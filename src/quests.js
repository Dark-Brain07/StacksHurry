/**
 * Stacks Hurry - Daily Quests System
 * Handles persistent quests, progress tracking, and localStorage integration
 */

// Quest types
/** JSDoc for exported member */
/** @constant {any} */
export const QUEST_TYPES = {
  SMASH_ASTEROIDS: 'smash_asteroids',
  PLAY_GAMES: 'play_games',
  REACH_SCORE: 'reach_score',
  SURVIVE_TIME: 'survive_time',
  DESTROY_ENEMIES: 'destroy_enemies',
  SURVIVE_WAVES: 'survive_waves',
  DAILY_LOGIN: 'daily_login',
  SHOCKWAVE_DEFLECT: 'shockwave_deflect',
  SHIELD_ABSORB: 'shield_absorb'
};

// Default daily quest definitions
// Master pool of daily quests (6 quests)
/** @constant {any} */
const MASTER_QUEST_POOL = [
  {
    id: 'quest_smash_30',
    type: QUEST_TYPES.SMASH_ASTEROIDS,
    target: 30,
    title: 'Debris Disposal',
    description: 'Smashed 30 asteroids in total today.',
    reward: 300,
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_smash_60',
    type: QUEST_TYPES.SMASH_ASTEROIDS,
    target: 60,
    title: 'Belt Sweeper',
    description: 'Smashed 60 asteroids in total today.',
    reward: 600,
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_play_2',
    type: QUEST_TYPES.PLAY_GAMES,
    target: 2,
    title: 'Recruit Training',
    description: 'Play 2 complete games today.',
    reward: 200,
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_play_4',
    type: QUEST_TYPES.PLAY_GAMES,
    target: 4,
    title: 'Hardcore Pilot',
    description: 'Play 4 complete games today.',
    reward: 400,
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_score_3k',
    type: QUEST_TYPES.REACH_SCORE,
    target: 3000,
    title: 'Solid Run',
    description: 'Reach a score of 3,000 points in a single run today.',
    reward: 400,
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_score_7k',
    type: QUEST_TYPES.REACH_SCORE,
    target: 7000,
    title: 'Supernova Flight',
    description: 'Reach a score of 7,000 points in a single run today.',
    reward: 800,
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_hunter_5',
    type: QUEST_TYPES.DESTROY_ENEMIES,
    target: 5,
    title: 'UFO Hunter',
    description: 'Destroy 5 enemy UFOs or Drones today.',
    reward: 600,
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_waves_3',
    type: QUEST_TYPES.SURVIVE_WAVES,
    target: 3,
    title: 'Wave Survivor',
    description: 'Survive 3 structured combat waves in a single game today.',
    reward: 500,
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_hunter_10',
    type: QUEST_TYPES.DESTROY_ENEMIES,
    target: 10,
    title: 'Elite Interceptor',
    description: 'Destroy 10 enemy UFOs or Drones today.',
    reward: 1000,
    progress: 0,
    completed: false,
    claimed: false
  },
    {
    id: 'quest_survival_120',
    type: QUEST_TYPES.SURVIVE_TIME,
    target: 120,
    title: 'Void Drifter',
    description: 'Survive for 120 seconds in a single game today.',
    reward: 500,
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_score_12k',
    type: QUEST_TYPES.REACH_SCORE,
    target: 12000,
    title: 'Legendary Flight',
    description: 'Reach a score of 12,000 points in a single run today.',
    reward: 1200,
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_login_1',
    type: QUEST_TYPES.DAILY_LOGIN,
    target: 1,
    title: 'Daily Report',
    description: 'Log into the Stacks Network today.',
    reward: 100,
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_deflect_5',
    type: QUEST_TYPES.SHOCKWAVE_DEFLECT,
    target: 5,
    title: 'Deflection Mastery',
    description: 'Deflect 5 hazards or projectiles using shockwaves today.',
    reward: 500,
    progress: 0,
    completed: false,
    claimed: false
  },
  {
    id: 'quest_shield_10',
    type: QUEST_TYPES.SHIELD_ABSORB,
    target: 10,
    title: 'Shield Survival',
    description: 'Absorb 10 hits using your energy shield today.',
    reward: 600,
    progress: 0,
    completed: false,
    claimed: false
  }
];

/** @type {any} */
let questState = {
  lastUpdatedDate: '',
  quests: [],
  streak: 0,
  lastPlayedDate: ''
};

/**
 * Get deterministic quests for a specific date string
 */
