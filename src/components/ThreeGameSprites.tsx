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
// 1. AltitudeShip3D (Squat - Body-as-Controller Spacecraft Altitude)
// Uses craft_speederA.glb or craft_racer.glb in full side/3/4 view
// ==========================================
interface AltitudeShip3DProps {
  chargePercent: number;
  isHit: boolean;
}

export const AltitudeShip3D: React.FC<AltitudeShip3DProps> = ({ chargePercent, isHit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ chargePercent, isHit });
  propsRef.current = { chargePercent, isHit };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 150;
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
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 0.3, 3.4);

    const ambient = new THREE.AmbientLight(0xffffff, 2.8);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 4.5);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 2.5);
    rimLight.position.set(-3, -2, 2);
    scene.add(rimLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Jet engine thruster particles
    const particleCount = 40;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pVel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = -0.5 - Math.random() * 0.4;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.12;

      pVel[i * 3] = -0.05 - Math.random() * 0.08;
      pVel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      pVel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const thruster = new THREE.Points(pGeo, pMat);
    rootGroup.add(thruster);

    let isDisposed = false;
    let model: THREE.Group | null = null;

    loadCachedGLTF('/models/craft_speederA.glb')
      .catch(() => loadCachedGLTF('/models/craft_racer.glb'))
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
        const scale = 1.9 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        // Isometric 3/4 angled side profile showing cockpit, fuselage & wings clearly
        model.rotation.set(0.28, -0.75, 0.08);
        rootGroup.add(model);
      })
      .catch((err) => {
        console.warn('Failed loading speeder, creating fallback ship:', err);
      });

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { chargePercent, isHit } = propsRef.current;

      // Thruster animation
      const pos = pGeo.attributes.position.array as Float32Array;
      const thrusterSpeed = isHit ? 2.5 : 1.0 + (chargePercent / 100) * 1.5;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3] += pVel[i * 3] * thrusterSpeed;
        if (pos[i * 3] < -1.4) {
          pos[i * 3] = -0.4;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
        }
      }
      pGeo.attributes.position.needsUpdate = true;
      pMat.color.setHex(isHit ? 0x2dd4bf : chargePercent > 70 ? 0xfacc15 : 0x38bdf8);

      if (rootGroup) {
        if (isHit) {
          rootGroup.scale.setScalar(1.25 + Math.sin(t * 25) * 0.08);
          rootGroup.position.set(0, Math.sin(t * 15) * 0.03, 0);
        } else if (chargePercent > 20) {
          const shake = (chargePercent / 100) * 0.02;
          rootGroup.scale.setScalar(1.05);
          rootGroup.position.set(
            (Math.random() - 0.5) * shake,
            Math.sin(t * 3.5) * 0.03 + (Math.random() - 0.5) * shake,
            0
          );
        } else {
          rootGroup.scale.setScalar(1.0);
          rootGroup.position.set(0, Math.sin(t * 2.2) * 0.03, 0);
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
    <div className={`relative flex flex-col items-center select-none pointer-events-none transition-all duration-300 ${isHit ? 'scale-115 drop-shadow-[0_0_25px_rgba(45,212,191,0.9)]' : 'drop-shadow-[0_8px_20px_rgba(56,189,248,0.5)]'}`}>
      <canvas
        ref={canvasRef}
        style={{ width: 150, height: 110 }}
        className="w-28 h-20 sm:w-34 sm:h-24"
      />
    </div>
  );
};

// Aliases for backward compatibility
export const Rocket3D = AltitudeShip3D;

// ==========================================
// 2. Spacecraft3D (Squat - Target UFO / Spacecraft)
// ==========================================
// ==========================================
// 2. SpaceRing3D (Squat - Target Altitude Gate / Energy Ring)
// ==========================================
interface SpaceRing3DProps {
  hp: number;
  isHit: boolean;
  isDemo: boolean;
}

