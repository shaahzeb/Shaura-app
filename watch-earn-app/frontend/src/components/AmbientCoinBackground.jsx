import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createCoinMesh, disposeCoin, addCoinLighting } from "../utils/coin3d";

// Mounted once at the app root (see App.jsx) so every route sits on top of
// the same drifting-coins scene instead of each page paying for its own
// full-screen WebGL context. Fixed, pointer-events none, sits behind the
// routed content via z-index.
export default function AmbientCoinBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x0b0d10, 1);
    mount.appendChild(renderer.domElement);

    addCoinLighting(scene);

    const coins = [];
    const COIN_COUNT = 14;
    for (let i = 0; i < COIN_COUNT; i++) {
      const radius = 0.25 + Math.random() * 0.35;
      const mesh = createCoinMesh({ radius, thickness: 0.12, letter: Math.random() > 0.5 ? "S" : "₹" });
      mesh.material.forEach((m) => {
        m.transparent = true;
        m.opacity = 0.5;
      });
      mesh.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 8 - 3);
      mesh.rotation.set(Math.PI / 2.4, Math.random() * Math.PI, 0);
      scene.add(mesh);
      coins.push({
        mesh,
        spin: (Math.random() - 0.5) * 0.006,
        floatSpeed: 0.2 + Math.random() * 0.3,
        floatOffset: Math.random() * Math.PI * 2,
        baseY: mesh.position.y,
      });
    }

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      coins.forEach((c) => {
        c.mesh.rotation.y += c.spin;
        c.mesh.position.y = c.baseY + Math.sin(t * c.floatSpeed + c.floatOffset) * 0.4;
      });
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      coins.forEach((c) => disposeCoin(c.mesh));
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
