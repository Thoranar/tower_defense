const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Development Watch Mode');
console.log('This will watch both TypeScript and JSON5 files\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, prefix, message) {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
}

// Start TypeScript compiler in watch mode
const tscWatch = spawn('npx', ['tsc', '--watch'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

tscWatch.stdout.on('data', (data) => {
  const message = data.toString().trim();
  if (message) {
    colorLog(colors.blue, '[TS]', message);
  }
});

tscWatch.stderr.on('data', (data) => {
  const message = data.toString().trim();
  if (message) {
    colorLog(colors.red, '[TS ERROR]', message);
  }
});

// Start content watcher
const contentWatch = spawn('node', ['scripts/watch-content.js'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

contentWatch.stdout.on('data', (data) => {
  const message = data.toString().trim();
  if (message) {
    colorLog(colors.green, '[CONTENT]', message);
  }
});

contentWatch.stderr.on('data', (data) => {
  const message = data.toString().trim();
  if (message) {
    colorLog(colors.red, '[CONTENT ERROR]', message);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping development watchers...');
  tscWatch.kill();
  contentWatch.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  tscWatch.kill();
  contentWatch.kill();
  process.exit(0);
});

colorLog(colors.cyan, '[DEV]', 'Development watchers started!');
colorLog(colors.cyan, '[DEV]', '- TypeScript files: Auto-compile on change');
colorLog(colors.cyan, '[DEV]', '- JSON5 files: Auto-copy to dist/ on change');
colorLog(colors.cyan, '[DEV]', 'Press Ctrl+C to stop all watchers');