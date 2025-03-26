#!/usr/bin/env node

/**
 * Vale Frontmatter CLI
 *
 * CLI tool to extract frontmatter from markdown files and lint with Vale
 */

const yargs = require('yargs');
const { lint } = require('../index');

const argv = yargs
  .usage('Usage: $0 [options] <patterns...>')
  .example('$0 "docs/**/*.md"', 'Lint all markdown files in the docs directory')
  .example('$0 --filter=".Name != AwesomeCo.Passive" "content/*.md"', 'Lint with a custom filter')
  .option('filter', {
    alias: 'f',
    type: 'string',
    description: 'Vale filter to apply'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
    default: false
  })
  .help()
  .alias('help', 'h')
  .argv;

// Get the patterns from the command line
const patterns = argv._;

// Handle no patterns
if (patterns.length === 0) {
  patterns.push("**/*.md");
  if (argv.verbose) {
    console.log('No patterns provided, using default: **/*.md (current directory)');
  }
}

// Log verbose information
if (argv.verbose) {
  console.log(`Linting files matching: ${patterns.join(', ')}`);
  console.log(`Using Vale filter: ${argv.filter}`);
}

// Run the linter
const exitCode = lint(patterns, { filter: argv.filter });

// Exit with the appropriate status code
process.exit(exitCode);
