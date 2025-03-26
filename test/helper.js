const { execSync } = require('child_process');

/**
 * Check if Vale is available on the system
 * @returns {boolean} Whether Vale is installed and accessible
 */
function checkValeAvailable() {
  try {
    execSync('vale --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Helper function to strip ANSI color codes from a string
 * @param {string} str - The string to strip
 * @returns {string} - The string without ANSI color codes
 */
function stripAnsi(str) {
  return str.replace(/\u001b\[\d+m/g, '').replace(/\u001b\[0m/g, '').replace(/\u001b\[4m/g, '');
}

module.exports = {
  checkValeAvailable, stripAnsi
};
