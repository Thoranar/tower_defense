// Presents upgrade card choices and processes selection
// Manages the card selection UI during level-ups
// Handles weighted card selection and upgrade application

import { EventBus } from '../core/EventBus.js';
import { Registry, CardBlueprint } from '../data/registry.js';

export class CardDraftSystem {
  active: boolean = false;            // true when draft UI is visible
  currentChoices: string[] = [];      // card keys currently presented

  private bus: EventBus;
  private registry: Registry;
  private rng: () => number;  // Simple RNG function

  constructor(args: { bus: EventBus; reg: Registry; rng?: () => number }) {
    this.bus = args.bus;
    this.registry = args.reg;
    this.rng = args.rng || Math.random;

    // Listen for level up events to trigger card draft
    this.bus.on('LevelUp', () => {
      this.offer(this.registry.config.cards.draftSize);
    });
  }

  /** Create a new draft set of N cards from reg.cards (weighted). */
  offer(count: number): void {
    const cards = this.registry.cards;
    const cardKeys = Object.keys(cards);

    if (cardKeys.length === 0) {
      console.warn('No cards available for draft');
      return;
    }

    // Create weighted card pool based on rarity
    const cardPool: string[] = [];

    for (const cardKey of cardKeys) {
      const card = cards[cardKey];
      if (!card) continue;

      const rarityWeight = this.registry.config.cards.rarityWeights[card.rarity] || 1;
      const totalWeight = card.weight * (rarityWeight / 100); // Convert percentage to multiplier

      // Add card multiple times based on weight
      for (let i = 0; i < Math.ceil(totalWeight); i++) {
        cardPool.push(cardKey);
      }
    }

    // Select random cards without duplicates
    this.currentChoices = [];
    const availableCards = [...cardPool];

    for (let i = 0; i < count && availableCards.length > 0; i++) {
      const randomIndex = Math.floor(this.rng() * availableCards.length);
      const selectedCard = availableCards[randomIndex];

      if (selectedCard) {
        this.currentChoices.push(selectedCard);

        // Remove all instances of this card to prevent duplicates
        const cardToRemove = selectedCard;
        for (let j = availableCards.length - 1; j >= 0; j--) {
          if (availableCards[j] === cardToRemove) {
            availableCards.splice(j, 1);
          }
        }
      }
    }

    this.active = true;
    console.log(`Card draft active with choices: ${this.currentChoices.join(', ')}`);

    // Emit draft event for UI
    this.bus.emit('CardDraftActive', {
      choices: this.currentChoices.map(key => ({
        key,
        card: this.registry.cards[key]
      }))
    });
  }

  /** Apply chosen card outcome (upgrade key), then close the draft. */
  choose(cardKey: string): void {
    if (!this.active || !this.currentChoices.includes(cardKey)) {
      console.warn(`Invalid card choice: ${cardKey}`);
      return;
    }

    const card = this.registry.cards[cardKey];
    if (!card) {
      console.error(`Card not found: ${cardKey}`);
      return;
    }

    console.log(`Card chosen: ${card.name} -> ${card.upgradeKey}`);

    // Emit card chosen event for upgrade system
    this.bus.emit('CardChosen', {
      cardKey,
      upgradeKey: card.upgradeKey,
      card
    });

    // Close the draft
    this.active = false;
    this.currentChoices = [];

    // Emit draft closed event for UI
    this.bus.emit('CardDraftClosed', {});
  }

  /** Force close the draft (for dev tools or cleanup) */
  close(): void {
    this.active = false;
    this.currentChoices = [];
    this.bus.emit('CardDraftClosed', {});
  }

  /** Get current draft state for UI */
  getDraftState(): { active: boolean; choices: Array<{ key: string; card: CardBlueprint }> } {
    return {
      active: this.active,
      choices: this.currentChoices.map(key => ({
        key,
        card: this.registry.cards[key]
      })).filter(choice => choice.card !== undefined) as Array<{ key: string; card: CardBlueprint }>
    };
  }
}