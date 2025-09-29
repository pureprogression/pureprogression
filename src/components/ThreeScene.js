"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useRef, useEffect, useState } from "react";

function DumbbellSceneContent() {
  const { scene } = useGLTF("/models/dumbbells.glb");
  const ref = useRef();
  const [loaded, setLoaded] = useState(false);

  // фиксированные позиции по X и Y
  const xFixed = 0;
  const yFixed = 0;
  const zStart = -10;
  const zEnd = -2;

  useEffect(() => {
    if (scene) setLoaded(true);
  }, [scene]);

  useFrame(() => {
    if (!ref.current || !loaded) return;

    // Получаем прогресс прокрутки страницы
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    let scrollProgress = scrollTop / docHeight;
    scrollProgress = Math.min(Math.max(scrollProgress, 0), 1);

    // Ограничиваем приближение только на первых 50% скролла
    const zoomProgress = Math.min(scrollProgress * 2, 1);

    // плавное приближение по Z
    ref.current.position.z += (zStart + zoomProgress * (zEnd - zStart) - ref.current.position.z) * 0.1;

    // вращение по Y на основе скролла
    const targetRotY = zoomProgress * Math.PI * 2;
    ref.current.rotation.y += (targetRotY - ref.current.rotation.y) * 0.1;

    // фиксируем X и Y
    ref.current.position.x = xFixed;
    ref.current.position.y = yFixed;
  });

  if (!scene) return null;
  return <primitive ref={ref} object={scene} scale={1.5} />;
}

export default function DumbbellScene() {
  return (
    <div className="relative w-full h-[300vh] bg-black">
      {/* Фиксированный Canvas */}
      <Canvas
        className="fixed top-0 left-0 w-full h-screen"
        camera={{ position: [0, 1.5, 5], fov: 50 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <DumbbellSceneContent />
        </Suspense>
      </Canvas>

      {/* Контент страницы */}
      <div className="relative z-10 pt-[100vh] text-center text-white text-2xl space-y-8">
        <p>Контент после зумирования гантелей</p>
        <p>Ещё контент...</p>
        <p>И ещё...</p>
      </div>
    </div>
  );
}
