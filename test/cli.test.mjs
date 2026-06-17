import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { test } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const CLI = fileURLToPath(new URL("../src/cli.mjs", import.meta.url));

async function withFixture(content, callback) {
  const dir = await mkdtemp(join(tmpdir(), "md-task-scan-"));
  const file = join(dir, "TODO.md");

  try {
    await writeFile(file, content, "utf8");
    await callback(file);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("prints open tasks by default", async () => {
  await withFixture("- [ ] Open task\n- [x] Done task\n", async (file) => {
    const { stdout } = await execFileAsync("node", [CLI, file]);

    assert.match(stdout, /Open task/);
    assert.doesNotMatch(stdout, /Done task/);
  });
});

test("prints done tasks with --done", async () => {
  await withFixture("- [ ] Open task\n- [x] Done task\n", async (file) => {
    const { stdout } = await execFileAsync("node", [CLI, "--done", file]);

    assert.doesNotMatch(stdout, /Open task/);
    assert.match(stdout, /Done task/);
  });
});

test("prints checkbox state with --all", async () => {
  await withFixture("- [ ] Open task\n- [x] Done task\n", async (file) => {
    const { stdout } = await execFileAsync("node", [CLI, "--all", file]);

    assert.match(stdout, /\[ \] Open task/);
    assert.match(stdout, /\[x\] Done task/);
  });
});

test("rejects multiple status flags", async () => {
  await assert.rejects(
    execFileAsync("node", [CLI, "--open", "--done"]),
    /Choose only one of --open, --done, or --all/
  );
});
