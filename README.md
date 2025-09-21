# Tower Defense

A 2D web-based progressive defense game where you control a single tower at the bottom center of the screen. Survive waves of incoming enemies for as long as possible while gaining experience, selecting upgrades, and facing an overwhelming super enemy that resets the run.

## Game Overview

### Core Gameplay
- **Player Tower**: Stationary at bottom center, turret can rotate left/right
- **Projectiles**: Fired upward in a straight line (or modified via upgrades)
- **Ground Defense**: If enemies reach the ground, player loses health
- **Enemies**: Spawn above camera range, move downward with different behaviors
- **Objective**: Survive waves as long as possible

### Core Game Loop

1. **Start Run** - Initialize with tower, base stats, and unlocked support buildings
2. **Enemy Waves** - Face increasing frequency and difficulty of enemies
3. **Player Actions** - Rotate tower, fire projectiles, avoid death
4. **Experience & Level-Up** - Gain XP from kills, choose from upgrade cards
5. **Upgrades** - Select from stat boosts, weapons, or support building enhancements
6. **Progression Escalation** - Face increasing enemy variety and spawn rates
7. **Super Enemy** - After 10 minutes, face the ultimate boss challenge
8. **End of Run** - Earn prestige currency based on performance
9. **Meta Progression** - Spend prestige on permanent upgrades
10. **Reset & Replay** - Start stronger runs with meta-progression

### Upgrade System
- **Rule**: Select up to **5 unique upgrades**, each up to **+5 levels**
- **Categories**:
  1. **Stat Upgrades** (damage, fire rate, HP, regen, XP gain)
  2. **Weapons** (new weapon types for tower)
  3. **Support Building Upgrades** (buffs for unlocked buildings)

### Victory Conditions
- **Short-Term**: Survive as long as possible, unlock new upgrades
- **Mid-Term**: Build stronger runs with prestige upgrades
- **Long-Term**: Defeat the **Super Enemy** at 10 minutes
- **Achievements**: Extra milestones and replay value

## Technical Architecture

### Project Structure
```
src/
  core/                  # Core engine and loop coordination
  systems/               # Systems implement distinct gameplay concerns
  gameplay/              # Entity definitions and gameplay classes
  data/                  # Data registry and loading layer
  ui/                    # User interface overlays and HUD
  devtools/              # Developer tools and debugging

public/
  content/               # Data-driven JSON5 files
```

### Key Design Principles
- **Data-Driven**: All gameplay numbers and content live in JSON5 files
- **Entity-Component-System**: Clean separation of concerns
- **Event-Driven**: Systems communicate through EventBus
- **Modular Rendering**: Abstract renderer allows different implementations
- **Factory Pattern**: Entities created only through data/creators.ts

### Systems Overview
- **SpawnSystem**: Enemy wave management
- **MovementSystem**: Entity physics and behaviors
- **CollisionSystem**: Collision detection and resolution
- **CombatSystem**: Damage application and rewards
- **ExperienceSystem**: XP tracking and level-ups
- **CardDraftSystem**: Upgrade card selection
- **UpgradeSystem**: Upgrade application and constraints
- **PrestigeSystem**: Meta-progression currency
- **BossSystem**: Super enemy encounter
- **AchievementSystem**: Goal tracking and rewards

## Development Status

🚧 **Project Status**: Initial Setup Complete

This repository contains the complete project structure with placeholder classes and comprehensive design documentation. All systems are defined with clear responsibilities and interfaces ready for implementation.

### Next Steps
1. Implement core engine (Game, World, EventBus)
2. Create basic entity system (Entity, Tower, Enemy, Projectile)
3. Build rendering pipeline (Canvas2DRenderer, UIRenderer)
4. Implement movement and collision systems
5. Add upgrade and progression mechanics
6. Create content data files
7. Polish UI and visual feedback

## Getting Started

### Prerequisites
- Modern web browser with Canvas 2D support
- HTTP server for development (due to CORS restrictions with JSON5 files)

### Development
1. Clone the repository
2. Serve the project directory with a local HTTP server
3. Open `index.html` in your browser
4. Begin implementing systems according to the design documents

### Design Documents
Comprehensive design documentation is available in the `Design_Docs/` folder:
- `game_gdd_core.md` - Core game design and loop
- `project_structure.md` - Technical architecture
- `class_skeletons_*.md` - Detailed class designs
- `content_file_specs_json_5.md` - Data file specifications
- `ui_design_schema.md` - UI/UX guidelines

## License

This project is open source. See LICENSE file for details.