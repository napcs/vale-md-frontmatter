const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const { lint, processFile } = require('../index');
const { checkValeAvailable, stripAnsi} = require('./helper');

// Basic functionality tests that don't require Vale
describe('Vale Frontmatter - Basic Functionality', function() {
  it('should process a file with frontmatter correctly', function() {
    const result = processFile('test/fixtures/test1.md');
    expect(result).to.not.be.null;
  });

  it('should skip files with empty frontmatter', function() {
    const result = processFile('test/fixtures/empty-frontmatter.md');
    expect(result).to.be.null;
  });

  it('should skip files without frontmatter', function() {
    const result = processFile('test/fixtures/no-frontmatter.md');
    expect(result).to.be.null;
  });
});

// Tests requiring Vale availability
const valeAvailable = checkValeAvailable();
if (!valeAvailable) {
  describe.skip('Vale Frontmatter - Line Number Tests (SKIPPED: Vale not available)', function() {
    it('should detect misspelled words in the title', function() {});
    it('should detect misspelled words in the description', function() {});
    it('should detect misspelled words in the summary', function() {});
    it('should preserve line numbers in complex frontmatter', function() {});
  });
} else {
  describe('Vale Frontmatter - Line Number Tests', function() {
    let writeStub;
    let originalDir;

    before(function() {
      // Save current working directory
      originalDir = process.cwd();

      // Change to the fixtures directory so Vale can find .vale.ini
      process.chdir(path.join(originalDir, 'test/fixtures'));

      // Stub process.stdout.write to capture output
      writeStub = sinon.stub(process.stdout, 'write');
    });

    after(function() {
      // Restore stdout.write
      writeStub.restore();

      // Change back to the original directory
      process.chdir(originalDir);

      // Clean up any temp files created during testing
      const tempDir = path.join(require('os').tmpdir(), 'vale-frontmatter');
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    beforeEach(function() {
      // Clear the stub before each test
      writeStub.reset();
    });

    it('should detect misspelled words in the title', function() {
      this.timeout(5000); // Vale might take some time

      // Run the linter
      lint(['test1.md'], { verbose: false });

      // Check if the output contains the misspelled word
      const output = stripAnsi(writeStub.args.join(''));
      expect(output).to.include('mispeled');

      // Check the line number - should be line 2 (where the title is)
      expect(output).to.include('test1.md');
      expect(output).to.include('2:19');
    });

    it('should detect misspelled words in the description', function() {
      this.timeout(5000);

      // Run the linter
      lint(['test2.md'], { verbose: false });

      // Check if the output contains the misspelled word
      const output = stripAnsi(writeStub.args.join(''));
      expect(output).to.include('mispeled');

      // Check the line number - should be line 5 (where the description is)
      expect(output).to.include('test2.md');
      expect(output).to.include('5:24');
    });

    it('should detect misspelled words in the summary', function() {
      this.timeout(5000);

      // Run the linter
      lint(['test3.md'], { verbose: false });

      // Check if the output contains the misspelled word
      const output = stripAnsi(writeStub.args.join(''));
      expect(output).to.include('mispeled');

      // Check the line number - should be line 4 (where the summary is)
      expect(output).to.include('test3.md');
      expect(output).to.include('4:20');
    });

    it('should preserve line numbers in complex frontmatter', function() {
      this.timeout(5000);

      // Run the linter
      lint(['test4.md'], { verbose: false });

      // Check if the output contains the misspelled word
      const output = stripAnsi(writeStub.args.join(''));
      expect(output).to.include('mispeled');

      // Check the line number - should be line 9 (where the title is)
      expect(output).to.include('test4.md');
      expect(output).to.include('9:14');
    });
  });
}
