# Core Coding Principles

This document outlines the key coding and design practices that must be followed across the entire project. These principles ensure the codebase remains **clean, maintainable, and extensible** while aligning with our design philosophy.

---

## 1. Separation of Concerns
- Each system, entity, and UI module should have a **single responsibility**.
- Do not combine unrelated logic (e.g., collisions should not apply XP).
- Keep files small (<200 lines for systems when possible).

## 2. Data-Driven Design
- All gameplay values, enemy definitions, weapons, upgrades, and content must live in **JSON5 files** under `public/content/`.
- Code should **never hardcode values** like HP, XP rewards, or weapon stats.
- Factories (`data/creators.ts`) are the only entry point for instantiating gameplay objects.

## 3. Explicit Architecture
- Follow the folder structure defined in **Project Architecture & File Hierarchy**.
- Place each file in its correct category (`core`, `systems`, `gameplay`, `ui`, `devtools`, `data`).
- Avoid “misc” or catch-all modules.

## 4. Interfaces & Class Skeletons
- Every major class should have a **skeleton** with documented methods and variables.
- Implementations should follow those skeletons to maintain consistency.
- Avoid large monolithic classes—prefer composition and small helpers.

## 5. Event-Driven Communication
- Use `EventBus` for cross-system signals (`EnemyKilled`, `LevelUp`, `RunEnded`).
- Avoid direct coupling between systems.
- Systems should subscribe to relevant events instead of polling global state.

## 6. Rendering & UI
- Rendering must use **Canvas 2D API** only.
- `Renderer` and `UIRenderer` abstract drawing functions.
- Gameplay systems **do not draw**—they update state. Rendering systems read state and display it.
- All UI overlays (cards, achievements, toasts) live in `src/ui/` and never modify gameplay state directly.

## 7. Dev Tools
- All debug visualizations, cheats, and testing buttons must:
  - Be implemented in `src/devtools/`.
  - Be toggleable at runtime from the DevTools overlay.
  - Use the same **public APIs** as gameplay systems (never mutate internals directly).
- DevTools settings must persist to `localStorage.devtools`.

## 8. Milestone Discipline
- Implement **only the current milestone** as outlined in **Milestones & Implementation Plan**.
- Each milestone must end with a **visible, testable result**.
- Avoid jumping ahead—features not in the current milestone should be deferred.

## 9. Coding Style
- **TypeScript** with strict typing (`strict` mode enabled).
- Prefer `readonly` where possible.
- Avoid `any`—define explicit types and interfaces.
- Functions should be small and descriptive.
- Favor pure functions when possible.

## 10. Testing & Validation
- Use DevTools overlays to validate behaviors visually.
- Add runtime validation for JSON5 content (missing keys, invalid refs).
- Each system should be testable in isolation via DevTools actions (e.g., spawn an enemy, grant XP).

---

## Summary
- Keep systems **small, decoupled, and event-driven**.
- Drive gameplay from **data files**, never from hardcoded constants.
- Maintain **clean architecture** with strict separation of rendering, logic, and dev tools.
- Always end milestones with something **visual and rollback-safe**.
- Prioritize clarity, consistency, and long-term extensibility over shortcuts.