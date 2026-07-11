import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createCoinMesh, disposeCoin, addCoinLighting } from "../utils/coin3d";

// The landing page's signature element: a real WebGL scene with one big
// coin at the center and three smaller coins orbiting it, all spinning on
// their own axes. The whole group tilts gently toward the cursor for a bit
// of depth/parallax, which is the part that reads as "3D" rather than a
// flat rendered image.
export default function HeroCoinScene({ height = 420 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = mount.clientWidth;
    let heightPx = height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / heightPx, 0.1, 100);
    camera.position.set(0, 0.4, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    addCoinLighting(scene);

    const group = new THREE.Group();
    scene.add(group);

    const mainCoin = createCoinMesh({ radius: 1.4, thickness: 0.28, letter: "S" });
    mainCoin.rotation.x = Math.PI / 2.4;
    group.add(mainCoin);

    const satellites = [];
    const satelliteConfig = [
      { radius: 0.42, orbitR: 2.6, speed: 0.5, letter: "₹", y: 0.3 },
      { radius: 0.32, orbitR: 3.1, speed: -0.35, letter: "S", y: -0.6 },
      { radius: 0.36, orbitR: 2.3, speed: 0.65, letter: "₹", y: -1.1 },
    ];
    satelliteConfig.forEach((cfg) => {
      const mesh = createCoinMesh({ radius: cfg.radius, thickness: 0.16, letter: cfg.letter });
      mesh.rotation.x = Math.PI / 2.4;
      group.add(mesh);
      satellites.push({ mesh, ...cfg, angle: Math.random() * Math.PI * 2 });
    });

    let targetRotX = 0;
    let targetRotY = 0;
    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 0.5;
      targetRotX = y * 0.25;
    };
    window.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      width = mount.clientWidth;
      camera.aspect = width / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(width, heightPx);
    };
    window.addEventListener("resize", onResize);

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      mainCoin.rotation.y += 0.01;

      satellites.forEach((s) => {
        s.angle += s.speed * 0.01;
        s.mesh.position.set(Math.cos(s.angle) * s.orbitR, s.y + Math.sin(t + s.angle) * 0.15, Math.sin(s.angle) * s.orbitR * 0.5);
        s.mesh.rotation.y += 0.02;
      });

      group.rotation.y += (targetRotY - group.rotation.y) * 0.04;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.04;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      disposeCoin(mainCoin);
      satellites.forEach((s) => disposeCoin(s.mesh));
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [height]);

  return <div ref={mountRef} style={{ width: "100%", height }} />;
}
