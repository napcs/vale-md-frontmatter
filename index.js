/**
 * Vale Frontmatter
 * Extract frontmatter from markdown files and lint with Vale
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const os = require('os');
const glob = require('glob');
const matter = require('gray-matter');

const TEMP_DIR = path.join(os.tmpdir(), 'vale-frontmatter');

/**
 * Process a file, extract frontmatter, and create a temporary file for Vale
 * @param {string} file - File path
 * @param {string} tempDir - Temporary directory
 * @returns {string|null} - Path to the temporary file or null if no frontmatter
 */
function processFile(file) {
  try {
    // Parse frontmatter
    const fileContent = fs.readFileSync(file, 'utf8');
    const parsed = matter(fileContent);
    const { data } = parsed;

    // Skip if no frontmatter
    if (!data || Object.keys(data).length === 0) return null;

    // Extract the raw frontmatter by finding the position between the --- markers
    const lines = fileContent.split('\n');
    let frontMatterStartLine = -1;
    let frontMatterEndLine = -1;

    // Find the frontmatter delimiters
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        if (frontMatterStartLine === -1) {
          frontMatterStartLine = i;
        } else {
          frontMatterEndLine = i;
          break;
        }
      }
    }

    // If we couldn't find valid frontmatter delimiters, skip this file
    if (frontMatterStartLine === -1 || frontMatterEndLine === -1) return null;

    // Extract the frontmatter lines (including delimiter lines)
    const frontMatterLines = lines.slice(frontMatterStartLine, frontMatterEndLine + 1);
    const frontMatterLineCount = frontMatterLines.length;

    // Create empty lines to match the frontmatter line count
    const emptyLines = Array(frontMatterLineCount).fill('').join('\n');

    // Initialize lintable content with empty lines to preserve line numbers
    let lintableContent = emptyLines + '\n';
    let lintableLines = lintableContent.split('\n');

    // Create a map of frontmatter keys to their line numbers in the original file
    const keyLineMap = {};

    // Process the frontmatter lines (skip the delimiter lines)
    for (let i = frontMatterStartLine + 1; i < frontMatterEndLine; i++) {
      const line = lines[i].trim();
      // Look for key: value pairs
      const match = line.match(/^(\w+):/);
      if (match) {
        const key = match[1];
        // Store the original line number
        keyLineMap[key] = i;
      }
    }

    // Add title at the correct line number if available
    if (data.title && keyLineMap.title !== undefined) {
      lintableLines[keyLineMap.title] = `# ${data.title}`;
    }

    // Add description/summary at the correct line number if available
    if (data.description && keyLineMap.description !== undefined) {
      lintableLines[keyLineMap.description] = data.description;
    } else if (data.summary && keyLineMap.summary !== undefined) {
      lintableLines[keyLineMap.summary] = data.summary;
    }

    lintableContent = lintableLines.join('\n');

    // Skip if no content to lint
    if (lintableContent.trim() === '') return null;

    const relativePath = path.relative(process.cwd(), file);
    const tempFile = path.join(TEMP_DIR, relativePath);

    // Create directory structure if needed
    const tempDir = path.dirname(tempFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(tempFile, lintableContent);
    return tempFile;
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
    return null;
  }
}

/**
 * Run Vale linter on the processed files
 * @param {string} filter - Vale filter
 * @returns {Object} - Object containing status code and output
 */
function runVale(filter) {
  const filterArg = filter ? `--filter=${filter}` : '';
  const args = filterArg ? [filterArg, TEMP_DIR] : [TEMP_DIR];

  const result = spawnSync('vale', args, {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Transform the output to remove the temp directory path
  const output = result.stdout ? result.stdout.toString() : '';
  const cleanedOutput = output.replace(new RegExp(TEMP_DIR + "/", 'g'), '');

  return {
    status: result.status || 0,
    output: cleanedOutput
  };
}

/**
 * Cleanup the temporary directory
 */
function cleanup() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}

/**
 * Main function to run the frontmatter linter
 * @param {Array<string>} patterns - Glob patterns for files to lint
 * @param {Object} options - Options for the linter
 * @returns {number} - Status code
 */
function lint(patterns, options = {}) {
  if (!patterns || patterns.length === 0) {
    patterns = ["**/*.md"];
  }

  // Create temporary directory if it doesn't exist
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Process each file in the patterns
  let processedFiles = 0;
  patterns.forEach(pattern => {
    glob.sync(pattern).forEach(file => {
      const result = processFile(file);
      if (result) {
        processedFiles++;
        if (options.verbose) {
          console.log(`Processed: ${file} -> Preserving original line numbers`);
        }
      }
    });
  });

  if (processedFiles === 0) {
    if (options.verbose) {
      console.warn('No files with frontmatter found matching the patterns');
    }
    cleanup();
    return 0;
  }

  // Run Vale on the processed files
  const filter = options.filter || '';
  const result = runVale(filter);

  // Output the results
  process.stdout.write(result.output);

  // Cleanup
  cleanup();

  return result.status;
}

module.exports = {
  lint,
  processFile,
  runVale,
  cleanup
};
