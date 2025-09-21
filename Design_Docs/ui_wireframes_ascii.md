# UI Wireframes (ASCII)

These ASCII mockups illustrate the rough layout of key UI screens: **HUD**, **Card Draft**, and **Boss Warning**.

---

## In-Run HUD (Normal State)
```
 --------------------------------------------------------------
|                           TIMER  03:45                      |
|                                                              |
|                                                              |
|                                                              |
|                                                              |
|                                                              |
|                 [GAMEPLAY AREA – ENEMIES FALL]               |
|                                                              |
|                                                              |
|                                                              |
|                                                              |
|                                                              |
| HP: [██████████░░░░░░░░]   XP: [███████░░░░░]   LVL: 4       |
 --------------------------------------------------------------
```
- **Top-center**: Timer.
- **Bottom-left**: HP bar.
- **Bottom-center**: XP bar + level indicator.

---

## Card Draft Overlay
```
 --------------------------------------------------------------
|                        LEVEL UP!                            |
|                                                              |
|  [CARD 1]         [CARD 2]         [CARD 3]                  |
|  +20 HP           New Weapon:      Fire Rate +10%            |
|                   Cannon                                        |
|                                                              |
|   Click to Select  |  Dimmed background gameplay              |
 --------------------------------------------------------------
```
- Appears on level-up.
- Dim background, 3 cards centered.
- Each card has **title + description**.
- One click to pick → overlay closes.

---

## Boss Warning Banner
```
 --------------------------------------------------------------
| █████████████████████ WARNING: BOSS IN 30s █████████████████ |
 --------------------------------------------------------------
```
- Flashes red/orange.
- Shown at top of screen when boss timer nears 10 min.
- Replaced by **Boss HP bar** when active.

---

## Boss Phase HUD (Boss Active)
```
 --------------------------------------------------------------
| BOSS HP: [██████████████░░░░░░░░░░░░]                        |
|                                                              |
|                                                              |
|                  [GAMEPLAY AREA – BOSS FIGHT]                |
|                                                              |
| HP: [██████░░░░░░░░░░░░]   XP: [█████████░░░]   LVL: 12      |
 --------------------------------------------------------------
```
- Timer hidden.
- Boss HP bar spans top.
- HUD otherwise same.

---

## Achievement Popup
```
 --------------------------------------------------------------
| +++ ACHIEVEMENT UNLOCKED: "Level 5 Survivor" +++             |
 --------------------------------------------------------------
```
- Small banner fades in top-left.
- Auto-fades after 3 seconds.

