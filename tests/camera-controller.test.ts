import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CameraController } from '@/game/rendering/CameraController';

const FOLLOW = 6;
const FOCUS = 1.3; // CameraController's default focusHeight

function make() {
  return new CameraController(1, { mode: 'thirdPerson', followDistance: FOLLOW, fov: 50 });
}

describe('CameraController third-person', () => {
  it('defaults to a +Z offset behind a player walking forward (-Z)', () => {
    const cam = make();
    cam.snap(new THREE.Vector3(0, 0, 0));
    const p = cam.camera.position;
    expect(p.x).toBeCloseTo(0, 5);
    expect(p.z).toBeGreaterThan(0); // camera sits on the +Z side (behind)
    // Low third-person framing: focus height plus a modest camera-side lift.
    expect(p.y).toBeCloseTo(FOCUS + FOLLOW * 0.18 + 0.9, 5);
  });

  it('orbits the camera off the default axis when dragged', () => {
    const cam = make();
    cam.snap(new THREE.Vector3(0, 0, 0));
    cam.orbit(200, 0); // drag right => yaw changes
    cam.snap(new THREE.Vector3(0, 0, 0));
    const p = cam.camera.position;
    expect(Math.abs(p.x)).toBeGreaterThan(0.1); // no longer straight on +Z
    expect(cam.lookYaw).not.toBe(0);
  });

  it('zooms the follow distance in and out with the wheel', () => {
    const cam = make();
    cam.snap(new THREE.Vector3(0, 0, 0));
    const far = cam.camera.position.length();

    const cam2 = make();
    cam2.zoom(-100); // scroll up => zoom in
    cam2.snap(new THREE.Vector3(0, 0, 0));
    const near = cam2.camera.position.length();

    const cam3 = make();
    cam3.zoom(100); // scroll down => zoom out
    cam3.snap(new THREE.Vector3(0, 0, 0));
    const farther = cam3.camera.position.length();

    expect(near).toBeLessThan(far);
    expect(farther).toBeGreaterThan(far);
  });
});

describe('CameraController first-person', () => {
  it('looks into the screen (-Z) at the default yaw, matching third-person', () => {
    const cam = new CameraController(1, { mode: 'firstPerson', followDistance: FOLLOW, fov: 50 });
    cam.snap(new THREE.Vector3(0, 0, 0));
    cam.camera.updateMatrixWorld(true);
    const dir = cam.camera.getWorldDirection(new THREE.Vector3());
    expect(dir.z).toBeCloseTo(-1, 1); // looking -Z
  });

  it('looks along the orbit yaw after dragging', () => {
    const cam = new CameraController(1, { mode: 'firstPerson', followDistance: FOLLOW, fov: 50 });
    cam.orbit(-200, 0); // drag left => yaw increases
    cam.snap(new THREE.Vector3(0, 0, 0));
    cam.camera.updateMatrixWorld(true);
    const dir = cam.camera.getWorldDirection(new THREE.Vector3());
    // look dir = (-sin yaw, -cos yaw); with yaw>0 the x component is negative.
    expect(dir.x).toBeLessThan(0);
  });
});