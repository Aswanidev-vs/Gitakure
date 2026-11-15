import * as THREE from 'three';
import { clamp, damp } from '@/utils/math';
import type { CameraMode } from '@/types';

// Dual-mode camera: first-person (eye-level) and third-person (elevated
// follow, fixed orientation, slight downward angle). Smooth damping,
// adjustable follow distance. Toggleable at runtime via `setMode`.

export interface CameraControllerOptions {
  mode: CameraMode;
  followDistance: number;
  fov: number;
  /** World-up offset of the player's focus point. */
  focusHeight?: number;
}

export class CameraController {
  readonly camera: THREE.PerspectiveCamera;
  private mode: CameraMode;
  private followDistance: number;
  private focusHeight: number;

  private currentPos = new THREE.Vector3(0, 5, 10);
  private currentTarget = new THREE.Vector3(0, 1, 0);
  private desiredPos = new THREE.Vector3();
  private desiredTarget = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();

  constructor(aspect: number, opts: CameraControllerOptions) {
    this.mode = opts.mode;
    this.followDistance = opts.followDistance;
    this.focusHeight = opts.focusHeight ?? 1.4;
    this.camera = new THREE.PerspectiveCamera(opts.fov, aspect, 0.1, 500);
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentTarget);
  }

  get cameraMode(): CameraMode {
    return this.mode;
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  toggleMode(): CameraMode {
    this.mode = this.mode === 'thirdPerson' ? 'firstPerson' : 'thirdPerson';
    return this.mode;
  }

  setFollowDistance(d: number): void {
    this.followDistance = clamp(d, 2, 14);
  }

  setFov(fov: number): void {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /**
   * @param target    player root position (feet)
   * @param rotation  player yaw in radians
   * @param dt        delta seconds
   * @param colliders optional meshes the third-person camera should not clip through
   */
  update(
    target: THREE.Vector3,
    rotation: number,
    dt: number,
    colliders?: THREE.Object3D[],
  ): void {
    const focus = this.desiredTarget.set(target.x, target.y + this.focusHeight, target.z);

    if (this.mode === 'menu') {
      // Cinematic menu vista: behind and to the left of the bench,
      // framing the seated character & cat on the right while leaving
      // the left open for the menu UI, looking toward the village bridge & sunset.
      const time = performance.now() * 0.0003;
      const breatheX = Math.sin(time) * 0.25;
      const breatheY = Math.cos(time * 0.7) * 0.12;

      const menuCamPos = new THREE.Vector3(
        target.x - 2.8 + breatheX,
        target.y + 1.35 + breatheY,
        target.z + 4.2,
      );
      const menuLookTarget = new THREE.Vector3(
        target.x + 3.5,
        target.y + 1.2,
        target.z - 7.0,
      );

      this.currentPos.x = damp(this.currentPos.x, menuCamPos.x, 4, dt);
      this.currentPos.y = damp(this.currentPos.y, menuCamPos.y, 4, dt);
      this.currentPos.z = damp(this.currentPos.z, menuCamPos.z, 4, dt);
      this.currentTarget.x = damp(this.currentTarget.x, menuLookTarget.x, 4, dt);
      this.currentTarget.y = damp(this.currentTarget.y, menuLookTarget.y, 4, dt);
      this.currentTarget.z = damp(this.currentTarget.z, menuLookTarget.z, 4, dt);

      this.camera.position.copy(this.currentPos);
      this.camera.lookAt(this.currentTarget);
      return;
    }

    if (this.mode === 'firstPerson') {
      const eye = this.desiredPos.set(
        target.x,
        target.y + this.focusHeight + 0.4,
        target.z,
      );
      // Look slightly ahead of the player.
      const ahead = new THREE.Vector3(
        target.x - Math.sin(rotation) * 4,
        target.y + this.focusHeight,
        target.z - Math.cos(rotation) * 4,
      );
      this.currentPos.x = damp(this.currentPos.x, eye.x, 18, dt);
      this.currentPos.y = damp(this.currentPos.y, eye.y, 18, dt);
      this.currentPos.z = damp(this.currentPos.z, eye.z, 18, dt);
      this.currentTarget.x = damp(this.currentTarget.x, ahead.x, 18, dt);
      this.currentTarget.y = damp(this.currentTarget.y, ahead.y, 18, dt);
      this.currentTarget.z = damp(this.currentTarget.z, ahead.z, 18, dt);
    } else {
      // Third-person: fixed orientation, elevated, slight downward angle.
      // Camera sits behind the player based on yaw.
      const behind = this.followDistance;
      const height = this.followDistance * 0.55 + 1.5;
      const offset = new THREE.Vector3(
        Math.sin(rotation) * behind,
        height,
        Math.cos(rotation) * behind,
      );
      const idealPos = new THREE.Vector3().copy(focus).add(offset);

      // Camera collision: pull in if something blocks the view.
      if (colliders && colliders.length > 0) {
        const dir = new THREE.Vector3().subVectors(idealPos, focus);
        const dist = dir.length();
        dir.normalize();
        this.raycaster.set(focus, dir);
        this.raycaster.far = dist;
        const hits = this.raycaster.intersectObjects(colliders, true);
        if (hits.length > 0) {
          const allowed = Math.max(1.5, hits[0]!.distance - 0.3);
          idealPos.copy(focus).addScaledVector(dir, allowed);
        }
      }

      this.currentPos.x = damp(this.currentPos.x, idealPos.x, 6, dt);
      this.currentPos.y = damp(this.currentPos.y, idealPos.y, 6, dt);
      this.currentPos.z = damp(this.currentPos.z, idealPos.z, 6, dt);
      this.currentTarget.x = damp(this.currentTarget.x, focus.x, 8, dt);
      this.currentTarget.y = damp(this.currentTarget.y, focus.y, 8, dt);
      this.currentTarget.z = damp(this.currentTarget.z, focus.z, 8, dt);
    }

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentTarget);
  }

  /** Snap immediately (no damping) — used on first frame / teleport. */
  snap(target: THREE.Vector3, rotation: number): void {
    const focus = this.desiredTarget.set(target.x, target.y + this.focusHeight, target.z);
    if (this.mode === 'menu') {
      this.currentPos.set(target.x - 2.8, target.y + 1.35, target.z + 4.2);
      this.currentTarget.set(target.x + 3.5, target.y + 1.2, target.z - 7.0);
    } else if (this.mode === 'firstPerson') {
      this.currentPos.set(target.x, target.y + this.focusHeight + 0.4, target.z);
      this.currentTarget.set(
        target.x - Math.sin(rotation) * 4,
        target.y + this.focusHeight,
        target.z - Math.cos(rotation) * 4,
      );
    } else {
      const behind = this.followDistance;
      const height = this.followDistance * 0.55 + 1.5;
      this.currentPos.set(
        focus.x + Math.sin(rotation) * behind,
        focus.y + height,
        focus.z + Math.cos(rotation) * behind,
      );
      this.currentTarget.copy(focus);
    }
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentTarget);
  }
}