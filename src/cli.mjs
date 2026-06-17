#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { scanMarkdown } from "./scanner.mjs";

const HELP = `md-task-scan

Usage:
  md-task-scan [options] [files...]

Options:
  --open           Print unchecked tasks. This is the default.
  --done           Print checked tasks.
  --all            Print checked and unchecked tasks.
  --json           Print results as JSON.
  --fail-on-found  Exit with code 2 when matching tasks are found.
  -h, --help       Show help.
  -v, --version    Show version.
`;

const STATUS_FLAGS = new Map([
  ["--open", "open"],
  ["--done", "done"],
  ["--all", "all"]
]);

async function readPackageVersion() {
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  return JSON.parse(packageJson).version;
}

async function readStdin() {
  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

function parseArgs(args) {
  const options = {
    status: "open",
    json: false,
    failOnFound: false,
    help: false,
    version: false,
    files: []
  };
  let statusFlagCount = 0;

  for (const arg of args) {
    if (STATUS_FLAGS.has(arg)) {
      options.status = STATUS_FLAGS.get(arg);
      statusFlagCount += 1;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--fail-on-found") {
      options.failOnFound = true;
    } else if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else if (arg === "-v" || arg === "--version") {
      options.version = true;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      options.files.push(arg);
    }
  }

  if (statusFlagCount > 1) {
    throw new Error("Choose only one of --open, --done, or --all.");
  }

  return options;
}

function emptyMessage(status) {
  if (status === "done") {
    return "No completed tasks found.";
  }

  if (status === "all") {
    return "No tasks found.";
  }

  return "No open tasks found.";
}

function printTasks(tasks, options) {
  const { json, status } = options;

  if (json) {
    console.log(JSON.stringify(tasks, null, 2));
    return;
  }

  if (tasks.length === 0) {
    console.log(emptyMessage(status));
    return;
  }

  for (const task of tasks) {
    const checkbox = status === "all" ? `${task.done ? "[x]" : "[ ]"} ` : "";
    console.log(`${task.source}:${task.line}  ${checkbox}${task.text}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(HELP);
    return;
  }

  if (options.version) {
    console.log(await readPackageVersion());
    return;
  }

  const tasks = [];

  if (options.files.length === 0) {
    tasks.push(...scanMarkdown(await readStdin(), "stdin", { status: options.status }));
  } else {
    for (const file of options.files) {
      const content = await readFile(file, "utf8");
      tasks.push(...scanMarkdown(content, file, { status: options.status }));
    }
  }

  printTasks(tasks, options);

  if (options.failOnFound && tasks.length > 0) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
