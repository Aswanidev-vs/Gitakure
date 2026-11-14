import * as THREE from 'three';
import { MAT } from '@/game/procedural/materials';
import { box, taperedCylinder, blob } from '@/game/procedural/geometry';
import { Rng } from '@/utils/rng';

// Peaceful NPC villager: a low-poly humanoid that wanders within a radius
// and pauses. Not a quest dispenser — ambient countryside life (spec §13).

export interface NPCParams {
  name: string;
  shirtColor: number;
  pantsColor: number;
  wanderRadius: number;
  seed: number;
}

export class NPC {
  readonly group: THREE.Group;
  readonly name: string;
  private home: THREE.Vector3;
  private target: THREE.Vector3;
  private speed = 0.9;
  private waitTimer = 0;
  private walking = false;
  private facing = 0;
  private walkPhase = 0;
  private parts: { armL: THREE.Mesh; armR: THREE.Mesh; legL: THREE.Mesh; legR: THREE.Mesh; torso: THREE.Mesh; head: THREE.Mesh };
  private rng: Rng;

  constructor(params: NPCParams, home: THREE.Vector3) {
    this.name = params.name;
    this.home = home.clone();
    this.target = home.clone();
    this.rng = new Rng(params.seed);
    this.group = new THREE.Group();
    this.group.name = `npc-${params.name}`;

    const shirt = new THREE.MeshStandardMaterial({ color: params.shirtColor, roughness: 0.85, flatShading: true });
    const pants = new THREE.MeshStandardMaterial({ color: params.pantsColor, roughness: 0.9, flatShading: true });
    const skin = MAT.dirt();

    const torso = new THREE.Mesh(box(0.5, 0.65, 0.28), shirt);
    torso.position.y = 1.0;
    torso.castShadow = true;
    this.group.add(torso);

    const head = new THREE.Mesh(blob(0.22, 1, 8), skin);
    head.position.y = 1.55;
    head.castShadow = true;
    this.group.add(head);

    const hair = new THREE.Mesh(blob(0.23, 0.5, 8), MAT.barkDark());
    hair.position.y = 1.66;
    this.group.add(hair);

    const armGeo = taperedCylinder(0.08, 0.07, 0.55, 5);
    const armL = new THREE.Mesh(armGeo, shirt);
    armL.position.set(-0.3, 1.35, 0);
    this.group.add(armL);
    const armR = new THREE.Mesh(armGeo.clone(), shirt);
    armR.position.set(0.3, 1.35, 0);
    this.group.add(armR);

    const legGeo = taperedCylinder(0.1, 0.08, 0.7, 5);
    const legL = new THREE.Mesh(legGeo, pants);
    legL.position.set(-0.14, 0.65, 0);
    this.group.add(legL);
    const legR = new THREE.Mesh(legGeo.clone(), pants);
    legR.position.set(0.14, 0.65, 0);
    this.group.add(legR);

    this.parts = { armL, armR, legL, legR, torso, head };
    this.group.position.copy(home);
  }

  update(dt: number): void {
    if (!this.walking) {
      this.waitTimer -= dt;
      if (this.waitTimer <= 0) {
        // Pick a new wander target within radius of home.
        const a = this.rng.range(0, Math.PI * 2);
        const d = this.rng.range(0, 4);
        this.target.set(this.home.x + Math.cos(a) * d, this.home.y, this.home.z + Math.sin(a) * d);
        this.walking = true;
      }
      this.animateIdle(dt);
      return;
    }

    // Move toward target.
    const dir = new THREE.Vector3().subVectors(this.target, this.group.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist < 0.3) {
      this.walking = false;
      this.waitTimer = this.rng.range(2, 5);
      return;
    }
    dir.normalize();
    this.group.position.addScaledVector(dir, this.speed * dt);
    this.facing = Math.atan2(dir.x, dir.z);
    this.group.rotation.y = this.facing;
    this.animateWalk(dt);
  }

  private animateWalk(dt: number): void {
    this.walkPhase += dt * 6;
    const swing = Math.sin(this.walkPhase) * 0.5;
    this.parts.legL.rotation.x = swing;
    this.parts.legR.rotation.x = -swing;
    this.parts.armL.rotation.x = -swing * 0.6;
    this.parts.armR.rotation.x = swing * 0.6;
  }

  private animateIdle(dt: number): void {
    const breathe = Math.sin(performance.now() * 0.0015) * 0.02;
    this.parts.torso.position.y = 1.0 + breathe;
    this.parts.legL.rotation.x = 0;
    this.parts.legR.rotation.x = 0;
    this.parts.armL.rotation.x = 0;
    this.parts.armR.rotation.x = 0;
    void dt;
  }

  dispose(): void {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry?.dispose();
    });
  }
}