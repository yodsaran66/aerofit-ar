// ==========================================
// ARScene3D.tsx  — Three.js WebGL AR 3D Overlay
// Uses Kenney Space Kit GLB models from /public/models/
//
// Exercise → Models:
//   squat         → rocket_baseA.glb (player) + craft_speederA.glb (target)
//   sideLunge     → gate_simple.glb × 2 (left & right portal)
//   standingCrunch→ meteor_detailed.glb × 2 (left & right targets)
//
// Architecture:
//   - Single RAF animation loop, never restarted
//   - Game state communicated via useRef (not useEffect deps)
//   - Full cleanup / dispose on unmount to prevent memory leaks
// ==========================================

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GameState } from '../types';

interface ARScene3DProps {
  gameState: GameState;
  width: number;
  height: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function disposeGroup(group: THREE.Group) {
  group.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => (m as THREE.Material)?.dispose());
    }
  });
}

function loadGLB(loader: GLTFLoader, url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) =>
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject)
  );
}

// ─── Component ───────────────────────────────────────────────────────
export function ARScene3D({ gameState, width, height }: ARScene3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js core objects — stored as refs so the RAF loop sees latest values
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    clock: THREE.Clock;
  } | null>(null);

  // Model refs
  const rocketRef      = useRef<THREE.Group | null>(null);
  const craftRef       = useRef<THREE.Group | null>(null);
  const gateLeftRef    = useRef<THREE.Group | null>(null);
  const gateRightRef   = useRef<THREE.Group | null>(null);
  const meteorLeftRef  = useRef<THREE.Group | null>(null);
  const meteorRightRef = useRef<THREE.Group | null>(null);
  const exhaustRef     = useRef<THREE.Points | null>(null);

  // Mirror latest gameState into a ref so the RAF loop can read it without deps
  const gsRef = useRef<GameState>(gameState);
  useEffect(() => { gsRef.current = gameState; }, [gameState]);

  // RAF handle
  const rafRef = useRef<number>(0);

  // ─── One-time setup ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Scene
    const scene = new THREE.Scene();

    // Camera  (FOV 55° → viewport at z=0 is ~±3.9 wide, ~±3.0 tall for 4:3)
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.01, 100);
    camera.position.set(0, 0, 6);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 2.0));
    const key = new THREE.DirectionalLight(0xffffff, 4.0);
    key.position.set(4, 8, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x88aaff, 1.5);
    fill.position.set(-4, 2, -2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x00e5ff, 1.0);
    rim.position.set(0, -4, 3);
    scene.add(rim);

    const clock = new THREE.Clock();
    threeRef.current = { renderer, scene, camera, clock };

    // ── Load models for current exercise ───────────────────────────
    const loader = new GLTFLoader();
    const exercise = gsRef.current.currentExercise;
    let cancelled = false;

    async function loadModels() {
      if (!exercise || cancelled) return;

      try {
        if (exercise === 'squat') {
          const [rkt, cft] = await Promise.all([
            loadGLB(loader, '/models/rocket_baseA.glb'),
            loadGLB(loader, '/models/craft_speederA.glb'),
          ]);
          if (cancelled) { disposeGroup(rkt); disposeGroup(cft); return; }

          // Rocket — bottom-left corner
          rkt.scale.setScalar(0.30);
          rkt.position.set(-3.0, -2.0, 0);
          rkt.rotation.set(0, 0, 0.3); // tilt right
          scene.add(rkt);
          rocketRef.current = rkt;

          // Target craft — top-right corner
          cft.scale.setScalar(0.24);
          cft.position.set(3.0, 2.0, 0);
          cft.rotation.y = Math.PI;
          scene.add(cft);
          craftRef.current = cft;

          // Exhaust particles
          const count = 80;
          const pos = new Float32Array(count * 3);
          for (let i = 0; i < count; i++) {
            pos[i * 3]     = (Math.random() - 0.5) * 0.12;
            pos[i * 3 + 1] = -Math.random() * 0.5;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
          }
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          const ptsMat = new THREE.PointsMaterial({
            color: 0xff6600, size: 0.05,
            transparent: true, opacity: 0.85, depthWrite: false,
          });
          const pts = new THREE.Points(geo, ptsMat);
          scene.add(pts);
          exhaustRef.current = pts;

        } else if (exercise === 'sideLunge') {
          const [gL, gR] = await Promise.all([
            loadGLB(loader, '/models/gate_simple.glb'),
            loadGLB(loader, '/models/gate_simple.glb'),
          ]);
          if (cancelled) { disposeGroup(gL); disposeGroup(gR); return; }

          gL.scale.setScalar(0.40);
          gL.position.set(-3.3, 0.0, -0.3);
          gL.rotation.y = Math.PI * 0.5;
          scene.add(gL);
          gateLeftRef.current = gL;

          gR.scale.setScalar(0.40);
          gR.position.set(3.3, 0.0, -0.3);
          gR.rotation.y = -Math.PI * 0.5;
          scene.add(gR);
          gateRightRef.current = gR;

        } else if (exercise === 'standingCrunch') {
          const [mL, mR] = await Promise.all([
            loadGLB(loader, '/models/meteor_detailed.glb'),
            loadGLB(loader, '/models/meteor_detailed.glb'),
          ]);
          if (cancelled) { disposeGroup(mL); disposeGroup(mR); return; }

          mL.scale.setScalar(0.22);
          mL.position.set(-2.9, -0.5, 0);
          scene.add(mL);
          meteorLeftRef.current = mL;

          mR.scale.setScalar(0.22);
          mR.position.set(2.9, -0.5, 0);
          scene.add(mR);
          meteorRightRef.current = mR;
        }
      } catch (err) {
        console.warn('[ARScene3D] GLB load failed:', err);
      }
    }

    loadModels();

    // ── Single persistent animation loop ───────────────────────────
    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      if (!threeRef.current) return;

      const { renderer: rndr, scene: scn, camera: cam, clock: clk } = threeRef.current;
      const t = clk.getElapsedTime();
      const gs = gsRef.current;
      const accuracy = (gs.formAccuracy || 0) / 100; // 0–1

      // ── Squat ──
      if (rocketRef.current) {
        const rkt = rocketRef.current;
        // Lift proportional to accuracy (squat depth), + gentle bob
        rkt.position.y = -2.0 + accuracy * 0.9 + Math.sin(t * 2.5) * 0.06;
        rkt.rotation.z = 0.3 + Math.sin(t * 1.5) * 0.05;
      }
      if (exhaustRef.current && rocketRef.current) {
        const ex = exhaustRef.current;
        ex.position.copy(rocketRef.current.position);
        ex.position.y -= 0.3;
        ex.rotation.y += 0.1;
        const mat = ex.material as THREE.PointsMaterial;
        mat.opacity = 0.4 + accuracy * 0.6;
        mat.color.setHSL(Math.max(0, 0.1 - accuracy * 0.1), 1, 0.5);
      }
      if (craftRef.current) {
        craftRef.current.rotation.y += 0.014;
        craftRef.current.position.y = 2.0 + Math.sin(t * 1.3) * 0.09;
      }

      // ── Side Lunge ──
      const crunchSide = gs.targetCrunchSide; // reused for both exercises
      if (gateLeftRef.current) {
        const isActive = !crunchSide || crunchSide === 'left';
        gateLeftRef.current.rotation.y = Math.PI * 0.5 + Math.sin(t * 2) * 0.07;
        const sc = isActive ? 0.42 + Math.sin(t * 3.5) * 0.025 : 0.34;
        gateLeftRef.current.scale.setScalar(sc);
        gateLeftRef.current.traverse((c) => {
          const mesh = c as THREE.Mesh;
          if (mesh.isMesh) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat && 'emissive' in mat) {
              mat.emissive.setHex(isActive ? 0x0044ff : 0x001133);
              mat.emissiveIntensity = isActive ? 0.5 + Math.sin(t * 5) * 0.3 : 0.08;
            }
          }
        });
      }
      if (gateRightRef.current) {
        const isActive = crunchSide === 'right';
        gateRightRef.current.rotation.y = -Math.PI * 0.5 + Math.sin(t * 2 + 1) * 0.07;
        const sc = isActive ? 0.42 + Math.sin(t * 3.5 + 1) * 0.025 : 0.34;
        gateRightRef.current.scale.setScalar(sc);
        gateRightRef.current.traverse((c) => {
          const mesh = c as THREE.Mesh;
          if (mesh.isMesh) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat && 'emissive' in mat) {
              mat.emissive.setHex(isActive ? 0xff3300 : 0x331100);
              mat.emissiveIntensity = isActive ? 0.5 + Math.sin(t * 5 + 1) * 0.3 : 0.08;
            }
          }
        });
      }

      // ── Standing Crunch ──
      if (meteorLeftRef.current) {
        const isTarget = gs.targetCrunchSide === 'left';
        meteorLeftRef.current.rotation.y += 0.020;
        meteorLeftRef.current.rotation.x += 0.008;
        meteorLeftRef.current.position.y = -0.5 + Math.sin(t * 2.2) * 0.14;
        const sc = isTarget ? 0.26 + Math.sin(t * 5) * 0.02 : 0.17;
        meteorLeftRef.current.scale.setScalar(sc);
      }
      if (meteorRightRef.current) {
        const isTarget = gs.targetCrunchSide === 'right';
        meteorRightRef.current.rotation.y -= 0.020;
        meteorRightRef.current.rotation.x += 0.010;
        meteorRightRef.current.position.y = -0.5 + Math.sin(t * 2.2 + Math.PI) * 0.14;
        const sc = isTarget ? 0.26 + Math.sin(t * 5 + 1) * 0.02 : 0.17;
        meteorRightRef.current.scale.setScalar(sc);
      }

      rndr.render(scn, cam);
    }

    animate();

    // ── Cleanup ───────────────────────────────────────────────────
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);

      const toDispose = [
        rocketRef.current,
        craftRef.current,
        gateLeftRef.current,
        gateRightRef.current,
        meteorLeftRef.current,
        meteorRightRef.current,
      ];
      toDispose.forEach((g) => { if (g) { scene.remove(g); disposeGroup(g); } });

      if (exhaustRef.current) {
        (exhaustRef.current.geometry as THREE.BufferGeometry).dispose();
        (exhaustRef.current.material as THREE.Material).dispose();
        scene.remove(exhaustRef.current);
      }

      rocketRef.current = null;
      craftRef.current = null;
      gateLeftRef.current = null;
      gateRightRef.current = null;
      meteorLeftRef.current = null;
      meteorRightRef.current = null;
      exhaustRef.current = null;

      renderer.dispose();
      threeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount — game state flows through gsRef

  // ─── Sync renderer size when container resizes ───────────────────
  useEffect(() => {
    const three = threeRef.current;
    if (!three || width <= 0 || height <= 0) return;
    three.renderer.setSize(width, height);
    three.camera.aspect = width / height;
    three.camera.updateProjectionMatrix();
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 6,
      }}
    />
  );
}
