/**
 * Stacks Hurry - Daily Quests System
 * Handles persistent quests, progress tracking, and localStorage integration
 */

// Quest types
export const QUEST_TYPES = {
  SMASH_ASTEROIDS: 'smash_asteroids',
  PLAY_GAMES: 'play_games',
  REACH_SCORE: 'reach_score',
  SURVIVE_TIME: 'survive_time'
};

// Default daily quest definitions
const DEFAULT_QUESTS = [
  {
    id: 'quest_smash_50',
    type: QUEST_TYPES.SMASH_ASTEROIDS,
    target: 50,
    title: 'Asteroid Sweeper',
    description: 'Smashed 50 asteroids in total.',
    reward: 500, // Points or mock STX
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_play_3',
    type: QUEST_TYPES.PLAY_GAMES,
    target: 3,
    title: 'Veteran Pilot',
    description: 'Play 3 complete games.',
    reward: 300,
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_score_5k',
    type: QUEST_TYPES.REACH_SCORE,
    target: 5000,
    title: 'Legendary Run',
    description: 'Reach a score of 5,000 points in a single run.',
    reward: 1000,
    progress: 0,
    completed: false,
    claimed: false
  }
];

let questState = {
  lastUpdatedDate: '',
  quests: [],
  streak: 0,
  lastPlayedDate: ''
};

/**
 * Get current date string (YYYY-MM-DD)
 */
function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Load quests from localStorage or initialize defaults
 */
export function loadQuests() {
  const today = getTodayString();
  try {
    const raw = localStorage.getItem('stacks_hurry_quests');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.quests && parsed.quests.length > 0) {
        questState = parsed;
        
        // Reset daily quests if date changed
        if (questState.lastUpdatedDate !== today) {
          resetDailyQuests(today);
        }
        return questState;
      }
    }
  } catch (e) {
    console.error('Failed to load quest state:', e);
  }

  // Initialize brand new state
  questState = {
    lastUpdatedDate: today,
    quests: JSON.parse(JSON.stringify(DEFAULT_QUESTS)),
    streak: 0,
    lastPlayedDate: today
  };
  saveQuests();
  return questState;
}

/**
 * Save current quests to localStorage
 */
export function saveQuests() {
  try {
    localStorage.setItem('stacks_hurry_quests', JSON.stringify(questState));
  } catch (e) {
    console.error('Failed to save quest state:', e);
  }
}

/**
 * Reset quests for a new day
 */
function resetDailyQuests(dateString) {
  questState.lastUpdatedDate = dateString;
  questState.quests = JSON.parse(JSON.stringify(DEFAULT_QUESTS));
  saveQuests();
}

/**
 * Get all current quests
 */
export function getQuests() {
  if (questState.quests.length === 0) {
    loadQuests();
  }
  return questState.quests;
}

/**
 * Update progress on a specific quest type
 */
export function updateQuestProgress(type, amount, isAbsolute = false) {
  let changed = false;
  let newlyCompleted = [];

  questState.quests.forEach(q => {
    if (q.type === type && !q.completed) {
      if (isAbsolute) {
        q.progress = Math.max(q.progress, amount);
      } else {
        q.progress += amount;
      }

      if (q.progress >= q.target) {
        q.progress = q.target;
        q.completed = true;
        newlyCompleted.push(q);
      }
      changed = true;
    }
  });

  if (changed) {
    saveQuests();
  }

  return newlyCompleted;
}
