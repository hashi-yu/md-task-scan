const TASK_LINE_PATTERN = /^(\s*)([-*+]|\d+[.)])\s+\[([ xX])\]\s+(.*)$/;
const FENCE_PATTERN = /^\s*(```|~~~)/;

export function scanMarkdown(content, source = "stdin", options = {}) {
  const status = options.status ?? "open";
  const tasks = [];
  let inFence = false;

  content.split(/\r?\n/).forEach((line, index) => {
    if (FENCE_PATTERN.test(line)) {
      inFence = !inFence;
      return;
    }

    if (inFence) {
      return;
    }

    const match = TASK_LINE_PATTERN.exec(line);

    if (!match) {
      return;
    }

    const [, indent, , marker, text] = match;
    const done = marker.toLowerCase() === "x";

    if (status === "open" && done) {
      return;
    }

    if (status === "done" && !done) {
      return;
    }

    tasks.push({
      source,
      line: index + 1,
      indent: indent.length,
      done,
      status: done ? "done" : "open",
      text: text.trim()
    });
  });

  return tasks;
}
