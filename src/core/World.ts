import { Entity } from '../gameplay/Entity.js';

// Maintains list of entities; add/remove/update lifecycle
// Entity container with safe iteration and querying capabilities
// Manages entity lifecycle and provides query methods for systems
export class World {
  private entities: Set<Entity> = new Set();
  private entitiesToAdd: Entity[] = [];
  private entitiesToRemove: Entity[] = [];
  private nextId: number = 1;

  /** Add entity to world; assigns id. */
  add(entity: Entity): void {
    entity.id = this.nextId++;
    this.entitiesToAdd.push(entity);
  }

  /** Mark entity for removal (safe during iteration). */
  remove(entity: Entity): void {
    entity.alive = false;
    this.entitiesToRemove.push(entity);
  }

  /** Process pending additions and removals (call at end of frame). */
  update(): void {
    // Add new entities
    for (const entity of this.entitiesToAdd) {
      this.entities.add(entity);
    }
    this.entitiesToAdd.length = 0;

    // Remove dead entities
    for (const entity of this.entitiesToRemove) {
      this.entities.delete(entity);
    }
    this.entitiesToRemove.length = 0;

    // Also remove any entities marked as not alive
    for (const entity of this.entities) {
      if (!entity.alive) {
        this.entities.delete(entity);
      }
    }
  }

  /** Iterate living entities for systems. */
  all(): Iterable<Entity> {
    return this.entities;
  }

  /** Query by type guard or tag; optional filtering. */
  query<T extends Entity>(predicate: (entity: Entity) => entity is T): T[] {
    const result: T[] = [];
    for (const entity of this.entities) {
      if (predicate(entity)) {
        result.push(entity);
      }
    }
    return result;
  }

  /** Get entity by ID */
  getById(id: number): Entity | undefined {
    for (const entity of this.entities) {
      if (entity.id === id) {
        return entity;
      }
    }
    return undefined;
  }

  /** Get count of entities */
  count(): number {
    return this.entities.size;
  }

  /** Check if entity exists in world */
  has(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  /** Clear all entities */
  clear(): void {
    this.entities.clear();
    this.entitiesToAdd.length = 0;
    this.entitiesToRemove.length = 0;
  }
}