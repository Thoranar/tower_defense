import { Tower } from '../gameplay/Tower.js';
import { Input } from '../core/Input.js';
import { World } from '../core/World.js';
import { Creators } from '../data/creators.js';
import { Projectile } from '../gameplay/Projectile.js';

/**
 * TowerSystem handles all tower-specific logic including:
 * - Input handling (rotation, aiming)
 * - Weapon firing
 * - Tower updates
 *
 * Following the principle that each system should handle one concern,
 * this extracts tower logic from the main Game class.
 */
export class TowerSystem {
  private world: World;
  private input: Input;
  private creators: Creators;

  constructor(args: { world: World; input: Input; creators: Creators }) {
    this.world = args.world;
    this.input = args.input;
    this.creators = args.creators;
  }

  /**
   * Update tower input, firing, and internal state
   */
  update(deltaTime: number, fireRateMultiplier: number = 1.0): void {
    const tower = this.getTower();
    if (!tower) return;

    // Handle tower rotation input
    this.handleRotationInput(tower, deltaTime);

    // Handle weapon firing
    this.handleWeaponFiring(tower, fireRateMultiplier);

    // Update tower (regeneration, weapon cooldowns, etc.)
    tower.update(deltaTime);
  }

  /**
   * Handle tower rotation from keyboard and mouse input
   */
  private handleRotationInput(tower: Tower, deltaTime: number): void {
    // Handle keyboard rotation input
    const rotationInput = this.input.getTurretRotationInput();
    if (rotationInput !== 0) {
      const rotationSpeed = 2.0; // radians per second
      tower.setTurretAngle(tower.turretAngle + rotationInput * rotationSpeed * deltaTime);
    }

    // Mouse aiming (override keyboard if mouse is used)
    if (this.input.isMouseDown()) {
      const mouseAngle = this.input.getAngleToMouse(tower.pos.x, tower.pos.y);
      tower.setTurretAngle(mouseAngle);
    }
  }

  /**
   * Handle automatic weapon firing
   */
  private handleWeaponFiring(tower: Tower, fireRateMultiplier: number): void {
    const projectiles = tower.fireWeapons(fireRateMultiplier, this.creators);


    // Add projectiles to world
    for (const projectile of projectiles) {
      this.world.add(projectile);
    }
  }

  /**
   * Get the tower entity from the world
   */
  private getTower(): Tower | null {
    const towers = this.world.query((entity): entity is Tower => entity instanceof Tower);
    return towers.length > 0 ? towers[0] ?? null : null;
  }

  /**
   * Get tower for external access (e.g., HUD rendering)
   */
  getTowerForDisplay(): Tower | null {
    return this.getTower();
  }
}