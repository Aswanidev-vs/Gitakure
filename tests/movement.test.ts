import { describe, it, expect } from 'vitest';
import { moveInputToDir } from '@/game/systems/MovementSystem';

describe('moveInputToDir (camera-relative movement)', () => {
  it('matches world-axis WASD at yaw 0', () => {
    expect(moveInputToDir(0, -1, 0)).toEqual({ x: 0, z: -1 }); // W => -Z
    expect(moveInputToDir(0, 1, 0)).toEqual({ x: 0, z: 1 }); // S => +Z
    expect(moveInputToDir(-1, 0, 0)).toEqual({ x: -1, z: 0 }); // A => -X
    expect(moveInputToDir(1, 0, 0)).toEqual({ x: 1, z: 0 }); // D => +X
  });

  it('keeps W pointing away from the camera after a 90° orbit', () => {
    // Camera orbited to +X looking toward -X: forward (W) is -X, right (D) is -Z.
    const w = moveInputToDir(0, -1, Math.PI / 2);
    expect(w.x).toBeCloseTo(-1, 6);
    expect(w.z).toBeCloseTo(0, 6);
    const d = moveInputToDir(1, 0, Math.PI / 2);
    expect(d.x).toBeCloseTo(0, 6);
    expect(d.z).toBeCloseTo(-1, 6);
  });

  it('is orthonormal at arbitrary yaw (unit length, perpendicular)', () => {
    const yaw = 0.7;
    const w = moveInputToDir(0, -1, yaw);
    const d = moveInputToDir(1, 0, yaw);
    expect(Math.hypot(w.x, w.z)).toBeCloseTo(1, 6);
    expect(Math.hypot(d.x, d.z)).toBeCloseTo(1, 6);
    expect(w.x * d.x + w.z * d.z).toBeCloseTo(0, 6);
  });
});