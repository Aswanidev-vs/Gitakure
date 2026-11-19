import * as THREE from 'three'
import { sunDirection } from './sunMath'

type SkyKey = {
  t: number
  top: number
  mid: number
  horizon: number
  bottom: number
  sun: number
  strength: number
}

// Warm storybook day, hand-tuned to the reference sunset palette.
const KEYS: SkyKey[] = [
  { t: 0.00, top: 0x101a33, mid: 0x1d2b4d, horizon: 0x35415f, bottom: 0x2a3148, sun: 0x9fb4d8, strength: 0 },
  { t: 0.22, top: 0x3f5a86, mid: 0x8e7b9a, horizon: 0xe6a07a, bottom: 0xb98a76, sun: 0xffc98a, strength: 0.55 },
  { t: 0.30, top: 0x6fa0c4, mid: 0xa8c6cf, horizon: 0xe8d9b8, bottom: 0xb9c9ae, sun: 0xffe6b0, strength: 0.85 },
  { t: 0.50, top: 0x5d96c2, mid: 0xa3c6d6, horizon: 0xdbe5da, bottom: 0xa8c0a0, sun: 0xfff3d0, strength: 1 },
  { t: 0.68, top: 0x44749f, mid: 0xbd8098, horizon: 0xf7b26e, bottom: 0xc47a4e, sun: 0xffdca0, strength: 0.95 },
  { t: 0.74, top: 0x304b86, mid: 0xc06286, horizon: 0xff8a34, bottom: 0xc76036, sun: 0xffc978, strength: 1.1 },
  { t: 0.80, top: 0x394a86, mid: 0xa2577d, horizon: 0xe8734a, bottom: 0x9c5242, sun: 0xffa05c, strength: 0.9 },
  { t: 0.86, top: 0x27335c, mid: 0x5f4a70, horizon: 0x8d5f6a, bottom: 0x55435a, sun: 0xd78a78, strength: 0.35 },
  { t: 1.00, top: 0x101a33, mid: 0x1d2b4d, horizon: 0x35415f, bottom: 0x2a3148, sun: 0x9fb4d8, strength: 0 },
]

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uBottom;
  uniform vec3 uSunColor;
  uniform vec3 uSunDirection;
  uniform float uSunStrength;
  varying vec3 vDirection;

  void main() {
    vec3 dir = normalize(vDirection);
    float h = dir.y;

    vec3 sky = mix(uHorizon, uTop, smoothstep(0.0, 0.6, h));
    sky = mix(sky, uMid, (1.0 - smoothstep(0.0, 0.42, abs(h - 0.16))) * 0.35);
    sky = mix(uBottom, sky, smoothstep(-0.3, 0.02, h));

    // Warm bloom smeared along the horizon toward the sun.
    vec2 flatDir = normalize(vec2(dir.x, dir.z) + vec2(0.0001));
    vec2 flatSun = normalize(vec2(uSunDirection.x, uSunDirection.z));
    float alignment = max(dot(flatDir, flatSun), 0.0);
    float band = 1.0 - smoothstep(0.0, 0.3, abs(h - 0.015));
    sky += uSunColor * pow(alignment, 7.0) * band * 0.32 * uSunStrength;

    // Sun disc and a soft halo.
    float d = distance(dir, normalize(uSunDirection));
    float disc = 1.0 - smoothstep(0.048, 0.058, d);
    float halo = (1.0 - smoothstep(0.05, 0.3, d)) * 0.3;
    sky += uSunColor * (disc * 1.1 + halo) * uSunStrength;

    gl_FragColor = vec4(sky, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

// Scratch objects reused on every update — no per-frame allocation.
const scratch = {
  top: new THREE.Color(),
  mid: new THREE.Color(),
  horizon: new THREE.Color(),
  bottom: new THREE.Color(),
  sun: new THREE.Color(),
}

/** Soft radial fuzz so the sun reads as glowing light, not a flat sticker. */
function createSunTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62)
  grad.addColorStop(0, 'rgba(255,250,236,1)')
  grad.addColorStop(0.14, 'rgba(255,232,186,0.95)')
  grad.addColorStop(0.34, 'rgba(255,200,132,0.46)')
  grad.addColorStop(0.68, 'rgba(255,176,104,0.12)')
  grad.addColorStop(1, 'rgba(255,168,96,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export class SkySystem {
  private readonly scene: THREE.Scene
  private readonly mesh: THREE.Mesh
  private readonly material: THREE.ShaderMaterial
  private readonly sunDisc: THREE.Mesh
  private readonly sunHalo: THREE.Mesh
  private readonly fog: THREE.FogExp2 | null
  private readonly camera: THREE.Camera
  private readonly top = new THREE.Color()
  private readonly mid = new THREE.Color()
  private readonly horizon = new THREE.Color()
  private readonly bottom = new THREE.Color()
  private readonly sun = new THREE.Color()
  private readonly sunDir = new THREE.Vector3()

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene
    this.camera = camera
    this.fog = scene.fog instanceof THREE.FogExp2 ? scene.fog : null

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: this.top },
        uMid: { value: this.mid },
        uHorizon: { value: this.horizon },
        uBottom: { value: this.bottom },
        uSunColor: { value: this.sun },
        uSunDirection: { value: this.sunDir },
        uSunStrength: { value: 1 },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })

    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(450, 32, 20), this.material)
    this.mesh.name = 'storybook-sky'
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = -1000
    scene.add(this.mesh)

    // The mountain backdrop would otherwise hide a low sun. These billboards
    // draw above it so the golden-hour disc stays visible on the horizon.
    const sunTex = createSunTexture()
    this.sunHalo = new THREE.Mesh(
      new THREE.PlaneGeometry(46, 46),
      new THREE.MeshBasicMaterial({
        map: sunTex,
        color: 0xffa860,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        fog: false,
      }),
    )
    this.sunHalo.renderOrder = 997
    scene.add(this.sunHalo)

    this.sunDisc = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 15),
      new THREE.MeshBasicMaterial({
        map: sunTex,
        color: 0xffe3ad,
        transparent: true,
        opacity: 0.96,
        depthTest: false,
        depthWrite: false,
        fog: false,
      }),
    )
    this.sunDisc.renderOrder = 998
    scene.add(this.sunDisc)
  }

  /** Update gradient, sun and fog for a time-of-day fraction (0..1). */
  setTimeOfDay(t: number): void {
    let a = KEYS[0]
    let b = KEYS[KEYS.length - 1]
    for (let i = 0; i < KEYS.length - 1; i++) {
      if (t >= KEYS[i].t && t <= KEYS[i + 1].t) {
        a = KEYS[i]
        b = KEYS[i + 1]
        break
      }
    }
    const span = b.t - a.t || 1
    const k = THREE.MathUtils.clamp((t - a.t) / span, 0, 1)

    this.top.copy(scratch.top.setHex(a.top)).lerp(scratch.top.setHex(b.top), k)
    this.mid.copy(scratch.mid.setHex(a.mid)).lerp(scratch.mid.setHex(b.mid), k)
    this.horizon.copy(scratch.horizon.setHex(a.horizon)).lerp(scratch.horizon.setHex(b.horizon), k)
    this.bottom.copy(scratch.bottom.setHex(a.bottom)).lerp(scratch.bottom.setHex(b.bottom), k)
    this.sun.copy(scratch.sun.setHex(a.sun)).lerp(scratch.sun.setHex(b.sun), k)
    this.material.uniforms.uSunStrength.value = THREE.MathUtils.lerp(a.strength, b.strength, k)

    sunDirection(t, this.sunDir)
    ;(this.sunDisc.material as THREE.MeshBasicMaterial).color.copy(this.sun)
    ;(this.sunHalo.material as THREE.MeshBasicMaterial).color.copy(this.sun)
    ;(this.sunHalo.material as THREE.MeshBasicMaterial).opacity = 0.22 * this.material.uniforms.uSunStrength.value
    this.sunDisc.visible = this.sunHalo.visible = this.material.uniforms.uSunStrength.value > 0.1
    if (this.fog) this.fog.color.copy(this.horizon).lerp(this.mid, 0.18)
    if (this.scene.background instanceof THREE.Color) this.scene.background.copy(this.horizon)
  }

  /** Keep the dome centred on the viewer so the horizon never parallaxes. */
  update(): void {
    this.mesh.position.copy(this.camera.position)
    if (!this.sunDisc.visible) return
    const distance = 300
    const x = this.camera.position.x + this.sunDir.x * distance
    const y = this.camera.position.y + this.sunDir.y * distance
    const z = this.camera.position.z + this.sunDir.z * distance
    this.sunDisc.position.set(x, y, z)
    this.sunHalo.position.set(x, y, z)
    this.sunDisc.lookAt(this.camera.position)
    this.sunHalo.lookAt(this.camera.position)
  }

  dispose(): void {
    this.mesh.removeFromParent()
    this.mesh.geometry.dispose()
    this.material.dispose()
    this.sunDisc.removeFromParent()
    this.sunDisc.geometry.dispose()
    const discMat = this.sunDisc.material as THREE.MeshBasicMaterial
    discMat.map?.dispose()
    discMat.dispose()
    this.sunHalo.removeFromParent()
    this.sunHalo.geometry.dispose()
    ;(this.sunHalo.material as THREE.Material).dispose()
  }
}
