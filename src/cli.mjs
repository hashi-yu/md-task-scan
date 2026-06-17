#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { scanMarkdown } from "./scanner.mjs";

const HELP = `md-task-scan

Usage:
  md-task-scan [options] [files...]

Options:
  --json           Print results as JSON.
  --fail-on-found  Exit with code 2 when open tasks are found.
  -h, --help       Show help.
  -v, --version    Show version.
`;

async function readStdin() {
  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

function parseArgs(args) {
  const options = {
    json: false,
    failOnFound: false,
    help: false,
    version: false,
    files: []
  };

  for (const arg of args) {
    if (arg === "--json") {
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

  return options;
}

function printTasks(tasks, json) {
  if (json) {
    console.log(JSON.stringify(tasks, null, 2));
    return;
  }

  if (tasks.length === 0) {
    console.log("No open tasks found.");
    return;
  }

  for (const task of tasks) {
    console.log(`${task.source}:${task.line}  ${task.text}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(HELP);
    return;
  }

  if (options.version) {
    console.log("0.1.0");
    return;
  }

  const tasks = [];

  if (options.files.length === 0) {
    tasks.push(...scanMarkdown(await readStdin()));
  } else {
    for (const file of options.files) {
      const content = await readFile(file, "utf8");
      tasks.push(...scanMarkdown(content, file));
    }
  }

  printTasks(tasks, options.json);

  if (options.failOnFound && tasks.length > 0) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
