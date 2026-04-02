import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Award, CheckCircle, FileSpreadsheet, ChevronDown } from 'lucide-react';
import variantsData from '../assets/mock-exam-variants.json';

const MotionDiv = motion.div;

function getQuestionKey(sectionId, questionIndex) {
  return `${sectionId}-${questionIndex}`;
}

function parseRubricChecklist(rubric = '') {
  return rubric
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/Points Total:/i.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, '').replace(/^\[(.*?)\]\s*/, '$1: '));
}

/**
 * Renders question text that may contain fenced code blocks (```lang\n...\n```).
 * Text segments are rendered as <p>, code blocks as <pre><code>.
 */
function QuestionText({ text }) {
  const fenceRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = fenceRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before.trim()) {
      parts.push({ type: 'text', content: before });
    }
    parts.push({ type: 'code', lang: match[1], content: match[2] });
    lastIndex = match.index + match[0].length;
  }

  const after = text.slice(lastIndex);
  if (after.trim()) {
    parts.push({ type: 'text', content: after });
  }

  return (
    <>
      {parts.map((part, i) =>
        part.type === 'code' ? (
          <pre
            key={i}
            style={{
              background: 'var(--bg-card-strong)',
              border: '1px solid var(--border-light)',
              borderLeft: '4px solid var(--accent-primary)',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '12px',
              overflowX: 'auto',
              fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
              fontSize: '0.85rem',
              lineHeight: '1.6',
              color: 'var(--text-main)',
              whiteSpace: 'pre',
            }}
          >
            {part.lang && (
              <span
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {part.lang}
              </span>
            )}
            <code>{part.content}</code>
          </pre>
        ) : (
          <span key={i} style={{ display: 'block', marginBottom: '4px' }}>
            {part.content}
          </span>
        )
      )}
    </>
  );
}

