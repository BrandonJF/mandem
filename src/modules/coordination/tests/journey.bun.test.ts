/** @fileoverview Real CLI, HTTP and SQLite message journey without a provider. */
import { expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { startCoordinationServer } from "../api/composition";

interface Message { id: string; subject: string; ackedBy: string[]; data?: { body?: string }; }

test("separate CLI processes send, receive, acknowledge and reply; receipts survive service restart", async () => {
  const directory = mkdtempSync(join(tmpdir(), "mandem-journey-"));
  const databasePath = join(directory, "coord.sqlite");
  let service = startCoordinationServer({ databasePath, port: 0, herdr: false });
  async function cli(...args: string[]) {
    const child = Bun.spawn(["bun", "src/cli/main.ts", ...args], {
      env: { ...process.env, MANDEM_COORD_URL: service.url }, stdout: "pipe", stderr: "pipe",
    });
    const stdout = await new Response(child.stdout).text();
    const stderr = await new Response(child.stderr).text();
    expect(await child.exited, stderr).toBe(0);
    return JSON.parse(stdout);
  }
  try {
    await cli("session", "register", "--session", "engineer", "--role", "engineer");
    expect((await cli("session", "list")).sessions).toHaveLength(1);
    const posted = await cli("msg", "send", "--topic", "session:engineer", "--sender", "orchestrator", "--type", "handoff", "--subject", "#51", "--data", '{"body":"Implement coordination"}');
    const inbox = await cli("msg", "inbox", "--topic", "session:engineer") as Message[];
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.id).toBe(posted.id);
    expect(inbox[0]?.data?.body).toBe("Implement coordination");
    await cli("msg", "ack", "--id", posted.id, "--session", "engineer");
    await cli("msg", "ack", "--id", posted.id, "--session", "engineer");
    await cli("msg", "send", "--topic", "session:orchestrator", "--sender", "engineer", "--type", "reply", "--subject", "#51", "--data", '{"body":"Coordination works"}');
    const reply = await cli("msg", "inbox", "--topic", "session:orchestrator") as Message[];
    expect(reply[0]?.data?.body).toBe("Coordination works");
    await service.stop();
    service = startCoordinationServer({ databasePath, port: 0, herdr: false });
    expect((await cli("msg", "inbox", "--topic", "session:engineer"))[0].ackedBy).toEqual(["engineer"]);
    expect(await cli("msg", "inbox", "--topic", "session:engineer", "--since", posted.id)).toEqual([]);
    expect((await cli("health")).ok).toBe(true);
  } finally { await service.stop(); rmSync(directory, {recursive:true, force:true}); }
}, 15_000);

test("CLI errors exit unsuccessfully instead of silently returning an empty inbox", async () => {
  const fake = Bun.serve({ hostname:"127.0.0.1", port:0, fetch: () => Response.json({error:"database unavailable"},{status:503}) });
  try {
    const child = Bun.spawn(["bun", "src/cli/main.ts", "msg", "inbox", "--topic", "session:engineer"], {
      env: {...process.env, MANDEM_COORD_URL:fake.url.toString().replace(/\/$/, "")}, stdout:"pipe", stderr:"pipe",
    });
    expect(await child.exited).toBe(1);
    expect(await new Response(child.stderr).text()).toContain("503");
    expect(await new Response(child.stdout).text()).toBe("");
  } finally { await fake.stop(true); }
});

test("a failed Herdr wake keeps the persisted message and exposes the failure in health", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mandem-wake-"));
  const service = startCoordinationServer({databasePath:join(dir,"coord.sqlite"),port:0,
    herdr:{parentPaneId:"w1:p1",workspaceId:"w1",run: () => {throw new Error("agent blocked");}}});
  const post = (path: string, body: unknown) => fetch(service.url + path, {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  try {
    await post("/sessions/register",{session:"engineer",role:"engineer",data:{herdrPaneId:"w1:p2"}});
    const response = await post("/messages",{topic:"session:engineer",type:"handoff",subject:"#51",sender:"orchestrator"});
    expect(response.status).toBe(201);
    let health = await (await fetch(service.url+"/health")).json();
    const deadline = Date.now()+1000;
    while (health.wakeFailures === 0 && Date.now()<deadline) {
      await Bun.sleep(10);
      health = await (await fetch(service.url+"/health")).json();
    }
    expect(health.wakeFailures).toBe(1);
    expect(health.lastWakeError).toContain("agent blocked");
    const inbox = await (await fetch(service.url+"/messages?topic=session:engineer")).json();
    expect(inbox).toHaveLength(1);
    expect(inbox[0].ackedBy).toEqual([]);
  } finally {await service.stop();rmSync(dir,{recursive:true,force:true});}
});

test("a four-second Herdr wake does not delay the send receipt or other requests", async () => {
  const { writeFileSync, existsSync } = await import("node:fs");
  const dir = mkdtempSync(join(tmpdir(), "mandem-slow-wake-"));
  const marker = join(dir,"wake-started");
  writeFileSync(join(dir,"herdr"), `#!/bin/sh\ntouch '${marker}'\nsleep 4\nprintf '%s' '{"result":{"type":"agent_prompted"}}'\n`, {mode:0o755});
  const server = Bun.spawn(["bun","src/cli/main.ts","serve","--db",join(dir,"coord.sqlite"),"--port","0"], {
    env:{...process.env,PATH:`${dir}:${process.env.PATH}`,HERDR_ENV:"1",HERDR_PANE_ID:"w1:p1",HERDR_WORKSPACE_ID:"w1"},stdout:"pipe",stderr:"pipe"});
  const reader = server.stdout.getReader();
  const startup = await reader.read();
  const url = new TextDecoder().decode(startup.value).match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
  reader.releaseLock();
  try {
    expect(url).toBeDefined();
    await fetch(url+"/sessions/register",{method:"POST",body:JSON.stringify({session:"engineer",role:"engineer",data:{herdrPaneId:"w1:p2"}})});
    const started = Date.now();
    const child = Bun.spawn(["bun","src/cli/main.ts","msg","send","--topic","session:engineer","--sender","orchestrator","--type","handoff","--subject","slow wake"],{
      env:{...process.env,MANDEM_COORD_URL:url},stdout:"pipe",stderr:"pipe"});
    const stdout = await new Response(child.stdout).text();
    const stderr = await new Response(child.stderr).text();
    expect(await child.exited,stderr).toBe(0);
    expect(JSON.parse(stdout).id).toBe("1");
    expect(Date.now()-started).toBeLessThan(2500);
    const deadline = Date.now()+1000;
    while(!existsSync(marker) && Date.now()<deadline) await Bun.sleep(10);
    expect(existsSync(marker)).toBe(true);
    const requestsStarted = Date.now();
    const responses = await Promise.all(["/health","/messages?topic=session:engineer","/merge-lock?name=merge"].map(path => fetch(url+path)));
    expect(responses.every(response=>response.ok)).toBe(true);
    expect(await responses[1]!.json()).toHaveLength(1);
    expect(Date.now()-requestsStarted).toBeLessThan(1000);
  } finally {
    server.kill("SIGTERM");
    await server.exited;
    rmSync(dir,{recursive:true,force:true});
  }
}, 10_000);