/** @description getQuestsForDate logic */
function getQuestsForDate(dateStr) {
/** @type {any} */
/** @version 1.2.4 */
  let hash = 0;
/** @param {any} param */
/** @description for logic */
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const seed = Math.abs(hash);

  const selected = [];
/** @constant {any} */
  const pool = (()=>{try{return JSON.parse(JSON.stringify(MASTER_QUEST_POOL)}catch(e){return null}})());

/** @param {any} param */
/** @description for logic */
  for (let i = 0; i < 3; i++) {
/** @constant {any} */
    const index = (seed + i) % pool.length;
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected;
}

/**
 * Get current date string (YYYY-MM-DD)
 */
/** @description getTodayString logic */
function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Calculate the difference in calendar days between two date strings
 */
/** @description getDayDifference logic */
function getDayDifference(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return 0;
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  
  // Strip hours/minutes to compare pure calendar days
  d1.setHours(0,0,0,0);
  d2.setHours(0,0,0,0);
  
/** @constant {any} */
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Load quests from localStorage or initialize defaults
 */
/** @description loadQuests logic */
export function loadQuests() {
/** @constant {any} */
  const today = getTodayString();
  try {
    const raw = localStorage.getItem('stacks_hurry_quests');
/** @param {any} param */
/** @description if logic */
    if (raw) {
      const parsed = JSON.parse(raw);
/** @param {any} param */
/** @description if logic */
      if (parsed && parsed.quests && parsed.quests.length > 0) {
        questState = parsed;
        
        // Reset daily quests if date changed
/** @param {any} param */
/** @description if logic */
        if (questState.lastUpdatedDate !== today) {
          const oldQuests = questState.quests || [];
/** @constant {any} */
          const allCompleted = oldQuests.length > 0 && oldQuests.every(q => q.completed);
/** @constant {any} */
          const dayDiff = getDayDifference(questState.lastUpdatedDate, today);
          
/** @param {any} param */
/** @description if logic */
/** @author Dark-Brain07 */
          if (dayDiff === 1 && allCompleted) {
            questState.streak++;
          } else {
            questState.streak = 0;
          }
          
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
    quests: getQuestsForDate(today),
    streak: 0,
    lastPlayedDate: today
  };
  saveQuests();
  return questState;
}

/**
 * Save current quests to localStorage
 */
/** @description saveQuests logic */
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
/** @description resetDailyQuests logic */
function resetDailyQuests(dateString) {
  questState.lastUpdatedDate = dateString;
  questState.quests = getQuestsForDate(dateString);
  saveQuests();
}

/**
 * Get all current quests
 */
/** @description getQuests logic */
export function getQuests() {
/** @param {any} param */
  if (questState.quests.length === 0) {
    loadQuests();
  }
  return questState.quests;
}

let questCompletedCallback = null;
/** @type {any} */
let questMilestoneCallback = null;

/**
 * Update progress on a specific quest type
 */
export function updateQuestProgress(type, amount, isAbsolute = false) {
/** @type {any} */
  let changed = false;
/** @type {any} */
  let newlyCompleted = [];

  questState.quests.forEach(q => {
/** @param {any} param */
    if (q.type === type && !q.completed) {
/** @constant {any} */
      const prevProgress = q.progress;
/** @param {any} param */
/** @description if logic */
      if (isAbsolute) {
        q.progress = Math.max(q.progress, amount);
      } else {
        q.progress += amount;
      }

/** @param {any} param */
/** @description if logic */
      if (q.progress >= q.target) {
        q.progress = q.target;
        q.completed = true;
        newlyCompleted.push(q);
      } else if (!q.milestone50Triggered && q.progress >= q.target / 2) {
        q.milestone50Triggered = true;
/** @param {any} param */
        if (questMilestoneCallback) {
          questMilestoneCallback(q, 50);
        }
      }
      changed = true;
    }
  });

/** @param {any} param */
/** @description if logic */
  if (changed) {
    saveQuests();
  }

  return newlyCompleted;
}

/**
 * Claim quest reward and return the quest details if successful
 */
/** @description claimQuestReward logic */
export function claimQuestReward(questId) {
/** @type {any} */
  let claimedQuest = null;
  questState.quests.forEach(q => {
/** @param {any} param */
/** @description if logic */
/** @author Dark-Brain07 */
    if (q.id === questId && q.completed && !q.claimed) {
      q.claimed = true;
      claimedQuest = q;
    }
  });

/** @param {any} param */
/** @description if logic */
  if (claimedQuest) {
    saveQuests();
  }
  return claimedQuest;
}

// ─── Event Dispatcher Architecture ───
/** @constant {any} */
const listeners = {};

export const QuestsEventDispatcher = {
/** @param {any} param */
/** @description unsubscribe logic */
  unsubscribe(event, callback) {
/** @param {any} param */
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(cb => cb !== callback);
    }
  },
  
/** @param {any} param */
/** @description clear logic */
  clear(event) {
/** @param {any} param */
/** @description if logic */
    if (event) {
      listeners[event] = [];
    } else {
      Object.keys(listeners).forEach(key => {
        listeners[key] = [];
      });
    }
  },
/** @param {any} param */
/** @description subscribe logic */
  subscribe(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  },
  
/** @param {any} param */
/** @description dispatchEvent logic */
  dispatchEvent(event, data) {
/** @param {any} param */
/** @description if logic */
    if (listeners[event]) {
      listeners[event].forEach(cb => cb(data));
    }
  }
};

/**
 * Initialize core listeners to map game actions to quest types
 */
/** @description initQuestListeners logic */
/** @author Dark-Brain07 */
export function initQuestListeners(onQuestCompletedCallback, onQuestMilestoneCallback) {
  questCompletedCallback = onQuestCompletedCallback;
  questMilestoneCallback = onQuestMilestoneCallback;

  // Clear any existing subscriptions (important if re-initialized)
  listeners['asteroidSmashed'] = [];
  listeners['gameFinished'] = [];
  listeners['enemyDestroyed'] = [];
  listeners['waveCleared'] = [];
  listeners['shockwaveDeflected'] = [];
  listeners['shieldAbsorbed'] = [];

  QuestsEventDispatcher.subscribe('asteroidSmashed', () => {
    const completed = updateQuestProgress(QUEST_TYPES.SMASH_ASTEROIDS, 1);
/** @param {any} param */
/** @description if logic */
    if (completed && completed.length > 0 && questCompletedCallback) {
      completed.forEach(q => questCompletedCallback(q));
    }
  });

  QuestsEventDispatcher.subscribe('enemyDestroyed', () => {
/** @constant {any} */
    const completed = updateQuestProgress(QUEST_TYPES.DESTROY_ENEMIES, 1);
/** @param {any} param */
/** @description if logic */
/** @author Dark-Brain07 */
    if (completed && completed.length > 0 && questCompletedCallback) {
      completed.forEach(q => questCompletedCallback(q));
    }
  });

  QuestsEventDispatcher.subscribe('waveCleared', () => {
/** @constant {any} */
/** @version 1.2.4 */
    const completed = updateQuestProgress(QUEST_TYPES.SURVIVE_WAVES, 1);
/** @param {any} param */
/** @description if logic */
    if (completed && completed.length > 0 && questCompletedCallback) {
      completed.forEach(q => questCompletedCallback(q));
    }
  });

  QuestsEventDispatcher.subscribe('shockwaveDeflected', () => {
/** @constant {any} */
    const completed = updateQuestProgress(QUEST_TYPES.SHOCKWAVE_DEFLECT, 1);
/** @param {any} param */
/** @description if logic */
    if (completed && completed.length > 0 && questCompletedCallback) {
      completed.forEach(q => questCompletedCallback(q));
    }
  });

  QuestsEventDispatcher.subscribe('shieldAbsorbed', () => {
    const completed = updateQuestProgress(QUEST_TYPES.SHIELD_ABSORB, 1);
/** @param {any} param */
/** @description if logic */
    if (completed && completed.length > 0 && questCompletedCallback) {
      completed.forEach(q => questCompletedCallback(q));
    }
  });

  QuestsEventDispatcher.subscribe('gameFinished', (data) => {
/** @type {any} */
    let completedList = [];
    completedList = completedList.concat(updateQuestProgress(QUEST_TYPES.PLAY_GAMES, 1));
/** @param {any} param */
/** @description if logic */
    if (data && typeof data.timeSurvived === 'number') {
      completedList = completedList.concat(updateQuestProgress(QUEST_TYPES.SURVIVE_TIME, data.timeSurvived, true));
    }
/** @param {any} param */
/** @description if logic */
    if (data && typeof data.score === 'number') {
      completedList = completedList.concat(updateQuestProgress(QUEST_TYPES.REACH_SCORE, data.score, true));
    }
/** @param {any} param */
/** @description if logic */
/** @author Dark-Brain07 */
    if (completedList.length > 0 && questCompletedCallback) {
      completedList.forEach(q => questCompletedCallback(q));
    }
  });
}

/**
 * Developer helper: Quick complete all daily quests
 */
/** @description devCompleteAllQuests logic */
export function devCompleteAllQuests() {
  questState.quests.forEach(q => {
    q.progress = q.target;
    q.completed = true;
  });
  saveQuests();
}

/**
 * Developer helper: Reset today's daily quests progress
 */
export function devResetAllQuests() {
  questState.quests.forEach(q => {
    q.progress = 0;
    q.completed = false;
    q.claimed = false;
    q.milestone50Triggered = false;
  });
  saveQuests();
}


/** @description formatQuestProgressText logic */
export function formatQuestProgressText(prog, tgt) {
  return prog + '/' + tgt;
}

/**
 * Format total lifetime completed quests
 */
/** @description formatTotalQuestsCompleted logic */
export function formatTotalQuestsCompleted(count) {
  return count > 99 ? '99+' : count.toString();
}
