import { Clock } from './Clock.js';
import { Canvas2DRenderer } from './Canvas2DRenderer.js';
import { UIRenderer } from '../ui/UIRenderer.js';
import { DevToolsSystem } from '../devtools/DevToolsSystem.js';
import { DevOverlay } from '../devtools/DevOverlay.js';
import { Input } from './Input.js';
import { Tower } from '../gameplay/Tower.js';
import { Hud } from '../ui/Hud.js';
import { World } from './World.js';

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

  init(): void {
    console.log('Game initialized');

    // Register DevTools actions
    this.devTools.registerGameActions({
      resetRun: () => this.resetRun()
    });

    this.startRun(); // Auto-start a run for milestone 2
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

      // Render other entities (enemies, projectiles) in future milestones
      // for (const entity of this.world.all()) { ... }
    }

    // Show FPS if enabled in DevTools
    if (this.devTools.isOn('showFps')) {
      this.uiRenderer.drawFPS(this.clock.getFPS());
    }

    // Render debug overlays and info (delegated to DevOverlay)
    this.devOverlay.renderDebugOverlays();
    this.devOverlay.renderInputDebug(this.input, this.getTower());

    // Render DevTools overlay last (on top)
    this.devOverlay.render();

    this.uiRenderer.end();
  }

  startRun(): void {
    console.log('Starting new run');

    // Clear world and create tower at bottom center
    this.world.clear();
    const centerX = this.canvas.width / 2;
    const groundY = this.renderer.getGroundY();
    const tower = new Tower(centerX, groundY - 30); // 30 pixels above ground
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