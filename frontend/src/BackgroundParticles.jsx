import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function BackgroundParticles() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene & camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 8;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // transparent over white body background
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const count = 500;
    const radius = 1.8; // blob radius in world units
    const positions = new Float32Array(count * 3);
    const baseOffsets = new Float32Array(count * 3);

    // Flat-ish blob around origin (disc + tiny z jitter)
    for (let i = 0; i < count; i++) {
      const ix = i * 3;

      // random point in a circle (2D)
      const angle = Math.random() * Math.PI * 2;
      const r = radius * Math.sqrt(Math.random()); // more dense near center
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      const z = (Math.random() - 0.5) * 0.6; // slight depth, but mostly flat

      baseOffsets[ix] = x;
      baseOffsets[ix + 1] = y;
      baseOffsets[ix + 2] = z;

      positions[ix] = x;
      positions[ix + 1] = y;
      positions[ix + 2] = z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.075,          // bigger particles
      color: 0x2563eb,      // blue-ish
      transparent: true,
      opacity: 0.9,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const posAttr = geometry.getAttribute("position");
    const posArray = posAttr.array;

    // Cursor target & current blob center in world space (z ~ 0 plane)
    const targetCenter = new THREE.Vector3(0, 0, 0);
    const center = new THREE.Vector3(0, 0, 0);

    const onMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const xNdc = ((event.clientX - rect.left) / rect.width) * 2 - 1;  // -1..1
      const yNdc = -(((event.clientY - rect.top) / rect.height) * 2 - 1); // -1..1 (flipped)

      // Ray from camera through the cursor into the scene
      const mouseVector = new THREE.Vector3(xNdc, yNdc, 0.5);
      mouseVector.unproject(camera);

      const dir = mouseVector.sub(camera.position).normalize();

      // Intersect with z = 0 plane
      const distance = -camera.position.z / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));

      targetCenter.copy(pos);
    };

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Smooth follow: ease the blob center towards cursor
      center.lerp(targetCenter, 0.12); // lower = slower, higher = snappier

      // Very subtle global bob
      const globalWobbleX = Math.sin(t * 0.6) * 0.15;
      const globalWobbleY = Math.cos(t * 0.5) * 0.12;

      // Update positions relative to blob center with per-particle wobble
      for (let i = 0; i < count; i++) {
        const ix = i * 3;

        const baseX = baseOffsets[ix];
        const baseY = baseOffsets[ix + 1];
        const baseZ = baseOffsets[ix + 2];

        // "Jellyfish" wobble
        const phase = t * 1.1 + i * 0.23;
        const wobbleAmp = 0.09;

        const localX =
          baseX +
          Math.sin(phase) * wobbleAmp +
          Math.cos(phase * 0.7) * wobbleAmp * 0.4;

        const localY =
          baseY +
          Math.cos(phase * 0.9) * wobbleAmp * 0.7 +
          Math.sin(phase * 0.5) * wobbleAmp * 0.4;

        const localZ = baseZ + Math.sin(phase * 0.8) * wobbleAmp * 0.6;

        posArray[ix] = center.x + localX + globalWobbleX;
        posArray[ix + 1] = center.y + localY + globalWobbleY;
        posArray[ix + 2] = center.z + localZ;
      }

      posAttr.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
