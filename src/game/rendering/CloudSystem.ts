import * as THREE from 'three'
import { Rng } from '@/utils/rng'

// Painted cloud billboards that hang above the mountain ridge. Each cloud is a
// single soft-textured plane, so the whole sky costs a handful of draw calls
// while giving the sunset something to sit in — matching the streaky pink
// clouds in the reference menu art.

type CloudKey = { t: number; color: number; opacity: number }

const KEYS: CloudKey[] = [
  { t: 0.0, color: 0x6b769c, opacity: 0.3 },
  { t: 0.22, color: 0xffc9b0, opacity: 0.62 },
  { t: 0.32, color: 0xfff3e4, opacity: 0.78 },
  { t: 0.5, color: 0xfff6ea, opacity: 0.7 },
  { t: 0.68, color: 0xffd2b8, opacity: 0.68 },
  { t: 0.74, color: 0xffb9ae, opacity: 0.78 },
  { t: 0.82, color: 0xb98ba3, opacity: 0.5 },
  { t: 0.9, color: 0x707092, opacity: 0.36 },
  { t: 1.0, color: 0x6b769c, opacity: 0.3 },
]

/** A soft cumulus blob: shaded base first, then bright overlapping crowns. */
function createCloudTexture(seed: number): THREE.CanvasTexture {
  const w = 512
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const rng = new Rng(seed)

  const puff = (cx: number, cy: number, radius: number, color: string) => {
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius)
    grad.addColorStop(0, color)
    grad.addColorStop(0.55, color.replace(/[\d.]+\)$/, '0.5)'))
    grad.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'))
    ctx.fillStyle = grad
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
  }

  // Cool underside.
  for (let i = 0; i < 9; i++) {
    const cx = 90 + rng.next() * (w - 180)
    const cy = 132 + rng.next() * 46
    puff(cx, cy, 34 + rng.next() * 46, 'rgba(150,158,184,0.45)')
  }
  // Sunlit crowns.
  for (let i = 0; i < 13; i++) {
    const cx = 70 + rng.next() * (w - 140)
    const cy = 78 + rng.next() * 56
    puff(cx, cy, 30 + rng.next() * 52, 'rgba(255,252,244,0.86)')
  }
  // A few high wisps for a hand-painted silhouette.
  for (let i = 0; i < 4; i++) {
    const cx = 40 + rng.next() * (w - 80)
    const cy = 46 + rng.next() * 26
    puff(cx, cy, 20 + rng.next() * 26, 'rgba(255,250,244,0.55)')
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

type CloudDef = { x: number; y: number; z: number; w: number; h: number; tex: number }

const CLOUDS: CloudDef[] = [
  { x: -100, y: 70, z: -215, w: 190, h: 62, tex: 0 },
  { x: 55, y: 78, z: -232, w: 225, h: 72, tex: 1 },
  { x: 152, y: 54, z: -150, w: 150, h: 54, tex: 2 },
  { x: -182, y: 62, z: -62, w: 135, h: 52, tex: 1 },
  { x: -18, y: 88, z: -262, w: 255, h: 82, tex: 2 },
  { x: 126, y: 64, z: 84, w: 155, h: 58, tex: 0 },
  { x: -138, y: 70, z: 138, w: 165, h: 60, tex: 2 },
]

export class CloudSystem {
  private readonly group = new THREE.Group()
  private readonly textures: THREE.CanvasTexture[]
  private readonly materials: THREE.MeshBasicMaterial[]
  private readonly meshes: THREE.Mesh[] = []
  private readonly scratch = new THREE.Color()
  private readonly color = new THREE.Color()
  private opacity = 0.8

  constructor(scene: THREE.Scene) {
    this.group.name = 'clouds'
    this.textures = [createCloudTexture(11), createCloudTexture(37), createCloudTexture(73)]
    this.materials = this.textures.map(
      (map) =>
        new THREE.MeshBasicMaterial({
          map,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
          fog: false,
        }),
    )

    for (const def of CLOUDS) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(def.w, def.h), this.materials[def.tex]!)
      mesh.position.set(def.x, def.y, def.z)
      // Faces roughly toward the village centre; at this distance the slight
      // parallax from walking around is invisible.
      mesh.rotation.y = Math.atan2(def.x, def.z) + Math.PI
      mesh.renderOrder = 900
      this.group.add(mesh)
      this.meshes.push(mesh)
    }

    scene.add(this.group)
  }

  /** Tint and fade the clouds to match the time-of-day sky. */
  setTimeOfDay(t: number): void {
    let a = KEYS[0]!
    let b = KEYS[KEYS.length - 1]!
    for (let i = 0; i < KEYS.length - 1; i++) {
      if (t >= KEYS[i]!.t && t <= KEYS[i + 1]!.t) {
        a = KEYS[i]!
        b = KEYS[i + 1]!
        break
      }
    }
    const span = b.t - a.t || 1
    const k = THREE.MathUtils.clamp((t - a.t) / span, 0, 1)
    this.color.copy(this.scratch.setHex(a.color)).lerp(this.scratch.setHex(b.color), k)
    this.opacity = THREE.MathUtils.lerp(a.opacity, b.opacity, k)
    for (const mat of this.materials) {
      mat.color.copy(this.color)
      mat.opacity = this.opacity
    }
    this.group.visible = this.opacity > 0.05
  }

  dispose(): void {
    this.group.removeFromParent()
    for (const mesh of this.meshes) mesh.geometry.dispose()
    for (const mat of this.materials) mat.dispose()
    for (const tex of this.textures) tex.dispose()
    this.group.clear()
  }
}
