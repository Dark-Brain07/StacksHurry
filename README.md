# 🚀 Stacks Hurry — High-Performance Decentralized Web3 Arcade

Stacks Hurry is a fast-paced, high-fidelity HTML5 Canvas space shooter built on the **Stacks blockchain**. This project combines pixel-perfect arcade physics, high-performance object pooling, decoupled event-driven architectures, and resilient Web3 transactions into a seamless desktop and mobile-friendly dApp.

![Stacks](https://img.shields.io/badge/Stacks-Mainnet-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Vite](https://img.shields.io/badge/Framework-Vite-blueviolet?style=for-the-badge)
![Physics](https://img.shields.io/badge/Math-2D--Vector--Physics-ff69b4?style=for-the-badge)

---

## 🏗️ Core Engineering Architecture

### 1. Vector Physics Engine (`src/physics.js`)
Rather than relying on primitive floating coordinates that struggle with floating-point drift, the engine leverage a custom `Vector2D` linear algebra utility. This class encapsulates high-performance vector math operations, enabling seamless coordinate calculations, circle collisions, and complex elastic collisions.
- **Momentum Splitting**: Upon shooting a large asteroid, child fragments inherit a percentage of the parent's momentum, drifting outward diagonally using diagonal vector decomposition to conserve kinetic energy.

### 2. Decoupled Quest Event Bus (`src/quests.js`)
To decouple gameplay mechanics from storage, rewards, and daily quests, we implemented a custom pub-sub model using the `QuestsEventDispatcher`. 
- When an asteroid is smashed or a wave is completed, the game engine fires events over the bus.
- The Quest engine captures these events, increments daily challenge progress stored in `localStorage`, and triggers state updates asynchronously, preventing game loop degradation.

### 3. Queue-Based Notification Manager (`src/ui.js`)
To resolve UI overlay overlap and improve visual user experience, we replaced independent DOM rendering alerts with a synchronized, non-overlapping `toastQueue`. Notifications are buffered sequentially, dynamically easing onto the canvas and processing down the stack cleanly once animations finalize.

### 4. Resilient Transactions (`src/contracts.js`)
To mitigate RPC failures and web3 connection dropouts during network congestion, write transaction calls incorporate:
- **Exponential Backoff**: Automates three retries with increasing backoff delays ($delay \times 2^{attempt - 1}$).
- **Verbose Diagnostics**: Detailed developer console printouts capturing transaction states, serialize buffer representations, and error states.

### 5. Unified Pilot Navigation (`src/game.js`)
The game is built for universal accessibility:
- **Mouse Steering**: Smooth exponential pointer follow.
- **Touch Steering**: Virtual joystick tracking for mobile screens.
- **Keyboard Steering**: Standard `W`/`A`/`S`/`D` and Arrow pilot steering featuring diagonal velocity normalization to prevent double-speed drift.
- **Automatic Sensing**: Organically swaps between mouse and keyboard inputs upon detecting pointer movements or keyboard press actions.

---

## 📅 Chronological Development Sprint Logs

Here is a full technical breakdown of the 15 contributions integrated to elevate the game engine:

1. `refactor(physics): Add advanced 2D Vector mathematics utility class`
   - Created high-performance `Vector2D` class with algebraic helper utilities.
2. `feat(physics): Leverage Vector2D in checkCircleCollision and distance calculations`
   - Replaced coordinate math in game logic with standard Vector parameters.
3. `refactor(particles): Implement customizable Particle class in particle system`
   - Replaced raw array maps with an OOP `Particle` class with localized draw loops.
4. `feat(vfx): Introduce screen shake decay and additive vibration modes`
   - Upgraded screen shake to a high-frequency sine oscillator featuring exponential damping.
5. `feat(audio): Implement toggleable localized BGM mute system with memory caching`
   - Added persistent local storage mute preference caching to avoid BGM sound overlapping on reload.
6. `feat(config): Introduce ship upgrade constants for speed, shield, and fire cooldowns`
   - Added tiered balanced upgrade properties (`SHIP_TIERS`) to configuration files.
7. `feat(enemies): Introduce a splitting small asteroid type with half-mass calculation`
   - Integrated diagonal vector momentum conservation when split fragments break off.
8. `refactor(ui): Optimize achievement toast animations and multi-toast queuing system`
   - Engineered a queue-based `toastQueue` to buffer overlapping HUD achievements sequentially.
9. `feat(quests): Add Daily Quest variety to pool (Score thresholds, Time survival)`
   - Linked game loop survivor clocks to new daily quest challenge tiers.
10. `feat(ui): Display daily quest streak animations and total points badge`
    - Injected interactive streak glow-ups and daily accumulated rewards points indicators.
11. `feat(contracts): Add transaction retry logic and verbose error reporting`
    - Implemented exponential backoff web3 retry loop with descriptive error handlers.
12. `feat(ui): Implement interactive Keyboard shortcuts display screen in settings`
    - Designed custom styled HTML `<kbd>` settings dashboard showcasing desktop controls.
13. `feat(game): Implement standard WASD and Arrow key controls for desktop pilots`
    - Added comprehensive steering input listeners with diagonal vector normalization.
14. `feat(game): Implement dynamic triple-shot powerup time extension logic`
    - Changed override duration multipliers to additively stack active powerups.
15. `docs(architecture): Upgrade system overview and features log in README.md`
    - Rewrote full codebase architecture documentation and development logs.

---

## 📜 Smart Contracts

| Contract | Address | Purpose |
|---|---|---|
| `open-mint-nft` | `SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF` | Open edition NFT minting |
| `character-nft` | `SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF` | Character NFT collection |
| `score` | `SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF` | Hall of Fame scoring (5000 uSTX fee) |
| `rocket-shooter` | `SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF` | Game score tracking |

---

## 🛠 Tech Stack

- **Vite** — Lightning-fast dev server & build
- **HTML5 Canvas** — Smooth 60fps game rendering
- **Stacks.js** — Decentralized contract interaction
- **Web Audio API** — Procedural sound effects
- **Vanilla CSS** — Custom space theme and glow panels

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 🛠️ Sprint 2: High-Performance Visual & Physics Upgrades

Our second development sprint focused on zero-Garbage-Collection graphics pooling, tactile boundary physics, compounding gameplay modifiers, and granular mobile performance tuning:

1. **`feat(ui): Add CRT Scanlines toggle filter to visual settings`**
   - Added CRT retro overlay toggle with local settings state caching in UI settings.
2. **`feat(audio): Add subtle procedural frequency/pitch randomization to laser sounds`**
   - Randomized baseline synthesizer frequency shifts dynamically to create retro acoustic diversity.
3. **`feat(physics): Add elastic boundary pushback to ship navigation`**
   - Softened rigid coordinate clamping with organic rebound impulses when hitting boundary borders.
4. **`feat(game): Implement localized high scores tracking history in UI settings`**
   - Configured high-fidelity top 5 score history caching without requiring initial connection.
5. **`refactor(particles): Implement unified ParticlePool for zero-garbage-collection performance`**
   - Replaced dynamic particle instantiation with pre-allocated memory pool patterns, avoiding micro-stuttering.
6. **`feat(a11y): Add focus trap and ESC key closure to modals`**
   - Enhanced modal accessibility with Escape-key global handlers and keyboard focus loops.
7. **`feat(enemies): Introduce high-velocity Kamikaze Drone and Elite Cruiser boss enemy types`**
   - Implemented tracking kamikazes and high-HP bosses with custom horizontal bobbing physics and visual markers.
8. **`feat(game): Enable compounded stacking of speed power-up multipliers`**
   - Added additive speed multiplier stacks decaying tier-by-tier with active on-screen alerts.
9. **`feat(quests): Add interactive confetti animations to quest completion`**
   - Integrated procedural CSS particle confetti celebrating completed on-chain bounty claims.
10. **`perf(render): Implement screen-shake throttling for high-performance mobile devices`**
    - Scaled down screen translations by 65% in low-graphics mode to bypass layout repaint delays on mobile webviews.
11. **`feat(quests): Support multi-phase progress metrics for long-form daily bounties`**
    - Designed segmented milestone tick marks on quest bars to indicate progress stages.
12. **`refactor(physics): Streamline bounding box calculations for collision detection`**
    - Added Axis-Aligned Bounding Box (AABB) broadphase filters to instantly discard distant pairs.
13. **`feat(audio): Increase wave completion audio feedback intensity`**
    - Upgraded wave clear beep into a beautiful procedural arpeggiated C-major triad synthesizer.
14. **`refactor(quests): Modularize event subscriptions for clean architecture`**
    - Refactored `QuestsEventDispatcher` to support modular `unsubscribe` handles and full memory flushes.
15. **`docs(refactor): Document visual particles pool architecture and modular quests design patterns`**
    - Added comprehensive documentation detail maps in README.md describing the full sprint stack.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---
**Stacks Hurry Live Link**: https://stackshurry.vercel.app/
