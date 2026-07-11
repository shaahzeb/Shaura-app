import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const GAME_DURATION = 10; // seconds
const TARGET_COUNT = 6;

// A real 3D mini-game: gold targets float in a WebGL scene, the player
// clicks them (raycaster hit-testing, not a flat HTML button), hit targets
// respawn elsewhere, and the final hit-count becomes the score submitted
// to /rewards/game/complete - same server-verified-cap pattern as before.
export default function TargetRaycastGame({ onGameEnd }) {
  const mountRef = useRef(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const scoreRef = useRef(0);

  // WebGL scene lifecycle - only runs while a round is in progress
  useEffect(() => {
    if (!running) return;
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffe9b0, 1.3);
    key.position.set(3, 4, 5);
    scene.add(key);

    const geometry = new THREE.IcosahedronGeometry(0.45, 0);
    const targets = [];

    const spawnTarget = () => {
      const material = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.8,
        roughness: 0.3,
        emissive: 0x2a1c00,
        emissiveIntensity: 0.3,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3.4, (Math.random() - 0.5) * 2);
      mesh.userData.floatOffset = Math.random() * Math.PI * 2;
      scene.add(mesh);
      targets.push(mesh);
    };
    for (let i = 0; i < TARGET_COUNT; i++) spawnTarget();

    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);
      const hits = raycaster.intersectObjects(targets);
      if (hits.length > 0) {
        const hit = hits[0].object;
        scene.remove(hit);
        hit.material.dispose();
        const idx = targets.indexOf(hit);
        if (idx > -1) targets.splice(idx, 1);
        spawnTarget();
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      targets.forEach((m) => {
        m.rotation.x += 0.012;
        m.rotation.y += 0.018;
        m.position.y += Math.sin(t * 2 + m.userData.floatOffset) * 0.002;
      });
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener("click", onClick);
      targets.forEach((m) => {
        scene.remove(m);
        m.material.dispose();
      });
      geometry.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [running]);

  // Countdown timer
  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      setRunning(false);
      setFinished(true);
      onGameEnd(scoreRef.current);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [running, timeLeft, onGameEnd]);

  const start = () => {
    scoreRef.current = 0;
    setScore(0);
    setFinished(false);
    setTimeLeft(GAME_DURATION);
    setRunning(true);
  };

  return (
    <div>
      {!running && (
        <button onClick={start}>{finished ? "Play Again" : "Start Game"}</button>
      )}

      {running && (
        <div>
          <p>
            Time left: {timeLeft}s | Score: {score}
          </p>
          <div
            ref={mountRef}
            style={{
              width: "100%",
              height: 360,
              cursor: "crosshair",
              borderRadius: 12,
              overflow: "hidden",
              background: "rgba(255,255,255,0.03)",
            }}
          />
          <p style={{ color: "#9a9ca3", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            Floating targets pe click karo jitni jaldi ho sake!
          </p>
        </div>
      )}
    </div>
  );
}
