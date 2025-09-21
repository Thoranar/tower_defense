import { DevToolsSystem } from './DevToolsSystem.js';
import { UIRenderer } from '../ui/UIRenderer.js';
import { Input } from '../core/Input.js';
import { Tower } from '../gameplay/Tower.js';

// Developer overlay panel UI
// Renders and manages the in-game developer tools interface
// Handles developer tool interactions and visual presentation
export class DevOverlay {
  private devTools: DevToolsSystem;
  private uiRenderer: UIRenderer;
  private width: number;
  private height: number;
  private panelWidth: number = 280;
  private panelHeight: number = 400;

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

    const panelX = this.width - this.panelWidth - 10;
    const panelY = 10;

    // Draw panel background
    this.uiRenderer.drawRect(panelX, panelY, this.panelWidth, this.panelHeight, 'rgba(0, 0, 0, 0.8)');
    this.uiRenderer.drawStrokeRect(panelX, panelY, this.panelWidth, this.panelHeight, '#444', 2);

    // Title
    this.uiRenderer.drawText('Dev Tools (` to toggle)', panelX + 10, panelY + 10, '#fff', 'bold 14px monospace');

    let yOffset = panelY + 40;

    // Render toggles section
    this.uiRenderer.drawText('Toggles:', panelX + 10, yOffset, '#ccc', '12px monospace');
    yOffset += 20;

    const toggles = this.devTools.getToggles();
    const toggleEntries = [
      { key: 'showFps', label: 'Show FPS', shortcut: '' },
      { key: 'showBounds', label: '[2] Canvas Bounds', shortcut: '2' },
      { key: 'showInput', label: '[1] Input Debug', shortcut: '1' },
      { key: 'projectileDebug', label: 'Projectile Debug', shortcut: '' },
      { key: 'behaviorTrails', label: 'Behavior Trails', shortcut: '' },
      { key: 'collisionMarkers', label: 'Collision Markers', shortcut: '' },
      { key: 'hitLogs', label: 'Hit Logs', shortcut: '' }
    ];

    for (const toggle of toggleEntries) {
      const isOn = toggles[toggle.key as keyof typeof toggles] ?? false;
      const color = isOn ? '#0f0' : '#666';
      const status = isOn ? '[ON]' : '[OFF]';
      this.uiRenderer.drawText(`${status} ${toggle.label}`, panelX + 15, yOffset, color, '11px monospace');
      yOffset += 16;
    }

    yOffset += 10;

    // Actions section
    this.uiRenderer.drawText('Actions:', panelX + 10, yOffset, '#ccc', '12px monospace');
    yOffset += 20;

    const actions = [
      { key: 'resetRun', label: '[R] Reset Run' },
      { key: 'clearStorage', label: '[C] Clear Storage' }
    ];

    for (const action of actions) {
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

    const panelX = this.width - this.panelWidth - 10;
    const panelY = 10;

    // Check if click is within panel bounds
    if (x >= panelX && x <= panelX + this.panelWidth &&
        y >= panelY && y <= panelY + this.panelHeight) {

      // Handle toggle clicks (basic implementation for milestone 1)
      // More sophisticated interaction will be added in future milestones
      console.log('DevOverlay clicked at', x - panelX, y - panelY);
      return true;
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
}