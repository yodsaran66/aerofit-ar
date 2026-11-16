// ==========================================
// ThreeGameSprites.tsx
// High-Quality 3D AR Game Models & Particle VFX from Kenney Space Kit (2.0)
//
// Models used:
// - Rocket3D:        /models/rocket_baseA.glb
// - Spacecraft3D:    /models/craft_speederA.glb
// - PortalGate3D:    /models/gate_simple.glb
// - MeteorTarget3D:  /models/meteor_detailed.glb (also aliased as CrystalTarget3D)
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
// 1. Rocket3D (Squat - Rocket Launch)
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

    const width = 110;
    const height = 150;

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
    renderer.toneMappingExposure = 1.35;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.25, 3.8);

    // Cosmic PBR Lighting
    const ambient = new THREE.AmbientLight(0xe0f2fe, 2.4);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x14b8a6, 2.8);
    rimLight.position.set(-2.5, -2, 2);
    scene.add(rimLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Dynamic 3D Exhaust Flame Particles (Inner hot core + Outer sparks)
    const particleCount = 65;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pVel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 0.16;
      pPos[i * 3 + 1] = -0.55 - Math.random() * 0.5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.16;

      pVel[i * 3] = (Math.random() - 0.5) * 0.04;
      pVel[i * 3 + 1] = -0.06 - Math.random() * 0.08;
      pVel[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xfb923c,
      size: 0.09,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
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
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.35 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y += 0.12;
        model.rotation.y = Math.PI / 4;
        rootGroup.add(model);
      })
      .catch((err) => {
        console.warn('Failed loading rocket_baseA.glb, creating procedural rocket:', err);
        const rocketMeshGroup = new THREE.Group();
        const bodyGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.7, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
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
      const isCharging = chargePercent > 12 || isFlying;

      // Particle update
      exhaust.visible = isCharging;
      if (isCharging) {
        const positions = pGeo.attributes.position.array as Float32Array;
        const speedMult = isFlying ? 2.5 : 1.0 + (chargePercent / 100) * 1.5;

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += pVel[i * 3] * speedMult;
          positions[i * 3 + 1] += pVel[i * 3 + 1] * speedMult;
          positions[i * 3 + 2] += pVel[i * 3 + 2] * speedMult;

          // Reset particle when fallen below boundary
          if (positions[i * 3 + 1] < -1.4) {
            positions[i * 3] = (Math.random() - 0.5) * 0.16;
            positions[i * 3 + 1] = -0.55;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.16;
          }
        }
        pGeo.attributes.position.needsUpdate = true;

        pMat.size = isFlying ? 0.14 : 0.07 + (chargePercent / 100) * 0.07;
        // Flame color ramp: deep orange -> intense gold -> hot cyan/plasma
        if (isFlying) {
          pMat.color.setHex(0x38bdf8);
        } else if (chargePercent > 75) {
          pMat.color.setHex(0xfacc15);
        } else {
          pMat.color.setHex(0xf97316);
        }
      }

      // Tremble / Vibration & Launch Animation
      if (model) {
        if (isFlying) {
          rootGroup.rotation.y += 0.08;
          rootGroup.rotation.z = Math.sin(t * 15) * 0.05;
          rootGroup.position.set(0, Math.sin(t * 10) * 0.04, 0);
        } else if (chargePercent > 25) {
          // Subtle rocket tremble / engine vibration proportional to squat depth
          const shakeIntensity = (chargePercent / 100) * 0.035;
          rootGroup.position.x = Math.sin(t * 50) * shakeIntensity;
          rootGroup.position.y = Math.sin(t * 3) * 0.03 + Math.cos(t * 45) * shakeIntensity;
          rootGroup.rotation.y = Math.PI / 4 + Math.sin(t * 2) * 0.05;
          rootGroup.rotation.z = Math.sin(t * 40) * (shakeIntensity * 0.8);
        } else {
          // Gentle idle hover
          rootGroup.position.set(0, Math.sin(t * 2.5) * 0.03, 0);
          rootGroup.rotation.y = Math.PI / 4 + Math.sin(t * 1.5) * 0.06;
          rootGroup.rotation.z = Math.sin(t * 2) * 0.02;
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
    <div className="relative flex flex-col items-center select-none pointer-events-none drop-shadow-[0_12px_24px_rgba(20,184,166,0.4)]">
      <canvas
        ref={canvasRef}
        style={{ width: 110, height: 150 }}
        className="w-22 h-30 sm:w-26 sm:h-36"
      />
    </div>
  );
};

// ==========================================
// 2. Spacecraft3D (Squat - Target UFO / Spacecraft)
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
    const height = 95;

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
    renderer.toneMappingExposure = 1.35;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.45, 3.2);

    const ambient = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 4.5);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 2.2);
    rimLight.position.set(-3, -1, 1);
    scene.add(rimLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Explosion Spark Burst Particles (triggered upon hit)
    const sparkCount = 40;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(sparkCount * 3);
    const sVel = new Float32Array(sparkCount * 3);

    for (let i = 0; i < sparkCount; i++) {
      sPos[i * 3] = 0;
      sPos[i * 3 + 1] = 0;
      sPos[i * 3 + 2] = 0;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spd = 0.04 + Math.random() * 0.08;
      sVel[i * 3] = Math.sin(phi) * Math.cos(theta) * spd;
      sVel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * spd;
      sVel[i * 3 + 2] = Math.cos(phi) * spd;
    }
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    const sMat = new THREE.PointsMaterial({
      color: 0xfacc15,
      size: 0.08,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sparks = new THREE.Points(sGeo, sMat);
    scene.add(sparks);

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
        const scale = 1.55 / maxDim;
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
    let explosionAge = 999;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { isExploding } = propsRef.current;

      if (isExploding) {
        if (explosionAge > 1.0) {
          // Trigger new explosion cycle
          explosionAge = 0;
          const pos = sGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < sparkCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 0.1;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
          }
          sGeo.attributes.position.needsUpdate = true;
          sMat.opacity = 1.0;
        }
      }

      // Animate explosion sparks
      if (explosionAge < 1.0) {
        explosionAge += 0.035;
        const pos = sGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < sparkCount; i++) {
          pos[i * 3] += sVel[i * 3];
          pos[i * 3 + 1] += sVel[i * 3 + 1];
          pos[i * 3 + 2] += sVel[i * 3 + 2];
        }
        sGeo.attributes.position.needsUpdate = true;
        sMat.opacity = Math.max(0, 1.0 - explosionAge);
      } else {
        sMat.opacity = 0;
      }

      if (rootGroup) {
        if (isExploding) {
          rootGroup.scale.setScalar(1.35 + Math.sin(t * 35) * 0.15);
          rootGroup.rotation.y += 0.15;
          rootGroup.position.x = (Math.random() - 0.5) * 0.09;
          rootGroup.position.y = (Math.random() - 0.5) * 0.09;
        } else {
          rootGroup.scale.setScalar(1.0);
          rootGroup.position.set(0, Math.sin(t * 2.2) * 0.06, 0);
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
      sGeo.dispose();
      sMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative flex flex-col items-center transition-transform duration-300 ${isExploding ? 'scale-125' : ''}`}>
      <canvas
        ref={canvasRef}
        style={{ width: 140, height: 95 }}
        className="w-28 h-19 sm:w-32 sm:h-22 drop-shadow-[0_8px_20px_rgba(56,189,248,0.5)]"
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
// 3. PortalGate3D (Side Lunge - Space Gate)
// ==========================================
interface PortalGate3DProps {
  active: boolean;
  hit: boolean;
  side: 'left' | 'right';
  chargePercent?: number;
}

export const PortalGate3D: React.FC<PortalGate3DProps> = ({ active, hit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ active, hit });
  propsRef.current = { active, hit };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 105;
    const height = 105;

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
    renderer.toneMappingExposure = 1.35;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, 3.2);

    const ambient = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x0ea5e9, 4.5);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Swirling Space Warp Portal Particles
    const portalCount = 35;
    const portalGeo = new THREE.BufferGeometry();
    const portalPos = new Float32Array(portalCount * 3);
    const portalAngles = new Float32Array(portalCount);
    const portalRadii = new Float32Array(portalCount);

    for (let i = 0; i < portalCount; i++) {
      portalAngles[i] = Math.random() * Math.PI * 2;
      portalRadii[i] = 0.2 + Math.random() * 0.45;
      portalPos[i * 3] = Math.cos(portalAngles[i]) * portalRadii[i];
      portalPos[i * 3 + 1] = Math.sin(portalAngles[i]) * portalRadii[i];
      portalPos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    portalGeo.setAttribute('position', new THREE.BufferAttribute(portalPos, 3));
    const portalMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.07,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const portalSparks = new THREE.Points(portalGeo, portalMat);
    rootGroup.add(portalSparks);

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
        const scale = 1.55 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        rootGroup.add(model);
      })
      .catch((err) => {
        console.warn('Failed loading gate_simple.glb, using pipe_ring fallback:', err);
        loadCachedGLTF('/models/pipe_ring.glb').then((ringScene) => {
          if (!isDisposed) {
            model = ringScene;
            model.scale.setScalar(0.75);
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

      // Swirl portal particles
      const pos = portalGeo.attributes.position.array as Float32Array;
      const spinSpeed = hit ? 0.08 : active ? 0.04 : 0.015;
      for (let i = 0; i < portalCount; i++) {
        portalAngles[i] += spinSpeed;
        pos[i * 3] = Math.cos(portalAngles[i]) * portalRadii[i];
        pos[i * 3 + 1] = Math.sin(portalAngles[i]) * portalRadii[i];
      }
      portalGeo.attributes.position.needsUpdate = true;

      if (hit) {
        portalMat.color.setHex(0xfacc15);
        portalMat.size = 0.11;
      } else if (active) {
        portalMat.color.setHex(0x38bdf8);
        portalMat.size = 0.07;
      } else {
        portalMat.color.setHex(0x0284c7);
        portalMat.size = 0.05;
      }

      if (rootGroup) {
        if (hit) {
          rootGroup.rotation.y += 0.09;
          rootGroup.scale.setScalar(1.25 + Math.sin(t * 18) * 0.1);
        } else if (active) {
          rootGroup.rotation.y += 0.04;
          rootGroup.scale.setScalar(1.08 + Math.sin(t * 4) * 0.06);
          rootGroup.position.y = Math.sin(t * 2) * 0.05;
        } else {
          rootGroup.rotation.y += 0.012;
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
      portalGeo.dispose();
      portalMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative transition-all duration-300 ${active ? 'scale-110' : 'scale-95 opacity-60'}`}>
      <canvas
        ref={canvasRef}
        style={{ width: 105, height: 105 }}
        className="w-18 h-18 sm:w-24 sm:h-24 drop-shadow-[0_0_24px_rgba(14,165,233,0.55)]"
      />
    </div>
  );
};

