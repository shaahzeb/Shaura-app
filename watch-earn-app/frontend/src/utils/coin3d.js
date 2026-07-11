import * as THREE from "three";

// Draws the coin's flat face (front/back) onto a canvas: a gold disc, an
// engraved ring, and a letter in the middle. Used as a texture map on the
// cylinder's top/bottom caps so the coin reads as branded, not generic.
function createCoinFaceTexture(letter = "S") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#d9b34a";
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = "#7a5c14";
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#8a6a1c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(256, 256, 190, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#5b430e";
  ctx.font = "bold 260px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, 256, 288);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// Builds a ready-to-add coin Mesh. Caller owns disposal (see disposeCoin).
export function createCoinMesh({ radius = 1, thickness = 0.22, letter = "S", segments = 64 } = {}) {
  const geometry = new THREE.CylinderGeometry(radius, radius, thickness, segments);
  const faceTexture = createCoinFaceTexture(letter);

  const sideMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfa53e,
    metalness: 1,
    roughness: 0.3,
  });
  const faceMaterial = new THREE.MeshStandardMaterial({
    map: faceTexture,
    metalness: 0.85,
    roughness: 0.25,
  });

  // Cylinder material order: [side, top, bottom]
  const mesh = new THREE.Mesh(geometry, [sideMaterial, faceMaterial, faceMaterial]);
  mesh.userData.disposables = [geometry, sideMaterial, faceMaterial, faceTexture];
  return mesh;
}

export function disposeCoin(mesh) {
  mesh.userData.disposables?.forEach((d) => d.dispose && d.dispose());
}

// Standard three-point-ish lighting rig tuned for a warm gold coin.
export function addCoinLighting(scene) {
  const hemi = new THREE.HemisphereLight(0xfff3d6, 0x1a1200, 0.9);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffe9b0, 1.5);
  key.position.set(3, 4, 5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x8fb2ff, 0.5);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  return [hemi, key, rim];
}
