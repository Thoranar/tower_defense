import { Tower } from '../gameplay/Tower.js';
import { Input } from '../core/Input.js';
import { World } from '../core/World.js';
import { Creators } from '../data/creators.js';
import { Projectile } from '../gameplay/Projectile.js';
import { EventBus } from '../core/EventBus.js';

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
  private bus: EventBus;

  constructor(args: { world: World; input: Input; creators: Creators; bus: EventBus }) {
    this.world = args.world;
    this.input = args.input;
    this.creators = args.creators;
    this.bus = args.bus;

    // Listen for weapon management events
    this.bus.on('EquipWeapon', (data: any) => {
      this.handleEquipWeapon(data);
    });

    this.bus.on('UpgradeWeapon', (data: any) => {
      this.handleUpgradeWeapon(data);
    });

    this.bus.on('SwitchProjectile', (data: any) => {
      this.handleSwitchProjectile(data);
    });

    this.bus.on('AddWeaponSlot', (data: any) => {
      this.handleAddWeaponSlot(data);
    });
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
  private handleWeaponFiring(tower: Tower, devToolsFireRateMultiplier: number): void {
    // Combine tower's fire rate stat with dev tools multiplier
    const totalFireRateMultiplier = tower.stats.fireRate * devToolsFireRateMultiplier;
    const projectiles = tower.fireWeapons(totalFireRateMultiplier, this.creators);


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

  /**
   * Handle equipping a weapon to the tower
   */
  private handleEquipWeapon(data: { weaponKey: string; level: number; slot?: number }): void {
    const tower = this.getTower();
    if (!tower) {
      console.warn('Cannot equip weapon: no tower found');
      return;
    }

    try {
      // Create the weapon using creators
      const weapon = this.creators.weapon(data.weaponKey, data.level);

      // Determine which slot to use
      const slot = data.slot || 0;

      // Replace weapon in slot or add if slot doesn't exist yet
      if (slot < tower.weapons.length) {
        tower.weapons[slot] = weapon;
        console.log(`Replaced weapon in slot ${slot} with ${data.weaponKey} level ${data.level}`);
      } else if (slot === tower.weapons.length) {
        tower.addWeapon(weapon);
        console.log(`Added ${data.weaponKey} level ${data.level} to new slot ${slot}`);
      } else {
        console.warn(`Cannot equip weapon: slot ${slot} is too far ahead (max slot: ${tower.weapons.length})`);
        return;
      }

    } catch (error) {
      console.error(`Failed to create or equip weapon ${data.weaponKey}:`, error);
    }
  }

  /**
   * Handle upgrading an existing weapon
   */
  private handleUpgradeWeapon(data: { slot: number; levelIncrease: number }): void {
    const tower = this.getTower();
    if (!tower) {
      console.warn('Cannot upgrade weapon: no tower found');
      return;
    }

    const slot = data.slot;
    if (slot >= tower.weapons.length) {
      console.warn(`Cannot upgrade weapon: slot ${slot} does not exist (max slot: ${tower.weapons.length - 1})`);
      return;
    }

    const weapon = tower.weapons[slot];
    if (!weapon) {
      console.warn(`Cannot upgrade weapon: no weapon in slot ${slot}`);
      return;
    }

    // Increase weapon level
    weapon.level += data.levelIncrease;
    console.log(`Upgraded weapon in slot ${slot} to level ${weapon.level}`);
  }

  /**
   * Handle switching projectile type for a weapon
   */
  private handleSwitchProjectile(data: { weaponSlot: number; projectileKey: string }): void {
    const tower = this.getTower();
    if (!tower) {
      console.warn('Cannot switch projectile: no tower found');
      return;
    }

    const slot = data.weaponSlot;
    if (slot >= tower.weapons.length) {
      console.warn(`Cannot switch projectile: weapon slot ${slot} does not exist`);
      return;
    }

    const weapon = tower.weapons[slot];
    if (!weapon) {
      console.warn(`Cannot switch projectile: no weapon in slot ${slot}`);
      return;
    }

    // Update weapon's projectile key
    weapon.projectileKey = data.projectileKey;
    console.log(`Switched weapon in slot ${slot} to use projectile: ${data.projectileKey}`);
  }

  /**
   * Handle adding additional weapon slots
   */
  private handleAddWeaponSlot(data: { count: number }): void {
    const tower = this.getTower();
    if (!tower) {
      console.warn('Cannot add weapon slot: no tower found');
      return;
    }

    // For now, just log that additional slots would be available
    // In a more complex system, this might increase a maxWeapons property
    const currentSlots = tower.weapons.length;
    const newCapacity = currentSlots + data.count;
    console.log(`Tower weapon capacity expanded from ${currentSlots} to ${newCapacity} slots`);

    // Note: The actual slot expansion happens when weapons are equipped
    // The tower.weapons array automatically grows as needed
  }
}