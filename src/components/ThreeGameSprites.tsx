// ==========================================
// ThreeGameSprites.tsx
// Real Three.js 3D GLB Models from Kenney Space Kit
// Replaces 2D SVG Stickers in AeroFit AR Game Overlay
//
// Models used:
// - Rocket3D:       /models/rocket_baseA.glb
// - Spacecraft3D:   /models/craft_speederA.glb
// - PortalGate3D:   /models/gate_simple.glb
// - CrystalTarget3D:/models/rock_crystals.glb
// ==========================================

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Helper to resolve asset URLs with Vite base path (e.g. /aerofit-ar/ on GitHub Pages)
export const getAssetUrl = (relativePath: string): string => {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${cleanBase}${cleanPath}`;
};

// Cache for parsed GLTF scenes to avoid re-parsing
const sceneCache = new Map<string, THREE.Group>();
const loader = new GLTFLoader();

function loadCachedGLTF(url: string): Promise<THREE.Group> {
  const resolvedUrl = getAssetUrl(url);
  if (sceneCache.has(resolvedUrl)) {
    return Promise.resolve(sceneCache.get(resolvedUrl)!.clone(true));
  }
  return new Promise((resolve, reject) => {
    loader.load(
      resolvedUrl,
      (gltf) => {
        sceneCache.set(resolvedUrl, gltf.scene);
        resolve(gltf.scene.clone(true));
      },
      undefined,
      (err) => {
        console.error(`[GLTFLoader] Failed loading from ${resolvedUrl}:`, err);
        reject(err);
      }
    );
  });
}

function disposeHierarchy(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
    }
  });
}

// ==========================================
// 1. Rocket3D (Squat - Player Rocket)
// ==========================================
interface Rocket3DProps {
  chargePercent: number;
  isFlying: boolean;
}

export const Rocket3D: React.FC<Rocket3DProps> = ({ chargePercent, isFlying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ chargePercent, isFlying });
  propsRef.current = { chargePercent, isFlying };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 100;
    const height = 140;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.2, 3.8);

    // PBR Lighting setup
    const ambient = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.0);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x14b8a6, 2.5);
    rimLight.position.set(-2, -2, 2);
    scene.add(rimLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Particle Exhaust
    const particleCount = 45;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 0.15;
      pPos[i * 3 + 1] = -0.6 - Math.random() * 0.5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xfb923c,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const exhaust = new THREE.Points(pGeo, pMat);
    rootGroup.add(exhaust);

    let isDisposed = false;
    let model: THREE.Group | null = null;

    loadCachedGLTF('/models/rocket_baseA.glb')
      .then((gltfScene) => {
        if (isDisposed) {
          disposeHierarchy(gltfScene);
          return;
        }
        model = gltfScene;
        // Auto-center and normalize scale
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.3 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y += 0.1;
        model.rotation.y = Math.PI / 4;
        rootGroup.add(model);
      })
      .catch((err) => {
        console.warn('Failed loading rocket_baseA.glb, creating procedural 3D rocket:', err);
        // Stylized 3D Rocket: Body + Nosecone + Fins
        const rocketMeshGroup = new THREE.Group();
        const bodyGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.7, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0;
        rocketMeshGroup.add(body);

        const noseGeo = new THREE.ConeGeometry(0.22, 0.45, 16);
        const noseMat = new THREE.MeshStandardMaterial({ color: 0x14b8a6, metalness: 0.4, roughness: 0.2 });
        const nose = new THREE.Mesh(noseGeo, noseMat);
        nose.position.y = 0.55;
        rocketMeshGroup.add(nose);

        for (let i = 0; i < 3; i++) {
          const finGeo = new THREE.BoxGeometry(0.08, 0.3, 0.22);
          const finMat = new THREE.MeshStandardMaterial({ color: 0x0f766e });
          const fin = new THREE.Mesh(finGeo, finMat);
          const angle = (i * Math.PI * 2) / 3;
          fin.position.set(Math.cos(angle) * 0.28, -0.25, Math.sin(angle) * 0.28);
          fin.rotation.y = -angle;
          rocketMeshGroup.add(fin);
        }

        rootGroup.add(rocketMeshGroup);
        model = rocketMeshGroup;
      });

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { chargePercent, isFlying } = propsRef.current;
      const isCharging = chargePercent > 15 || isFlying;

      // Exhaust behavior
      exhaust.visible = isCharging;
      if (isCharging) {
        pMat.size = isFlying ? 0.12 : 0.06 + (chargePercent / 100) * 0.06;
        pMat.color.setHex(isFlying ? 0x38bdf8 : chargePercent > 70 ? 0xfacc15 : 0xf97316);
        exhaust.rotation.y += 0.05;
      }

      // Hover / flight animation
      if (model) {
        rootGroup.position.y = Math.sin(t * 3) * 0.04;
        rootGroup.rotation.z = Math.sin(t * 2) * 0.03;
        if (isFlying) {
          rootGroup.rotation.y += 0.06;
        } else {
          rootGroup.rotation.y = Math.PI / 4 + Math.sin(t * 1.5) * 0.08;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      disposeHierarchy(scene);
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center select-none pointer-events-none drop-shadow-[0_10px_20px_rgba(20,184,166,0.35)]">
      <canvas
        ref={canvasRef}
        style={{ width: 100, height: 140 }}
        className="w-20 h-28 sm:w-24 sm:h-32"
      />
    </div>
  );
};

// ==========================================
// 2. Spacecraft3D (Squat - Target UFO / Boss)
// ==========================================
interface Spacecraft3DProps {
  hp: number;
  isExploding: boolean;
  isDemo: boolean;
}

export const Spacecraft3D: React.FC<Spacecraft3DProps> = ({ hp, isExploding, isDemo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ hp, isExploding });
  propsRef.current = { hp, isExploding };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 140;
    const height = 90;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.4, 3.2);

    // PBR Lighting setup
    const ambient = new THREE.AmbientLight(0xffffff, 2.4);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 4.5);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 2.0);
    rimLight.position.set(-3, -1, 1);
    scene.add(rimLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    let isDisposed = false;
    let model: THREE.Group | null = null;

    loadCachedGLTF('/models/craft_speederA.glb')
      .then((gltfScene) => {
        if (isDisposed) {
          disposeHierarchy(gltfScene);
          return;
        }
        model = gltfScene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.5 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.rotation.set(0.3, Math.PI, 0);
        rootGroup.add(model);
      })
      .catch((err) => {
        console.warn('Failed loading craft_speederA.glb:', err);
      });

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { isExploding } = propsRef.current;

      if (rootGroup) {
        if (isExploding) {
          rootGroup.scale.setScalar(1.3 + Math.sin(t * 30) * 0.15);
          rootGroup.rotation.y += 0.12;
          rootGroup.position.x = (Math.random() - 0.5) * 0.08;
          rootGroup.position.y = (Math.random() - 0.5) * 0.08;
        } else {
          rootGroup.scale.setScalar(1.0);
          rootGroup.position.set(0, Math.sin(t * 2.2) * 0.05, 0);
          rootGroup.rotation.y = Math.PI + Math.sin(t * 1.5) * 0.35;
          rootGroup.rotation.z = Math.sin(t * 2.0) * 0.08;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      disposeHierarchy(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative flex flex-col items-center transition-transform duration-300 ${isExploding ? 'scale-125' : ''}`}>
      <canvas
        ref={canvasRef}
        style={{ width: 140, height: 90 }}
        className="w-28 h-18 sm:w-32 sm:h-20 drop-shadow-[0_8px_16px_rgba(56,189,248,0.4)]"
      />
      {!isDemo && (
        <div className="w-24 sm:w-28 h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-white/20 mt-0.5">
          <div
            className="h-full bg-teal-400 transition-all duration-300 ease-out"
            style={{ width: `${hp}%` }}
          />
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. PortalGate3D (Side Lunge - Left/Right Energy Dock)
// ==========================================
interface PortalGate3DProps {
  active: boolean;
  hit: boolean;
  side: 'left' | 'right';
}

export const PortalGate3D: React.FC<PortalGate3DProps> = ({ active, hit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ active, hit });
  propsRef.current = { active, hit };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 100;
    const height = 100;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, 3.2);

    const ambient = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x0ea5e9, 4.0);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    let isDisposed = false;
    let model: THREE.Group | null = null;

    loadCachedGLTF('/models/gate_simple.glb')
      .then((gltfScene) => {
        if (isDisposed) {
          disposeHierarchy(gltfScene);
          return;
        }
        model = gltfScene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.5 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        rootGroup.add(model);
      })
      .catch((err) => {
        console.warn('Failed loading gate_simple.glb, using pipe_ring.glb fallback:', err);
        loadCachedGLTF('/models/pipe_ring.glb').then((ringScene) => {
          if (!isDisposed) {
            model = ringScene;
            model.scale.setScalar(0.7);
            rootGroup.add(model);
          }
        });
      });

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { active, hit } = propsRef.current;

      if (rootGroup) {
        if (hit) {
          rootGroup.rotation.y += 0.08;
          rootGroup.scale.setScalar(1.2 + Math.sin(t * 15) * 0.08);
        } else if (active) {
          rootGroup.rotation.y += 0.035;
          rootGroup.scale.setScalar(1.05 + Math.sin(t * 3) * 0.05);
          rootGroup.position.y = Math.sin(t * 2) * 0.04;
        } else {
          rootGroup.rotation.y += 0.01;
          rootGroup.scale.setScalar(0.9);
          rootGroup.position.y = 0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      disposeHierarchy(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative transition-all duration-300 ${active ? 'scale-110' : 'scale-95 opacity-60'}`}>
      <canvas
        ref={canvasRef}
        style={{ width: 100, height: 100 }}
        className="w-18 h-18 sm:w-22 sm:h-22 drop-shadow-[0_0_20px_rgba(14,165,233,0.5)]"
      />
    </div>
  );
};

// ==========================================
// 4. CrystalTarget3D (Cross Crunch - Crystal Target)
// ==========================================
interface CrystalTarget3DProps {
  isHit: boolean;
  active: boolean;
}

export const CrystalTarget3D: React.FC<CrystalTarget3DProps> = ({ isHit, active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ isHit, active });
  propsRef.current = { isHit, active };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 110;
    const height = 110;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, 3.2);

    const ambient = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x2dd4bf, 4.5);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 2.5);
    rimLight.position.set(-2, -2, 2);
    scene.add(rimLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    let isDisposed = false;
    let model: THREE.Group | null = null;

    // Prefer rock_crystals.glb or meteor_detailed.glb
    loadCachedGLTF('/models/rock_crystals.glb')
      .catch(() => loadCachedGLTF('/models/meteor_detailed.glb'))
      .then((gltfScene) => {
        if (isDisposed) {
          disposeHierarchy(gltfScene);
          return;
        }
        model = gltfScene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.4 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        rootGroup.add(model);
      })
      .catch((err) => {
        console.warn('Failed loading rock_crystals.glb/meteor_detailed.glb:', err);
      });

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { isHit, active } = propsRef.current;

      if (rootGroup) {
        if (isHit) {
          rootGroup.rotation.y += 0.1;
          rootGroup.rotation.x += 0.05;
          rootGroup.scale.setScalar(1.25 + Math.sin(t * 20) * 0.1);
        } else if (active) {
          rootGroup.rotation.y += 0.025;
          rootGroup.rotation.x = Math.sin(t * 1.5) * 0.15;
          rootGroup.position.y = Math.sin(t * 2.5) * 0.06;
          rootGroup.scale.setScalar(1.05 + Math.sin(t * 3) * 0.05);
        } else {
          rootGroup.rotation.y += 0.01;
          rootGroup.position.y = 0;
          rootGroup.scale.setScalar(0.85);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      disposeHierarchy(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative transition-all duration-300 ${active ? 'scale-110 drop-shadow-[0_0_25px_rgba(45,212,191,0.85)]' : 'scale-90 opacity-40'}`}>
      <canvas
        ref={canvasRef}
        style={{ width: 110, height: 110 }}
        className="w-20 h-20 sm:w-24 sm:h-24"
      />
    </div>
  );
};
