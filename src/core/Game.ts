import { Clock } from './Clock.js';
import { Canvas2DRenderer } from './Canvas2DRenderer.js';
import { UIRenderer } from '../ui/UIRenderer.js';
import { DevToolsSystem } from '../devtools/DevToolsSystem.js';
import { DevOverlay } from '../devtools/DevOverlay.js';
import { Input } from './Input.js';
import { Tower } from '../gameplay/Tower.js';
import { Hud } from '../ui/Hud.js';
import { World } from './World.js';
import { makeCreators, Creators } from '../data/creators.js';
import { Projectile } from '../gameplay/Projectile.js';
import { Enemy } from '../gameplay/Enemy.js';
import { loadRegistry, Registry } from '../data/registry.js';
import { FALLBACK_REGISTRY } from '../data/fallbackRegistry.js';
import { TowerSystem } from '../systems/TowerSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { ExperienceSystem } from '../systems/ExperienceSystem.js';
import { CardDraftSystem } from '../systems/CardDraftSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { CardOverlayView } from '../ui/CardOverlayView.js';
import { EventBus } from './EventBus.js';

// Main game loop; orchestrates systems and updates world
// Manages rendering, input, and coordinates all game systems
// Handles run start/end logic and state transitions
export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private clock: Clock;
  private renderer: Canvas2DRenderer;
  private uiRenderer: UIRenderer;
  private devTools: DevToolsSystem;
  private devOverlay: DevOverlay;
  private input: Input;
  private world: World;
  private hud: Hud;
  private creators: Creators | null = null;
  private registry: Registry | null = null;
  private running: boolean = false;
  private animationId: number = 0;
  private inRun: boolean = false;
  private gamePaused: boolean = false;
  private bus: EventBus;

  // Game systems
  private spawnSystem: SpawnSystem | null = null;
  private movementSystem: MovementSystem | null = null;
  private collisionSystem: CollisionSystem | null = null;
  private combatSystem: CombatSystem | null = null;
  private experienceSystem: ExperienceSystem | null = null;
  private cardDraftSystem: CardDraftSystem | null = null;
  private upgradeSystem: UpgradeSystem | null = null;
  private cardOverlay: CardOverlayView;
  private towerSystem: TowerSystem | null = null;
  private renderSystem: RenderSystem | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;

    this.clock = new Clock();
    this.renderer = new Canvas2DRenderer(this.ctx, canvas.width, canvas.height);
    this.uiRenderer = new UIRenderer(this.ctx, canvas.width, canvas.height);
    this.devTools = new DevToolsSystem();
    this.devOverlay = new DevOverlay(this.devTools, this.uiRenderer, canvas.width, canvas.height);
    this.input = new Input(canvas);
    this.world = new World();
    this.hud = new Hud();
    this.bus = new EventBus();
    this.cardOverlay = new CardOverlayView(this.uiRenderer, canvas.width, canvas.height);
  }

  async init(): Promise<void> {
    console.log('Game initializing...');

    // Load registry and create creators
    try {
      this.registry = await loadRegistry();
      this.creators = makeCreators(this.registry);
      this.initializeSystems();
      console.log('Registry loaded successfully');
    } catch (error) {
      console.error('Failed to load registry:', error);
      console.log('Using fallback registry for development');
      this.registry = FALLBACK_REGISTRY;
      this.creators = makeCreators(this.registry);
      this.initializeSystems();
    }

    // Set up card system event listeners
    this.bus.on('CardDraftActive', (data: any) => {
      this.cardOverlay.show(data.choices);
      this.pauseGame();
    });

    this.bus.on('CardDraftClosed', () => {
      this.cardOverlay.hide();
      this.resumeGame();
    });

    // Register DevTools actions
    this.devTools.registerGameActions({
      resetRun: () => this.resetRun(),
      spawnBasicEnemy: () => this.spawnEnemyManually('basic', 1),
      grantXp: () => this.grantXpManually(10),
      getUpgradeState: () => this.upgradeSystem?.getUpgradeState() || { levels: {}, slots: { used: 0, max: 5 }, canSelectAny: false }
    });

    // Register parameterized actions separately
    this.devTools.registerParameterizedAction('applyUpgrade', (upgradeKey: string) => this.applyUpgradeManually(upgradeKey));

    // Populate available upgrades for DevTools
    if (this.registry) {
      const availableUpgrades = Object.keys(this.registry.upgrades);
      this.devTools.setAvailableUpgrades(availableUpgrades);
    }

    this.startRun(); // Auto-start a run for milestone 3
    console.log('Game initialized');
  }

  private initializeSystems(): void {
    if (!this.registry || !this.creators) {
      throw new Error('Cannot initialize systems: registry or creators not available');
    }

    this.spawnSystem = new SpawnSystem({
      world: this.world,
      creators: this.creators,
      reg: this.registry,
      clock: this.clock
    });

    this.movementSystem = new MovementSystem({
      world: this.world,
      reg: this.registry
    });

    this.collisionSystem = new CollisionSystem({
      world: this.world,
      bus: this.bus
    });

    this.combatSystem = new CombatSystem({
      world: this.world,
      bus: this.bus
    });

    this.experienceSystem = new ExperienceSystem({
      bus: this.bus,
      reg: this.registry
    });

    this.cardDraftSystem = new CardDraftSystem({
      bus: this.bus,
      reg: this.registry
    });

    this.upgradeSystem = new UpgradeSystem({
      bus: this.bus,
      reg: this.registry!,
      creators: this.creators
    });

    this.towerSystem = new TowerSystem({
      world: this.world,
      input: this.input,
      creators: this.creators,
      bus: this.bus
    });

    this.renderSystem = new RenderSystem({
      renderer: this.renderer,
      uiRenderer: this.uiRenderer,
      world: this.world,
      hud: this.hud
    });
  }

  start(): void {
    if (this.running) return;

    this.running = true;
    this.clock.start();
    this.gameLoop();
    console.log('Game started');
  }

  stop(): void {
    this.running = false;
    this.clock.stop();
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    console.log('Game stopped');
  }

  private gameLoop = (): void => {
    if (!this.running) return;

    this.clock.update();
    const deltaTime = this.clock.getDeltaTime();

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    // Handle input for overlays
    this.handleOverlayInput();

    // Update DevTools overlay
    this.devOverlay.update(deltaTime);

    if (this.inRun && !this.gamePaused) {
      // Update tower system (input, firing, tower state)
      if (this.towerSystem) {
        const fireRateMultiplier = this.devTools.getSlider('fireRateMult');
        this.towerSystem.update(deltaTime, fireRateMultiplier);
      }

      // Update game systems
      this.updateGameSystems(deltaTime);

      // Update all entities
      this.updateAllEntities(deltaTime);

      // Process world updates (add/remove entities)
      this.world.update();
    }
  }

  /**
   * Handle mouse clicks for UI overlays
   */
  private handleOverlayInput(): void {
    const mouseClick = this.input.getMouseClick();
    if (!mouseClick.clicked) return;

    // Check card overlay first (higher priority)
    const cardClicked = this.cardOverlay.handleClick(mouseClick.x, mouseClick.y);
    if (cardClicked && this.cardDraftSystem) {
      this.cardDraftSystem.choose(cardClicked);
    } else {
      // Check dev overlay if no card was clicked
      this.devOverlay.handleClick(mouseClick.x, mouseClick.y);
    }
  }

  /**
   * Update all game systems in the proper order
   */
  private updateGameSystems(deltaTime: number): void {
    if (this.spawnSystem) {
      this.spawnSystem.update(deltaTime);
    }

    if (this.movementSystem) {
      this.movementSystem.update(deltaTime);
    }

    if (this.collisionSystem) {
      this.collisionSystem.update(deltaTime);
    }

    if (this.combatSystem) {
      this.combatSystem.clearOldDamageEvents();
      // Sync invincible tower dev tool state
      this.combatSystem.setTowerInvincible(this.devTools.isOn('invincibleTower'));
    }
  }

  /**
   * Update all entities in the world
   */
  private updateAllEntities(deltaTime: number): void {
    for (const entity of this.world.all()) {
      if (entity.update) {
        entity.update(deltaTime);
      }
    }
  }

  private render(): void {
    // Delegate core rendering to RenderSystem
    if (this.renderSystem) {
      const tower = this.getTower();
      this.renderSystem.render({
        inRun: this.inRun,
        tower: tower,
        clock: this.clock,
        experienceSystem: this.experienceSystem || undefined,
        combatSystem: this.combatSystem || undefined,
        showFps: this.devTools.isOn('showFps')
      });
    }

    // Render debug overlays and info (delegated to DevOverlay)
    this.renderDebugOverlays();

    // Render card overlay (on top of everything)
    this.cardOverlay.render();

    // Render DevTools overlay last (on top)
    this.devOverlay.render();
  }

  /**
   * Render debug overlays via DevOverlay
   */
  private renderDebugOverlays(): void {
    this.devOverlay.renderDebugOverlays();
    this.devOverlay.renderInputDebug(this.input, this.getTower());

    if (this.inRun && this.collisionSystem && this.combatSystem) {
      this.devOverlay.renderCollisionMarkers(this.collisionSystem.getCollisionPairs());
      this.devOverlay.renderHitLogs(this.combatSystem.getDamageEvents());
    }

    if (this.inRun) {
      const projectiles = this.world.query((entity): entity is Projectile => entity instanceof Projectile);
      this.devOverlay.renderProjectileDebug(projectiles);

      const counts = this.getEntityCounts();
      this.devOverlay.renderEntityCounts(counts);

      if (this.upgradeSystem) {
        const upgradeState = this.upgradeSystem.getUpgradeState();
        this.devOverlay.renderUpgradeInspector(upgradeState);
      }

      const tower = this.getTower();
      if (tower) {
        this.devOverlay.renderStatOverlays(tower);
      }
    }
  }

  startRun(): void {
    if (!this.creators) {
      console.error('Cannot start run: creators not initialized');
      return;
    }

    console.log('Starting new run');

    // Clear world and create tower at bottom center
    this.world.clear();
    const centerX = this.canvas.width / 2;
    const groundY = this.renderer.getGroundY();
    const tower = new Tower(centerX, groundY - 30, this.bus); // 30 pixels above ground, pass EventBus

    this.world.add(tower);

    // Reset systems
    if (this.spawnSystem) {
      this.spawnSystem.reset();
    }
    if (this.experienceSystem) {
      this.experienceSystem.reset();
    }
    if (this.upgradeSystem) {
      this.upgradeSystem.reset();
    }

    // Reset tower to base stats
    tower.reset();

    // Equip tower with a cannon weapon for Milestone 3 (AFTER reset)
    try {
      const cannon = this.creators.weapon('cannon', 1);
      tower.addWeapon(cannon);
    } catch (error) {
      console.error('Failed to create or add weapon:', error);
    }

    this.inRun = true;
    this.clock.reset();
    this.clock.start();
  }

  endRun(reason: "death" | "boss_ground" | "victory"): void {
    console.log(`Run ended: ${reason}`);
    this.inRun = false;
    this.world.clear();
  }

  /** Reset run (for DevTools) */
  resetRun(): void {
    if (this.inRun) {
      this.endRun("death");
    }
    this.startRun();
  }

  /** Manually spawn enemy (for DevTools) */
  spawnEnemyManually(enemyKey: string, count: number = 1): void {
    if (this.spawnSystem && this.inRun) {
      this.spawnSystem.requestSpawn(enemyKey, count);
    }
  }

  /** Manually grant XP (for DevTools) */
  grantXpManually(amount: number): void {
    if (this.experienceSystem && this.inRun) {
      this.experienceSystem.grant(amount);
    }
  }

  /** Manually apply upgrade (for DevTools) */
  applyUpgradeManually(upgradeKey: string): void {
    if (this.upgradeSystem && this.inRun) {
      console.log(`DevTools applying upgrade: ${upgradeKey}`);
      this.upgradeSystem.apply(upgradeKey);
    } else {
      console.warn('Cannot apply upgrade: UpgradeSystem not available or not in run');
    }
  }

  /** Helper method to get the tower from the world */
  private getTower(): Tower | null {
    // Delegate to TowerSystem if available
    if (this.towerSystem) {
      return this.towerSystem.getTowerForDisplay();
    }

    // Fallback to direct world query
    const towers = this.world.query((entity): entity is Tower => entity instanceof Tower);
    return towers.length > 0 ? towers[0] ?? null : null;
  }

  /** Get entity counts for dev tools */
  getEntityCounts(): { enemies: number; projectiles: number; total: number } {
    const enemies = this.world.query((entity): entity is Enemy => entity instanceof Enemy);
    const projectiles = this.world.query((entity): entity is Projectile => entity instanceof Projectile);
    const total = Array.from(this.world.all()).length;

    return {
      enemies: enemies.length,
      projectiles: projectiles.length,
      total: total
    };
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;

    // Delegate to RenderSystem
    if (this.renderSystem) {
      this.renderSystem.resize(width, height);
    }

    this.devOverlay.resize(width, height);
    this.cardOverlay.resize(width, height);
  }

  /** Pause the game (stops all game system updates but keeps rendering) */
  pauseGame(): void {
    if (this.gamePaused) return;
    this.gamePaused = true;
    console.log('Game paused');
  }

  /** Resume the game (restores game system updates) */
  resumeGame(): void {
    if (!this.gamePaused) return;
    this.gamePaused = false;
    console.log('Game resumed');
  }

  /** Check if the game is currently paused */
  isPaused(): boolean {
    return this.gamePaused;
  }
}