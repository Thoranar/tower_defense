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
import { loadRegistry, Registry } from '../data/registry.js';

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
  }

  async init(): Promise<void> {
    console.log('Game initializing...');

    // Load registry and create creators
    try {
      this.registry = await loadRegistry();
      this.creators = makeCreators(this.registry);
      console.log('Registry loaded successfully');
    } catch (error) {
      console.error('Failed to load registry:', error);
      // Use fallback for testing
      this.registry = {
        projectiles: {
          bullet: {
            name: "Bullet", description: "Standard projectile", speed: 200, lifetime: 3.0, radius: 3,
            visual: { type: "circle", color: "#ffff00", size: 6 },
            physics: { piercing: false, gravity: false, bounce: false },
            effects: { trail: false, explosion: false }
          }
        },
        weapons: {
          cannon: {
            name: "Cannon", description: "Standard cannon", type: "cannon", projectileKey: "bullet",
            baseCooldown: 1.0, baseUpgradeStats: { damage: 10, fireRate: 1.0, range: 300 },
            levelScaling: { damage: 1.2, fireRate: 1.1, range: 1.05 }, maxLevel: 5, rarity: "common"
          }
        }
      };
      this.creators = makeCreators(this.registry);
    }

    // Register DevTools actions
    this.devTools.registerGameActions({
      resetRun: () => this.resetRun()
    });

    this.startRun(); // Auto-start a run for milestone 3
    console.log('Game initialized');
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
    // Update DevTools overlay
    this.devOverlay.update(deltaTime);

    if (this.inRun) {
      const tower = this.getTower();
      if (tower) {
        // Handle tower rotation input
        const rotationInput = this.input.getTurretRotationInput();
        if (rotationInput !== 0) {
          const rotationSpeed = 2.0; // radians per second
          tower.setTurretAngle(tower.turretAngle + rotationInput * rotationSpeed * deltaTime);
        }

        // Mouse aiming (override keyboard if mouse is used)
        if (this.input.isMouseDown() || this.devTools.isOn('showInput')) {
          const mouseAngle = this.input.getAngleToMouse(tower.pos.x, tower.pos.y);
          tower.setTurretAngle(mouseAngle);
        }

        // Handle weapon firing (automatic for Milestone 3)
        // Apply fire rate multiplier from DevTools
        const fireRateMultiplier = this.devTools.getSlider('fireRateMult');
        const projectiles = tower.fireWeapons(fireRateMultiplier, this.creators);
        for (const projectile of projectiles) {
          this.world.add(projectile);
        }

        // Update tower
        tower.update(deltaTime);
      }

      // Update all entities
      for (const entity of this.world.all()) {
        if (entity.update) {
          entity.update(deltaTime);
        }
      }

      // Process world updates (add/remove entities)
      this.world.update();
    }

    // Update systems here in future milestones
  }

  private render(): void {
    // Clear and render background
    this.renderer.begin();
    this.renderer.end();

    // Render UI
    this.uiRenderer.begin();

    // Render entities if in run
    if (this.inRun) {
      const tower = this.getTower();
      if (tower) {
        this.uiRenderer.drawTower(tower);

        // Render HUD
        const hudModel = this.hud.snapshot(tower, this.clock);
        this.uiRenderer.drawHUD(hudModel);
      }

      // Render projectiles
      for (const entity of this.world.all()) {
        if (entity instanceof Projectile) {
          this.uiRenderer.drawProjectile(entity);
        }
      }
    }

    // Show FPS if enabled in DevTools
    if (this.devTools.isOn('showFps')) {
      this.uiRenderer.drawFPS(this.clock.getFPS());
    }

    // Render debug overlays and info (delegated to DevOverlay)
    this.devOverlay.renderDebugOverlays();
    this.devOverlay.renderInputDebug(this.input, this.getTower());

    // Render projectile debug info if enabled
    if (this.inRun) {
      const projectiles = this.world.query((entity): entity is Projectile => entity instanceof Projectile);
      this.devOverlay.renderProjectileDebug(projectiles);
    }

    // Render DevTools overlay last (on top)
    this.devOverlay.render();

    this.uiRenderer.end();
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
    const tower = new Tower(centerX, groundY - 30); // 30 pixels above ground

    // Equip tower with a cannon weapon for Milestone 3
    const cannon = this.creators.weapon('cannon', 1);
    tower.addWeapon(cannon);

    this.world.add(tower);

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

  /** Helper method to get the tower from the world */
  private getTower(): Tower | null {
    const towers = this.world.query((entity): entity is Tower => entity instanceof Tower);
    return towers.length > 0 ? towers[0] ?? null : null;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.renderer.resize(width, height);
    this.uiRenderer.resize(width, height);
    this.devOverlay.resize(width, height);
  }
}