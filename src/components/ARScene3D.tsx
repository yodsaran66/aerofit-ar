// ==========================================
// ARScene3D.tsx
// Three.js WebGL AR Overlay using Kenney Space Kit GLB models
// - Squat    → rocket_baseA.glb (player rocket) + craft_speederA.glb (target)
// - SideLunge→ gate_simple.glb (left/right portal targets)
// - Crunch   → meteor.glb (floating targets left/right)
// All models placed at screen periphery, never blocking body landmarks
// ==========================================

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GameState } from '../types';

interface ARScene3DProps {
  gameState: GameState;
  width: number;
  height: number;
}

// ─── Model path helper ────────────────────────────────────────────────
const MODEL_BASE = '/GLTF format/';
const m = (name: string) => `${MODEL_BASE}${name}`;

// ─── Per-exercise model config ─────────────────────────────────────────
const EXERCISE_MODELS = {
  squat: {
    player: m('rocket_baseA.glb'),
    target: m('craft_speederA.glb'),
  },
  sideLunge: {
    gateLeft:  m('gate_simple.glb'),
    gateRight: m('gate_simple.glb'),
  },
  standingCrunch: {
    meteorLeft:  m('meteor_detailed.glb'),
    meteorRight: m('meteor_detailed.glb'),
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────
function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => mat.dispose());
      } else {
        (mesh.material as THREE.Material)?.dispose();
      }
    }
  });
}

async function loadGLB(
  loader: GLTFLoader,
  url: string
): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
  });
}

