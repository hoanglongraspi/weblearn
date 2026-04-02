import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Star, Play, Layers3, FileText, CircleHelp } from 'lucide-react';
import examData from '../assets/mock-exam.json';
import studyTopics from '../lib/studyContent';

const MotionDiv = motion.div;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard({ gameState, onSelectTopic, onStartExam }) {
  const { xp, level, streak, topics } = gameState;
  const totalSlides = studyTopics.reduce((sum, topic) => sum + topic.slideCount, 0);
  const totalQuestions = examData.sections.reduce((sum, section) => sum + section.questions.length, 0);
  const nextLevelXp = level * 100;
  const currentLevelProgress = (xp % 100) / 100 * 100;

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header / Stats Bar */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>CSE 312 Interactive Review</h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: '700px' }}>
            Study in two layers inside one app: a fast core review path and detailed lesson notes that fully cover the original slides.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <Flame size={24} /> {streak} Day Streak
            </div>
          </div>
          
          <div style={{ width: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={18} color="var(--accent-primary)" />
                <span style={{ fontWeight: 'bold' }}>Level {level}</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{xp} / {nextLevelXp} XP</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${currentLevelProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '40px' }}>
        <div className="glass-panel stat-card">
          <div className="stat-label">
            <Layers3 size={18} /> Topics
          </div>
          <div className="stat-value">{studyTopics.length}</div>
          <p className="stat-note">Includes lectures, recitations, and the final capstone review.</p>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">
            <FileText size={18} /> Source Slides
          </div>
          <div className="stat-value">{totalSlides}</div>
          <p className="stat-note">Every topic includes detailed lesson clusters built from the original slide deck.</p>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">
            <CircleHelp size={18} /> Mock Questions
          </div>
          <div className="stat-value">{totalQuestions}</div>
          <p className="stat-note">Auto-graded MCQs plus rubric-based self-grading in the original exam format.</p>
        </div>
      </div>

      {/* Topics Grid */}
      <h2 style={{ marginBottom: '24px', fontSize: '1.8rem' }}>Targeted Learning Paths</h2>
      
      <MotionDiv 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '24px' 
        }}
      >
        {studyTopics.map((topic) => {
          const topicState = topics[topic.id] || { mastery: 0, totalModules: topic.modules.length, completedModules: [] };
          const isMastered = topicState.mastery === 100;
          
          return (
            <MotionDiv 
              key={topic.id} 
              variants={itemVariants}
              className="glass-panel" 
              style={{ 
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                borderColor: isMastered ? 'var(--success)' : 'var(--accent-primary)',
                borderWidth: isMastered ? '1px' : '2px'
              }}
              onClick={() => onSelectTopic(topic.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.4rem', maxWidth: '85%' }}>{topic.title}</h3>
                {isMastered ? <Star fill="var(--success)" color="var(--success)" /> : <Play color="var(--accent-primary)" fill="var(--accent-primary)" />}
              </div>
              
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px', minHeight: '45px' }}>
                {topic.description}
              </p>

              <div className="topic-metadata">
                <span>{topic.slideCount} slides</span>
                <span>{topic.lessonCount} lessons</span>
                <span>{topic.quizCount} checkpoints</span>
              </div>
              
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                <span style={{ fontWeight: 'bold', color: isMastered ? 'var(--success)' : 'var(--text-main)' }}>{topicState.mastery}%</span>
              </div>
              
              <div className="progress-track" style={{ height: '8px', background: 'var(--bg-card-hover)' }}>
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${topicState.mastery}%`,
                    background: isMastered ? 'var(--success)' : 'var(--accent-primary)'
                  }} 
                />
              </div>
              
              <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {topicState.completedModules?.length || 0} / {topicState.totalModules} steps completed
              </div>
            </MotionDiv>
          );
        })}
      </MotionDiv>

      <div 
        className="glass-panel" 
        style={{ 
          marginTop: '40px',
          background: 'var(--bg-card-strong)',
          borderColor: 'var(--accent-primary)',
          borderWidth: '2px',
          textAlign: 'center',
          padding: '40px'
        }}
      >
        <h2 style={{ fontSize: '2rem', color: 'var(--accent-primary)', marginBottom: '16px' }}>Mock Midterm For Final Check</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '24px', maxWidth: '680px', margin: '0 auto 24px auto' }}>
          This is your final synthesis step after finishing the individual topics. Use the mock to test recall speed, short-answer structure, and code-review reasoning in exam format.
        </p>
        <button 
          className="btn btn-primary" 
          style={{ fontSize: '1.2rem', padding: '16px 32px' }}
          onClick={onStartExam}
        >
          Begin Mock Exam
        </button>
      </div>
      
    </div>
  );
}
