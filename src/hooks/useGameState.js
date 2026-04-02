import { useEffect, useState } from 'react';
import studyTopics from '../lib/studyContent';

const STORAGE_KEY = 'cse312StudyStateV2';

function buildTopicsState(existingTopics = {}) {
  return studyTopics.reduce((acc, topic) => {
    const savedTopic = existingTopics[topic.id];
    const completedModules = [...new Set(savedTopic?.completedModules || [])]
      .filter((index) => index >= 0 && index < topic.modules.length)
      .sort((left, right) => left - right);

    acc[topic.id] = {
      mastery: topic.modules.length
        ? Math.min(100, Math.round((completedModules.length / topic.modules.length) * 100))
        : 0,
      completedModules,
      totalModules: topic.modules.length,
    };

    return acc;
  }, {});
}

function applyDailyActivity(state) {
  const today = new Date().toDateString();

  if (state.lastActive === today) {
    return state;
  }

  if (!state.lastActive) {
    return {
      ...state,
      streak: 1,
      lastActive: today,
    };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isConsecutive = state.lastActive === yesterday.toDateString();

  return {
    ...state,
    streak: isConsecutive ? state.streak + 1 : 1,
    lastActive: today,
  };
}

function buildInitialState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    const parsed = JSON.parse(saved);

    return applyDailyActivity({
      xp: parsed.xp || 0,
      level: parsed.level || 1,
      streak: parsed.streak || 0,
      lastActive: parsed.lastActive || null,
      topics: buildTopicsState(parsed.topics),
    });
  }

  return applyDailyActivity({
    xp: 0,
    level: 1,
    streak: 0,
    lastActive: null,
    topics: buildTopicsState(),
  });
}

export function useGameState() {
  const [gameState, setGameState] = useState(buildInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const completeModule = (topicId, moduleIndex, xpEarned) => {
    setGameState(prev => {
      const topicState = prev.topics[topicId];
      if (!topicState) {
        return prev;
      }

      const alreadyCompleted = topicState.completedModules.includes(moduleIndex);
      const newCompleted = alreadyCompleted
        ? topicState.completedModules
        : [...topicState.completedModules, moduleIndex].sort((left, right) => left - right);
      const newMastery = Math.min(100, Math.round((newCompleted.length / topicState.totalModules) * 100));
      const newXp = alreadyCompleted ? prev.xp : prev.xp + xpEarned;
      const newLevel = Math.floor(newXp / 100) + 1;

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        topics: {
          ...prev.topics,
          [topicId]: {
            ...topicState,
            completedModules: newCompleted,
            mastery: newMastery,
          },
        },
      };
    });
  };

  return { gameState, completeModule };
}
