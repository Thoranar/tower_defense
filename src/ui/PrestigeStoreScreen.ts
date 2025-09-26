// Prestige store screen with tabbed interface
// Allows player to purchase permanent upgrades using prestige currency
// Three tabs: Tower Upgrades, Building Unlocks, Weapons & Projectiles

import { UIRenderer } from './UIRenderer.js';
import { MetaData, PrestigeSystem } from '../systems/PrestigeSystem.js';
import { Registry } from '../data/registry.js';

type TabType = 'tower' | 'building' | 'weapon';

type ClickableButton = {
  x: number;
  y: number;
  width: number;
  height: number;
  action: 'back' | 'purchase';
  itemKey?: string;
};

type ClickableTab = {
  x: number;
  y: number;
  width: number;
  height: number;
  tab: TabType;
};

type PrestigeItemWithState = {
  key: string;
  category: string;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  basePrice: number;
  priceScaling: number;
  currentLevel: number;
  nextPrice: number;
  canAfford: boolean;
  isAvailable: boolean;
  isMaxLevel: boolean;
  requiresUnlock?: string | undefined;
};

export class PrestigeStoreScreen {
  private uiRenderer: UIRenderer;
  private width: number;
  private height: number;
  private isVisible: boolean = false;
  private metaData: MetaData | null = null;
  private prestigeSystem: PrestigeSystem | null = null;
  private clickableButtons: ClickableButton[] = [];
  private clickableTabs: ClickableTab[] = [];
  private currentTab: TabType = 'tower';
  private prestigeItems: PrestigeItemWithState[] = [];
  private scrollOffset: number = 0;

  constructor(uiRenderer: UIRenderer, width: number, height: number) {
    this.uiRenderer = uiRenderer;
    this.width = width;
    this.height = height;
  }

  /** Show the prestige store with meta progression data */
  show(metaData: MetaData, prestigeSystem: PrestigeSystem): void {
    this.metaData = metaData;
    this.prestigeSystem = prestigeSystem;
    this.isVisible = true;
    this.loadPrestigeItems();
    this.updateClickableAreas();
  }

  /** Hide the prestige store */
  hide(): void {
    this.isVisible = false;
    this.metaData = null;
    this.clickableButtons = [];
    this.clickableTabs = [];
    this.scrollOffset = 0;
  }

  /** Check if screen is currently visible */
  getVisible(): boolean {
    return this.isVisible;
  }

  /** Handle mouse clicks and return action if button was clicked */
  handleClick(x: number, y: number): { action: string; itemKey?: string } | null {
    if (!this.isVisible) return null;

    // Check tab clicks
    for (const tab of this.clickableTabs) {
      if (x >= tab.x && x <= tab.x + tab.width &&
          y >= tab.y && y <= tab.y + tab.height) {
        this.currentTab = tab.tab;
        this.scrollOffset = 0; // Reset scroll when switching tabs
        this.updateClickableAreas();
        return null; // Tab switch doesn't return an action
      }
    }

    // Check button clicks
    for (const button of this.clickableButtons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        return {
          action: button.action,
          ...(button.itemKey && { itemKey: button.itemKey })
        };
      }
    }

