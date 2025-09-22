import { Canvas2DRenderer } from '../core/Canvas2DRenderer.js';
import { UIRenderer } from '../ui/UIRenderer.js';
import { World } from '../core/World.js';
import { Tower } from '../gameplay/Tower.js';
import { Enemy } from '../gameplay/Enemy.js';
import { Projectile } from '../gameplay/Projectile.js';
import { Clock } from '../core/Clock.js';
import { ExperienceSystem } from './ExperienceSystem.js';
import { CombatSystem } from './CombatSystem.js';
import { BossSystem } from './BossSystem.js';
import { Hud } from '../ui/Hud.js';

/**
 * RenderSystem handles all rendering concerns, delegating specific
 * rendering tasks to appropriate renderers.
 *
 * This follows the single responsibility principle by extracting
 * all rendering logic from the main Game class.
 */
export class RenderSystem {
  private renderer: Canvas2DRenderer;
  private uiRenderer: UIRenderer;
  private world: World;
  private hud: Hud;

  constructor(args: {
    renderer: Canvas2DRenderer;
    uiRenderer: UIRenderer;
    world: World;
    hud: Hud;
  }) {
    this.renderer = args.renderer;
    this.uiRenderer = args.uiRenderer;
    this.world = args.world;
    this.hud = args.hud;
  }

  /**
   * Render the game world and UI
   */
  render(args: {
    inRun: boolean;
    tower?: Tower | null;
    clock: Clock;
    experienceSystem?: ExperienceSystem | undefined;
    combatSystem?: CombatSystem | undefined;
    bossSystem?: BossSystem | undefined;
    showFps?: boolean;
  }): void {
    // Clear and render background
    this.renderer.begin();
    this.renderer.end();

    // Render UI
    this.uiRenderer.begin();

    if (args.inRun && args.tower) {
      this.renderGameEntities(args.tower, args.clock, args.experienceSystem);
      this.renderFloatingDamage(args.combatSystem);
      this.renderExplosionEffects(args.combatSystem);
      this.renderBossUI(args.bossSystem);
    }

    // Show FPS if enabled
    if (args.showFps) {
      this.uiRenderer.drawFPS(args.clock.getFPS());
    }

    this.uiRenderer.end();
  }

  /**
   * Render game entities (tower, enemies, projectiles, HUD)
   */
  private renderGameEntities(
    tower: Tower,
    clock: Clock,
    experienceSystem?: ExperienceSystem | undefined
  ): void {
    // Render tower
    this.uiRenderer.drawTower(tower);

    // Render HUD
    const hudModel = this.hud.snapshot(tower, clock, experienceSystem);
    this.uiRenderer.drawHUD(hudModel);

    // Render enemies and projectiles
    for (const entity of this.world.all()) {
      if (entity instanceof Projectile) {
        this.uiRenderer.drawProjectile(entity);
      } else if (entity instanceof Enemy) {
        this.uiRenderer.drawEnemy(entity);
      }
    }
  }

  /**
   * Render floating damage numbers
   */
  private renderFloatingDamage(combatSystem?: CombatSystem | undefined): void {
    if (!combatSystem) return;

    const damageEvents = combatSystem.getDamageEvents();
    const now = Date.now();
    const maxAge = 3000; // 3 seconds

    for (const event of damageEvents) {
      const age = now - event.timestamp;
      if (age < maxAge) {
        this.uiRenderer.drawFloatingDamage(
          event.position.x,
          event.position.y,
          event.amount,
          age,
          maxAge
        );
      }
    }
  }

  /**
   * Render explosion visual effects
   */
  private renderExplosionEffects(combatSystem?: CombatSystem | undefined): void {
    if (!combatSystem) return;

    const explosionEvents = combatSystem.getExplosionEvents();
    const now = Date.now();
    const maxAge = 1000; // 1 second

    for (const event of explosionEvents) {
      const age = now - event.timestamp;
      if (age < maxAge) {
        this.uiRenderer.drawExplosion(
          event.position.x,
          event.position.y,
          event.radius,
          age,
          maxAge
        );
      }
    }

    // Clean up old explosion events
    combatSystem.clearOldExplosionEvents(maxAge);
  }

  /**
   * Render boss-related UI elements
   */
  private renderBossUI(bossSystem?: BossSystem | undefined): void {
    if (!bossSystem) return;

    // Render boss warning if active
    const warning = bossSystem.getCurrentWarning();
    if (warning) {
      this.uiRenderer.drawBossWarning(warning.type, warning.timeRemaining, warning.bossKey);
    }

    // Render boss health bar if boss is active
    const activeBoss = bossSystem.getActiveBoss();
    if (activeBoss) {
      this.uiRenderer.drawBossHealthBar(activeBoss);
    }
  }

  /**
   * Resize renderer viewports
   */
  resize(width: number, height: number): void {
    this.renderer.resize(width, height);
    this.uiRenderer.resize(width, height);
  }
}