// ==========================================
// 4. MeteorTarget3D (Standing Cross Crunch - Meteor Smash)
// ==========================================
interface MeteorTarget3DProps {
  isHit: boolean;
  active: boolean;
  side?: 'left' | 'right';
  bmiCategory?: string;
}

export const MeteorTarget3D: React.FC<MeteorTarget3DProps> = ({ isHit, active, bmiCategory }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ isHit, active, bmiCategory });
  propsRef.current = { isHit, active, bmiCategory };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 115;
    const height = 115;

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
    renderer.toneMappingExposure = 1.45;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, 3.2);

    const ambient = new THREE.AmbientLight(0xffffff, 2.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x2dd4bf, 4.8);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xf43f5e, 2.5);
    rimLight.position.set(-2, -2, 2);
    scene.add(rimLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 3D Meteor Shatter Debris Particles (Rock fragments bursting on smash)
    const debrisCount = 45;
    const dGeo = new THREE.BufferGeometry();
    const dPos = new Float32Array(debrisCount * 3);
    const dVel = new Float32Array(debrisCount * 3);

    for (let i = 0; i < debrisCount; i++) {
      dPos[i * 3] = 0;
      dPos[i * 3 + 1] = 0;
      dPos[i * 3 + 2] = 0;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spd = 0.05 + Math.random() * 0.09;
      dVel[i * 3] = Math.sin(phi) * Math.cos(theta) * spd;
      dVel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * spd;
      dVel[i * 3 + 2] = Math.cos(phi) * spd;
    }
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    const dMat = new THREE.PointsMaterial({
      color: 0x5eead4,
      size: 0.09,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const debris = new THREE.Points(dGeo, dMat);
    scene.add(debris);

    let isDisposed = false;
    let model: THREE.Group | null = null;

    // Load meteor_detailed.glb with rock_crystals.glb fallback
    loadCachedGLTF('/models/meteor_detailed.glb')
      .catch(() => loadCachedGLTF('/models/rock_crystals.glb'))
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
        const scale = 1.45 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        rootGroup.add(model);
      })
      .catch((err) => {
        console.warn('Failed loading meteor_detailed.glb:', err);
      });

    let rafId = 0;
    const clock = new THREE.Clock();
    let shatterAge = 999;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { isHit, active, bmiCategory } = propsRef.current;

      // BMI Height Offset: Adjust height for optimal knee raise target
      let targetYOffset = 0;
      if (bmiCategory === 'obese') {
        targetYOffset = -0.12; // Comfortable lower target
      } else if (bmiCategory === 'overweight') {
        targetYOffset = -0.04;
      } else {
        targetYOffset = 0.08;  // Athletic high knee target
      }

      // Shatter trigger
      if (isHit) {
        if (shatterAge > 1.0) {
          shatterAge = 0;
          const pos = dGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < debrisCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 0.12;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
          }
          dGeo.attributes.position.needsUpdate = true;
          dMat.opacity = 1.0;
        }
      }

      // Debris expansion
      if (shatterAge < 1.0) {
        shatterAge += 0.04;
        const pos = dGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < debrisCount; i++) {
          pos[i * 3] += dVel[i * 3];
          pos[i * 3 + 1] += dVel[i * 3 + 1];
          pos[i * 3 + 2] += dVel[i * 3 + 2];
        }
        dGeo.attributes.position.needsUpdate = true;
        dMat.opacity = Math.max(0, 1.0 - shatterAge);
      } else {
        dMat.opacity = 0;
      }

      if (rootGroup) {
        if (isHit) {
          rootGroup.rotation.y += 0.12;
          rootGroup.rotation.x += 0.08;
          rootGroup.scale.setScalar(1.35 + Math.sin(t * 25) * 0.15);
        } else if (active) {
          rootGroup.rotation.y += 0.028;
          rootGroup.rotation.x = Math.sin(t * 1.5) * 0.18;
          rootGroup.position.y = targetYOffset + Math.sin(t * 2.5) * 0.07;
          rootGroup.scale.setScalar(1.08 + Math.sin(t * 3.5) * 0.06);
        } else {
          rootGroup.rotation.y += 0.012;
          rootGroup.position.y = targetYOffset;
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
      dGeo.dispose();
      dMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative transition-all duration-300 ${active ? 'scale-110 drop-shadow-[0_0_28px_rgba(45,212,191,0.9)]' : 'scale-90 opacity-45'}`}>
      <canvas
        ref={canvasRef}
        style={{ width: 115, height: 115 }}
        className="w-20 h-20 sm:w-26 sm:h-26"
      />
    </div>
  );
};

// Aliased for seamless backwards compatibility
export const CrystalTarget3D = MeteorTarget3D;
