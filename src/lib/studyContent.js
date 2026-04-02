import enhancedTopics from '../assets/enhanced-content.json';
import slideDecks from '../assets/slides.json';

const BULLET_PREFIX = /^[•●○■-]\s*/;
const DATE_ONLY = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
const FILE_TITLE = /^#\s+\S+\.pdf$/i;
const PAGE_NUMBER = /^\d+$/;
const MULTI_SPACE = /\s+/g;
const CLUSTER_SIZE = 2;

const slideDeckById = Object.fromEntries(slideDecks.map((deck) => [deck.id, deck]));

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function cleanLine(line = '') {
  return line.replace(MULTI_SPACE, ' ').trim();
}

function stripMarkdown(text = '') {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();
}

function withPeriod(text = '') {
  if (!text) {
    return '';
  }

  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function isStandaloneLabel(text) {
  return (
    text.length <= 40 &&
    text.split(' ').length <= 4 &&
    /^[A-Z0-9][A-Za-z0-9/&' -]+$/.test(text) &&
    !/[.:;!?]$/.test(text)
  );
}

function mergeSlideLines(content = '') {
  const rawLines = content
    .split('\n')
    .map(cleanLine)
    .filter(Boolean)
    .filter((line) => !FILE_TITLE.test(line))
    .filter((line) => !DATE_ONLY.test(line))
    .filter((line) => !PAGE_NUMBER.test(line));

  const merged = [];

  for (const rawLine of rawLines) {
    const bullet = BULLET_PREFIX.test(rawLine);
    const text = rawLine.replace(BULLET_PREFIX, '').trim();

    if (!text) {
      continue;
    }

    const previous = merged[merged.length - 1];
    const shouldAppend =
      previous &&
      !bullet &&
      !isStandaloneLabel(text) &&
      (previous.bullet || /[a-z0-9,:)\]]$/.test(previous.text));

    if (shouldAppend) {
      previous.text = `${previous.text} ${text}`;
      continue;
    }

    merged.push({ text, bullet });
  }

  return merged;
}

function normalizeSlide(slide) {
  const items = mergeSlideLines(slide.content);

  if (!items.length) {
    return null;
  }

  let title = `Slide ${slide.slideNumber}`;
  let body = items;

  if (!items[0].bullet && items[0].text.length <= 90) {
    title = items[0].text;
    body = items.slice(1);
  } else if (items[0].text.length <= 72) {
    title = items[0].text;
    body = items.slice(1);
  }

  return {
    slideNumber: slide.slideNumber,
    title,
    items: body,
    preview: body.map((item) => item.text).slice(0, 4),
  };
}

function buildSlideClusters(slides = []) {
  const normalizedSlides = slides
    .map(normalizeSlide)
    .filter(Boolean)
    .filter((slide) => slide.items.length || !/^Slide \d+$/.test(slide.title));

  const clusters = [];

  for (let index = 0; index < normalizedSlides.length; index += CLUSTER_SIZE) {
    const group = normalizedSlides.slice(index, index + CLUSTER_SIZE);

    if (!group.length) {
      continue;
    }

    const first = group[0];
    const last = group[group.length - 1];
    const summary = unique(
      group.flatMap((slide) => {
        if (!slide.items.length) {
          return [slide.title];
        }

        return slide.items.slice(0, 2).map((item) => item.text);
      }),
    ).slice(0, 4);

    const flattenedPoints = group.flatMap((slide) => slide.items.map((item) => item.text));
    const lectureSections = group.map((slide, slideIndex) => buildLectureSection(slide, slideIndex));

    clusters.push({
      id: `lesson-${index + 1}`,
      type: 'lesson',
      title: first.title,
      navLabel: `Lesson ${Math.floor(index / CLUSTER_SIZE) + 1}`,
      slideRange: `Slides ${first.slideNumber}-${last.slideNumber}`,
      summary,
      lectureSections,
      coveragePoints: unique(flattenedPoints),
      sourceSlides: group,
    });
  }

  return clusters;
}

