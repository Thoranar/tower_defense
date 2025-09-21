const fs = require('fs');
const path = require('path');

console.log('🔥 JSON5 Content Watcher Started');
console.log('Watching public/ folder for changes...');
console.log('Changes will be automatically copied to dist/');
console.log('Press Ctrl+C to stop\n');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  console.log('📁 Creating dist directory...');
  fs.mkdirSync('dist', { recursive: true });
}

// Function to copy files to dist
function copyAssets() {
  try {
    // Copy index.html
    if (fs.existsSync('index.html')) {
      fs.cpSync('index.html', 'dist/index.html');
    }

    // Copy public folder
    if (fs.existsSync('public')) {
      fs.cpSync('public', 'dist/public', { recursive: true });
    }

    const timestamp = new Date().toLocaleTimeString();
    console.log(`✅ [${timestamp}] Assets copied to dist/`);
  } catch (error) {
    console.error('❌ Error copying assets:', error.message);
  }
}

// Initial copy
copyAssets();

// Watch for changes
const watchOptions = { recursive: true };

// Watch public folder
if (fs.existsSync('public')) {
  fs.watch('public', watchOptions, (eventType, filename) => {
    if (filename && (filename.endsWith('.json5') || filename.endsWith('.json'))) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`📝 [${timestamp}] ${filename} changed - copying assets...`);
      copyAssets();
    }
  });
}

// Watch index.html
if (fs.existsSync('index.html')) {
  fs.watch('index.html', (eventType, filename) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`📝 [${timestamp}] index.html changed - copying assets...`);
    copyAssets();
  });
}

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Content watcher stopped');
  process.exit(0);
});

console.log('👀 Watching for changes to JSON5 files and index.html...');