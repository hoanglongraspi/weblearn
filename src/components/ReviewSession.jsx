import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Lightbulb,
  HelpCircle,
  CheckCircle,
  XCircle,
  Layers3,
  ListChecks,
  NotebookTabs,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getStudyTopic } from '../lib/studyContent';

const MotionDiv = motion.div;

function toInlineHtml(text = '') {
  return text
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
}

function renderRichText(text = '') {
  const lines = text.split('\n');
  const blocks = [];
  let listItems = [];
  let orderedList = false;

  const flushList = () => {
    if (!listItems.length) {
      return;
    }

    const Tag = orderedList ? 'ol' : 'ul';
    blocks.push(
      <Tag key={`list-${blocks.length}`} className="rich-list">
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`} dangerouslySetInnerHTML={{ __html: toInlineHtml(item) }} />
        ))}
      </Tag>,
    );

    listItems = [];
    orderedList = false;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (/^###\s+/.test(trimmed)) {
      flushList();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="study-subheading">
          {trimmed.replace(/^###\s+/, '')}
        </h3>,
      );
      return;
    }

    if (/^##\s+/.test(trimmed)) {
      flushList();
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className="study-heading">
          {trimmed.replace(/^##\s+/, '')}
        </h2>,
      );
      return;
    }

    if (/^- /.test(trimmed)) {
      if (orderedList) {
        flushList();
      }

      listItems.push(trimmed.replace(/^- /, ''));
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!orderedList && listItems.length) {
        flushList();
      }

      orderedList = true;
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} dangerouslySetInnerHTML={{ __html: toInlineHtml(trimmed) }} />,
    );
  });

  flushList();

  return blocks;
}

function getStepMeta(step) {
  switch (step.type) {
    case 'overview':
      return {
        label: 'Overview',
        icon: <BookOpen size={18} />,
        accent: 'var(--accent-primary)',
      };
    case 'concept':
      return {
        label: 'Core Concept',
        icon: <Lightbulb size={18} />,
        accent: 'var(--warning)',
      };
    case 'lesson':
      return {
        label: 'Study Prep',
        icon: <NotebookTabs size={18} />,
        accent: 'var(--accent-secondary)',
      };
    case 'quiz':
      return {
        label: 'Checkpoint',
        icon: <HelpCircle size={18} />,
        accent: 'var(--success)',
      };
    default:
      return {
        label: 'Study Step',
        icon: <Layers3 size={18} />,
        accent: 'var(--accent-primary)',
      };
  }
}

function OverviewStep({ topic, module }) {
  return (
    <>
      <div className="study-card-header" style={{ color: 'var(--accent-primary)' }}>
        <BookOpen size={28} />
        <div>
          <p className="module-kicker">Topic Launch</p>
          <h2>{topic.title}</h2>
        </div>
      </div>

      <div className="study-copy">{renderRichText(module.content)}</div>

      <div className="overview-metrics">
        <div className="overview-metric">
          <span>Study steps</span>
          <strong>{topic.modules.length}</strong>
        </div>
        <div className="overview-metric">
          <span>Source slides</span>
          <strong>{topic.slideCount}</strong>
        </div>
        <div className="overview-metric">
          <span>Lessons</span>
          <strong>{topic.lessonCount}</strong>
        </div>
        <div className="overview-metric">
          <span>Checkpoints</span>
          <strong>{topic.quizCount}</strong>
        </div>
      </div>

      <div className="study-grid-two">
        <div className="study-subpanel">
          <div className="study-panel-title">
            <Layers3 size={18} />
            Fast Track
          </div>
          <ul className="rich-list">
            {module.quickHits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="study-subpanel">
          <div className="study-panel-title">
            <ListChecks size={18} />
            Exam Lens
          </div>
          <ul className="rich-list">
            {module.examChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {!!module.guidedQuestions?.length && (
        <div className="study-subpanel" style={{ marginTop: '16px' }}>
          <div className="study-panel-title">
            <HelpCircle size={18} />
            Guided Questions
          </div>
          <ul className="rich-list" style={{ marginBottom: 0 }}>
            {module.guidedQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function ConceptStep({ module }) {
  return (
    <>
      <div className="study-card-header" style={{ color: 'var(--warning)' }}>
        <Lightbulb size={28} />
        <div>
          <p className="module-kicker">Core Concept</p>
          <h2>{module.title}</h2>
        </div>
      </div>

      {!!module.keyTerms?.length && (
        <div className="tag-row" style={{ marginBottom: '24px' }}>
          {module.keyTerms.map((term) => (
            <span key={term} className="tag-pill">
              {term}
            </span>
          ))}
        </div>
      )}

      <div className="study-copy">{renderRichText(module.content)}</div>
    </>
  );
}

function LessonStep({ module }) {
  return (
    <>
      <div className="study-card-header" style={{ color: 'var(--accent-secondary)' }}>
        <NotebookTabs size={28} />
        <div>
          <p className="module-kicker">{module.slideRange}</p>
          <h2>{module.navLabel}: {module.title}</h2>
        </div>
      </div>

      {!!module.summary?.length && (
        <div className="study-subpanel" style={{ marginBottom: '24px' }}>
          <div className="study-panel-title">
            <ListChecks size={18} />
            Key Takeaways
          </div>
          <ul className="rich-list">
            {module.summary.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="slide-stack">
        {module.lectureSections.map((section) => (
          <article key={section.id} className="source-slide-card">
            <div className="source-slide-top">
              <span className="source-slide-number">{section.label}</span>
              <h3>{section.title}</h3>
            </div>

            <div className="source-slide-body">
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="rich-list" style={{ margin: '8px 0 0', paddingLeft: '4px' }}>
                  {section.bullets.map((point, idx) =>
                    section.isBullet?.[idx] !== false ? (
                      <li key={idx}>{point}</li>
                    ) : (
                      <p key={idx} style={{ margin: '4px 0' }}>{point}</p>
                    )
                  )}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                  Title / transition slide — no additional bullet content.
                </p>
              )}
            </div>
          </article>
        ))}
      </div>



      <details className="study-subpanel" style={{ marginTop: '24px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--text-main)' }}>
          View exact slide source
        </summary>
        <div className="slide-stack" style={{ marginTop: '16px' }}>
          {module.sourceSlides.map((slide) => (
            <article key={`source-${slide.slideNumber}`} className="source-slide-card">
              <div className="source-slide-top">
                <span className="source-slide-number">Slide {slide.slideNumber}</span>
                <h3>{slide.title}</h3>
              </div>
              {slide.items.length ? (
                <div className="source-slide-body">
                  {slide.items.map((item, index) =>
                    item.bullet ? (
                      <div key={`${slide.slideNumber}-source-bullet-${index}`} className="source-slide-bullet">
                        <span className="source-slide-bullet-dot" />
                        <span>{item.text}</span>
                      </div>
                    ) : (
                      <p key={`${slide.slideNumber}-source-text-${index}`}>{item.text}</p>
                    ),
                  )}
                </div>
              ) : (
                <p className="source-slide-empty">This slide mainly acts as a title or framing transition for the subtopic.</p>
              )}
            </article>
          ))}
        </div>
      </details>
    </>
  );
}

function QuizStep({
  module,
  selectedOption,
  showFeedback,
  setSelectedOption,
  onSubmit,
  onNext,
}) {
  return (
    <>
      <div className="study-card-header" style={{ color: 'var(--success)' }}>
        <HelpCircle size={28} />
        <div>
          <p className="module-kicker">{module.title}</p>
          <h2>Knowledge Check</h2>
        </div>
      </div>

      <div className="quiz-question">{module.question}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {module.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrect = module.answer === index;

          let background = 'var(--bg-card)';
          let borderColor = 'var(--border-light)';

          if (showFeedback) {
            if (isCorrect) {
              background = 'rgba(37, 99, 235, 0.12)';
              borderColor = 'var(--success)';
            } else if (isSelected) {
              background = 'rgba(15, 23, 42, 0.08)';
              borderColor = 'var(--danger)';
            }
          } else if (isSelected) {
            background = 'var(--bg-card-hover)';
            borderColor = 'var(--accent-primary)';
          }

          return (
            <button
              key={option}
              className="btn quiz-option"
              style={{
                background,
                border: `2px solid ${borderColor}`,
              }}
              disabled={showFeedback}
              onClick={() => setSelectedOption(index)}
            >
              <span>{option}</span>
              {showFeedback && isCorrect && <CheckCircle style={{ marginLeft: 'auto', color: 'var(--success)' }} />}
              {showFeedback && isSelected && !isCorrect && <XCircle style={{ marginLeft: 'auto', color: 'var(--danger)' }} />}
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="study-subpanel"
          style={{ marginTop: '24px', borderColor: 'var(--border-light)' }}
        >
          <div className="study-panel-title">
            <ListChecks size={18} />
            Why this answer works
          </div>
          <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: 1.7 }}>
            <strong>{selectedOption === module.answer ? 'Correct.' : 'Not quite.'}</strong> {module.explanation}
          </p>
        </motion.div>
      )}

      <div className="study-actions">
        {!showFeedback ? (
          <button
            className="btn btn-primary"
            style={{ width: '220px', opacity: selectedOption !== null ? 1 : 0.55 }}
            disabled={selectedOption === null}
            onClick={onSubmit}
          >
            Check Answer
          </button>
        ) : (
          <button className="btn btn-primary" style={{ width: '220px' }} onClick={onNext}>
            {selectedOption === module.answer ? 'Next (+15 XP)' : 'Next (+5 XP)'}
          </button>
        )}
      </div>
    </>
  );
}

export default function ReviewSession({ topicId, onBack, completeModule }) {
  const topic = useMemo(() => getStudyTopic(topicId), [topicId]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [showFinished, setShowFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  if (!topic) {
    return <div>Topic not found</div>;
  }

  const modules = topic.modules;
  const currentModule = modules[currentModuleIndex];
  const progress = ((currentModuleIndex + 1) / modules.length) * 100;

  const goToModule = (nextIndex) => {
    setSelectedOption(null);
    setShowFeedback(false);
    setCurrentModuleIndex(nextIndex);
  };

  const handleNext = (xpEarned = 5) => {
    completeModule(topicId, currentModuleIndex, xpEarned);

    if (currentModuleIndex < modules.length - 1) {
      goToModule(currentModuleIndex + 1);
      return;
    }

    setShowFinished(true);
  };

  const goToPrevious = () => {
    goToModule(Math.max(0, currentModuleIndex - 1));
  };

  const handleQuizSubmit = () => {
    if (selectedOption === null) {
      return;
    }

    setShowFeedback(true);
  };

  if (showFinished) {
    return (
      <div style={{ padding: '40px', maxWidth: '820px', margin: '100px auto', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel"
          style={{ padding: '60px 40px' }}
        >
          <TrophyIcon />
          <h1 className="text-gradient" style={{ fontSize: '3rem', margin: '24px 0' }}>Topic Complete</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            You finished both the core review and the detailed lesson notes for <strong>{topic.title}</strong>.
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>
            When you want to review again, jump back to this topic from the dashboard or head straight into the mock midterm to test retention.
          </p>
          <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.2rem' }} onClick={onBack}>
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const stepMeta = getStepMeta(currentModule);

  return (
    <div style={{ padding: '32px 24px 48px', maxWidth: '1320px', margin: '0 auto' }}>
      <div className="review-topbar">
        <button className="btn btn-outline" onClick={onBack}>
          <ArrowLeft size={18} /> Back
        </button>

        <div className="review-topbar-copy">
          <p>{topic.title}</p>
          <span>
            {currentModuleIndex + 1} / {modules.length} steps
          </span>
        </div>
      </div>

      <div className="progress-track" style={{ marginBottom: '28px' }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="study-session-layout">
        <aside className="glass-panel study-sidebar">
          <div className="study-sidebar-intro">
            <h2>{topic.title}</h2>
            <p>{topic.description}</p>
          </div>

          <div className="study-sidebar-list">
            {modules.map((module, index) => {
              const meta = getStepMeta(module);
              const isActive = index === currentModuleIndex;

              return (
                <button
                  key={module.id || `${module.type}-${index}`}
                  type="button"
                  className={`study-sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => goToModule(index)}
                >
                  <span className="study-sidebar-index">{index + 1}</span>
                  <span className="study-sidebar-content">
                    <span className="study-sidebar-label">{meta.label}</span>
                    <strong>{module.navLabel || module.title || module.slideRange}</strong>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="study-main">
          <AnimatePresence mode="wait">
            <MotionDiv
              key={currentModule.id || `${currentModule.type}-${currentModuleIndex}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="glass-panel study-card"
            >
              <div className="step-chip" style={{ borderColor: stepMeta.accent, color: stepMeta.accent }}>
                {stepMeta.icon}
                {stepMeta.label}
              </div>

              {currentModule.type === 'overview' && <OverviewStep topic={topic} module={currentModule} />}
              {currentModule.type === 'concept' && <ConceptStep module={currentModule} />}
              {currentModule.type === 'lesson' && <LessonStep module={currentModule} />}
              {currentModule.type === 'quiz' && (
                <QuizStep
                  module={currentModule}
                  selectedOption={selectedOption}
                  showFeedback={showFeedback}
                  setSelectedOption={setSelectedOption}
                  onSubmit={handleQuizSubmit}
                  onNext={() => handleNext(selectedOption === currentModule.answer ? 15 : 5)}
                />
              )}

              {currentModule.type !== 'quiz' && (
                <div className="study-actions">
                  <button
                    className="btn btn-outline"
                    disabled={currentModuleIndex === 0}
                    onClick={goToPrevious}
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>

                  <button className="btn btn-primary" onClick={() => handleNext(5)}>
                    {currentModuleIndex === modules.length - 1 ? 'Finish Topic' : 'Mark Reviewed (+5 XP)'}
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </MotionDiv>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TrophyIcon() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--accent-primary)' }}>
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
        <path d="M4 22h16"></path>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
      </svg>
    </div>
  );
}