export const SpaceRing3D: React.FC<SpaceRing3DProps> = ({ isHit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ isHit });
  propsRef.current = { isHit };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 120;
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
    renderer.toneMappingExposure = 1.35;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, 3.0);

    const ambient = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x2dd4bf, 4.0);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Outer Torus Ring
    const torusGeo = new THREE.TorusGeometry(0.7, 0.08, 16, 32);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x14b8a6,
      emissive: 0x0d9488,
      emissiveIntensity: 1.2,
      metalness: 0.8,
      roughness: 0.2,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.rotation.x = 0.3;
    rootGroup.add(torus);

    // Inner glowing ring
    const innerGeo = new THREE.RingGeometry(0.35, 0.55, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x5eead4,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const innerRing = new THREE.Mesh(innerGeo, innerMat);
    innerRing.rotation.x = 0.3;
    rootGroup.add(innerRing);

    let isDisposed = false;
    let model: THREE.Group | null = null;

    loadCachedGLTF('/models/pipe_ring.glb')
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
        model.rotation.set(0.3, 0, 0);
        rootGroup.add(model);
      })
      .catch(() => {});

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { isHit } = propsRef.current;

      torus.rotation.z += isHit ? 0.08 : 0.02;
      innerRing.rotation.z -= isHit ? 0.09 : 0.025;

      if (isHit) {
        torusMat.emissiveIntensity = 4.0;
        torusMat.color.setHex(0xfacc15);
        innerMat.opacity = 0.9;
        rootGroup.scale.setScalar(1.2 + Math.sin(t * 20) * 0.08);
      } else {
        torusMat.emissiveIntensity = 1.2;
        torusMat.color.setHex(0x14b8a6);
        innerMat.opacity = 0.4;
        rootGroup.scale.setScalar(1.0);
        rootGroup.position.y = Math.sin(t * 2.5) * 0.03;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      disposeHierarchy(scene);
      torusGeo.dispose();
      torusMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      <canvas
        ref={canvasRef}
        style={{ width: 120, height: 90 }}
        className="w-24 h-18 sm:w-28 sm:h-22 drop-shadow-[0_0_20px_rgba(45,212,191,0.6)]"
      />
    </div>
  );
};

// Aliased for backward compatibility
export const Spacecraft3D = SpaceRing3D;

// ==========================================
// 3. StepPad3D (Side Lunge - Ground Landing Pad / Energy Dock)
// Real 3D Ground Base with energy charging ring and beacon
// ==========================================
interface StepPad3DProps {
  active: boolean;
  hit: boolean;
  side: 'left' | 'right';
  chargePercent?: number;
}