function buildLectureSection(slide, slideIndex) {
  const points = slide.items.map((item) => stripMarkdown(item.text)).filter(Boolean);
  const isTitledSlide = !/^Slide \d+$/.test(slide.title);
  const label = slide.slideNumber ? `Slide ${slide.slideNumber}` : `Part ${slideIndex + 1}`;

  if (!points.length) {
    return {
      id: `${slide.slideNumber || slideIndex}-lecture`,
      label,
      title: slide.title,
      teachingText: [
        isTitledSlide
          ? withPeriod(`${slide.title} acts as the transition that frames the next subtopic`)
          : 'This part introduces the next subtopic and sets up the details that follow.',
      ],
      bulletCoverage: [],
    };
  }

  const [firstPoint, ...restPoints] = points;
  const teachingText = [];

  if (isTitledSlide) {
    teachingText.push(withPeriod(`This lesson segment is centered on ${slide.title}`));
  }

  teachingText.push(withPeriod(`The first thing to lock in is: ${firstPoint}`));

  if (restPoints.length) {
    teachingText.push(
      withPeriod(
        `The slide then expands the idea with these supporting details: ${restPoints.slice(0, 2).join('; ')}`,
      ),
    );
  }

  if (restPoints.length > 2) {
    teachingText.push(
      withPeriod(
        `For complete coverage, also remember: ${restPoints.slice(2).join('; ')}`,
      ),
    );
  }

  return {
    id: `${slide.slideNumber || slideIndex}-lecture`,
    label,
    title: slide.title,
    teachingText,
    bulletCoverage: points,
  };
}

function buildOverviewModule(topic, slideClusters) {
  const openingModule = topic.modules.find((module) => module.type === 'story');
  const conceptTitles = unique(
    topic.modules
      .filter((module) => module.type === 'concept')
      .map((module) => stripMarkdown(module.title)),
  ).slice(0, 6);

  const quizPrompts = unique(
    topic.modules
      .filter((module) => module.type === 'quiz')
      .map((module) => stripMarkdown(module.question)),
  ).slice(0, 4);

  const sourceRanges = slideClusters.slice(0, 4).map((cluster) => cluster.slideRange);
  const guidedQuestions = buildGuidedQuestions(topic, conceptTitles, quizPrompts, slideClusters);

  return {
    id: 'overview',
    type: 'overview',
    title: 'Study Map',
    navLabel: 'Start',
    content: openingModule?.content || topic.description,
    quickHits: conceptTitles.length ? conceptTitles : slideClusters.map((cluster) => cluster.title).slice(0, 6),
    examChecklist: quizPrompts.length ? quizPrompts : sourceRanges,
    guidedQuestions,
    lessonCount: slideClusters.length,
  };
}

