/** @fileoverview Resolves revision-check storage to an allowed persistent backing filesystem. */

interface Mount {
  readonly path: string;
  readonly type: string;
  readonly options: ReadonlyMap<string, string | true>;
}

const persistent = new Set(["ext2", "ext3", "ext4", "xfs", "btrfs", "zfs"]);

function decode(value: string): string {
  return value.replaceAll("\\040", " ").replaceAll("\\011", "\t").replaceAll("\\012", "\n").replaceAll("\\134", "\\");
}

function contained(parent: string, child: string): boolean {
  return child === parent || child.startsWith(parent.endsWith("/") ? parent : `${parent}/`);
}

function parseOptions(value: string): ReadonlyMap<string, string | true> {
  return new Map<string, string | true>(value.split(",").filter(Boolean).map((entry): [string, string | true] => {
    const separator = entry.indexOf("=");
    return separator < 0 ? [entry, true] : [entry.slice(0, separator), decode(entry.slice(separator + 1))];
  }));
}

function parseMounts(source: string): readonly Mount[] {
  return source.trim().split("\n").filter(Boolean).map((line) => {
    const [left, right] = line.split(" - ");
    const leftFields = left?.split(" ") ?? [];
    const rightFields = right?.split(" ") ?? [];
    if (!left || !right || !leftFields[4] || !rightFields[0] || !rightFields[2]) {
      throw new Error("invalid Linux mountinfo record");
    }
    return { path: decode(leftFields[4]), type: rightFields[0], options: parseOptions(rightFields.slice(2).join(",")) };
  });
}

export function persistentFilesystem(source: string, path: string): string {
  const mounts = parseMounts(source);
  const resolve = (candidate: string, visited: ReadonlySet<string>): string => {
    const mount = mounts.filter((entry) => contained(entry.path, candidate)).sort((a, b) => b.path.length - a.path.length)[0];
    if (!mount) throw new Error("verification storage filesystem is unknown");
    if (persistent.has(mount.type)) return mount.type;
    if (mount.type !== "overlay") throw new Error(`verification storage is backed by unsupported ${mount.type}`);
    if (visited.has(mount.path)) throw new Error("verification storage overlay cycle detected");
    const upperdir = mount.options.get("upperdir");
    if (typeof upperdir !== "string" || !upperdir.startsWith("/")) throw new Error("verification storage overlay has no absolute upperdir");
    return resolve(upperdir, new Set([...visited, mount.path]));
  };
  return resolve(path, new Set());
}
