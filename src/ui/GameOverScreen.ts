// Game over screen with score display and replay options
// Shows final score, prestige earned, and provides menu navigation
// Handles post-game UI interaction and navigation

import { UIRenderer } from './UIRenderer.js';
import { GameScore } from '../systems/PrestigeSystem.js';

type ClickableButton = {
  x: number;
  y: number;
  width: number;
  height: number;
  action: 'restart' | 'menu';
};

export class GameOverScreen {
  private uiRenderer: UIRenderer;
  private width: number;
  private height: number;
  private isVisible: boolean = false;
  private gameScore: GameScore | null = null;
  private clickableButtons: ClickableButton[] = [];

  constructor(uiRenderer: UIRenderer, width: number, height: number) {
    this.uiRenderer = uiRenderer;
    this.width = width;
    this.height = height;
  }

  /** Show the game over screen with score information */
  show(gameScore: GameScore): void {
    this.gameScore = gameScore;
    this.isVisible = true;
    this.updateClickableAreas();
  }

  /** Hide the game over screen */
  hide(): void {
    this.isVisible = false;
    this.gameScore = null;
    this.clickableButtons = [];
  }

  /** Check if screen is currently visible */
  getVisible(): boolean {
    return this.isVisible;
  }

  /** Handle mouse clicks and return action if button was clicked */
  handleClick(x: number, y: number): 'restart' | 'menu' | null {
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
    const buttonY = this.height * 0.75;
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonSpacing = 20;

    // Restart button
    this.clickableButtons.push({
      x: centerX - buttonWidth - buttonSpacing / 2,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      action: 'restart'
    });

    // Main menu button
    this.clickableButtons.push({
      x: centerX + buttonSpacing / 2,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      action: 'menu'
    });
  }

  /** Render the game over screen */
  render(): void {
    if (!this.isVisible || !this.gameScore) return;

    const ctx = this.uiRenderer.getContext();

    // Semi-transparent dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const startY = this.height * 0.25;

    // Title - different for victory vs game over
    if (this.gameScore.finalBossDefeated) {
      ctx.fillStyle = '#ffdd00';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS DEFEATED!', centerX, startY);
    } else {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', centerX, startY);
    }

    // Score information with detailed breakdown
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';

    let currentY = startY + 80;
    const lineHeight = 30;

    // Time survived with breakdown
    ctx.fillText(`Time Survived: ${this.formatTime(this.gameScore.timeSurvived)}`, centerX, currentY);
    currentY += lineHeight;
    ctx.fillStyle = '#cccccc';
    ctx.font = '16px Arial';
    ctx.fillText(`+${this.gameScore.breakdown.timeScore} prestige (1 per 10 seconds)`, centerX, currentY);
    currentY += lineHeight + 5;

    // Enemies killed with breakdown
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(`Enemies Killed: ${this.gameScore.enemiesKilled}`, centerX, currentY);
    currentY += lineHeight;
    ctx.fillStyle = '#cccccc';
    ctx.font = '16px Arial';
    ctx.fillText(`+${this.gameScore.breakdown.killScore} prestige (2 per enemy)`, centerX, currentY);
    currentY += lineHeight + 5;

    // Mini-bosses defeated
    if (this.gameScore.miniBossesDefeated > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.fillText(`Mini-Bosses Defeated: ${this.gameScore.miniBossesDefeated}`, centerX, currentY);
      currentY += lineHeight;
      ctx.fillStyle = '#cccccc';
      ctx.font = '16px Arial';
      ctx.fillText(`+${this.gameScore.breakdown.miniBossBonus} prestige (50 per mini-boss)`, centerX, currentY);
      currentY += lineHeight + 5;
    }

    // Final boss defeated
    if (this.gameScore.finalBossDefeated) {
      ctx.fillStyle = '#ffdd00';
      ctx.font = '20px Arial';
      ctx.fillText('🏆 FINAL BOSS DEFEATED! 🏆', centerX, currentY);
      currentY += lineHeight;
      ctx.fillStyle = '#cccccc';
      ctx.font = '16px Arial';
      ctx.fillText(`+${this.gameScore.breakdown.finalBossBonus} prestige (victory bonus)`, centerX, currentY);
      currentY += lineHeight + 5;
    }

    currentY += 15;

    // Total prestige earned
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`Total: +${this.gameScore.prestigeEarned} Prestige`, centerX, currentY);

    // Buttons
    this.renderButtons();
  }

  /** Render clickable buttons */
  private renderButtons(): void {
    const ctx = this.uiRenderer.getContext();

    for (const button of this.clickableButtons) {
      // Button background
      ctx.fillStyle = '#333333';
      ctx.fillRect(button.x, button.y, button.width, button.height);

      // Button border
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
      ctx.strokeRect(button.x, button.y, button.width, button.height);

      // Button text
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';

      const buttonCenterX = button.x + button.width / 2;
      const buttonCenterY = button.y + button.height / 2 + 6; // Offset for text baseline

      const text = button.action === 'restart' ? 'Play Again' : 'Main Menu';
      ctx.fillText(text, buttonCenterX, buttonCenterY);
    }
  }

  /** Format time in minutes:seconds */
  private formatTime(seconds: number): string {
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