function buildGuidedQuestions(topic, conceptTitles, quizPrompts, slideClusters) {
  const questions = [];
  const topicName = stripMarkdown(topic.title);
  const coveragePoints = unique(
    slideClusters.flatMap((cluster) => [
      ...(cluster.summary || []),
      ...(cluster.coveragePoints || []),
    ]),
  );
  const lessonLabels = slideClusters.map((cluster) => cluster.slideRange);

  const pushQuestion = (question) => {
    const cleanQuestion = question?.trim();
    if (!cleanQuestion) {
      return;
    }

    const normalized = cleanQuestion.endsWith('?') ? cleanQuestion : `${cleanQuestion}?`;
    if (!questions.includes(normalized)) {
      questions.push(normalized);
    }
  };

  if (conceptTitles.length) {
    pushQuestion(`Before going deeper, can you explain ${conceptTitles[0]} in your own words`);
  }

  if (conceptTitles.length > 1) {
    pushQuestion(`In ${topicName}, what is the most important difference between ${conceptTitles[0]} and ${conceptTitles[1]}`);
  }

  if (quizPrompts.length) {
    pushQuestion(`If the exam asked "${quizPrompts[0]}", which idea would you start with first`);
  }

  if (slideClusters.length) {
    pushQuestion(`After finishing ${slideClusters[0].slideRange}, which exact terms or rules should you remember`);
  }

  if (slideClusters.length > 1) {
    pushQuestion(`Which part of ${topicName} is easiest to confuse when moving from ${slideClusters[0].slideRange} to ${slideClusters[1].slideRange}`);
  }

  if (conceptTitles.length) {
    pushQuestion(`Why does ${conceptTitles[0]} matter in real problems involving ${topicName}`);
  }

  if (conceptTitles.length > 2) {
    pushQuestion(`If you had to connect ${conceptTitles[0]}, ${conceptTitles[1]}, and ${conceptTitles[2]} into one logical flow, how would you explain it`);
  }

  if (quizPrompts.length > 1) {
    pushQuestion(`What is the key idea that helps you avoid getting "${quizPrompts[1]}" wrong`);
  }

  if (coveragePoints.length) {
    pushQuestion(`Can you clearly explain "${coveragePoints[0]}" without looking at your notes`);
  }

  if (coveragePoints.length > 1) {
    pushQuestion(`If you forgot "${coveragePoints[1]}", what would be missing from your exam answer`);
  }

  if (coveragePoints.length > 2) {
    pushQuestion(`How does "${coveragePoints[2]}" connect to another part of ${topicName}`);
  }

  if (coveragePoints.length > 3) {
    pushQuestion(`What real example or bug would help you remember "${coveragePoints[3]}" better`);
  }

  if (lessonLabels.length > 1) {
    pushQuestion(`After finishing ${lessonLabels[0]} and ${lessonLabels[1]}, do you see the overall flow of ${topicName}`);
  }

  if (slideClusters.length) {
    pushQuestion(`If you had to reteach the first lesson of ${topicName} to a classmate in 60 seconds, what would you say`);
  }

  const fallbackTemplates = [
    (point) => `What makes "${point}" easy to confuse during an exam`,
    (point) => `How would you turn "${point}" into a full-credit short answer`,
    (point) => `If the exam included code or a packet trace, where would "${point}" show up`,
    (point) => `What would happen if you misunderstood "${point}"`,
    (point) => `Which term, header, method, or processing step is usually tied to "${point}"`,
  ];

  let fallbackIndex = 0;
  while (questions.length < 10 && coveragePoints.length) {
    const point = coveragePoints[fallbackIndex % coveragePoints.length];
    const template = fallbackTemplates[fallbackIndex % fallbackTemplates.length];
    pushQuestion(template(point));
    fallbackIndex += 1;
  }

  let genericIndex = 1;
  while (questions.length < 10) {
    pushQuestion(`In ${topicName}, what is a self-check question number ${genericIndex} that you believe you should be able to answer`);
    genericIndex += 1;
  }

  return questions.slice(0, 10);
}

function extractKeyTerms(text = '') {
  const boldTerms = [...text.matchAll(/\*\*(.*?)\*\*/g)].map((match) => match[1]);
  const codeTerms = [...text.matchAll(/`(.*?)`/g)].map((match) => match[1]);

  return unique([...boldTerms, ...codeTerms]).slice(0, 8);
}

function shuffleDeterministically(values = []) {
  return values
    .map((value, index) => ({ value, weight: (index * 17 + String(value).length * 13) % 101 }))
    .sort((left, right) => left.weight - right.weight)
    .map((entry) => entry.value);
}

