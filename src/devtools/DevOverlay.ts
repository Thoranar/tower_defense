import { DevToolsSystem } from './DevToolsSystem.js';
import { UIRenderer } from '../ui/UIRenderer.js';
import { Input } from '../core/Input.js';
import { Tower } from '../gameplay/Tower.js';
import { Projectile } from '../gameplay/Projectile.js';
import { CollisionPair } from '../systems/CollisionSystem.js';
import { DamageEvent } from '../systems/CombatSystem.js';

// Developer overlay panel UI
// Renders and manages the in-game developer tools interface
// Handles developer tool interactions and visual presentation

type ClickableArea = {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'toggle' | 'action';
  key: string;
};

export class DevOverlay {
  private devTools: DevToolsSystem;
  private uiRenderer: UIRenderer;
  private width: number;
  private height: number;
  private panelWidth: number = 280;
  private panelHeight: number = 400;
  private clickableAreas: ClickableArea[] = [];

  constructor(devTools: DevToolsSystem, uiRenderer: UIRenderer, width: number, height: number) {
    this.devTools = devTools;
    this.uiRenderer = uiRenderer;
    this.width = width;
    this.height = height;
  }

  update(deltaTime: number): void {
    // Handle overlay updates if needed
  }

  render(): void {
    if (!this.devTools.isVisible()) return;

    // Clear clickable areas for this frame
    this.clickableAreas = [];

    const panelX = this.width - this.panelWidth - 10;
    const panelY = 10;

    // Draw panel background
    this.uiRenderer.drawRect(panelX, panelY, this.panelWidth, this.panelHeight, 'rgba(0, 0, 0, 0.8)');
    this.uiRenderer.drawStrokeRect(panelX, panelY, this.panelWidth, this.panelHeight, '#444', 2);

    // Title
    this.uiRenderer.drawText('Dev Tools (` to toggle)', panelX + 10, panelY + 10, '#fff', 'bold 14px monospace');

    let yOffset = panelY + 40;

    // Render toggles section
    this.uiRenderer.drawText('Toggles (click to toggle):', panelX + 10, yOffset, '#ccc', '12px monospace');
    yOffset += 20;

    const toggles = this.devTools.getToggles();
    const toggleEntries = [
      { key: 'showFps', label: 'Show FPS', shortcut: '' },
      { key: 'showBounds', label: '[2] Canvas Bounds', shortcut: '2' },
      { key: 'showInput', label: '[1] Input Debug', shortcut: '1' },
      { key: 'projectileDebug', label: 'Projectile Debug', shortcut: '' },
      { key: 'behaviorTrails', label: 'Behavior Trails', shortcut: '' },
      { key: 'collisionMarkers', label: 'Collision Markers', shortcut: '' },
      { key: 'hitLogs', label: 'Hit Logs', shortcut: '' },
      { key: 'invincibleTower', label: 'Invincible Tower', shortcut: '' },
      { key: 'draftPreview', label: 'Draft Preview', shortcut: '' },
      { key: 'showUpgradeInspector', label: 'Upgrade Inspector', shortcut: '' },
      { key: 'showStatOverlays', label: 'Stat Overlays', shortcut: '' }
    ];

    for (const toggle of toggleEntries) {
      const isOn = toggles[toggle.key as keyof typeof toggles] ?? false;
      const color = isOn ? '#0f0' : '#666';
      const status = isOn ? '[ON]' : '[OFF]';

      // Add clickable area
      const clickableWidth = this.panelWidth - 30;
      const clickableHeight = 14;
      this.clickableAreas.push({
        x: panelX + 15,
        y: yOffset - 2,
        width: clickableWidth,
        height: clickableHeight,
        type: 'toggle',
        key: toggle.key
      });

      // Draw hover background for better UX
      this.uiRenderer.drawRect(panelX + 15, yOffset - 2, clickableWidth, clickableHeight, 'rgba(255, 255, 255, 0.05)');

      this.uiRenderer.drawText(`${status} ${toggle.label}`, panelX + 15, yOffset, color, '11px monospace');
      yOffset += 16;
    }

    yOffset += 10;

    // Actions section
    this.uiRenderer.drawText('Actions (click to execute):', panelX + 10, yOffset, '#ccc', '12px monospace');
    yOffset += 20;

    const actions = [
      { key: 'resetRun', label: '[R] Reset Run' },
      { key: 'spawnBasicEnemy', label: 'Spawn Basic Enemy' },
      { key: 'grantXp', label: 'Grant +10 XP' },
      { key: 'clearStorage', label: '[C] Clear Storage' }
    ];

    for (const action of actions) {
      // Add clickable area
      const clickableWidth = this.panelWidth - 30;
      const clickableHeight = 14;
      this.clickableAreas.push({
        x: panelX + 15,
        y: yOffset - 2,
        width: clickableWidth,
        height: clickableHeight,
        type: 'action',
        key: action.key
      });

      // Draw hover background for better UX
      this.uiRenderer.drawRect(panelX + 15, yOffset - 2, clickableWidth, clickableHeight, 'rgba(255, 255, 255, 0.05)');

      this.uiRenderer.drawText(action.label, panelX + 15, yOffset, '#9af', '11px monospace');
      yOffset += 16;
    }

    yOffset += 10;

    // Instructions
    this.uiRenderer.drawText('Controls:', panelX + 10, yOffset, '#ccc', '12px monospace');
    yOffset += 20;
    this.uiRenderer.drawText('` - Toggle dev panel', panelX + 15, yOffset, '#999', '10px monospace');
    yOffset += 14;
    this.uiRenderer.drawText('A/D or ←/→ - Rotate turret', panelX + 15, yOffset, '#999', '10px monospace');
    yOffset += 14;
    this.uiRenderer.drawText('Mouse - Aim turret', panelX + 15, yOffset, '#999', '10px monospace');
  }

