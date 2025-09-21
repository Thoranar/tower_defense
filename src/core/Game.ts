import { Clock } from './Clock.js';
import { Canvas2DRenderer } from './Canvas2DRenderer.js';
import { UIRenderer } from '../ui/UIRenderer.js';
import { DevToolsSystem } from '../devtools/DevToolsSystem.js';
import { DevOverlay } from '../devtools/DevOverlay.js';

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
  private running: boolean = false;
  private animationId: number = 0;

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
  }

  init(): void {
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

    // Update systems here in future milestones
  }

  private render(): void {
    // Clear and render background
    this.renderer.begin();
    this.renderer.end();

    // Render UI
    this.uiRenderer.begin();

    // Show FPS if enabled in DevTools
    if (this.devTools.isOn('showFps')) {
      this.uiRenderer.drawFPS(this.clock.getFPS());
    }

    // Render debug overlays first (under UI)
    this.devOverlay.renderDebugOverlays();

    // Render DevTools overlay last (on top)
    this.devOverlay.render();

    this.uiRenderer.end();
  }

  startRun(): void {
    console.log('Starting new run');
  }

  endRun(reason: "death" | "boss_ground" | "victory"): void {
    console.log(`Run ended: ${reason}`);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.renderer.resize(width, height);
    this.uiRenderer.resize(width, height);
    this.devOverlay.resize(width, height);
  }
}