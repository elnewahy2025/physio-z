const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace text-gray-900 with text-gray-900 dark:text-gray-100 where it doesn't already have dark mode
      if (content.includes('text-gray-900')) {
        // Find text-gray-900 that is NOT followed by a dark: class in the same string literal
        const newContent = content.replace(/text-gray-900(?!\s+dark:text-)/g, 'text-gray-900 dark:text-gray-100');
        if (content !== newContent) {
          fs.writeFileSync(fullPath, newContent);
          console.log('Fixed:', fullPath);
        }
      }
    }
  }
}

processDir('./src');
