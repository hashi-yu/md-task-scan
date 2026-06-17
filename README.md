# md-task-scan

A tiny zero-dependency CLI for listing open Markdown tasks.

It finds unchecked task list items like:

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
git clone <repo-url>
cd md-task-scan
npm test
```

## Usage

Scan one or more Markdown files:

```sh
md-task-scan README.md docs/plan.md
```

Read from standard input:

```sh
cat README.md | md-task-scan
```

Print JSON:

```sh
md-task-scan --json README.md
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

## Development

```sh
npm test
```

## License

MIT
