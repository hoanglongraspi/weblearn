import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.resolve(__dirname, '../../content/text');
const outputFile = path.resolve(__dirname, '../src/assets/slides.json');

// Ensure assets directory exists
const assetsDir = path.dirname(outputFile);
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const lectures = [];

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.md'));
// Ensure they are sorted somehow to maintain order if possible, though they have numeric prefixes
files.sort((a, b) => {
  // simple natural sort
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
});

for (const file of files) {
  const filePath = path.join(inputDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract title
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].replace('.pdf', '') : file.replace('.md', '');

  const slides = [];
  
  // Split the file into chunks using '## Slide' or '---'
  const sections = content.split('---');
  let currentSlide = 1;

  for (const section of sections) {
    if (!section.trim()) continue;
    
    // Attempt to extract slide number
    const slideMatch = section.match(/## Slide\s+(\d+)/);
    const slideNumber = slideMatch ? parseInt(slideMatch[1], 10) : currentSlide;
    
    // The text content: remove the h2 heading
    const textContent = section.replace(/## Slide\s+\d+\n*/g, '').trim();
    
    if (textContent.length > 0) {
      slides.push({
        slideNumber,
        content: textContent
      });
    }
    currentSlide++;
  }

  lectures.push({
    id: path.basename(file, '.md'),
    title: title,
    slides: slides
  });
}

fs.writeFileSync(outputFile, JSON.stringify(lectures, null, 2), 'utf-8');
console.log(`Parsed ${lectures.length} lectures to ${outputFile}`);
