import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createCoinMesh, disposeCoin, addCoinLighting } from "../utils/coin3d";

// A small, self-contained WebGL scene rendering one spinning gold coin.
// Used anywhere in the app that wants the real-3D brand mark instead of a
// flat CSS circle: nav logo, dashboard header, wallet balance, auth pages.
export default function Coin3D({ size = 40, letter = "S", spin = true, tilt = true }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.5, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    addCoinLighting(scene);

    const coin = createCoinMesh({ letter });
    coin.rotation.x = Math.PI / 2.6;
    scene.add(coin);

    let frameId;
    let targetTiltX = 0;
    const onMouseMove = (e) => {
      if (!tilt) return;
      const rect = mount.getBoundingClientRect();
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetTiltX = Math.PI / 2.6 + y * 0.4;
    };
    if (tilt) window.addEventListener("mousemove", onMouseMove);

    const animate = () => {
      if (spin) coin.rotation.y += 0.015;
      coin.rotation.x += (targetTiltX - coin.rotation.x) * 0.05;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      if (tilt) window.removeEventListener("mousemove", onMouseMove);
      disposeCoin(coin);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [size, letter, spin, tilt]);

  return <div ref={mountRef} style={{ width: size, height: size, lineHeight: 0 }} />;
}
