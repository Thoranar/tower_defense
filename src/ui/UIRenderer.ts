// Canvas 2D UI rendering implementation
// Handles drawing of HUD elements, bars, text, and overlays
// Provides high-level UI drawing methods for game interface
export class UIRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  begin(): void {
    // Save context state for UI rendering
    this.ctx.save();
  }

  end(): void {
    // Restore context state
    this.ctx.restore();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  drawFPS(fps: number): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    const text = `FPS: ${Math.round(fps)}`;
    this.ctx.fillText(text, 10, 10);
  }

  drawText(text: string, x: number, y: number, color: string = '#ffffff', font: string = '16px monospace'): void {
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(text, x, y);
  }

  drawBar(x: number, y: number, width: number, height: number, fill: number, bgColor: string = '#333', fgColor: string = '#0f0'): void {
    // Background
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(x, y, width, height);

    // Fill
    this.ctx.fillStyle = fgColor;
    this.ctx.fillRect(x, y, width * Math.max(0, Math.min(1, fill)), height);

    // Border
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);
  }

  drawRect(x: number, y: number, width: number, height: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  drawStrokeRect(x: number, y: number, width: number, height: number, color: string, lineWidth: number = 1): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(x, y, width, height);
  }

  drawHUD(hud: any): void {
    // Health bar (bottom-left)
    const hpBarX = 20;
    const hpBarY = this.height - 60;
    const hpBarWidth = 200;
    const hpBarHeight = 20;

    this.drawText('Health:', hpBarX, hpBarY - 20, '#fff', '14px monospace');
    this.drawBar(hpBarX, hpBarY, hpBarWidth, hpBarHeight, hud.hp / hud.maxHp, '#600', '#f00');
    this.drawText(`${Math.ceil(hud.hp)}/${hud.maxHp}`, hpBarX + hpBarWidth + 10, hpBarY + 2, '#fff', '12px monospace');

    // Timer (top-center)
    const minutes = Math.floor(hud.timeSec / 60);
    const seconds = Math.floor(hud.timeSec % 60);
    const timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 18px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(timeText, this.width / 2, 20);
  }

  drawTower(tower: any): void {
    const x = tower.pos.x;
    const y = tower.pos.y;
    const radius = tower.radius;

    // Draw tower base (circle)
    this.ctx.fillStyle = '#4a4a4a';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw tower outline
    this.ctx.strokeStyle = '#888';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw turret (line showing direction)
    const turretLength = radius + 10;
    const endX = x + Math.cos(tower.turretAngle) * turretLength;
    const endY = y + Math.sin(tower.turretAngle) * turretLength;

    this.ctx.strokeStyle = '#aaa';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
  }
}