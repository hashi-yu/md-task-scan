const TASK_LINE_PATTERN = /^(\s*)([-*+]|\d+[.)])\s+\[([ xX])\]\s+(.*)$/;
const FENCE_PATTERN = /^\s*(```|~~~)/;

export function scanMarkdown(content, source = "stdin") {
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

    if (marker.toLowerCase() === "x") {
      return;
    }

    tasks.push({
      source,
      line: index + 1,
      indent: indent.length,
      text: text.trim()
    });
  });

  return tasks;
}