    return null;
  }

  /** Load prestige items from the prestige system and registry */
  private loadPrestigeItems(): void {
    if (!this.prestigeSystem) {
      this.prestigeItems = [];
      return;
    }

    const prestigeItemsWithLevels = this.prestigeSystem.getPrestigeItemsWithLevels();

    this.prestigeItems = prestigeItemsWithLevels.map(({key, item, currentLevel, nextPrice, canAfford, isAvailable, isMaxLevel}) => ({
      key,
      category: item.category,
      name: item.name,
      description: item.description,
      icon: item.icon,
      maxLevel: item.maxLevel,
      basePrice: item.basePrice,
      priceScaling: item.priceScaling,
      currentLevel,
      nextPrice,
      canAfford,
      isAvailable,
      isMaxLevel,
      requiresUnlock: item.requiresUnlock
    }));
  }

  /** Get price for next level of an item */
  private getItemPrice(item: PrestigeItemWithState): number {
    return item.nextPrice;
  }

  /** Get items for current tab */
  private getCurrentTabItems(): PrestigeItemWithState[] {
    return this.prestigeItems.filter(item => item.category === this.currentTab);
  }

  /** Check if item is available for purchase */
  private isItemAvailable(item: PrestigeItemWithState): boolean {
    return item.isAvailable && !item.isMaxLevel;
  }

  /** Update clickable areas for buttons and tabs */
  private updateClickableAreas(): void {
    this.clickableButtons = [];
    this.clickableTabs = [];

    // Tab buttons
    const tabWidth = 180;
    const tabHeight = 40;
    const tabSpacing = 10;
    const tabStartX = (this.width - (tabWidth * 3 + tabSpacing * 2)) / 2;
    const tabY = 60;

    const tabs: { tab: TabType; text: string }[] = [
      { tab: 'tower', text: 'Tower Upgrades' },
      { tab: 'building', text: 'Buildings' },
      { tab: 'weapon', text: 'Weapons' }
    ];

    for (let i = 0; i < tabs.length; i++) {
      const tabInfo = tabs[i];
      if (tabInfo) {
        this.clickableTabs.push({
          x: tabStartX + i * (tabWidth + tabSpacing),
          y: tabY,
          width: tabWidth,
          height: tabHeight,
          tab: tabInfo.tab
        });
      }
    }

    // Back button
    this.clickableButtons.push({
      x: 20,
      y: 20,
      width: 80,
      height: 30,
      action: 'back'
    });

    // Item purchase buttons
    const items = this.getCurrentTabItems();
    const itemHeight = 120;
    const itemSpacing = 10;
    const startY = 140;
    const itemsPerRow = 2;
    const itemWidth = (this.width - 60) / itemsPerRow - itemSpacing;

    for (let i = 0; i < items.length; i++) {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      const x = 30 + col * (itemWidth + itemSpacing);
      const y = startY + row * (itemHeight + itemSpacing) - this.scrollOffset;

      // Only add button if item is visible and available
      const currentItem = items[i];
      if (currentItem && y + itemHeight > 120 && y < this.height - 50 && this.isItemAvailable(currentItem)) {
        const buttonHeight = 30;
        const buttonY = y + itemHeight - buttonHeight - 10;

        this.clickableButtons.push({
          x: x + 10,
          y: buttonY,
          width: itemWidth - 20,
          height: buttonHeight,
          action: 'purchase',
          itemKey: currentItem.key
        });
      }
    }
  }

  /** Render the prestige store screen */
  render(): void {
    if (!this.isVisible || !this.metaData) return;

    const ctx = this.uiRenderer.getContext();

    // Dark background
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, this.width, this.height);

    this.renderHeader();
    this.renderTabs();
    this.renderContent();
  }

  /** Render header with title and currency */
  private renderHeader(): void {
    const ctx = this.uiRenderer.getContext();
    const centerX = this.width / 2;

    // Title
    ctx.fillStyle = '#00aaff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PRESTIGE STORE', centerX, 40);

    // Prestige currency
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Prestige: ${this.metaData?.totalPrestige || 0}`, centerX, this.height - 25);

    // Back button
    ctx.fillStyle = '#5d5d2a';
    ctx.fillRect(20, 20, 80, 30);
    ctx.strokeStyle = '#8f8f4a';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 80, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BACK', 60, 38);
  }

  /** Render tab navigation */
  private renderTabs(): void {
    const ctx = this.uiRenderer.getContext();

    const tabs: { tab: TabType; text: string }[] = [
      { tab: 'tower', text: 'Tower Upgrades' },
      { tab: 'building', text: 'Buildings' },
      { tab: 'weapon', text: 'Weapons' }
    ];

    for (let i = 0; i < this.clickableTabs.length; i++) {
      const tabButton = this.clickableTabs[i];
      if (!tabButton) continue;

      const isActive = tabButton.tab === this.currentTab;

      // Tab background
      ctx.fillStyle = isActive ? '#4a4a8f' : '#2a2a4a';
      ctx.fillRect(tabButton.x, tabButton.y, tabButton.width, tabButton.height);

      // Tab border
      ctx.strokeStyle = isActive ? '#8f8fff' : '#666666';
      ctx.lineWidth = 2;
      ctx.strokeRect(tabButton.x, tabButton.y, tabButton.width, tabButton.height);

      // Tab text
      ctx.fillStyle = isActive ? '#ffffff' : '#cccccc';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      const tabText = tabs[i]?.text || '';
      ctx.fillText(tabText, tabButton.x + tabButton.width / 2, tabButton.y + 25);
    }
  }

  /** Render tab content */
  private renderContent(): void {
    const ctx = this.uiRenderer.getContext();
    const items = this.getCurrentTabItems();

    if (items.length === 0) {
      // Empty state
      ctx.fillStyle = '#888888';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Coming Soon!', this.width / 2, this.height / 2);
      return;
    }

    // Render items in grid
    const itemHeight = 120;
    const itemSpacing = 10;
    const startY = 140;
    const itemsPerRow = 2;
    const itemWidth = (this.width - 60) / itemsPerRow - itemSpacing;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      const x = 30 + col * (itemWidth + itemSpacing);
      const y = startY + row * (itemHeight + itemSpacing) - this.scrollOffset;

      // Only render if visible
      const currentItem = items[i];
      if (currentItem && y + itemHeight > 120 && y < this.height - 50) {
        this.renderItem(currentItem, x, y, itemWidth, itemHeight);
      }
    }
  }

  /** Render individual prestige item */
  private renderItem(item: PrestigeItemWithState, x: number, y: number, width: number, height: number): void {
    const ctx = this.uiRenderer.getContext();
    const isAvailable = item.isAvailable;
    const canAfford = item.canAfford;
    const isMaxLevel = item.isMaxLevel;
    const price = item.nextPrice;

    // Item background
    let bgColor = '#333333';
    if (isMaxLevel) {
      bgColor = '#2a5d2a'; // Green for max level
    } else if (!isAvailable) {
      bgColor = '#5d2a2a'; // Red for locked
    } else if (!canAfford) {
      bgColor = '#5d5d2a'; // Yellow for can't afford
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, width, height);

    // Item border
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Icon placeholder (colored square)
    const iconSize = 24;
    const iconX = x + 10;
    const iconY = y + 10;
    ctx.fillStyle = this.getIconColor(item.icon);
    ctx.fillRect(iconX, iconY, iconSize, iconSize);

    // Item name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(item.name, iconX + iconSize + 10, y + 20);

    // Level display
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px Arial';
    ctx.fillText(`Level: ${item.currentLevel}/${item.maxLevel}`, iconX + iconSize + 10, y + 38);

    // Description
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px Arial';
    this.wrapText(item.description, iconX, y + 55, width - 20, 12);

    // Price and purchase button
    if (!isMaxLevel && isAvailable) {
      const buttonHeight = 30;
      const buttonY = y + height - buttonHeight - 10;
      const buttonX = x + 10;
      const buttonWidth = width - 20;

      // Purchase button
      const buttonColor = canAfford ? '#2a5d2a' : '#5d5d2a';
      ctx.fillStyle = buttonColor;
      ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
      ctx.strokeStyle = canAfford ? '#4a8f4a' : '#8f8f4a';
      ctx.lineWidth = 2;
      ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

      // Button text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      const buttonText = canAfford ? `BUY - ${price}` : `NEED ${price}`;
      ctx.fillText(buttonText, buttonX + buttonWidth / 2, buttonY + 20);
    } else if (isMaxLevel) {
      // Max level indicator
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('MAX LEVEL', x + width / 2, y + height - 20);
    } else {
      // Locked indicator
      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      let lockText = 'LOCKED';
      if (item.requiresUnlock) {
        const requiredItem = this.prestigeItems.find(i => i.key === item.requiresUnlock);
        lockText = requiredItem ? `REQUIRES: ${requiredItem.name}` : 'LOCKED';
      }
      ctx.fillText(lockText, x + width / 2, y + height - 20);
    }
  }

  /** Get color for icon placeholder */
  private getIconColor(icon: string): string {
    const colors: Record<string, string> = {
      'tower_damage': '#ff4444',
      'tower_health': '#44ff44',
      'tower_fire_rate': '#4444ff',
      'xp_boost': '#ffff44',
      'auto_turret': '#ff8844',
      'buff_beacon': '#8844ff',
      'rapid_cannon': '#44ffff',
      'piercing_rounds': '#ff44ff',
      'weapon_damage': '#88ff88'
    };
    return colors[icon] || '#888888';
  }

  /** Wrap text to fit within width */
  private wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const ctx = this.uiRenderer.getContext();
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, x, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }

    ctx.fillText(line, x, currentY);
  }

  /** Resize the screen */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.updateClickableAreas();
  }
}