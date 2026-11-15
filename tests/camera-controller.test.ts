import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CameraController } from '@/game/rendering/CameraController';

const FOLLOW = 6;
const FOCUS = 1.4;

function make() {
  return new CameraController(1, { mode: 'thirdPerson', followDistance: FOLLOW, fov: 50 });
}

describe('CameraController third-person', () => {
  it('keeps a fixed +Z offset behind a player facing -Z (walking forward)', () => {
    const cam = make();
    // rotation = PI => player faces -Z (the W direction).
    cam.snap(new THREE.Vector3(0, 0, 0), Math.PI);
    const p = cam.camera.position;
    expect(p.x).toBeCloseTo(0, 5);
    expect(p.z).toBeGreaterThan(0); // camera sits on the +Z side (behind)
    expect(p.y).toBeCloseTo(FOCUS + FOLLOW * 0.55 + 1.5, 5);
  });

  it('ignores player facing: offset is identical for any rotation', () => {
    const a = make();
    a.snap(new THREE.Vector3(0, 0, 0), 0);
    const b = make();
    b.snap(new THREE.Vector3(0, 0, 0), Math.PI / 2);
    const c = make();
    c.snap(new THREE.Vector3(0, 0, 0), Math.PI);
    expect(a.camera.position.toArray()).toEqual(b.camera.position.toArray());
    expect(a.camera.position.toArray()).toEqual(c.camera.position.toArray());
  });
});

describe('CameraController first-person', () => {
  it('looks in the direction the player faces', () => {
    const cam = new CameraController(1, { mode: 'firstPerson', followDistance: FOLLOW, fov: 50 });
    cam.snap(new THREE.Vector3(0, 0, 0), 0); // facing +Z
    cam.camera.updateMatrixWorld(true);
    const dir = cam.camera.getWorldDirection(new THREE.Vector3());
    expect(dir.z).toBeGreaterThan(0.9); // looking +Z
  });
});