import * as THREE from 'three';
import { clamp, damp } from '@/utils/math';
import type { TerrainSystem } from '@/game/world/TerrainSystem';

// WASD / arrow-key movement with smooth acceleration and deceleration,
// terrain-aware height following, and simple collision against world
// obstacles (sphere-vs-AABB against registered colliders). spec §11.

export interface MovementConfig {
  walkSpeed: number;
  runSpeed: number;
  accel: number;
  decel: number;
  turnSpeed: number;
  radius: number;
}

export const DEFAULT_MOVEMENT: MovementConfig = {
  walkSpeed: 3.2,
  runSpeed: 6.0,
  accel: 12,
  decel: 14,
  turnSpeed: 12,
  radius: 0.4,
};

export interface Collider {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

/**
 * Camera-relative move direction from raw input and the camera's look yaw.
 * `ix` is +1 for D / -1 for A; `iz` is -1 for W / +1 for S. The result is the
 * horizontal direction "into the screen" for forward and "screen-right" for D,
 * rotated by the camera yaw, so W always moves away from the camera.
 */
export function moveInputToDir(ix: number, iz: number, cameraYaw: number): { x: number; z: number } {
  const sin = Math.sin(cameraYaw);
  const cos = Math.cos(cameraYaw);
  return {
    x: sin * iz + cos * ix,
    z: cos * iz - sin * ix,
  };
}

export class MovementSystem {
  private velocity = new THREE.Vector3();
  private moveDir = new THREE.Vector3();
  private targetSpeed = 0;
  private keys = new Set<string>();
  private colliders: Collider[] = [];
  private enabled = false;
  private sitting = false;
  private facing = 0;

  constructor(
    private terrain: TerrainSystem,
    private cfg: MovementConfig = DEFAULT_MOVEMENT,
  ) {}

  addCollider(min: THREE.Vector3, max: THREE.Vector3): void {
    this.colliders.push({ min, max });
  }

  clearColliders(): void {
    this.colliders.length = 0;
  }

  enable(): void {
    this.enabled = true;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  disable(): void {
    this.enabled = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.keys.clear();
  }

  setSitting(sitting: boolean): void {
    this.sitting = sitting;
    if (sitting) {
      this.velocity.set(0, 0, 0);
      this.targetSpeed = 0;
    }
  }

  get isSitting(): boolean {
    return this.sitting;
  }

  get speed(): number {
    return this.velocity.length();
  }

  get facingYaw(): number {
    return this.facing;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.enabled || this.sitting) return;
    this.keys.add(e.code);
  };
  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private isDown(...codes: string[]): boolean {
    return codes.some((c) => this.keys.has(c));
  }

  update(dt: number, position: THREE.Vector3, cameraYaw = 0): void {
    if (!this.enabled) return;

    // Input → desired direction, relative to the camera's look yaw so that
    // W always moves away from the camera and A/D stay screen-left/right even
    // after the player orbits the view.
    let ix = 0;
    let iz = 0;
    if (this.isDown('KeyW', 'ArrowUp')) iz -= 1;
    if (this.isDown('KeyS', 'ArrowDown')) iz += 1;
    if (this.isDown('KeyA', 'ArrowLeft')) ix -= 1;
    if (this.isDown('KeyD', 'ArrowRight')) ix += 1;
    const hasInput = (ix !== 0 || iz !== 0) && !this.sitting;

    const running = this.isDown('ShiftLeft', 'ShiftRight');
    const target = hasInput ? (running ? this.cfg.runSpeed : this.cfg.walkSpeed) : 0;
    this.targetSpeed = damp(this.targetSpeed, target, hasInput ? this.cfg.accel : this.cfg.decel, dt);

    if (hasInput) {
      const dir = moveInputToDir(ix, iz, cameraYaw);
      this.moveDir.set(dir.x, 0, dir.z).normalize();
      const desiredFacing = Math.atan2(this.moveDir.x, this.moveDir.z);
      this.facing = this.lerpAngle(this.facing, desiredFacing, this.cfg.turnSpeed * dt);
    }

    // Integrate horizontal velocity.
    const step = this.targetSpeed * dt;
    const nextX = position.x + this.moveDir.x * step;
    const nextZ = position.z + this.moveDir.z * step;

    // Collision: clamp against AABBs (sphere-vs-AABB, simplified to point).
    const resolved = this.resolveCollisions(nextX, nextZ);

    position.x = resolved.x;
    position.z = resolved.z;
    // Terrain-aware height.
    position.y = this.terrain.heightAt(position.x, position.z);

    this.velocity.set(this.moveDir.x * this.targetSpeed, 0, this.moveDir.z * this.targetSpeed);
  }

  private resolveCollisions(toX: number, toZ: number): { x: number; z: number } {
    let x = toX;
    let z = toZ;
    const r = this.cfg.radius;
    for (const c of this.colliders) {
      if (
        x > c.min.x - r &&
        x < c.max.x + r &&
        z > c.min.z - r &&
        z < c.max.z + r
      ) {
        // Push out along the smallest penetration axis.
        const dxMin = Math.abs(x - (c.min.x - r));
        const dxMax = Math.abs((c.max.x + r) - x);
        const dzMin = Math.abs(z - (c.min.z - r));
        const dzMax = Math.abs((c.max.z + r) - z);
        const m = Math.min(dxMin, dxMax, dzMin, dzMax);
        if (m === dxMin) x = c.min.x - r;
        else if (m === dxMax) x = c.max.x + r;
        else if (m === dzMin) z = c.min.z - r;
        else z = c.max.z + r;
      }
    }
    return { x, z };
  }

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + clamp(diff, -t, t);
  }

  dispose(): void {
    this.disable();
  }
}