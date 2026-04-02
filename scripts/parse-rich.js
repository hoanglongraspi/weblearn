import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.resolve(__dirname, '../../content/text');
const outputFile = path.resolve(__dirname, '../src/assets/enhanced-content.json');

const lectures = [];
const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.md'));
files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

// Helper to extract key terms from a text (markdown bold or inline code)
function extractKeyTerms(text) {
  const terms = new Set();
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    if (match[1].length > 2 && match[1].length < 30) terms.add(match[1]);
  }
  return Array.from(terms);
}

for (const file of files) {
  const filePath = path.join(inputDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].replace('.pdf', '') : file.replace('.md', '');

  const modules = [];
  const sections = content.split('---');
  
  const allTerms = extractKeyTerms(content);
  
  // Add a welcoming story for the topic
  modules.push({
    type: 'story',
    content: `Welcome to **${title}**.\n\nThis extensive module covers every detail from your course slides to ensure you master this topic for your midterm. Let's dive deep into the protocols, concepts, and gotchas.`
  });

  let slideCounter = 1;
  const quizCandidates = [];

  for (const section of sections) {
    if (!section.trim() || section.includes(`# ${title}`)) continue; // Skip title slide
    
    // Clean up slide heading
    let textContent = section.replace(/## Slide\s+\d+\n*/g, '').trim();
    if (textContent.length < 5) continue;

    // Break the slide into concepts if it's too long, otherwise make it one concept
    modules.push({
      type: 'concept',
      title: `Core Principle ${slideCounter}`,
      content: textContent
    });

    // Look for sentences with key terms to create potential quizzes
    const sentences = textContent.split(/(?<=[.!?])\s+/);
    for (const sentence of sentences) {
      for (const term of allTerms) {
        if (sentence.includes(`**${term}**`) && sentence.length > 20 && sentence.length < 200) {
          quizCandidates.push({ sentence, term });
          break; // Only one term per sentence
        }
      }
    }
    
    slideCounter++;
  }

  // Generate up to 3 quizzes for this lecture based on the text
  const numQuizzes = Math.min(3, quizCandidates.length);
  // Shuffle candidates
  quizCandidates.sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < numQuizzes; i++) {
    const candidate = quizCandidates[i];
    const questionText = candidate.sentence.replace(`**${candidate.term}**`, '__________');
    
    // Generate decoy options
    const options = [candidate.term];
    const decoys = allTerms.filter(t => t !== candidate.term).sort(() => 0.5 - Math.random());
    while (options.length < 4 && decoys.length > 0) {
      options.push(decoys.pop());
    }
    
    // Fill with generic terms if we don't have enough
    const genericDecoys = ["TCP", "HTTP", "Encoding", "Router", "Buffer"];
    while (options.length < 4) {
      options.push(genericDecoys.pop());
    }
    
    // Shuffle options
    options.sort(() => 0.5 - Math.random());
    const answerIndex = options.indexOf(candidate.term);

    modules.push({
      type: 'quiz',
      question: questionText.replace(/\*\*/g, ''), // clean up extra bolds in question
      options: options,
      answer: answerIndex,
      explanation: `The correct term is ${candidate.term}. This is a key concept from the slides.`
    });
  }

  // Load deep overrides if they exist
  let deepOverrides = {};
  for (let i = 1; i <= 7; i++) {
    const filename = i === 1 ? 'deep-overrides.json' : `deep-overrides-${i}.json`;
    const overridesPath = path.join(__dirname, filename);
    if (fs.existsSync(overridesPath)) {
      Object.assign(deepOverrides, JSON.parse(fs.readFileSync(overridesPath, 'utf-8')));
    }
  }

  const topicId = path.basename(file, '.md');
  if (deepOverrides[topicId]) {
    // Inject the handcrafted masterpiece
    lectures.push({
      id: topicId,
      title: deepOverrides[topicId].title,
      description: deepOverrides[topicId].description,
      modules: deepOverrides[topicId].modules
    });
  } else {
    // Use the auto-generated heuristic module
    lectures.push({
      id: topicId,
      title: title,
      description: `Comprehensive review covering ${slideCounter - 1} slides of detail.`,
      modules: modules
    });
  }
}

fs.writeFileSync(outputFile, JSON.stringify(lectures, null, 2), 'utf-8');
console.log(`Successfully generated deep-dive content for ${lectures.length} topics!`);