function buildGeneratedLessonQuiz(topic, lesson, lessonIndex, conceptModules, lessonModules) {
  const topicName = stripMarkdown(topic.title);
  const correctAnswer =
    lesson.coveragePoints?.find(Boolean) ||
    lesson.summary?.find(Boolean) ||
    `${lesson.title} is a core idea in ${topicName}`;

  const distractorPool = unique([
    ...conceptModules.map((module) => stripMarkdown(module.title)),
    ...lessonModules
      .filter((candidate) => candidate.id !== lesson.id)
      .flatMap((candidate) => [...(candidate.summary || []), ...(candidate.coveragePoints || [])]),
  ]).filter((candidate) => candidate && candidate !== correctAnswer);

  const distractors = shuffleDeterministically(distractorPool).slice(0, 3);
  while (distractors.length < 3) {
    distractors.push(`${topicName} detail ${distractors.length + 1}`);
  }

  const options = shuffleDeterministically([correctAnswer, ...distractors]).slice(0, 4);
  const answer = options.indexOf(correctAnswer);

  return {
    id: `generated-quiz-${lessonIndex + 1}`,
    type: 'quiz',
    title: `Quick Check ${lessonIndex + 1}`,
    navLabel: `Quiz ${lessonIndex + 1}`,
    question: `Which statement best matches a key idea from ${lesson.navLabel.toLowerCase()} (${lesson.slideRange})?`,
    options,
    answer,
    explanation: `The best answer is "${correctAnswer}" because it comes directly from ${lesson.slideRange} in ${topicName}.`,
  };
}

function buildInterleavedModules(topic, overview, conceptModules, lessonModules, authoredQuizzes) {
  const modules = [overview];

  conceptModules.forEach((module) => {
    modules.push(module);
  });

  lessonModules.forEach((lesson, lessonIndex) => {
    modules.push(lesson);

    const pairedQuiz =
      authoredQuizzes[lessonIndex] ||
      buildGeneratedLessonQuiz(topic, lesson, lessonIndex, conceptModules, lessonModules);

    modules.push({
      ...pairedQuiz,
      id: pairedQuiz.id || `quiz-${lessonIndex + 1}`,
      type: 'quiz',
      title: pairedQuiz.title || `Quick Check ${lessonIndex + 1}`,
      navLabel: pairedQuiz.navLabel || `Quiz ${lessonIndex + 1}`,
    });
  });

  if (!lessonModules.length) {
    authoredQuizzes.forEach((quiz, index) => {
      modules.push({
        ...quiz,
        id: quiz.id || `quiz-${index + 1}`,
        type: 'quiz',
        title: quiz.title || `Quick Check ${index + 1}`,
        navLabel: quiz.navLabel || `Quiz ${index + 1}`,
      });
    });
  } else if (authoredQuizzes.length > lessonModules.length) {
    authoredQuizzes.slice(lessonModules.length).forEach((quiz, index) => {
      const quizNumber = lessonModules.length + index + 1;
      modules.push({
        ...quiz,
        id: quiz.id || `quiz-${quizNumber}`,
        type: 'quiz',
        title: quiz.title || `Checkpoint ${quizNumber}`,
        navLabel: quiz.navLabel || `Quiz ${quizNumber}`,
      });
    });
  }

  return modules;
}

const studyTopics = enhancedTopics.map((topic) => {
  const slideDeck = slideDeckById[topic.id];
  const lessonModules = buildSlideClusters(slideDeck?.slides || []);
  const conceptModules = topic.modules
    .filter((module) => module.type === 'concept')
    .map((module, index) => ({
      ...module,
      id: `concept-${index + 1}`,
      navLabel: `Core ${index + 1}`,
      keyTerms: extractKeyTerms(module.content),
    }));
  const quizzes = topic.modules
    .filter((module) => module.type === 'quiz')
    .map((module, index) => ({
      ...module,
      id: `quiz-${index + 1}`,
      navLabel: `Quiz ${index + 1}`,
      title: module.title || `Checkpoint ${index + 1}`,
    }));

  const overview = buildOverviewModule(topic, lessonModules);
  const modules = buildInterleavedModules(topic, overview, conceptModules, lessonModules, quizzes);
  const totalQuizzes = modules.filter((module) => module.type === 'quiz').length;

  return {
    ...topic,
    slideCount: slideDeck?.slides?.length || 0,
    lessonCount: lessonModules.length,
    quizCount: totalQuizzes,
    conceptCount: conceptModules.length,
    modules,
  };
});

export function getStudyTopic(topicId) {
  return studyTopics.find((topic) => topic.id === topicId) || null;
}

export default studyTopics;
