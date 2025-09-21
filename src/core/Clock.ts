// Manages time deltas, elapsed time, and timers
// Provides consistent timing for game updates and animations
// Handles frame timing and elapsed time tracking
export class Clock {
  private startTime: number = 0;
  private lastTime: number = 0;
  private deltaTime: number = 0;
  private elapsedTime: number = 0;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private fps: number = 0;
  private running: boolean = false;

  start(): void {
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.running = true;
  }

  update(): void {
    if (!this.running) return;

    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.elapsedTime = (currentTime - this.startTime) / 1000;

    // FPS calculation
    this.frameCount++;
    this.fpsTimer += this.deltaTime;

    if (this.fpsTimer >= 1.0) {
      this.fps = this.frameCount / this.fpsTimer;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.lastTime = currentTime;
  }

  stop(): void {
    this.running = false;
  }

  reset(): void {
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.deltaTime = 0;
    this.elapsedTime = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.fps = 0;
  }

  getDeltaTime(): number {
    return this.deltaTime;
  }

  getElapsedTime(): number {
    return this.elapsedTime;
  }

  getFPS(): number {
    return this.fps;
  }

  isRunning(): boolean {
    return this.running;
  }
}