export const StepPad3D: React.FC<StepPad3DProps> = ({ active, hit, side, chargePercent = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ active, hit, side, chargePercent });
  propsRef.current = { active, hit, side, chargePercent };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 130;
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
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    // Looking slightly down at the ground pad
    camera.position.set(0, 1.2, 2.5);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 2.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 4.5);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Ground platform base ring
    const baseGeo = new THREE.CylinderGeometry(0.7, 0.75, 0.1, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.15;
    rootGroup.add(baseMesh);

    // Glowing energy charging ring on the pad
    const padRingGeo = new THREE.TorusGeometry(0.55, 0.05, 16, 32);
    const padRingMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9,
    });
    const padRing = new THREE.Mesh(padRingGeo, padRingMat);
    padRing.rotation.x = Math.PI / 2;
    padRing.position.y = -0.09;
    rootGroup.add(padRing);

    // Vertical hologram beacon cylinder
    const beaconGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 24, 1, true);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 0.5;
    rootGroup.add(beacon);

    let isDisposed = false;
    let model: THREE.Group | null = null;

    loadCachedGLTF('/models/gate_complex.glb')
      .catch(() => loadCachedGLTF('/models/gate_simple.glb'))
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
        const scale = 1.3 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y += 0.2;
        // Inward 35-45 degree angle facing player center
        model.rotation.y = propsRef.current.side === 'left' ? Math.PI * 0.7 : Math.PI * 0.3;
        rootGroup.add(model);
      })
      .catch((err) => {
        console.warn('Failed loading gate for step pad:', err);
      });

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { active, hit, chargePercent } = propsRef.current;
      const cp = chargePercent || 0;

      // Pulse beacon height and opacity with charge
      if (active) {
        beacon.visible = true;
        const targetOpacity = 0.15 + (cp / 100) * 0.55;
        beaconMat.opacity = hit ? 0.9 : targetOpacity;
        beaconMat.color.setHex(hit ? 0xfacc15 : cp > 80 ? 0x2dd4bf : 0x38bdf8);
        beacon.scale.y = 0.8 + (cp / 100) * 0.8;

        padRingMat.emissiveIntensity = hit ? 5.0 : 1.2 + (cp / 100) * 3.5;
        padRingMat.color.setHex(hit ? 0xffffff : cp > 80 ? 0x2dd4bf : 0x0284c7);
        padRingMat.emissive.setHex(hit ? 0xfacc15 : cp > 80 ? 0x2dd4bf : 0x0ea5e9);
        padRing.rotation.z += 0.02 + (cp / 100) * 0.06;
      } else {
        beacon.visible = false;
        padRingMat.emissiveIntensity = 0.6;
        padRingMat.color.setHex(0x334155);
        padRingMat.emissive.setHex(0x1e293b);
      }

      if (rootGroup) {
        if (hit) {
          rootGroup.scale.setScalar(1.2 + Math.sin(t * 30) * 0.08);
        } else if (active) {
          rootGroup.scale.setScalar(1.05 + Math.sin(t * 3) * 0.03);
        } else {
          rootGroup.scale.setScalar(0.9);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      disposeHierarchy(scene);
      baseGeo.dispose();
      baseMat.dispose();
      padRingGeo.dispose();
      padRingMat.dispose();
      beaconGeo.dispose();
      beaconMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative flex flex-col items-center select-none transition-all duration-300 ${active ? 'scale-110 drop-shadow-[0_0_30px_rgba(14,165,233,0.8)]' : 'scale-90 opacity-50'}`}>
      <canvas
        ref={canvasRef}
        style={{ width: 130, height: 110 }}
        className="w-28 h-22 sm:w-34 sm:h-28"
      />
    </div>
  );
};

// Aliased for backward compatibility
export const PortalGate3D = StepPad3D;

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
    const burstRef = { age: 0, wasHit: false };

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
          // Burst & Shatter fly-out: rise upward and expand fast
          if (!burstRef.wasHit) {
            burstRef.age = 0;
            burstRef.wasHit = true;
          }
          burstRef.age = Math.min(burstRef.age + 0.05, 1.0);
          const bf = burstRef.age;
          rootGroup.position.y = targetYOffset + bf * 2.2;
          rootGroup.scale.setScalar(1.2 + bf * 2.2);
          rootGroup.rotation.y += 0.22;
          rootGroup.rotation.x += 0.15;
          rootGroup.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mat = (child as THREE.Mesh).material;
              if (mat && !Array.isArray(mat)) {
                mat.transparent = true;
                mat.opacity = Math.max(0, 1.0 - bf * 1.3);
              }
            }
          });
        } else {
          // Reset when not hit
          if (burstRef.wasHit) {
            burstRef.wasHit = false;
            burstRef.age = 0;
            rootGroup.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mat = (child as THREE.Mesh).material;
                if (mat && !Array.isArray(mat)) {
                  mat.opacity = 1.0;
                }
              }
            });
          }
          if (active) {
            rootGroup.rotation.y += 0.035;
            rootGroup.rotation.x = Math.sin(t * 1.5) * 0.18;
            rootGroup.position.y = targetYOffset + Math.sin(t * 2.5) * 0.07;
            rootGroup.scale.setScalar(1.2 + Math.sin(t * 3.5) * 0.07);
          } else {
            rootGroup.rotation.y += 0.015;
            rootGroup.position.y = targetYOffset;
            rootGroup.scale.setScalar(0.95);
          }
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
