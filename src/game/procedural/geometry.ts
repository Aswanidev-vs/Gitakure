import * as THREE from 'three';

// Low-poly geometry helpers. Everything returns plain BufferGeometry so the
// caller can merge/instance as needed.

/** A tapered cylinder along +Y from y=0 to y=height, base radius r1, top r2. */
export function taperedCylinder(r1: number, r2: number, height: number, seg = 6): THREE.CylinderGeometry {
  const g = new THREE.CylinderGeometry(r2, r1, height, seg, 1);
  g.translate(0, height / 2, 0);
  return g;
}

/** A box from (0,0,0) to (w,h,d). */
export function box(w: number, h: number, d: number): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  return g;
}

/** A low-poly icosphere (subdivisions=0 is a 20-face icosahedron). */
export function icoRock(radius: number, detail = 0): THREE.IcosahedronGeometry {
  return new THREE.IcosahedronGeometry(radius, detail);
}

/** A cone along +Y from y=0 to y=height, base radius r. */
export function cone(r: number, height: number, seg = 6): THREE.ConeGeometry {
  const g = new THREE.ConeGeometry(r, height, seg, 1);
  g.translate(0, height / 2, 0);
  return g;
}

/** A flattened sphere (leaf / frond blob). */
export function blob(r: number, flatten = 0.35, seg = 6): THREE.SphereGeometry {
  const g = new THREE.SphereGeometry(r, seg, Math.max(3, Math.round(seg * 0.6)));
  g.scale(1, flatten, 1);
  return g;
}

/** Apply a matrix to a geometry (rotation + translation) and return it. */
export function transform(
  g: THREE.BufferGeometry,
  opts: { rotY?: number; rotX?: number; rotZ?: number; x?: number; y?: number; z?: number; s?: number },
): THREE.BufferGeometry {
  if (opts.s !== undefined) g.scale(opts.s, opts.s, opts.s);
  if (opts.rotX) g.rotateX(opts.rotX);
  if (opts.rotY) g.rotateY(opts.rotY);
  if (opts.rotZ) g.rotateZ(opts.rotZ);
  if (opts.x || opts.y || opts.z) g.translate(opts.x ?? 0, opts.y ?? 0, opts.z ?? 0);
  return g;
}

/** Build a flat-shaded mesh from a geometry with a material. */
export function mesh(g: THREE.BufferGeometry, m: THREE.Material): THREE.Mesh {
  const out = new THREE.Mesh(g, m);
  out.castShadow = true;
  out.receiveShadow = false;
  return out;
}

/** Build a group of meshes sharing the material lookup pattern. */
export function group(...children: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  for (const c of children) g.add(c);
  return g;
}

/**
 * Merge a list of geometries (each optionally with a per-part color via a
 * material array) into a single geometry with vertex colors. Returns a
 * geometry usable with a single MeshStandardMaterial({ vertexColors: true }).
 */
export function mergeColored(parts: Array<{ geometry: THREE.BufferGeometry; color: THREE.Color }>): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  for (const part of parts) {
    const g = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry;
    const pos = g.attributes.position;
    const nor = g.attributes.normal;
    const c = part.color;
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      if (nor) normals.push(nor.getX(i), nor.getY(i), nor.getZ(i));
      colors.push(c.r, c.g, c.b);
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length === positions.length) out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  out.computeVertexNormals();
  return out;
}

/** Shared vertex-color material (one draw call for many merged parts). */
let vertexColorMat: THREE.MeshStandardMaterial | null = null;
export function vertexColorMaterial(): THREE.MeshStandardMaterial {
  if (!vertexColorMat) {
    vertexColorMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.9,
      metalness: 0,
    });
  }
  return vertexColorMat;
}