  renderDebugOverlays(): void {
    // Canvas bounds visualization
    if (this.devTools.isOn('showBounds')) {
      this.uiRenderer.drawStrokeRect(0, 0, this.width, this.height, '#ff0', 2);

      // Safe area guides
      const margin = 20;
      this.uiRenderer.drawStrokeRect(margin, margin, this.width - margin * 2, this.height - margin * 2, '#f80', 1);

      // Center crosshair
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      this.uiRenderer.drawText('+', centerX - 5, centerY - 8, '#ff0', '16px monospace');
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  handleClick(x: number, y: number): boolean {
    if (!this.devTools.isVisible()) return false;

    // Check each clickable area
    for (const area of this.clickableAreas) {
      if (x >= area.x && x <= area.x + area.width &&
          y >= area.y && y <= area.y + area.height) {

        if (area.type === 'toggle') {
          // Toggle the dev option
          const currentValue = this.devTools.isOn(area.key as any);
          this.devTools.setToggle(area.key as any, !currentValue);
          console.log(`Toggled ${area.key}: ${!currentValue}`);
        } else if (area.type === 'action') {
          // Execute the action
          this.devTools.runAction(area.key as any);
          console.log(`Executed action: ${area.key}`);
        }

        return true; // Click was handled
      }
    }

    // Check if click is within panel bounds (for general panel interaction)
    const panelX = this.width - this.panelWidth - 10;
    const panelY = 10;

    if (x >= panelX && x <= panelX + this.panelWidth &&
        y >= panelY && y <= panelY + this.panelHeight) {
      return true; // Click was within panel, consume it
    }

    return false;
  }

  /** Render input debug information (moved from Game.ts) */
  renderInputDebug(input: Input, tower: Tower | null): void {
    if (!this.devTools.isOn('showInput')) return;

    const inputState = input.getDebugState();
    let y = 120;

    this.uiRenderer.drawText('Input Debug:', 10, y, '#ff0', '14px monospace');
    y += 20;

    if (inputState.pressedKeys.length > 0) {
      this.uiRenderer.drawText(`Keys: ${inputState.pressedKeys.join(', ')}`, 10, y, '#fff', '12px monospace');
    } else {
      this.uiRenderer.drawText('Keys: (none)', 10, y, '#666', '12px monospace');
    }
    y += 16;

    this.uiRenderer.drawText(`Mouse: ${Math.round(inputState.mouse.x)}, ${Math.round(inputState.mouse.y)} ${inputState.mouse.down ? '[DOWN]' : ''}`, 10, y, '#fff', '12px monospace');
    y += 16;

    if (tower) {
      const angleDeg = (tower.turretAngle * 180 / Math.PI).toFixed(1);
      this.uiRenderer.drawText(`Turret: ${angleDeg}°`, 10, y, '#fff', '12px monospace');
    }
  }

  /** Render projectile debug information for Milestone 3 */
  renderProjectileDebug(projectiles: Projectile[]): void {
    if (!this.devTools.isOn('projectileDebug')) return;

    for (const projectile of projectiles) {
      // Draw projectile ID and lifetime above each projectile
      const x = projectile.pos.x;
      const y = projectile.pos.y - 15; // Above the projectile
      const lifePercent = ((projectile.lifetime / projectile.maxLifetime) * 100).toFixed(0);

      this.uiRenderer.drawText(
        `${projectile.id}`,
        x - 10,
        y,
        '#0ff',
        '10px monospace'
      );

      this.uiRenderer.drawText(
        `${lifePercent}%`,
        x - 10,
        y - 12,
        '#0af',
        '9px monospace'
      );
    }
  }

  /** Render entity count readout for Milestone 4 */
  renderEntityCounts(counts: { enemies: number; projectiles: number; total: number }): void {
    if (!this.devTools.isVisible()) return;

    // Position near the bottom left of screen
    const x = 10;
    let y = this.height - 80;

    this.uiRenderer.drawText('Entity Counts:', x, y, '#ccc', '14px monospace');
    y += 20;
    this.uiRenderer.drawText(`Enemies: ${counts.enemies}`, x, y, '#f66', '12px monospace');
    y += 16;
    this.uiRenderer.drawText(`Projectiles: ${counts.projectiles}`, x, y, '#ff6', '12px monospace');
    y += 16;
    this.uiRenderer.drawText(`Total: ${counts.total}`, x, y, '#6f6', '12px monospace');
  }

  /** Render collision markers for Milestone 5 */
  renderCollisionMarkers(collisionPairs: CollisionPair[]): void {
    if (!this.devTools.isOn('collisionMarkers')) return;

    for (const collision of collisionPairs) {
      const x = (collision.entityA.pos.x + collision.entityB.pos.x) / 2;
      const y = (collision.entityA.pos.y + collision.entityB.pos.y) / 2;

      // Different colors for different collision types
      let color = '#fff';
      let size = 8;

      switch (collision.type) {
        case 'projectile-enemy':
          color = '#ff0'; // Yellow for projectile hits
          size = 6;
          break;
        case 'enemy-ground':
          color = '#f00'; // Red for ground collisions
          size = 10;
          break;
        case 'enemy-tower':
          color = '#f80'; // Orange for tower collisions
          size = 12;
          break;
      }

      // Draw collision marker as a flashing circle
      const time = Date.now() / 100;
      const alpha = 0.5 + 0.5 * Math.sin(time);

      this.uiRenderer.drawRect(x - size/2, y - size/2, size, size, color);
      this.uiRenderer.drawStrokeRect(x - size/2, y - size/2, size, size, '#fff', 1);
    }
  }

  /** Render hit logs for collision debugging */
  renderHitLogs(damageEvents: DamageEvent[]): void {
    if (!this.devTools.isOn('hitLogs')) return;

    // Position at top-left under FPS counter
    const x = 10;
    let y = 60;
    const maxLogs = 10;
    const maxAge = 5000; // 5 seconds
    const now = Date.now();

    // Filter recent events and take the most recent
    const recentEvents = damageEvents
      .filter(event => (now - event.timestamp) < maxAge)
      .slice(-maxLogs)
      .reverse();

    if (recentEvents.length === 0) return;

    this.uiRenderer.drawText('Hit Logs:', x, y, '#ccc', '12px monospace');
    y += 16;

    for (const event of recentEvents) {
      const age = now - event.timestamp;
      const alpha = 1 - (age / maxAge);

      // Determine log color based on target type
      let color = '#fff';
      let targetType = 'Unknown';

      if (event.target.constructor.name === 'Enemy') {
        color = '#f66';
        targetType = 'Enemy';
      } else if (event.target.constructor.name === 'Tower') {
        color = '#66f';
        targetType = 'Tower';
      }

      const logText = `${targetType} -${event.amount} HP`;
      this.uiRenderer.drawText(logText, x, y, color, '10px monospace');
      y += 12;
    }
  }

  /** Render upgrade inspector panel showing selected upgrades. */
  renderUpgradeInspector(upgradeState: any): void {
    if (!this.devTools.isOn('showUpgradeInspector')) return;

    const panelX = 10;
    const panelY = 120;
    const panelWidth = 300;
    const lineHeight = 20;
    let currentY = panelY;

    // Background
    this.uiRenderer.drawRect(panelX, panelY, panelWidth, 200, 'rgba(0, 0, 0, 0.8)');
    this.uiRenderer.drawStrokeRect(panelX, panelY, panelWidth, 200, '#444', 2);

    // Title
    this.uiRenderer.drawText('Upgrade Inspector', panelX + 10, currentY + 20, '#fff', 'bold 16px monospace');
    currentY += 35;

    // Slots info
    const slotsText = `Slots: ${upgradeState.slots.used}/${upgradeState.slots.max}`;
    this.uiRenderer.drawText(slotsText, panelX + 10, currentY, '#ccc', '14px monospace');
    currentY += lineHeight;

    // Selected upgrades
    if (Object.keys(upgradeState.levels).length === 0) {
      this.uiRenderer.drawText('No upgrades selected', panelX + 10, currentY, '#888', '14px monospace');
    } else {
      for (const [key, level] of Object.entries(upgradeState.levels)) {
        const upgradeText = `${key}: Level ${level}`;
        this.uiRenderer.drawText(upgradeText, panelX + 10, currentY, '#0f0', '14px monospace');
        currentY += lineHeight;
      }
    }

    currentY += 10;
    const canSelectText = `Can select more: ${upgradeState.canSelectAny ? 'Yes' : 'No'}`;
    const color = upgradeState.canSelectAny ? '#0f0' : '#f80';
    this.uiRenderer.drawText(canSelectText, panelX + 10, currentY, color, '14px monospace');
  }

  /** Render stat overlays showing derived multipliers next to tower. */
  renderStatOverlays(tower: any): void {
    if (!this.devTools.isOn('showStatOverlays')) return;

    const stats = tower.getDerivedStats();
    const towerX = tower.pos.x;
    const towerY = tower.pos.y;

    // Position overlays to the right of the tower
    const overlayX = towerX + 40;
    let overlayY = towerY - 60;
    const lineHeight = 16;

    // Background for readability
    this.uiRenderer.drawRect(overlayX - 5, overlayY - 5, 150, 80, 'rgba(0, 0, 0, 0.7)');
    this.uiRenderer.drawStrokeRect(overlayX - 5, overlayY - 5, 150, 80, '#444', 1);

    // HP
    this.uiRenderer.drawText(`HP: ${stats.hp}/${stats.maxHp}`, overlayX, overlayY, '#0f0', '12px monospace');
    overlayY += lineHeight;

    // Damage multiplier
    this.uiRenderer.drawText(`Damage: ${stats.damageMultDisplay}`, overlayX, overlayY, '#f66', '12px monospace');
    overlayY += lineHeight;

    // Fire rate multiplier
    this.uiRenderer.drawText(`Fire Rate: ${stats.fireRateMultDisplay}`, overlayX, overlayY, '#ff6', '12px monospace');
    overlayY += lineHeight;

    // Regeneration
    this.uiRenderer.drawText(`Regen: ${stats.regenDisplay}`, overlayX, overlayY, '#6f6', '12px monospace');
  }
}