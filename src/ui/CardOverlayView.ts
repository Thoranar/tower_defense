// Card selection overlay view and interaction handling
// Handles layout, hit testing, and rendering of card selection UI
// Manages card overlay visual presentation and input

import { UIRenderer } from './UIRenderer.js';
import { CardBlueprint } from '../data/registry.js';

type CardChoice = {
  key: string;
  card: CardBlueprint;
};

type ClickableCard = {
  x: number;
  y: number;
  width: number;
  height: number;
  cardKey: string;
};

export class CardOverlayView {
  private uiRenderer: UIRenderer;
  private width: number;
  private height: number;
  private isVisible: boolean = false;
  private choices: CardChoice[] = [];
  private clickableCards: ClickableCard[] = [];

  constructor(uiRenderer: UIRenderer, width: number, height: number) {
    this.uiRenderer = uiRenderer;
    this.width = width;
    this.height = height;
  }

  /** Show the card overlay with given choices */
  show(choices: CardChoice[]): void {
    this.choices = choices;
    this.isVisible = true;
    this.updateClickableAreas();
  }

  /** Hide the card overlay */
  hide(): void {
    this.isVisible = false;
    this.choices = [];
    this.clickableCards = [];
  }

  /** Check if overlay is currently visible */
  getVisible(): boolean {
    return this.isVisible;
  }

  /** Handle click on overlay, returns selected card key or null */
  handleClick(x: number, y: number): string | null {
    if (!this.isVisible) return null;

    for (const clickable of this.clickableCards) {
      if (x >= clickable.x && x <= clickable.x + clickable.width &&
          y >= clickable.y && y <= clickable.y + clickable.height) {
        return clickable.cardKey;
      }
    }

    return null;
  }

  /** Render the card overlay */
  render(): void {
    if (!this.isVisible || this.choices.length === 0) return;

    // Draw overlay background
    this.uiRenderer.drawRect(0, 0, this.width, this.height, 'rgba(0, 0, 0, 0.8)');

    // Title
    const titleY = 100;
    this.uiRenderer.drawText('Choose an Upgrade', this.width / 2 - 100, titleY, '#fff', 'bold 24px monospace');

    // Card layout
    const cardWidth = 200;
    const cardHeight = 280;
    const cardSpacing = 40;
    const totalWidth = this.choices.length * cardWidth + (this.choices.length - 1) * cardSpacing;
    const startX = (this.width - totalWidth) / 2;
    const cardY = 200;

    // Draw cards
    for (let i = 0; i < this.choices.length; i++) {
      const choice = this.choices[i];
      if (!choice) continue;

      const card = choice.card;
      const x = startX + i * (cardWidth + cardSpacing);

      this.drawCard(x, cardY, cardWidth, cardHeight, card);
    }

    // Instructions
    const instructY = cardY + cardHeight + 40;
    this.uiRenderer.drawText('Click a card to select it', this.width / 2 - 100, instructY, '#ccc', '16px monospace');

    // Pause indicator
    const pauseY = instructY + 30;
    this.uiRenderer.drawText('GAME PAUSED', this.width / 2 - 50, pauseY, '#ffa500', 'bold 14px monospace');
  }

  private drawCard(x: number, y: number, width: number, height: number, card: CardBlueprint): void {
    // Card background
    this.uiRenderer.drawRect(x, y, width, height, '#2a2a2a');
    this.uiRenderer.drawStrokeRect(x, y, width, height, card.visual.color, 3);

    // Rarity background color
    const rarityColors = {
      common: 'rgba(169, 169, 169, 0.2)',    // Gray
      uncommon: 'rgba(76, 175, 80, 0.2)',    // Green
      rare: 'rgba(156, 39, 176, 0.2)',       // Purple
      epic: 'rgba(255, 152, 0, 0.2)',        // Orange
      legendary: 'rgba(255, 193, 7, 0.2)'    // Gold
    };
    const rarityColor = rarityColors[card.rarity as keyof typeof rarityColors] || rarityColors.common;
    this.uiRenderer.drawRect(x + 5, y + 5, width - 10, height - 10, rarityColor);

    // Icon
    const iconSize = 48;
    const iconX = x + width / 2 - iconSize / 2;
    const iconY = y + 30;
    this.uiRenderer.drawText(card.visual.icon, iconX, iconY, card.visual.color, `${iconSize}px monospace`);

    // Card name
    const nameY = iconY + iconSize + 20;
    this.uiRenderer.drawText(card.name, x + 10, nameY, '#fff', 'bold 16px monospace');

    // Rarity
    const rarityY = nameY + 25;
    this.uiRenderer.drawText(card.rarity.toUpperCase(), x + 10, rarityY, card.visual.color, '12px monospace');

    // Description (word-wrapped)
    const descY = rarityY + 30;
    this.drawWrappedText(card.description, x + 10, descY, width - 20, '#ccc', '14px monospace');
  }

  private drawWrappedText(text: string, x: number, y: number, maxWidth: number, color: string, font: string): void {
    const words = text.split(' ');
    let line = '';
    let lineY = y;
    const lineHeight = 18;

    for (const word of words) {
      const testLine = line + word + ' ';
      // Simple width estimation (not perfect but good enough)
      const estimatedWidth = testLine.length * 8;

      if (estimatedWidth > maxWidth && line !== '') {
        this.uiRenderer.drawText(line.trim(), x, lineY, color, font);
        line = word + ' ';
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }

    if (line.trim() !== '') {
      this.uiRenderer.drawText(line.trim(), x, lineY, color, font);
    }
  }

  private updateClickableAreas(): void {
    this.clickableCards = [];

    if (!this.isVisible || this.choices.length === 0) return;

    const cardWidth = 200;
    const cardHeight = 280;
    const cardSpacing = 40;
    const totalWidth = this.choices.length * cardWidth + (this.choices.length - 1) * cardSpacing;
    const startX = (this.width - totalWidth) / 2;
    const cardY = 200;

    for (let i = 0; i < this.choices.length; i++) {
      const choice = this.choices[i];
      if (!choice) continue;

      const x = startX + i * (cardWidth + cardSpacing);

      this.clickableCards.push({
        x,
        y: cardY,
        width: cardWidth,
        height: cardHeight,
        cardKey: choice.key
      });
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.updateClickableAreas();
  }
}