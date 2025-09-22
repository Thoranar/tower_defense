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

  /** Get the canvas context for direct rendering */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
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

    // XP bar (bottom-left, below health)
    if (hud.xp) {
      const xpBarX = 20;
      const xpBarY = this.height - 30;
      const xpBarWidth = 200;
      const xpBarHeight = 16;

      this.drawText(`Level ${hud.xp.level}`, xpBarX, xpBarY - 18, '#fff', '12px monospace');
      this.drawBar(xpBarX, xpBarY, xpBarWidth, xpBarHeight, hud.xp.progress, '#333', '#4ecdc4');
      this.drawText(`${hud.xp.xp}/${hud.xp.xpToNext}`, xpBarX + xpBarWidth + 10, xpBarY + 2, '#fff', '10px monospace');
    }

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

  drawProjectile(projectile: any): void {
    const x = projectile.pos.x;
    const y = projectile.pos.y;
    const radius = projectile.radius;

    // Draw projectile as a yellow circle
    this.ctx.fillStyle = '#ffff00';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw outline
    this.ctx.strokeStyle = '#ffcc00';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  drawEnemy(enemy: any): void {
    const x = enemy.pos.x;
    const y = enemy.pos.y;
    const radius = enemy.radius;

    // Draw enemy as a colored circle
    this.ctx.fillStyle = enemy.color || '#FF6B6B';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw outline
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Draw HP bar above enemy
    const barWidth = radius * 2;
    const barHeight = 4;
    const barX = x - barWidth / 2;
    const barY = y - radius - 8;
    const hpPercent = enemy.hp / enemy.maxHp;

    // Background
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health fill
    this.ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
    this.ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }

  drawFloatingDamage(x: number, y: number, damage: number, age: number, maxAge: number): void {
    const progress = age / maxAge;
    const alpha = 1 - progress;
    const offsetY = progress * 30; // Float upward

    // Color based on damage amount
    let color = '#ffff00'; // Yellow for normal damage
    if (damage >= 20) color = '#ff4444'; // Red for high damage
    else if (damage >= 10) color = '#ff8844'; // Orange for medium damage

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Add text outline for better visibility
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeText(`-${damage}`, x, y - offsetY);
    this.ctx.fillText(`-${damage}`, x, y - offsetY);

    this.ctx.restore();
  }

  drawBossWarning(bossType: 'mini' | 'final', timeRemaining: number, bossKey?: string): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2 - 100;

    // Warning banner background
    const bannerWidth = 400;
    const bannerHeight = 80;
    const bannerX = centerX - bannerWidth / 2;
    const bannerY = centerY - bannerHeight / 2;

    // Pulsing effect based on time remaining
    const pulseIntensity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
    const warningColor = bossType === 'final' ? `rgba(255, 0, 0, ${pulseIntensity})` : `rgba(255, 165, 0, ${pulseIntensity})`;

    // Draw banner background
    this.ctx.fillStyle = warningColor;
    this.ctx.fillRect(bannerX, bannerY, bannerWidth, bannerHeight);

    // Draw banner border
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(bannerX, bannerY, bannerWidth, bannerHeight);

    // Warning text
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 20px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const warningText = bossType === 'final' ? 'FINAL BOSS APPROACHING!' : 'MINI-BOSS INCOMING!';
    this.ctx.fillText(warningText, centerX, centerY - 15);

    // Countdown
    this.ctx.font = 'bold 16px monospace';
    const countdownText = `${Math.ceil(timeRemaining)}s`;
    this.ctx.fillText(countdownText, centerX, centerY + 15);

    // Boss name if available
    if (bossKey) {
      this.ctx.font = '14px monospace';
      const bossName = bossKey.charAt(0).toUpperCase() + bossKey.slice(1);
      this.ctx.fillText(bossName, centerX, centerY + 35);
    }
  }

  drawBossHealthBar(boss: any): void {
    if (!boss || !boss.isBoss) return;

    // Boss health bar at top of screen
    const barWidth = this.width * 0.8;
    const barHeight = 20;
    const barX = (this.width - barWidth) / 2;
    const barY = 60;

    const hpPercent = boss.hp / boss.maxHp;

    // Background
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health fill - red for bosses
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // Border
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Boss label and HP text
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    const bossLabel = boss.bossType === 'final' ? 'FINAL BOSS' : 'MINI-BOSS';
    this.ctx.fillText(bossLabel, this.width / 2, barY - 18);

    this.ctx.font = '12px monospace';
    this.ctx.fillText(`${Math.ceil(boss.hp)}/${boss.maxHp}`, this.width / 2, barY + barHeight + 5);
  }
}