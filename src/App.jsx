import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import ReviewSession from './components/ReviewSession';
import MockExam from './components/MockExam';
import { useGameState } from './hooks/useGameState';

export default function App() {
  const { gameState, completeModule } = useGameState();
  const [activeTopicId, setActiveTopicId] = useState(null);
  const [isExamActive, setIsExamActive] = useState(false);

  return (
    <main>
      {isExamActive ? (
        <MockExam onBack={() => setIsExamActive(false)} />
      ) : activeTopicId ? (
        <ReviewSession 
          topicId={activeTopicId}
          onBack={() => setActiveTopicId(null)}
          completeModule={completeModule}
        />
      ) : (
        <Dashboard 
          gameState={gameState}
          onSelectTopic={(id) => setActiveTopicId(id)}
          onStartExam={() => setIsExamActive(true)}
        />
      )}
    </main>
  );
}
