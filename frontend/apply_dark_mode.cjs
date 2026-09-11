const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

const replacements = [
  { regex: /text-gray-900(?!\s+dark:text-gray-[12]00)/g, replacement: 'text-gray-900 dark:text-gray-100' },
  { regex: /text-gray-800(?!\s+dark:text-gray-[23]00)/g, replacement: 'text-gray-800 dark:text-gray-200' },
  { regex: /text-gray-700(?!\s+dark:text-gray-[34]00)/g, replacement: 'text-gray-700 dark:text-gray-300' },
  { regex: /text-gray-600(?!\s+dark:text-gray-[34]00)/g, replacement: 'text-gray-600 dark:text-gray-400' },
  { regex: /text-gray-500(?!\s+dark:text-gray-[45]00)/g, replacement: 'text-gray-500 dark:text-gray-400' },
  { regex: /bg-white(?!\s+dark:bg-gray-[89]00)/g, replacement: 'bg-white dark:bg-gray-800' },
  { regex: /bg-gray-50(?!\s*\/)(?!\s+dark:bg-gray-[89]00)/g, replacement: 'bg-gray-50 dark:bg-gray-900' },
  { regex: /bg-gray-50\/50(?!\s+dark:bg-gray-900\/50)/g, replacement: 'bg-gray-50/50 dark:bg-gray-900/50' },
  { regex: /border-gray-200(?!\s+dark:border-gray-[67]00)/g, replacement: 'border-gray-200 dark:border-gray-700' },
  { regex: /border-gray-100(?!\s+dark:border-gray-[67]00)/g, replacement: 'border-gray-100 dark:border-gray-700' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;

      for (const rule of replacements) {
        content = content.replace(rule.regex, rule.replacement);
      }

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  }
}

processDirectory(dir);
console.log('Sweep completed!');
