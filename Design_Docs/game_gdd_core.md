# Game Design Document (GDD) – Core Game & Loop

## Overview

A 2D web-based progressive defense game where the player controls a single tower at the bottom center of the screen. The tower fires projectiles upward, and the player must survive waves of incoming enemies for as long as possible. As the game progresses, the player gains experience, selects upgrades, and eventually faces an overwhelming super enemy that resets the run. Prestige points earned from each run unlock permanent upgrades for future attempts.

---

## Core Gameplay

- **Player Tower**: Stationary at bottom center, turret can rotate left/right.
- **Projectiles**: Fired upward in a straight line (or modified via upgrades).
- **Ground/Plain**: If enemies reach the ground, player loses health.
- **Enemies**: Spawn above outside of camera range, move downward, with different behaviors introduced over time.
- **Objective**: Survive waves as long as possible.

---

## Core Game Loop

### 1. Start Run

- Game initializes with the player’s tower, base stats, and any unlocked support buildings (prestige upgrades).
- Timer starts at 0.

### 2. Enemy Waves

- Enemies spawn at increasing frequency and difficulty.
- Enemy types (basic → advanced → special behaviors) introduced progressively.
- On enemy death → player gains XP.

### 3. Player Actions

- Rotate tower turret left/right.
- Fire projectiles at enemies.
- Avoid health reaching 0.

### 4. Experience & Level-Up

- Each kill grants XP.
- When XP threshold is reached:
  - Player levels up.
  - Three upgrade **cards** are offered.
  - Player selects **1 of 3 cards**.
  - Prestige upgrades can later give the player more card choices. ex. increase from 3 to 4 or 5.

### 5. Upgrades

- Upgrades fall into three categories:
  1. **Stat Upgrades** (damage, fire rate, HP, regen, increased experience gain).
  2. **Weapons** (new weapon types attached to tower).
  3. **Upgrades to Support Buildings** - (Only available for support buildings that have been unlocked and include damage and fire rate or other buffs relevant to the support building type).
- Rule: Player can select up to **5 unique upgrades**, each upgrade up to **+5 levels**.
- Chosen upgrades immediately affect gameplay but do not carry over into the next game.

### 6. Progression Escalation

- As time passes:

  - Number of enemies increase
  - Enemy variety increases.
  - Spawn rates and difficulty scale upward.

- After **10 minutes**, the **Super Enemy** spawns:

  - Extremely powerful.
  - Reaching the ground ends the run.
  - Killing it is the ultimate challenge/achievement.

### 7. End of Run

- Run ends if:
  - Player HP reaches 0.
  - Super Enemy reaches the ground.
- Stats are tallied:
  - Time survived.
  - Enemies killed.
  - Super Enemy defeated (yes/no).

### 8. Prestige & Meta Progression

- Player earns prestige currency based on performance.
- Prestige is spent on **permanent upgrades**:
  - Support buildings (auto turrets, buff towers).
  - Player stat boosts.
  - Enemy debuffs.
- Achievements may also unlock rewards.

### 9. Reset & Replay

- Game resets back to the start menu where the player can go to the presitige shop and spend prestige currency.
- Player is able to then start a new game
- Player tower + unlocked supports carry forward, but any cards previously gained during the run are reset.
- Repeat loop with stronger meta-progression.

---

## Victory & Long-Term Goals

- **Short-Term Goal**: Survive as long as possible, unlock new upgrades.
- **Mid-Term Goal**: Build stronger runs with prestige upgrades.
- **Long-Term Goal**: Defeat the **Super Enemy** at the end of a run.
- **Achievements** provide extra milestones and replay value.

---

## Summary of Flow

1. Start run → Tower + supports spawned.
2. Fight waves of enemies → Gain XP.
3. Level up → Choose upgrade cards.
4. Survive escalating waves.
5. Super Enemy spawns at 10 min.
6. Run ends → tally stats.
7. Earn prestige → buy permanent upgrades.
8. Restart stronger.

