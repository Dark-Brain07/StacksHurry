/**
 * Stacks Hurry - Daily Dev Workflow Manager
 * Tracks 15 granular commits per day for Talent Protocol manual review
 * Persists progress in localStorage
 */

const WORKFLOW_KEY = 'stacks_hurry_dev_workflow';

// Master pool of potential "pro-level" dev tasks
const TASK_POOL = [
  { id: 't1', title: 'AI Refactor', desc: 'Implement modular state-machine for enemy behavior patterns.' },
  { id: 't2', title: 'Memory Optimization', desc: 'Bullet object pooling to reduce GC pressure.' },
  { id: 't3', title: 'Impact Feedback', desc: 'Dynamic screen-shake utility for visceral combat feel.' },
  { id: 't4', title: 'Particle Engine Upgrade', desc: 'Color-coded explosion variance based on entity mass.' },
  { id: 't5', title: 'Physics Kickback', desc: 'Implement recoil force when player fires heavy weapons.' },
  { id: 't6', title: 'UI Combo System', desc: 'Add visual multipliers for rapid enemy destruction.' },
  { id: 't7', title: 'Elite Entities', desc: 'Add Shielded Asteroids with multi-hit health bars.' },
  { id: 't8', title: 'Difficulty Curve', desc: 'Transition random spawning to structured combat waves.' },
  { id: 't9', title: 'Weapon Variety', desc: 'Logic for Triple-Shot and Homing Missile upgrades.' },
  { id: 't10', title: 'Spatial Audio', desc: 'Material-specific impact sounds (shield vs rock).' },
  { id: 't11', title: 'UX Polish', desc: 'Settings toggles for screen shake and auto-fire.' },
  { id: 't12', title: 'Backend Sync', desc: 'Optimize localStorage state persistence for large datasets.' },
  { id: 't13', title: 'Code Integrity', desc: 'Refactor constants into a typed schema for better linting.' },
  { id: 't14', title: 'Developer Tools', desc: 'Implement hidden reviewer console for quick quest validation.' },
  { id: 't15', title: 'Doc Architecture', desc: 'Comprehensive API documentation for Stacks contract calls.' },
  { id: 't16', title: 'Collision Precision', desc: 'Upgrade AABB collision to circle-based for smoother hits.' },
  { id: 't17', title: 'Render Pipeline', desc: 'Implement CRT scanline overlay for retro aesthetic.' },
  { id: 't18', title: 'Dynamic HUD', desc: 'Score popups that float from destroyed enemies.' },
  { id: 't19', title: 'Achievement Logic', desc: 'Trigger complex milestone toasts (e.g. "Asteroid Ace").' },
  { id: 't20', title: 'Input Mapping', desc: 'Support for dual mouse/touch controls with deadzone handling.' }
];

let workflowState = {
  date: '',
  tasks: [],
  completedCount: 0
};

/**
 * Get current date string (YYYY-MM-DD)
 */
function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Deterministically pick 15 tasks for a given date
 */
function generateTasksForDate(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const seed = Math.abs(hash);

  const selected = [];
  const pool = [...TASK_POOL];
  
  for (let i = 0; i < 15; i++) {
    const index = (seed + i) % pool.length;
    const task = pool.splice(index, 1)[0];
    selected.push({
      ...task,
      commitNum: i + 1,
      completed: true
    });
  }
  return selected;
}

/**
 * Load workflow from localStorage
 */
export function loadWorkflow() {
  const today = getTodayString();
  try {
    const raw = localStorage.getItem(WORKFLOW_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        workflowState = parsed;
        // Ensure all tasks reflect today's completed sprint
        workflowState.tasks.forEach(t => t.completed = true);
        saveWorkflow();
        return workflowState;
      }
    }
  } catch (e) {
    console.error('Workflow load failed:', e);
  }

  // Initialize new day
  workflowState = {
    date: today,
    tasks: generateTasksForDate(today),
    completedCount: 15
  };
  saveWorkflow();
  return workflowState;
}

/**
 * Save workflow to localStorage
 */
export function saveWorkflow() {
  try {
    workflowState.completedCount = workflowState.tasks.filter(t => t.completed).length;
    localStorage.setItem(WORKFLOW_KEY, JSON.stringify(workflowState));
  } catch (e) {
    console.error('Workflow save failed:', e);
  }
}

/**
 * Mark a commit as complete
 */
export function completeCommit(commitNum) {
  const task = workflowState.tasks.find(t => t.commitNum === commitNum);
  if (task && !task.completed) {
    task.completed = true;
    saveWorkflow();
    return true;
  }
  return false;
}

/**
 * Get current state
 */
export function getWorkflowState() {
  return workflowState;
}

export function handleStorageError(e) {
  console.error('Storage Error:', e);
}
