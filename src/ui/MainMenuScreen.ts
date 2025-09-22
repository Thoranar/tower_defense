// Main menu screen with game stats and navigation options
// Shows prestige currency, top scores, and provides start/reset options
// Handles main menu UI interaction and navigation

import { UIRenderer } from './UIRenderer.js';
import { MetaData } from '../systems/PrestigeSystem.js';

type ClickableButton = {
  x: number;
  y: number;
  width: number;
  height: number;
  action: 'start' | 'prestige_store' | 'reset';
};

export class MainMenuScreen {
  private uiRenderer: UIRenderer;
  private width: number;
  private height: number;
  private isVisible: boolean = false;
  private metaData: MetaData | null = null;
  private clickableButtons: ClickableButton[] = [];

  constructor(uiRenderer: UIRenderer, width: number, height: number) {
    this.uiRenderer = uiRenderer;
    this.width = width;
    this.height = height;
  }

  /** Show the main menu with meta progression data */
  show(metaData: MetaData): void {
    this.metaData = metaData;
    this.isVisible = true;
    this.updateClickableAreas();
  }

  /** Hide the main menu */
  hide(): void {
    this.isVisible = false;
    this.metaData = null;
    this.clickableButtons = [];
  }

  /** Check if screen is currently visible */
  getVisible(): boolean {
    return this.isVisible;
  }

  /** Handle mouse clicks and return action if button was clicked */
  handleClick(x: number, y: number): 'start' | 'prestige_store' | 'reset' | null {
    if (!this.isVisible) return null;

    for (const button of this.clickableButtons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        return button.action;
      }
    }

    return null;
  }

  /** Update clickable button areas */
  private updateClickableAreas(): void {
    this.clickableButtons = [];

    const centerX = this.width / 2;
    const buttonWidth = 160;
    const buttonHeight = 50;
    const buttonSpacing = 20;

    let buttonY = this.height * 0.6;

    // Start run button
    this.clickableButtons.push({
      x: centerX - buttonWidth / 2,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      action: 'start'
    });

    buttonY += buttonHeight + buttonSpacing;

    // Prestige store button (placeholder)
    this.clickableButtons.push({
      x: centerX - buttonWidth / 2,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      action: 'prestige_store'
    });

    buttonY += buttonHeight + buttonSpacing;

    // Reset progress button
    this.clickableButtons.push({
      x: centerX - buttonWidth / 2,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      action: 'reset'
    });
  }

  /** Render the main menu screen */
  render(): void {
    if (!this.isVisible || !this.metaData) return;

    const ctx = this.uiRenderer.getContext();

    // Dark background
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    let currentY = this.height * 0.15;

    // Title
    ctx.fillStyle = '#00aaff';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TOWER DEFENSE', centerX, currentY);

    currentY += 100;

    // Stats section
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';

    const statsY = currentY;
    const lineHeight = 35;

    ctx.fillText('── STATS ──', centerX, statsY);
    currentY = statsY + lineHeight + 10;

    // Prestige currency
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`Prestige: ${this.metaData.totalPrestige}`, centerX, currentY);
    currentY += lineHeight + 5;

    // Best scores
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(`Best Score: ${this.metaData.topScore}`, centerX, currentY);
    currentY += lineHeight - 5;

    ctx.fillText(`Best Time: ${this.formatTime(this.metaData.topTime)}`, centerX, currentY);
    currentY += lineHeight - 5;

    ctx.fillText(`Runs Completed: ${this.metaData.totalRuns}`, centerX, currentY);

    // Buttons
    this.renderButtons();
  }

  /** Render clickable buttons */
  private renderButtons(): void {
    const ctx = this.uiRenderer.getContext();

    for (const button of this.clickableButtons) {
      // Button styling based on action
      let bgColor = '#333333';
      let borderColor = '#666666';
      let textColor = '#ffffff';

      if (button.action === 'start') {
        bgColor = '#2a5d2a';
        borderColor = '#4a8f4a';
      } else if (button.action === 'prestige_store') {
        bgColor = '#2a2a5d';
        borderColor = '#4a4a8f';
      } else if (button.action === 'reset') {
        bgColor = '#5d2a2a';
        borderColor = '#8f4a4a';
      }

      // Button background
      ctx.fillStyle = bgColor;
      ctx.fillRect(button.x, button.y, button.width, button.height);

      // Button border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(button.x, button.y, button.width, button.height);

      // Button text
      ctx.fillStyle = textColor;
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';

      const buttonCenterX = button.x + button.width / 2;
      const buttonCenterY = button.y + button.height / 2 + 6; // Offset for text baseline

      let text = '';
      switch (button.action) {
        case 'start':
          text = 'START RUN';
          break;
        case 'prestige_store':
          text = 'PRESTIGE STORE';
          break;
        case 'reset':
          text = 'RESET PROGRESS';
          break;
      }

      ctx.fillText(text, buttonCenterX, buttonCenterY);

      // Add "Coming Soon" text for prestige store
      if (button.action === 'prestige_store') {
        ctx.fillStyle = '#888888';
        ctx.font = '12px Arial';
        ctx.fillText('(Coming Soon)', buttonCenterX, buttonCenterY + 20);
      }
    }
  }

  /** Format time in minutes:seconds */
  private formatTime(seconds: number): string {
    if (seconds === 0) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /** Resize the screen */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.updateClickableAreas();
  }
}