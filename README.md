# Vale Markdown Frontmatter Linter

This tool takes markdown files with frontmatter, extracts the `title`, `description`, and `summary` fields, and creates temporary files.

These temporary files are then passed to Vale for linting. The results are transformed to reference the original file paths instead of the temporary files.

This attempts to keep line numbers the same, and attempts to report the original filenames.

It currently cannot hook directly into Vale, so using it with Vale's LSP or in-editor features won't work. You'll want to run this as a separate process.

## Installation

To run this, you'll need:

- [Node.js](https://nodejs.org/) (v12 or later)
- [Vale](https://vale.sh/) installed and configured

To install globally, if you have to use this with multiple projects:

```bash
npm install -g vale-md-frontmatter
```

You can also install as a per-project dependency:

```bash
npm install vale-md-frontmatter --save-dev
```


## Usage

You can use this as a command-line tool or as a module.

### Command Line

The basic usage is:

```bash
vale-md-frontmatter [options] <patterns...>
```

Examples:

```bash
# Lint all markdown files in the current directory (default if no pattern provided)
vale-frontmatter

# Lint all markdown files in the docs directory and child directories
vale-md-frontmatter "docs/**/*.md"

# Lint with a custom filter
vale-md-frontmatter --filter=".Name != Microsoft.We" "content/*.md"

# Get help
vale-md-frontmatter --help
```

### Options

- `--filter, -f`: Vale filter to apply. Uses the same syntax Vale uses.
- `--verbose, -v`: Run with verbose logging
- `--help, -h`: Show help


The command-line tool runs Vale directly and forwards its status code back so you can use it in your CI/CD system.

### Programmatic Usage

You can also use the package programmatically in your Node.js applications:

```javascript
const valeFrontmatter = require('vale-frontmatter');

// Lint files matching patterns
const exitCode = valeFrontmatter.lint(['docs/**/*.md'], {
  filter: '.Name != AwesomeCo.Passive'
});

console.log(`Lint finished with exit code: ${exitCode}`);
```

## Changelog

### 2025-03-26 - 0.1.0

- Initial version.
- Tests.

## License

MIT
