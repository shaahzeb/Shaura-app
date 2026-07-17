import * as THREE from "three";

// Two coin identities used throughout the app: S Coin (gold, primary
// currency) and B Coin (blue neon, bonus currency). Any other letter
// falls back to the gold theme.
const THEMES = {
  S: { face: "#d9b34a", ring: "#7a5c14", ringInner: "#8a6a1c", letter: "#5b430e", side: 0xcfa53e, glow: 0xffce4a },
  B: { face: "#173a56", ring: "#2a6f9e", ringInner: "#5fd0ff", letter: "#9fecff", side: 0x1c6fa8, glow: 0x3fd0ff },
};

// Draws the coin's flat face (front/back) onto a canvas: a disc, an
// engraved ring, and a letter in the middle. Used as a texture map on the
// cylinder's top/bottom caps so the coin reads as branded, not generic.
function createCoinFaceTexture(letter = "S") {
  const theme = THEMES[letter] || THEMES.S;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = theme.face;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = theme.ring;
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = theme.ringInner;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(256, 256, 190, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = theme.letter;
  ctx.font = "bold 260px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, 256, 288);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// Soft radial-gradient sprite, additive-blended, placed behind the coin so
// it reads as "glowing neon coin on black" without a full bloom
// postprocessing pipeline.
function createGlowTexture(hexColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const c = new THREE.Color(hexColor);
  const rgb = `${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}`;

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, `rgba(${rgb}, 0.5)`);
  gradient.addColorStop(0.4, `rgba(${rgb}, 0.22)`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}

// Builds a ready-to-add coin Group (coin mesh + glow halo sprite behind
// it). Caller owns disposal (see disposeCoin). Returning a Group (not a
// bare Mesh) keeps the glow perfectly attached without extra bookkeeping
// in callers - they can still just set .rotation / .position as before.
export function createCoinMesh({ radius = 1, thickness = 0.22, letter = "S", segments = 64 } = {}) {
  const theme = THEMES[letter] || THEMES.S;
  const geometry = new THREE.CylinderGeometry(radius, radius, thickness, segments);
  const faceTexture = createCoinFaceTexture(letter);

  const sideMaterial = new THREE.MeshStandardMaterial({
    color: theme.side,
    metalness: 1,
    roughness: 0.3,
    emissive: theme.side,
    emissiveIntensity: 0.12,
  });
  const faceMaterial = new THREE.MeshStandardMaterial({
    map: faceTexture,
    metalness: 0.85,
    roughness: 0.25,
    emissive: theme.side,
    emissiveIntensity: 0.1,
  });

  // Cylinder material order: [side, top, bottom]
  const coinMesh = new THREE.Mesh(geometry, [sideMaterial, faceMaterial, faceMaterial]);

  const glowTexture = createGlowTexture(theme.glow);
  const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Sprite(glowMaterial);
  glow.scale.set(radius * 4.5, radius * 4.5, 1);

  const group = new THREE.Group();
  group.add(glow);
  group.add(coinMesh);
  group.userData.disposables = [geometry, sideMaterial, faceMaterial, faceTexture, glowMaterial, glowTexture];
  return group;
}

export function disposeCoin(group) {
  group.userData.disposables?.forEach((d) => d.dispose && d.dispose());
}

// Standard three-point-ish lighting rig tuned for a warm gold coin (the
// coins also carry their own emissive glow, so this just needs to be
// enough to read the metal without washing out the halo).
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
