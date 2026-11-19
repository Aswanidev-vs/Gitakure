import * as THREE from 'three';

/**
 * Soft radial contact shadow used under characters. The real directional
 * shadow is long and faint at golden hour, so this little blob keeps their
 * feet visually planted on the ground.
 */
export function createContactShadow(size = 1, opacity = 0.5): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
  grad.addColorStop(0, `rgba(32,20,12,${opacity})`);
  grad.addColorStop(0.52, `rgba(32,20,12,${opacity * 0.55})`);
  grad.addColorStop(1, 'rgba(32,20,12,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.015;
  mesh.renderOrder = 1;
  mesh.name = 'contact-shadow';
  return mesh;
}
