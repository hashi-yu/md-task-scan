# md-task-scan

A tiny zero-dependency CLI for listing Markdown tasks.

It finds task list items like:

```md
- [ ] Write tests
- [x] Ship release
```

## Install

```sh
npm install -g md-task-scan
```

For local development:

```sh
git clone https://github.com/hashi-yu/md-task-scan.git
cd md-task-scan
npm test
```

## Usage

Try the included sample:

```sh
md-task-scan examples/TODO.md
```

Scan one or more Markdown files:

```sh
md-task-scan README.md docs/plan.md
```

By default, it prints unchecked tasks. You can also make that explicit:

```sh
md-task-scan --open README.md
```

Print checked tasks:

```sh
md-task-scan --done README.md
```

Print all tasks:

```sh
md-task-scan --all README.md
```

Read from standard input:

```sh
cat README.md | md-task-scan
```

Print JSON:

```sh
md-task-scan --json README.md
```

Print JSON Lines for scripts and agents:

```sh
md-task-scan --all --jsonl README.md
```

Print stable summary counts:

```sh
md-task-scan --summary README.md
```

Fail when open tasks are found, which is useful in CI:

```sh
md-task-scan --fail-on-found README.md
```

## Output

```txt
README.md:12  Write tests
README.md:18  Update release notes
```

With `--all`, each task includes its checkbox state:

```txt
README.md:12  [ ] Write tests
README.md:16  [x] Ship release
```

With `--jsonl`, each task is printed as one JSON object per line:

```jsonl
{"source":"README.md","line":12,"indent":0,"done":false,"status":"open","text":"Write tests"}
{"source":"README.md","line":16,"indent":0,"done":true,"status":"done","text":"Ship release"}
```

With `--summary`, the output is a single stable key=value line:

```txt
files=1 total=2 open=1 done=1 matched=1 filter=open
```

## Development

```sh
npm test
```

## License

MIT
