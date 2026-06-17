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
  --jsonl          Print results as JSON Lines.
  --summary        Print stable key=value counts.
  --fail-on-found  Exit with code 2 when matching tasks are found.
  -h, --help       Show help.
  -v, --version    Show version.
`;

const STATUS_FLAGS = new Map([
  ["--open", "open"],
  ["--done", "done"],
  ["--all", "all"]
]);

const OUTPUT_FLAGS = new Map([
  ["--json", "json"],
  ["--jsonl", "jsonl"],
  ["--summary", "summary"]
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
    output: "text",
    failOnFound: false,
    help: false,
    version: false,
    files: []
  };
  let statusFlagCount = 0;
  let outputFlagCount = 0;

  for (const arg of args) {
    if (STATUS_FLAGS.has(arg)) {
      options.status = STATUS_FLAGS.get(arg);
      statusFlagCount += 1;
    } else if (OUTPUT_FLAGS.has(arg)) {
      options.output = OUTPUT_FLAGS.get(arg);
      outputFlagCount += 1;
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

  if (outputFlagCount > 1) {
    throw new Error("Choose only one of --json, --jsonl, or --summary.");
  }

  return options;
}

function matchesStatus(task, status) {
  return status === "all" || task.status === status;
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

function summarizeTasks(allTasks, matchingTasks, status, fileCount) {
  const done = allTasks.filter((task) => task.done).length;

  return {
    files: fileCount,
    total: allTasks.length,
    open: allTasks.length - done,
    done,
    matched: matchingTasks.length,
    filter: status
  };
}

function printSummary(summary) {
  console.log(
    [
      `files=${summary.files}`,
      `total=${summary.total}`,
      `open=${summary.open}`,
      `done=${summary.done}`,
      `matched=${summary.matched}`,
      `filter=${summary.filter}`
    ].join(" ")
  );
}

function printTasks(allTasks, matchingTasks, options, fileCount) {
  const { output, status } = options;

  if (output === "summary") {
    printSummary(summarizeTasks(allTasks, matchingTasks, status, fileCount));
    return;
  }

  if (output === "json") {
    console.log(JSON.stringify(matchingTasks, null, 2));
    return;
  }

  if (output === "jsonl") {
    for (const task of matchingTasks) {
      console.log(JSON.stringify(task));
    }
    return;
  }

  if (matchingTasks.length === 0) {
    console.log(emptyMessage(status));
    return;
  }

  for (const task of matchingTasks) {
    const checkbox = status === "all" ? `${task.done ? "[x]" : "[ ]"} ` : "";
    console.log(`${task.source}:${task.line}  ${checkbox}${task.text}`);
  }
}

async function readTasks(options) {
  const allTasks = [];
  let fileCount = 0;

  if (options.files.length === 0) {
    fileCount = 1;
    allTasks.push(...scanMarkdown(await readStdin(), "stdin", { status: "all" }));
    return { allTasks, fileCount };
  }

  fileCount = options.files.length;

  for (const file of options.files) {
    const content = await readFile(file, "utf8");
    allTasks.push(...scanMarkdown(content, file, { status: "all" }));
  }

  return { allTasks, fileCount };
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

  const { allTasks, fileCount } = await readTasks(options);
  const matchingTasks = allTasks.filter((task) => matchesStatus(task, options.status));

  printTasks(allTasks, matchingTasks, options, fileCount);

  if (options.failOnFound && matchingTasks.length > 0) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
