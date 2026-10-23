/** @fileoverview Coordination client rejects failed or malformed delivery responses. */
import { expect, it } from "vitest";
import { ackMessage, postMessage, readMessages, registerSession, listSessions, listTopics, acquireMergeLock } from "../infrastructure/coord-client";
const message = { topic:"session:engineer", type:"handoff", subject:"#51", sender:"orchestrator" };
function options(body: unknown, status = 200) {
  return { fetchImpl: Object.assign(async () => Response.json(body, {status}), { preconnect: fetch.preconnect }) };
}
it("rejects HTTP failures for message and session reads and writes", async () => {
  const opts = options({error:"database unavailable"}, 503);
  for (const operation of [() => postMessage(message,opts), () => readMessages(message.topic,opts), () => ackMessage("1","engineer",opts),
    () => registerSession({session:"engineer",role:"engineer"},opts), () => listSessions(opts), () => listTopics(opts)]) {
    await expect(operation()).rejects.toThrow("503");
  }
});
it("rejects malformed success bodies rather than reporting delivery or an empty inbox", async () => {
  await expect(postMessage(message, options({}))).rejects.toThrow("Invalid");
  await expect(readMessages(message.topic, options({}))).rejects.toThrow("Invalid");
  await expect(listSessions(options({}))).rejects.toThrow("Invalid");
  await expect(listTopics(options({}))).rejects.toThrow("Invalid");
  await expect(ackMessage("1", "engineer", options({}))).rejects.toThrow("Invalid");
  await expect(registerSession({session:"engineer",role:"engineer"}, options({}))).rejects.toThrow("Invalid");
});
it("fails closed on malformed or unavailable merge-lock acquisition", async () => {
  await expect(acquireMergeLock(options({}))).rejects.toThrow("coord service unreachable");
  await expect(acquireMergeLock(options({error:"unavailable"},503))).rejects.toThrow("unavailable");
});