export default function MockExam({ onBack }) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selfScores, setSelfScores] = useState({});
  const [showRubrics, setShowRubrics] = useState({});
  const [examSubmitted, setExamSubmitted] = useState(false);

  const examData = variantsData[selectedVariantIndex];

  const handleVariantChange = (newIndex) => {
    setSelectedVariantIndex(newIndex);
    setAnswers({});
    setSelfScores({});
    setShowRubrics({});
    setExamSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnswerChange = (sectionId, questionIndex, value) => {
    setAnswers((previous) => ({
      ...previous,
      [getQuestionKey(sectionId, questionIndex)]: value,
    }));
  };

  const handleSelfScoreChange = (sectionId, questionIndex, score, maxScore) => {
    let value = Number.parseInt(score, 10) || 0;
    if (value > maxScore) value = maxScore;
    if (value < 0) value = 0;
    setSelfScores((previous) => ({
      ...previous,
      [getQuestionKey(sectionId, questionIndex)]: value,
    }));
  };

  const toggleRubric = (sectionId, questionIndex) => {
    setShowRubrics((previous) => ({
      ...previous,
      [getQuestionKey(sectionId, questionIndex)]: !previous[getQuestionKey(sectionId, questionIndex)],
    }));
  };

  const getSectionScore = (section) => {
    return section.questions.reduce((total, question, questionIndex) => {
      const key = getQuestionKey(section.id, questionIndex);
      if (section.type === 'mcq') {
        return answers[key] === question.answer ? total + section.pointsPerQuestion : total;
      }
      return total + (selfScores[key] || 0);
    }, 0);
  };

  const sectionBreakdown = examData.sections.map((section) => ({
    id: section.id,
    title: section.title,
    score: getSectionScore(section),
    maxScore: section.questions.length * section.pointsPerQuestion,
  }));

  const totalScore = sectionBreakdown.reduce((sum, section) => sum + section.score, 0);
  const percentage = (totalScore / examData.totalPoints) * 100;

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '40px 20px 56px' }}>
      <button
        onClick={onBack}
        className="btn btn-secondary"
        style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ArrowLeft size={20} /> Leave Exam
      </button>

      {/* Variant selector */}
      <div className="glass-panel" style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Exam Variant:</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {variantsData.map((variant, idx) => (
            <button
              key={variant.variantId}
              onClick={() => handleVariantChange(idx)}
              className={idx === selectedVariantIndex ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ minWidth: '48px', padding: '8px 16px', fontWeight: 700 }}
            >
              {variant.variantId}
            </button>
          ))}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginLeft: 'auto' }}>
          Switching variant resets your answers
        </span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '12px' }}>
          {examData.title}
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto' }}>
          {examData.description} — Total Points: {examData.totalPoints}. MCQs are auto-graded on submission;
          free-response sections use rubric checklists for self-grading.
        </p>
      </div>

      {!examSubmitted && (
        <div className="glass-panel" style={{ marginBottom: '32px', border: '1px solid var(--warning)' }}>
          <p style={{ color: 'var(--warning)', fontWeight: 'bold', marginBottom: '8px' }}>Testing Instructions</p>
          <ul className="rich-list" style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
            <li>Answer the MCQs like a real exam, then submit to auto-grade the multiple-choice section.</li>
            <li>For short-answer and code review, write your response first, then open the rubric and grade yourself honestly.</li>
            <li>When reading the rubric, focus on the must-have ideas, not just the final score.</li>
          </ul>
        </div>
      )}

      {examData.sections.map((section) => {
        const sectionScore = getSectionScore(section);
        const sectionMax = section.questions.length * section.pointsPerQuestion;

        return (
          <div key={section.id} className="glass-panel" style={{ marginBottom: '32px' }}>
            <div className="exam-section-header">
              <div>
                <h2 style={{ color: 'var(--accent-primary)', marginBottom: '10px' }}>{section.title}</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                  {section.questions.length} questions • {section.pointsPerQuestion} point(s) each
                </p>
              </div>
              {examSubmitted && (
                <div className="exam-score-pill">
                  {sectionScore} / {sectionMax}
                </div>
              )}
            </div>

            {section.questions.map((question, questionIndex) => {
              const key = getQuestionKey(section.id, questionIndex);
              const isMcq = section.type === 'mcq';
              const isCorrect = answers[key] === question.answer;
              const checklist = parseRubricChecklist(question.rubric);

              return (
                <div
                  key={key}
                  style={{
                    marginBottom: '24px',
                    padding: '18px',
                    background: 'var(--bg-card-strong)',
                    borderRadius: '12px',
                    borderLeft: '4px solid var(--accent-secondary)',
                  }}
                >
                  {/* Question label */}
                  <div style={{ fontWeight: 'bold', fontSize: '1.08rem', marginBottom: '12px' }}>
                    <span>Q{questionIndex + 1}. </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      ({section.pointsPerQuestion} pts)
                    </span>
                    <div style={{ marginTop: '6px', color: 'var(--text-main)', fontWeight: 'normal' }}>
                      <QuestionText text={question.q} />
                    </div>
                  </div>

                  {isMcq ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={option}
                          className="mcq-option-row"
                          style={{
                            borderColor:
                              examSubmitted && optionIndex === question.answer
                                ? 'var(--success)'
                                : answers[key] === optionIndex
                                  ? 'var(--accent-primary)'
                                  : 'var(--border-light)',
                          }}
                        >
                          <input
                            type="radio"
                            name={key}
                            value={optionIndex}
                            checked={answers[key] === optionIndex}
                            onChange={() => handleAnswerChange(section.id, questionIndex, optionIndex)}
                            disabled={examSubmitted}
                          />
                          <span>{option}</span>
                        </label>
                      ))}

                      {examSubmitted && (
                        <div style={{ marginTop: '6px', color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                          {isCorrect ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircle size={16} /> Correct
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertCircle size={16} /> Correct answer: {question.options[question.answer]}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <textarea
                        value={answers[key] || ''}
                        onChange={(event) => handleAnswerChange(section.id, questionIndex, event.target.value)}
                        placeholder="Type your detailed answer here..."
                        className="exam-textarea"
                      />

                      <div className="exam-rubric-controls">
                        <button className="btn btn-secondary" onClick={() => toggleRubric(section.id, questionIndex)}>
                          {showRubrics[key] ? 'Hide Rubric' : 'Open Rubric'}
                        </button>

                        {showRubrics[key] && (
                          <div className="exam-score-input">
                            <span>Self-score (0-{section.pointsPerQuestion})</span>
                            <input
                              type="number"
                              min="0"
                              max={section.pointsPerQuestion}
                              value={selfScores[key] ?? ''}
                              onChange={(event) =>
                                handleSelfScoreChange(section.id, questionIndex, event.target.value, section.pointsPerQuestion)
                              }
                            />
                          </div>
                        )}
                      </div>

                      {showRubrics[key] && (
                        <MotionDiv
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="study-subpanel"
                          style={{ borderColor: 'rgba(37, 99, 235, 0.35)' }}
                        >
                          <div className="study-panel-title">
                            <FileSpreadsheet size={18} />
                            Grading Rubric
                          </div>
                          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: '0 0 14px', color: 'var(--text-main)' }}>
                            {question.rubric}
                          </pre>
                          <div className="study-panel-title" style={{ marginBottom: '10px' }}>
                            <CheckCircle size={18} />
                            Strong answer checklist
                          </div>
                          <ul className="rich-list" style={{ marginBottom: 0 }}>
                            {checklist.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </MotionDiv>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="glass-panel" style={{ textAlign: 'center', marginTop: '40px' }}>
        {!examSubmitted ? (
          <button
            className="btn btn-primary"
            style={{ fontSize: '1.2rem', padding: '16px 32px' }}
            onClick={() => {
              setExamSubmitted(true);
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
          >
            Submit Exam & Calculate Final Score
          </button>
        ) : (
          <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Award
              size={64}
              color={percentage >= 90 ? 'var(--warning)' : 'var(--accent-primary)'}
              style={{ margin: '0 auto 16px auto' }}
            />
            <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>
              Final Score: {totalScore} / {examData.totalPoints}
            </h2>
            <p style={{ fontSize: '1.2rem', color: percentage >= 90 ? 'var(--warning)' : 'var(--success)', marginBottom: '22px' }}>
              ({percentage.toFixed(1)}%) —{' '}
              {percentage >= 90 ? 'Outstanding!' : percentage >= 80 ? 'Great Job!' : 'Keep Studying!'}
            </p>

            <div className="stats-grid">
              {sectionBreakdown.map((section) => (
                <div key={section.id} className="study-subpanel" style={{ textAlign: 'left' }}>
                  <div className="study-panel-title">{section.title}</div>
                  <strong style={{ fontSize: '1.5rem' }}>
                    {section.score} / {section.maxScore}
                  </strong>
                </div>
              ))}
            </div>

            <button
              className="btn btn-secondary"
              style={{ marginTop: '24px' }}
              onClick={() => {
                setExamSubmitted(false);
                setAnswers({});
                setSelfScores({});
                setShowRubrics({});
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Retake This Variant
            </button>
          </MotionDiv>
        )}
      </div>
    </div>
  );
}
