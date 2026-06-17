import assert from "node:assert/strict";
import { test } from "node:test";
import { scanMarkdown } from "../src/scanner.mjs";

test("lists unchecked Markdown tasks", () => {
  const tasks = scanMarkdown(
    [
      "# Plan",
      "",
      "- [ ] Write tests",
      "- [x] Ship release",
      "  - [ ] Update docs"
    ].join("\n"),
    "plan.md"
  );

  assert.deepEqual(tasks, [
    {
      source: "plan.md",
      line: 3,
      indent: 0,
      done: false,
      status: "open",
      text: "Write tests"
    },
    {
      source: "plan.md",
      line: 5,
      indent: 2,
      done: false,
      status: "open",
      text: "Update docs"
    }
  ]);
});

test("supports ordered task lists", () => {
  const tasks = scanMarkdown("1. [ ] First\n2) [ ] Second", "todo.md");

  assert.deepEqual(
    tasks.map((task) => task.text),
    ["First", "Second"]
  );
});

test("ignores non-task list items", () => {
  const tasks = scanMarkdown("- plain item\n- [] malformed", "notes.md");

  assert.deepEqual(tasks, []);
});

test("ignores tasks inside fenced code blocks", () => {
  const tasks = scanMarkdown(
    ["```md", "- [ ] Example task", "```", "- [ ] Real task"].join("\n"),
    "readme.md"
  );

  assert.deepEqual(tasks, [
    {
      source: "readme.md",
      line: 4,
      indent: 0,
      done: false,
      status: "open",
      text: "Real task"
    }
  ]);
});

test("lists checked Markdown tasks", () => {
  const tasks = scanMarkdown(
    "- [ ] Open task\n- [x] Done task\n- [X] Uppercase done task",
    "todo.md",
    { status: "done" }
  );

  assert.deepEqual(
    tasks.map((task) => ({
      done: task.done,
      text: task.text
    })),
    [
      {
        done: true,
        text: "Done task"
      },
      {
        done: true,
        text: "Uppercase done task"
      }
    ]
  );
});

test("lists all Markdown tasks", () => {
  const tasks = scanMarkdown("- [ ] Open task\n- [x] Done task", "todo.md", {
    status: "all"
  });

  assert.deepEqual(
    tasks.map((task) => ({
      done: task.done,
      text: task.text
    })),
    [
      {
        done: false,
        text: "Open task"
      },
      {
        done: true,
        text: "Done task"
      }
    ]
  );
});
