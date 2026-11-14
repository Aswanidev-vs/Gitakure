import * as THREE from 'three';

// River/canal water surface with a lightweight custom shader: gentle
// scrolling normal-based ripples, fresnel sky reflection tint, and a
// shallow-to-deep color gradient. No external deps (spec §8, §14, §18).

const vertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vUv = uv;
    vec3 pos = position;
    // Gentle vertical bob to suggest flow.
    pos.y += sin(pos.x * 0.15 + uTime * 0.8) * 0.06
           + sin(pos.z * 0.2 + uTime * 1.1) * 0.05;
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uShallow;
  uniform vec3 uDeep;
  uniform vec3 uSkyColor;
  uniform float uOpacity;

  // Cheap hash-based normal perturbation.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 uv = vWorldPos.xz * 0.15;
    float n1 = noise(uv + vec2(uTime * 0.1, uTime * 0.07));
    float n2 = noise(uv * 1.7 - vec2(uTime * 0.08, uTime * 0.12));
    float ripple = (n1 + n2) * 0.5;

    // Fresnel-ish: more reflective at grazing angles (viewed from distance).
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(viewDir.y, 0.0), 2.0);

    vec3 base = mix(uShallow, uDeep, ripple * 0.6);
    vec3 col = mix(base, uSkyColor, fresnel * 0.5);

    gl_FragColor = vec4(col, uOpacity + fresnel * 0.2);
  }
`;

export class WaterSystem {
  readonly mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor(width: number, length: number, y = -0.6) {
    const geo = new THREE.PlaneGeometry(width, length, 1, 1);
    geo.rotateX(-Math.PI / 2);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uShallow: { value: new THREE.Color(0x6bb6d6) },
        uDeep: { value: new THREE.Color(0x1f4f7a) },
        uSkyColor: { value: new THREE.Color(0x9fc7c9) },
        uOpacity: { value: 0.78 },
      },
    });

    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.position.y = y;
    this.mesh.name = 'water';
  }

  update(elapsed: number): void {
    this.material.uniforms.uTime!.value = elapsed;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}