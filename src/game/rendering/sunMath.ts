import * as THREE from 'three'

/** Shared sun direction so the sky disc and the directional light agree. */
export function sunDirection(t: number, out = new THREE.Vector3()): THREE.Vector3 {
  const daylight = Math.sin(((t - 0.25) / 0.5) * Math.PI)
  // Keep the sun a little higher through the late afternoon so golden hour
  // still lights the village instead of instantly becoming a backlit silhouette.
  const raw = daylight > 0 ? Math.pow(daylight, 0.55) * 0.8 : daylight * 0.85
  const elevation = Math.max(-0.08, raw)
  const evening = t >= 0.5
  return out.set(evening ? 0.38 : -0.38, elevation, evening ? -0.925 : 0.925).normalize()
}