// ─── Main Component ────────────────────────────────────────────────────
export function ARScene3D({ gameState, width, height }: ARScene3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef      = useRef<number>(0);
  const clockRef    = useRef(new THREE.Clock());

  // Model refs (cleared on exercise change)
  const playerRocketRef = useRef<THREE.Group | null>(null);
  const targetCraftRef  = useRef<THREE.Group | null>(null);
  const gateLeftRef     = useRef<THREE.Group | null>(null);
  const gateRightRef    = useRef<THREE.Group | null>(null);
  const meteorLeftRef   = useRef<THREE.Group | null>(null);
  const meteorRightRef  = useRef<THREE.Group | null>(null);

  // Exhaust particles for rocket
  const exhaustParticlesRef = useRef<THREE.Points | null>(null);

  // ── Setup renderer ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera — orthographic-like perspective that maps to screen coords
    const fov = 60;
    const cam = new THREE.PerspectiveCamera(fov, width / height, 0.01, 100);
    cam.position.set(0, 0, 5);
    cameraRef.current = cam;

    // ── Lighting (PBR-friendly) ──────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3.5);
    dirLight.position.set(3, 6, 4);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 1.2);
    fillLight.position.set(-4, 2, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 0.8);
    rimLight.position.set(0, -4, 3);
    scene.add(rimLight);

    return () => {
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, []); // only on mount

  // ── Resize sync ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current) return;
    rendererRef.current.setSize(width, height);
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
  }, [width, height]);

  // ── Clear all models from scene ──────────────────────────────────────
  const clearModels = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const toDispose = [
      playerRocketRef.current,
      targetCraftRef.current,
      gateLeftRef.current,
      gateRightRef.current,
      meteorLeftRef.current,
      meteorRightRef.current,
      exhaustParticlesRef.current,
    ];
    toDispose.forEach((obj) => {
      if (obj) {
        scene.remove(obj);
        disposeObject(obj);
      }
    });
    playerRocketRef.current = null;
    targetCraftRef.current = null;
    gateLeftRef.current = null;
    gateRightRef.current = null;
    meteorLeftRef.current = null;
    meteorRightRef.current = null;
    exhaustParticlesRef.current = null;
  }, []);

  // ── Create exhaust particle system (for rocket) ───────────────────────
  const createExhaust = useCallback((scene: THREE.Scene): THREE.Points => {
    const count = 60;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 0.08;
      positions[i * 3 + 1] = -0.3 - Math.random() * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.04,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return pts;
  }, []);

  // ── Load models per exercise ─────────────────────────────────────────
  const loadExerciseModels = useCallback(async (exercise: string) => {
    const scene = sceneRef.current;
    if (!scene) return;

    clearModels();
    const loader = new GLTFLoader();

    try {
      if (exercise === 'squat') {
        // ── Squat: Rocket (bottom-left corner) + Target Craft (top-right) ──
        const [rocketScene, craftScene] = await Promise.all([
          loadGLB(loader, EXERCISE_MODELS.squat.player),
          loadGLB(loader, EXERCISE_MODELS.squat.target),
        ]);

        // Player rocket — bottom-left peripheral
        rocketScene.scale.setScalar(0.28);
        rocketScene.position.set(-3.0, -1.9, 0);
        rocketScene.rotation.z = 0.25; // slight tilt
        scene.add(rocketScene);
        playerRocketRef.current = rocketScene;

        // Target craft — top-right peripheral
        craftScene.scale.setScalar(0.22);
        craftScene.position.set(2.8, 1.8, 0);
        craftScene.rotation.y = Math.PI + 0.3;
        scene.add(craftScene);
        targetCraftRef.current = craftScene;

        // Exhaust particles attached below rocket
        exhaustParticlesRef.current = createExhaust(scene);

      } else if (exercise === 'sideLunge') {
        // ── Side Lunge: Portal gates on left and right wings ──
        const [gateL, gateR] = await Promise.all([
          loadGLB(loader, EXERCISE_MODELS.sideLunge.gateLeft),
          loadGLB(loader, EXERCISE_MODELS.sideLunge.gateRight),
        ]);

        gateL.scale.setScalar(0.35);
        gateL.position.set(-3.1, 0.0, -0.5);
        gateL.rotation.y = Math.PI / 2;
        scene.add(gateL);
        gateLeftRef.current = gateL;

        gateR.scale.setScalar(0.35);
        gateR.position.set(3.1, 0.0, -0.5);
        gateR.rotation.y = -Math.PI / 2;
        scene.add(gateR);
        gateRightRef.current = gateR;

      } else if (exercise === 'standingCrunch') {
        // ── Standing Crunch: Meteors floating on left and right ──
        const [metL, metR] = await Promise.all([
          loadGLB(loader, EXERCISE_MODELS.standingCrunch.meteorLeft),
          loadGLB(loader, EXERCISE_MODELS.standingCrunch.meteorRight),
        ]);

        // Left meteor — knee height
        metL.scale.setScalar(0.20);
        metL.position.set(-2.8, -0.6, 0);
        scene.add(metL);
        meteorLeftRef.current = metL;

        // Right meteor — knee height
        metR.scale.setScalar(0.20);
        metR.position.set(2.8, -0.6, 0);
        scene.add(metR);
        meteorRightRef.current = metR;
      }
    } catch (err) {
      // Silently skip — GLB load failure should not crash the game
      console.warn('[ARScene3D] GLB load error:', err);
    }
  }, [clearModels, createExhaust]);

  // ── Re-load on exercise change ────────────────────────────────────────
  const prevExerciseRef = useRef<string | null>(null);
  useEffect(() => {
    if (!gameState.currentExercise) return;
    if (gameState.currentExercise === prevExerciseRef.current) return;
    prevExerciseRef.current = gameState.currentExercise;
    loadExerciseModels(gameState.currentExercise);
  }, [gameState.currentExercise, loadExerciseModels]);

  // ── Animation loop ────────────────────────────────────────────────────
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene    = sceneRef.current;
    const camera   = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const t = clockRef.current.getElapsedTime();

      // ── Squat animations ──────────────────────────────────────────
      if (playerRocketRef.current) {
        const rocket = playerRocketRef.current;
        // Map formAccuracy (0-100) → thrust height: more accurate = higher
        const accuracy = gameState.formAccuracy / 100;
        // Hover bob + accuracy-driven lift
        rocket.position.y = -1.9 + accuracy * 0.6 + Math.sin(t * 2.5) * 0.06;
        rocket.rotation.z = 0.25 + Math.sin(t * 1.8) * 0.04;
        // Exhaust intensity
        if (exhaustParticlesRef.current) {
          const ex = exhaustParticlesRef.current;
          ex.position.set(
            rocket.position.x + 0.0,
            rocket.position.y - 0.35,
            rocket.position.z
          );
          const mat = ex.material as THREE.PointsMaterial;
          mat.opacity = 0.5 + accuracy * 0.5;
          mat.color.setHSL(0.08 - accuracy * 0.05, 1, 0.5);
          ex.rotation.y += 0.08;
        }
      }
      if (targetCraftRef.current) {
        const craft = targetCraftRef.current;
        craft.rotation.y += 0.012;
        craft.position.y = 1.8 + Math.sin(t * 1.4) * 0.08;
      }

      // ── Side Lunge animations ─────────────────────────────────────
      const targetSide = (gameState as any).targetLungeSide; // may be undefined
      if (gateLeftRef.current) {
        const isActive = !targetSide || targetSide === 'left';
        gateLeftRef.current.rotation.y = Math.PI / 2 + Math.sin(t * 2) * 0.08;
        gateLeftRef.current.scale.setScalar(isActive ? 0.38 + Math.sin(t * 3) * 0.025 : 0.32);
        gateLeftRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat && mat.emissive) {
              mat.emissive.setHex(isActive ? 0x0033ff : 0x001133);
              mat.emissiveIntensity = isActive ? 0.6 + Math.sin(t * 4) * 0.3 : 0.1;
            }
          }
        });
      }
      if (gateRightRef.current) {
        const isActive = targetSide === 'right';
        gateRightRef.current.rotation.y = -Math.PI / 2 + Math.sin(t * 2 + 1) * 0.08;
        gateRightRef.current.scale.setScalar(isActive ? 0.38 + Math.sin(t * 3 + 1) * 0.025 : 0.32);
        gateRightRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat && mat.emissive) {
              mat.emissive.setHex(isActive ? 0xff3300 : 0x331100);
              mat.emissiveIntensity = isActive ? 0.6 + Math.sin(t * 4 + 1) * 0.3 : 0.1;
            }
          }
        });
      }

      // ── Crunch animations ─────────────────────────────────────────
      const crunchTarget = gameState.targetCrunchSide;
      if (meteorLeftRef.current) {
        const isTarget = crunchTarget === 'left';
        meteorLeftRef.current.rotation.y += 0.018;
        meteorLeftRef.current.rotation.x += 0.008;
        meteorLeftRef.current.position.y = -0.6 + Math.sin(t * 2.2) * 0.12;
        // Scale pulse when active
        const sc = isTarget ? 0.22 + Math.sin(t * 5) * 0.015 : 0.16;
        meteorLeftRef.current.scale.setScalar(sc);
      }
      if (meteorRightRef.current) {
        const isTarget = crunchTarget === 'right';
        meteorRightRef.current.rotation.y -= 0.018;
        meteorRightRef.current.rotation.x += 0.010;
        meteorRightRef.current.position.y = -0.6 + Math.sin(t * 2.2 + Math.PI) * 0.12;
        const sc = isTarget ? 0.22 + Math.sin(t * 5 + 1) * 0.015 : 0.16;
        meteorRightRef.current.scale.setScalar(sc);
      }

      renderer.render(scene, camera);
    };

    animate();
    return () => cancelAnimationFrame(rafRef.current);
  }, [gameState.formAccuracy, gameState.targetCrunchSide]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
}
