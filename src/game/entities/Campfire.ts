import * as THREE from 'three';

// Immersive campfire: animated flame planes (shader-free, layered transparent
// cones with flicker), rising smoke particles (Points), and a warm flickering
// point light. No time limit, no reward (spec §12).

export class Campfire {
  readonly group: THREE.Group;
  readonly light: THREE.PointLight;
  private flames: THREE.Mesh[] = [];
  private smoke: THREE.Points;
  private smokeVelocities: Float32Array;
  private flicker = 0;
  private reducedMotion = false;

  constructor(position: THREE.Vector3) {
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.name = 'campfire';

    // Layered flame cones (additive, warm).
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff7a2a,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffd24a,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 3; i++) {
      const r = 0.35 - i * 0.1;
      const h = 0.9 + i * 0.2;
      const flame = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), i === 2 ? innerMat : flameMat);
      flame.position.y = 0.2 + h / 2;
      this.group.add(flame);
      this.flames.push(flame);
    }

    // Warm point light.
    this.light = new THREE.PointLight(0xff8a3a, 3, 12, 1.5);
    this.light.position.y = 0.8;
    this.group.add(this.light);

    // Smoke: a rising particle column.
    const smokeCount = 40;
    const positions = new Float32Array(smokeCount * 3);
    this.smokeVelocities = new Float32Array(smokeCount);
    for (let i = 0; i < smokeCount; i++) {
      this.resetSmokeParticle(positions, i, true);
    }
    const smokeGeo = new THREE.BufferGeometry();
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const smokeMat = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.3,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    this.smoke = new THREE.Points(smokeGeo, smokeMat);
    this.smoke.position.y = 0.6;
    this.group.add(this.smoke);
  }

  setReducedMotion(v: boolean): void {
    this.reducedMotion = v;
    this.smoke.visible = !v;
  }

  private resetSmokeParticle(arr: Float32Array, i: number, randomY = false): void {
    arr[i * 3] = (Math.random() - 0.5) * 0.3;
    arr[i * 3 + 1] = randomY ? Math.random() * 3 : 0;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    this.smokeVelocities[i] = 0.4 + Math.random() * 0.6;
  }

  update(dt: number, elapsed: number): void {
    if (this.reducedMotion) {
      this.light.intensity = 3;
      return;
    }

    // Flame flicker.
    this.flicker += dt * 10;
    const f = Math.sin(this.flicker) * 0.15 + Math.sin(this.flicker * 2.7) * 0.1;
    this.flames.forEach((flame, i) => {
      flame.scale.y = 1 + f * (1 + i * 0.3);
      flame.rotation.y += dt * (1.5 + i);
      flame.position.y = 0.2 + (flame.geometry as THREE.ConeGeometry).parameters.height / 2 + f * 0.1;
    });
    this.light.intensity = 3 + f * 2;

    // Smoke rise.
    const pos = this.smoke.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < this.smokeVelocities.length; i++) {
      arr[i * 3 + 1]! += this.smokeVelocities[i]! * dt;
      arr[i * 3]! += Math.sin(elapsed + i) * dt * 0.2;
      if (arr[i * 3 + 1]! > 4) {
        this.resetSmokeParticle(arr, i);
      }
    }
    pos.needsUpdate = true;
  }

  dispose(): void {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
      if (o instanceof THREE.Points) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
  }
}