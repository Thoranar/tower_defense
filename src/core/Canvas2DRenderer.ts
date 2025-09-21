// Canvas 2D implementation of Renderer
// Concrete implementation using HTML5 Canvas 2D context
// Handles sprite rendering, shapes, and UI drawing
export class Canvas2DRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private groundY: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.groundY = height - 60; // Ground line 60 pixels from bottom
  }

  begin(): void {
    // Clear canvas with solid dark background
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw ground line
    this.ctx.strokeStyle = '#444';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.groundY);
    this.ctx.lineTo(this.width, this.groundY);
    this.ctx.stroke();
  }

  end(): void {
    // Frame finalization if needed
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.groundY = height - 60;
  }

  getGroundY(): number {
    return this.groundY;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }
}