import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { CharacterRig, CharacterGender } from './CharacterFactory';

/**
 * Adapter that exposes a loaded, skinned GLB as the same lightweight rig the
 * procedural characters use. The bone objects themselves become the
 * head/torso/arm/leg groups, so Player's existing animation code drives the
 * skeleton directly without any proxy objects.
 */
const PATHS: Record<CharacterGender, string> = {
  female: '/glb/Mika-Kimono-Rigged.glb',
  male: '/glb/Traveler-Rigged.glb',
};

const pending = new Map<CharacterGender, Promise<CharacterRig>>();
const resolved = new Map<CharacterGender, CharacterRig>();

function adapt(gender: CharacterGender, gltf: { scene: THREE.Group }): CharacterRig {
  const scene = gltf.scene;
  let foundMesh: THREE.SkinnedMesh | null = null;
  scene.traverse((o) => {
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) foundMesh = o as THREE.SkinnedMesh;
  });
  if (!foundMesh) throw new Error(`${PATHS[gender]}: no SkinnedMesh found`);

  const skinned = foundMesh as THREE.SkinnedMesh;
  const bone = (name: string): THREE.Bone => {
    const b = skinned.skeleton.bones.find((bone) => bone.name === name);
    if (!b) throw new Error(`${PATHS[gender]}: missing bone ${name}`);
    return b;
  };

  // The source models are centred on the origin with their feet near y=-1;
  // raise them so the soles sit at the player's ground plane.
  scene.position.y = 1.0;
  skinned.castShadow = true;
  skinned.receiveShadow = false;
  skinned.frustumCulled = false;

  return {
    root: scene,
    head: bone('head'),
    torso: bone('hips'),
    armL: bone('upperArmL'),
    armR: bone('upperArmR'),
    legL: bone('upperLegL'),
    legR: bone('upperLegR'),
    // The reference artwork is baked into vertex colours, so expressions
    // cannot be swapped at runtime.
    setExpression: () => {},
    faceMaterial: skinned.material as THREE.MeshBasicMaterial,
  };
}

/** Load (and cache) the rigged GLB for a gender. */
export function loadRiggedCharacter(gender: CharacterGender): Promise<CharacterRig> {
  let promise = pending.get(gender);
  if (!promise) {
    promise = new Promise<CharacterRig>((resolve, reject) => {
      new GLTFLoader().load(
        PATHS[gender],
        (gltf) => {
          try {
            const rig = adapt(gender, gltf);
            resolved.set(gender, rig);
            resolve(rig);
          } catch (e) {
            reject(e);
          }
        },
        undefined,
        reject,
      );
    }).catch((e) => {
      // A failed load should not stay cached — allow a later retry.
      pending.delete(gender);
      throw e;
    });
    pending.set(gender, promise);
  }
  return promise;
}

/** An already-resolved rig, if one has finished loading. */
export function peekRiggedCharacter(gender: CharacterGender): CharacterRig | null {
  return resolved.get(gender) ?? null;
}
