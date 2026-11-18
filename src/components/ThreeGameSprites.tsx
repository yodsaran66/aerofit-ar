// ==========================================
// ThreeGameSprites.tsx
// 3-Zone Spatial Layout: Center Player Zone (±0.6), Action Zones (±1.75), HUD Zone (top)
//
// Exercise 3D Components:
// 1. Squat (Rocket Strike) — Right Vertical Lane at X=1.85
//    - Mothership target (Y=1.35) + Player rocket (Y=-0.85) aligned on single vertical axis
//    - Exhaust flame pinned as child of rocketGroup at (0, -0.45, 0)
//    - Targeting laser dashed line centered at X=0 relative to rocket/mothership axis
//    - Full-viewport overlay canvas; camera frustum auto-computes safe X
// 2. Side Lunge (Side Pad Reflector) — Symmetrical Left/Right at X=±1.75
//    - Ground pads (Y=-1.0) + Top turrets (Y=1.25) in mirror symmetry
//    - Energy beam + charging ring follow active side
// 3. Standing Cross Crunch (Knee Meteor Smash) — Knee-Level Targets at X=±1.25
//    - Meteor at BMI-adjusted knee height + reticle tracking real-time knee Y
//    - Shatter debris particles on hit
//
// Shared:
// - PerspectiveCamera (fov: 45) with ResizeObserver for responsive frustum
// - computeSafeX() clamps objects to visible frustum edges with configurable margin
// - AmbientLight (0.85) + DirectionalLight (1.3) + Rim lighting
// - Procedural geometry fallbacks if GLB load fails
// - Complete disposal on unmount
// ==========================================

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const getAssetUrl = (relativePath: string): string => {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${cleanBase}${cleanPath}`;
};

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
      (err) => reject(err)
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

// ---- Responsive Frustum Utility ----
// Compute visible half-width at a given depth from a PerspectiveCamera.
// Use to position objects at screen edges regardless of aspect ratio.
function visibleHalfWidth(camera: THREE.PerspectiveCamera, depth: number): number {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const halfH = Math.tan(vFov / 2) * depth;
  return halfH * camera.aspect;
}

// Return a clamped X coordinate that stays within visible frustum with a margin.
// `fractionFromEdge`: 0 = dead center, 1 = at the very edge.
// `margin`: world-unit inset from frustum boundary.
function computeSafeX(
  camera: THREE.PerspectiveCamera,
  depth: number,
  fractionFromEdge: number,
  margin: number = 0.15
): number {
  const halfW = visibleHalfWidth(camera, depth);
  const maxX = halfW - margin;
  return Math.min(maxX, maxX * fractionFromEdge);
}

// =========================================================================
// 1. SQUAT — "ยิงจรวดทำลายยานแม่" (Rocket Strike)
// Right Vertical Lane — Mothership (Y=1.35) + Rocket (Y=-0.85) at responsive X
// =========================================================================
interface SquatRocketStrike3DProps {
  chargePercent: number; // 0 - 100
  isLaunched: boolean;
  isHit: boolean;
}

export const SquatRocketStrike3D: React.FC<SquatRocketStrike3DProps> = ({
  chargePercent,
  isLaunched,
  isHit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ chargePercent, isLaunched, isHit });
  propsRef.current = { chargePercent, isLaunched, isHit };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = container.clientWidth || 360;
    let height = container.clientHeight || 640;

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
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0.25, 5.0);

    // Standard Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(3, 5, 5);
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-2, -3, 2);
    scene.add(rimLight);

    // Compute safe right-lane X from frustum (≈78-82% from center, ≥0.6 clear zone)
    const cameraDepth = camera.position.z;
    let laneX = computeSafeX(camera, cameraDepth, 0.82, 0.2);
    laneX = Math.max(laneX, 1.4); // Floor: never closer than 1.4

    // Groups positioned on the right vertical lane
    const mothershipGroup = new THREE.Group();
    mothershipGroup.position.set(laneX, 1.35, 0);
    scene.add(mothershipGroup);

    const rocketGroup = new THREE.Group();
    rocketGroup.position.set(laneX, -0.85, 0);
    scene.add(rocketGroup);

    // Exhaust flame cone pinned as direct child of rocketGroup at (0, -0.45, 0)
    const flameGeo = new THREE.ConeGeometry(0.12, 0.45, 16);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.85,
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.rotation.x = Math.PI;
    flameMesh.position.set(0, -0.45, 0);
    rocketGroup.add(flameMesh);

    // Targeting Laser Line centered at X=0 relative to rocketGroup, extending up to mothership
    const laserTravelDist = 2.2; // from -0.85 to 1.35
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.25, 0),
      new THREE.Vector3(0, laserTravelDist, 0),
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xef4444,
      dashSize: 0.1,
      gapSize: 0.08,
      linewidth: 2,
    });
    const laserLine = new THREE.Line(lineGeo, lineMat);
    laserLine.computeLineDistances();
    rocketGroup.add(laserLine);

    // Explosion Particle Burst at mothership location
    const burstCount = 45;
    const burstGeo = new THREE.BufferGeometry();
    const burstPos = new Float32Array(burstCount * 3);
    const burstVel = new Float32Array(burstCount * 3);
    for (let i = 0; i < burstCount; i++) {
      burstPos[i * 3] = 0;
      burstPos[i * 3 + 1] = 0;
      burstPos[i * 3 + 2] = 0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spd = 0.06 + Math.random() * 0.12;
      burstVel[i * 3] = Math.sin(phi) * Math.cos(theta) * spd;
      burstVel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * spd;
      burstVel[i * 3 + 2] = Math.cos(phi) * spd;
    }
    burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
    const burstMat = new THREE.PointsMaterial({
      color: 0xfacc15,
      size: 0.12,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const burstPoints = new THREE.Points(burstGeo, burstMat);
    burstPoints.position.set(laneX, 1.35, 0);
    scene.add(burstPoints);

    let isDisposed = false;
    let mothershipModel: THREE.Group | null = null;
    let rocketModel: THREE.Group | null = null;

    // Load Mothership
    loadCachedGLTF('/models/craft_speederA.glb')
      .catch(() => loadCachedGLTF('/models/craft_racer.glb'))
      .then((gltfScene) => {
        if (isDisposed) { disposeHierarchy(gltfScene); return; }
        mothershipModel = gltfScene;
        const box = new THREE.Box3().setFromObject(mothershipModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 0.85 / maxDim;
        mothershipModel.scale.setScalar(scale);
        mothershipModel.position.sub(center.multiplyScalar(scale));
        mothershipModel.rotation.set(0.35, -0.45, 0);
        mothershipGroup.add(mothershipModel);
      })
      .catch(() => {
        const fGroup = new THREE.Group();
        const diskGeo = new THREE.CylinderGeometry(0.45, 0.5, 0.14, 24);
        const diskMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.3 });
        const domeGeo = new THREE.SphereGeometry(0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 });
        const disk = new THREE.Mesh(diskGeo, diskMat);
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.y = 0.07;
        fGroup.add(disk);
        fGroup.add(dome);
        fGroup.rotation.set(0.35, -0.45, 0);
        mothershipGroup.add(fGroup);
        mothershipModel = fGroup;
      });

    // Load Rocket
    loadCachedGLTF('/models/rocket_baseA.glb')
      .then((gltfScene) => {
        if (isDisposed) { disposeHierarchy(gltfScene); return; }
        rocketModel = gltfScene;
        const box = new THREE.Box3().setFromObject(rocketModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 0.72 / maxDim;
        rocketModel.scale.setScalar(scale);
        rocketModel.position.sub(center.multiplyScalar(scale));
        rocketModel.rotation.set(0.3, -0.4, 0);
        rocketGroup.add(rocketModel);
      })
      .catch(() => {
        const rGroup = new THREE.Group();
        const bodyGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.55, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const noseGeo = new THREE.ConeGeometry(0.14, 0.3, 16);
        const noseMat = new THREE.MeshStandardMaterial({ color: 0x14b8a6 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        const nose = new THREE.Mesh(noseGeo, noseMat);
        nose.position.y = 0.42;
        rGroup.add(body);
        rGroup.add(nose);
        rGroup.rotation.set(0.3, -0.4, 0);
        rocketGroup.add(rGroup);
        rocketModel = rGroup;
      });

    // ResizeObserver — recalc frustum + lane X on resize
    const updateLayout = (w: number, h: number) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      // Recompute safe lane X for new aspect
      laneX = computeSafeX(camera, cameraDepth, 0.82, 0.2);
      laneX = Math.max(laneX, 1.4);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) updateLayout(w, h);
      }
    });
    resizeObserver.observe(container);

    let rafId = 0;
    const clock = new THREE.Clock();
    let launchProgress = 0;
    let burstAge = 999;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { chargePercent, isLaunched, isHit } = propsRef.current;
      const isCharging = chargePercent > 15;

      // Always keep mothership + burst at current responsive laneX
      burstPoints.position.x = laneX;

      // 1. Mothership: gentle hover, shake on hit
      if (isHit) {
        mothershipGroup.position.set(
          laneX + (Math.random() - 0.5) * 0.08,
          1.35 + (Math.random() - 0.5) * 0.08,
          0
        );
        if (burstAge > 1.0) {
          burstAge = 0;
          const pos = burstGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < burstCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 0.1;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
          }
          burstGeo.attributes.position.needsUpdate = true;
          burstMat.opacity = 1.0;
        }
      } else {
        mothershipGroup.position.set(laneX, 1.35 + Math.sin(t * 2.0) * 0.035, 0);
      }

      // Animate Explosion Particles
      if (burstAge < 1.0) {
        burstAge += 0.04;
        const pos = burstGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < burstCount; i++) {
          pos[i * 3] += burstVel[i * 3];
          pos[i * 3 + 1] += burstVel[i * 3 + 1];
          pos[i * 3 + 2] += burstVel[i * 3 + 2];
        }
        burstGeo.attributes.position.needsUpdate = true;
        burstMat.opacity = Math.max(0, 1.0 - burstAge);
      } else {
        burstMat.opacity = 0;
      }

      // 2. Rocket State Machine
      if (isLaunched || isHit) {
        laserLine.visible = false;
        launchProgress = Math.min(launchProgress + 0.065, 1.0);
        const currentY = -0.85 + launchProgress * 2.2;
        rocketGroup.position.set(laneX, currentY, 0);
        flameMesh.visible = true;
        flameMesh.scale.set(1.5, 2.0, 1.5);
        flameMat.color.setHex(0x38bdf8);
      } else {
        launchProgress = 0;
        laserLine.visible = true;

        if (isCharging) {
          const squatRatio = chargePercent / 100;
          const dropY = -0.85 - squatRatio * 0.25;
          const shake = squatRatio * 0.02;
          rocketGroup.position.set(
            laneX + (Math.random() - 0.5) * shake,
            dropY + (Math.random() - 0.5) * shake,
            0
          );
          flameMesh.visible = true;
          const flameScale = 0.6 + squatRatio * 1.0;
          flameMesh.scale.set(flameScale, flameScale * 1.4, flameScale);
          flameMat.color.setHex(chargePercent > 80 ? 0xfacc15 : 0xf97316);
          const targetColor = chargePercent > 75 ? 0x2dd4bf : 0xef4444;
          lineMat.color.setHex(targetColor);
        } else {
          rocketGroup.position.set(laneX, -0.85 + Math.sin(t * 2.0) * 0.03, 0);
          flameMesh.visible = false;
          lineMat.color.setHex(0xef4444);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      disposeHierarchy(scene);
      flameGeo.dispose();
      flameMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      burstGeo.dispose();
      burstMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full pointer-events-none select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

// =========================================================================
// 2. SIDE LUNGE — "ก้าวเหยียบแท่นสะท้อนพลังงาน" (Side Pad Reflector)
// Symmetrical Left/Right Lanes — Pads (Y=-1.0) + Turrets (Y=1.25) at responsive X=±1.75
// =========================================================================
interface SidePadReflector3DProps {
  activeSide: 'left' | 'right';
  chargePercent: number; // 0 - 100
  isHit: boolean;
}

export const SidePadReflector3D: React.FC<SidePadReflector3DProps> = ({
  activeSide,
  chargePercent,
  isHit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ activeSide, chargePercent, isHit });
  propsRef.current = { activeSide, chargePercent, isHit };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = container.clientWidth || 360;
    let height = container.clientHeight || 640;

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
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0, 5.0);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(3, 5, 5);
    scene.add(dirLight);

    // Compute symmetrical safe X from frustum — target ~75% from center
    const cameraDepth = camera.position.z;
    let sideX = computeSafeX(camera, cameraDepth, 0.78, 0.2);
    sideX = Math.max(sideX, 1.3); // Floor: never narrower than 1.3

    // Left & Right Ground Pad Groups at responsive ±sideX, y = -1.0
    const leftPadGroup = new THREE.Group();
    leftPadGroup.position.set(-sideX, -1.0, 0);
    leftPadGroup.rotation.x = 0.35;
    scene.add(leftPadGroup);

    const rightPadGroup = new THREE.Group();
    rightPadGroup.position.set(sideX, -1.0, 0);
    rightPadGroup.rotation.x = 0.35;
    scene.add(rightPadGroup);

    // Top Receiver Turrets at responsive ±sideX, y = 1.25
    const leftTurretGroup = new THREE.Group();
    leftTurretGroup.position.set(-sideX, 1.25, 0);
    scene.add(leftTurretGroup);

    const rightTurretGroup = new THREE.Group();
    rightTurretGroup.position.set(sideX, 1.25, 0);
    scene.add(rightTurretGroup);

    // Procedural Pedestal Base + Torus Ring helper
    const createPadMesh = () => {
      const g = new THREE.Group();
      const cylGeo = new THREE.CylinderGeometry(0.45, 0.5, 0.1, 24);
      const cylMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
      const cyl = new THREE.Mesh(cylGeo, cylMat);
      g.add(cyl);

      const ringGeo = new THREE.TorusGeometry(0.38, 0.04, 16, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.5,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.06;
      g.add(ring);
      return { group: g, ringMat };
    };

    const leftPad = createPadMesh();
    leftPadGroup.add(leftPad.group);
    const rightPad = createPadMesh();
    rightPadGroup.add(rightPad.group);

    // Top Turrets
    const createTurretMesh = () => {
      const g = new THREE.Group();
      const tGeo = new THREE.OctahedronGeometry(0.2, 0);
      const tMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 1.2 });
      const m = new THREE.Mesh(tGeo, tMat);
      g.add(m);
      return { group: g, mat: tMat, mesh: m };
    };
    const leftTurret = createTurretMesh();
    leftTurretGroup.add(leftTurret.group);
    const rightTurret = createTurretMesh();
    rightTurretGroup.add(rightTurret.group);

    // Vertical Reflection Energy Beam
    const beamHeight = 2.25;
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, beamHeight, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.set(-sideX, 0.125, 0); // centered between pad (-1.0) and turret (1.25)
    scene.add(beamMesh);

    // Expanding charging energy ring around active pad
    const chargeRingGeo = new THREE.TorusGeometry(0.48, 0.035, 12, 32);
    const chargeRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
    });
    const chargeRingMesh = new THREE.Mesh(chargeRingGeo, chargeRingMat);
    chargeRingMesh.rotation.x = Math.PI / 2;
    scene.add(chargeRingMesh);

    // ResizeObserver — recalc symmetrical X on resize
    const updateLayout = (w: number, h: number) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      sideX = computeSafeX(camera, cameraDepth, 0.78, 0.2);
      sideX = Math.max(sideX, 1.3);
      // Update static group positions
      leftPadGroup.position.x = -sideX;
      rightPadGroup.position.x = sideX;
      leftTurretGroup.position.x = -sideX;
      rightTurretGroup.position.x = sideX;
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) updateLayout(w, h);
      }
    });
    resizeObserver.observe(container);

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { activeSide, chargePercent, isHit } = propsRef.current;
      const isLeft = activeSide === 'left';
      const activePad = isLeft ? leftPad : rightPad;
      const inactivePad = isLeft ? rightPad : leftPad;

      // Rotate Turrets
      leftTurret.mesh.rotation.y += 0.02;
      rightTurret.mesh.rotation.y += 0.02;

      // Active Pad Glowing & Charging Ring
      activePad.ringMat.emissiveIntensity = isHit ? 5.0 : 1.5 + (chargePercent / 100) * 3.5;
      activePad.ringMat.color.setHex(isHit ? 0xffffff : chargePercent > 80 ? 0x2dd4bf : 0x38bdf8);
      inactivePad.ringMat.emissiveIntensity = 0.5;
      inactivePad.ringMat.color.setHex(0x1e293b);

      // Animate Expanding Charging Ring at current sideX
      if (chargePercent > 10) {
        chargeRingMesh.visible = true;
        const xPos = isLeft ? -sideX : sideX;
        const ringElev = -1.0 + (chargePercent / 100) * 0.8;
        chargeRingMesh.position.set(xPos, ringElev, 0);
        chargeRingMesh.scale.setScalar(0.8 + (chargePercent / 100) * 0.5);
        chargeRingMat.opacity = 0.3 + (chargePercent / 100) * 0.6;
        chargeRingMat.color.setHex(chargePercent > 80 ? 0x2dd4bf : 0x38bdf8);
      } else {
        chargeRingMesh.visible = false;
      }

      // Hit Reflection Energy Beam at current sideX
      if (isHit) {
        beamMesh.visible = true;
        beamMesh.position.x = isLeft ? -sideX : sideX;
        beamMat.opacity = 0.95;
        beamMesh.scale.x = 1.0 + Math.sin(t * 30) * 0.3;
      } else {
        beamMat.opacity = 0;
        beamMesh.visible = false;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      disposeHierarchy(scene);
      beamGeo.dispose();
      beamMat.dispose();
      chargeRingGeo.dispose();
      chargeRingMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full pointer-events-none select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

// =========================================================================
// 3. STANDING CROSS CRUNCH — "ยกเข่ากระแทกอุกกาบาต" (Knee Meteor Smash)
// Knee-Level Target Zones at responsive X=±1.25 + Real-time Knee Target Reticle
// =========================================================================
interface KneeMeteorSmash3DProps {
  activeSide: 'left' | 'right';
  kneeY: number; // normalized 0 - 1 from MediaPipe
  chargePercent: number; // 0 - 100
  isHit: boolean;
  bmiCategory?: string;
}

export const KneeMeteorSmash3D: React.FC<KneeMeteorSmash3DProps> = ({
  activeSide,
  kneeY,
  chargePercent,
  isHit,
  bmiCategory = 'normal',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ activeSide, kneeY, chargePercent, isHit, bmiCategory });
  propsRef.current = { activeSide, kneeY, chargePercent, isHit, bmiCategory };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = container.clientWidth || 360;
    let height = container.clientHeight || 640;

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
    camera.position.set(0, 0, 5.0);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dirLight = new THREE.DirectionalLight(0x2dd4bf, 1.4);
    dirLight.position.set(3, 5, 5);
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0xf43f5e, 1.1);
    rimLight.position.set(-3, -3, 2);
    scene.add(rimLight);

    // Compute symmetrical knee-zone X from frustum — target ~55% from center
    const cameraDepth = camera.position.z;
    let kneeZoneX = computeSafeX(camera, cameraDepth, 0.55, 0.2);
    kneeZoneX = Math.max(kneeZoneX, 1.0); // Floor: never narrower than 1.0

    // Meteor Group
    const meteorGroup = new THREE.Group();
    scene.add(meteorGroup);

    // Target Reticle Group that tracks real-time knee
    const reticleGroup = new THREE.Group();
    const reticleRingGeo = new THREE.TorusGeometry(0.24, 0.025, 8, 24);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf,
      transparent: true,
      opacity: 0.85,
    });
    const reticleMesh = new THREE.Mesh(reticleRingGeo, reticleMat);
    reticleGroup.add(reticleMesh);
    scene.add(reticleGroup);

    // Shatter Debris Particles
    const debrisCount = 45;
    const debrisGeo = new THREE.BufferGeometry();
    const debrisPos = new Float32Array(debrisCount * 3);
    const debrisVel = new Float32Array(debrisCount * 3);
    for (let i = 0; i < debrisCount; i++) {
      debrisPos[i * 3] = 0;
      debrisPos[i * 3 + 1] = 0;
      debrisPos[i * 3 + 2] = 0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spd = 0.07 + Math.random() * 0.12;
      debrisVel[i * 3] = Math.sin(phi) * Math.cos(theta) * spd;
      debrisVel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * spd;
      debrisVel[i * 3 + 2] = Math.cos(phi) * spd;
    }
    debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPos, 3));
    const debrisMat = new THREE.PointsMaterial({
      color: 0x5eead4,
      size: 0.14,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const debrisPoints = new THREE.Points(debrisGeo, debrisMat);
    scene.add(debrisPoints);

    let isDisposed = false;
    let meteorModel: THREE.Group | null = null;

    // Load Meteor GLB or Procedural Fallback
    loadCachedGLTF('/models/meteor_detailed.glb')
      .catch(() => loadCachedGLTF('/models/rock_crystals.glb'))
      .then((gltfScene) => {
        if (isDisposed) { disposeHierarchy(gltfScene); return; }
        meteorModel = gltfScene;
        const box = new THREE.Box3().setFromObject(meteorModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 0.65 / maxDim;
        meteorModel.scale.setScalar(scale);
        meteorModel.position.sub(center.multiplyScalar(scale));
        meteorGroup.add(meteorModel);
      })
      .catch(() => {
        const dGeo = new THREE.DodecahedronGeometry(0.3, 1);
        const dMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.8 });
        const m = new THREE.Mesh(dGeo, dMat);
        meteorGroup.add(m);
        meteorModel = meteorGroup;
      });

    // ResizeObserver — recalc knee zone X on resize
    const updateLayout = (w: number, h: number) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      kneeZoneX = computeSafeX(camera, cameraDepth, 0.55, 0.2);
      kneeZoneX = Math.max(kneeZoneX, 1.0);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) updateLayout(w, h);
      }
    });
    resizeObserver.observe(container);

    let rafId = 0;
    const clock = new THREE.Clock();
    let shatterAge = 999;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { activeSide, kneeY, chargePercent, isHit, bmiCategory } = propsRef.current;
      const isLeft = activeSide === 'left';

      // Knee target height based on BMI
      const baseTargetY = bmiCategory === 'obese' ? -0.2 : bmiCategory === 'overweight' ? 0.0 : 0.2;
      // Responsive symmetrical X
      const targetX = isLeft ? -kneeZoneX : kneeZoneX;

      meteorGroup.position.set(targetX, baseTargetY + Math.sin(t * 2.5) * 0.04, 0);

      // Rotate meteor slowly
      meteorGroup.rotation.x += 0.01;
      meteorGroup.rotation.y += 0.015;

      // Target reticle position tracking knee Y
      const mappedKneeY = 1.0 - (kneeY || 0.6) * 2.5;
      reticleGroup.position.set(targetX, Math.max(-1.2, Math.min(1.0, mappedKneeY)), 0);
      reticleMesh.rotation.z += 0.04;
      reticleMat.color.setHex(chargePercent > 80 ? 0x2dd4bf : 0x818cf8);
      reticleMesh.scale.setScalar(1.0 + (chargePercent / 100) * 0.3);

      // Shatter explosion trigger
      if (isHit) {
        if (shatterAge > 1.0) {
          shatterAge = 0;
          debrisPoints.position.copy(meteorGroup.position);
          const pos = debrisGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < debrisCount; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 0.1;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
          }
          debrisGeo.attributes.position.needsUpdate = true;
          debrisMat.opacity = 1.0;
        }
        meteorGroup.scale.setScalar(0.01); // vanish
      } else {
        meteorGroup.scale.setScalar(1.0 + (chargePercent / 100) * 0.25);
      }

      // Animate debris
      if (shatterAge < 1.0) {
        shatterAge += 0.04;
        const pos = debrisGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < debrisCount; i++) {
          pos[i * 3] += debrisVel[i * 3];
          pos[i * 3 + 1] += debrisVel[i * 3 + 1];
          pos[i * 3 + 2] += debrisVel[i * 3 + 2];
        }
        debrisGeo.attributes.position.needsUpdate = true;
        debrisMat.opacity = Math.max(0, 1.0 - shatterAge);
      } else {
        debrisMat.opacity = 0;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      disposeHierarchy(scene);
      reticleRingGeo.dispose();
      reticleMat.dispose();
      debrisGeo.dispose();
      debrisMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full pointer-events-none select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

// Aliases for seamless backward compatibility
export const Rocket3D = SquatRocketStrike3D;
export const Spacecraft3D = SquatRocketStrike3D;
export const PortalGate3D = SidePadReflector3D;
export const StepPad3D = SidePadReflector3D;
export const MeteorTarget3D = KneeMeteorSmash3D;
export const CrystalTarget3D = KneeMeteorSmash3D;
export const AltitudeShip3D = SquatRocketStrike3D;
export const SpaceRing3D = SquatRocketStrike3D;
