// The Lantern Lands in 3D. A physical sky and reflective water, islands lit by the sun of the
// chosen time of day, lanterns that are real lights, and a city whose windows come on at night.
// Loaded on demand; the flat SVG map stands in until it's ready or if WebGL isn't available.
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { CHAPTERS, STATUS_LABEL, suits, type BandId, type Chapter } from '../content/chapters';
import type { Daylight } from '../lib/daylight';

interface Props {
  light: Daylight;
  band: BandId;
  lit: string[];
  reduced: boolean;
  /** False while the hero is scrolled away or a game is playing: the scene stops drawing. */
  active?: boolean;
  onOpen: (c: Chapter) => void;
}

// ------------------------------------------------------------------ layout
type V2 = [number, number];
const ISLES = {
  academy: { at: [-2.5, 3.5] as V2, r: 6.5, sx: 1, sz: 0.62 },
  shop: { at: [5, -6] as V2, r: 5, sx: 1, sz: 0.65 },
  post: { at: [1.5, 11.5] as V2, r: 4, sx: 1, sz: 0.62 },
  islet: { at: [12, 13] as V2, r: 2.4, sx: 1, sz: 0.7 },
  rock: { at: [28.5, -0.5] as V2, r: 2.3, sx: 1, sz: 0.8 },
  kingdom: { at: [0, -42] as V2, r: 16, sx: 1, sz: 0.42 },
  city: { at: [21, -21] as V2, r: 10, sx: 1, sz: 0.55 },
};
// Where each chapter's lantern stands.
const LANTERNS: Record<string, V2> = {
  sidekick: [-4.5, 5],
  echo: [-0.5, 12],
  'order-up': [2.5, -5.5],
  treequest: [-4, -40],
  relight: [14.5, -18],
  countersign: [22, -27],
  'the-line': [28, -17],
  'sorting-harbour': [12, 13],
};
const LAND_TOP = 1.1;

// A tiny seeded random, so trees and windows land in the same place every time.
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Tileable wave normals for the water, generated here so nothing loads from the network.
function waterNormals(): THREE.Texture {
  const n = 256;
  const data = new Uint8Array(n * n * 4);
  const h = (x: number, y: number) => {
    const u = (x / n) * Math.PI * 2, v = (y / n) * Math.PI * 2;
    return Math.sin(u * 3 + v * 2) * 0.5 + Math.sin(u * 7 - v * 5) * 0.25 + Math.sin(u * 13 + v * 11) * 0.12 + Math.cos(u * 5 + v * 9) * 0.2;
  };
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1);
      const len = Math.hypot(dx, dy, 1);
      const i = (y * n + x) * 4;
      data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

// Window grid for a tower: some lit, some dark, as an emissive map.
function windowTexture(seed: number): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 64, 128);
  const r = rand(seed);
  for (let y = 4; y < 124; y += 10)
    for (let x = 5; x < 60; x += 11) {
      const v = r();
      if (v < 0.55) continue;
      ctx.fillStyle = v > 0.94 ? '#5cf2ff' : v > 0.9 ? '#ff4fa3' : '#ffd36b';
      ctx.fillRect(x, y, 6, 5);
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ------------------------------------------------------------------ materials
const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true, ...extra });

function useMaterials() {
  return useMemo(
    () => ({
      sand: mat('#e9d6a0'),
      grass: mat('#7fb36a'),
      grassDark: mat('#5f9a55'),
      rock: mat('#8d929c'),
      trunk: mat('#7a5a3a'),
      leaf: mat('#4f8d4a'),
      leafLight: mat('#6fae5c'),
      white: mat('#f6f1e7'),
      roofRed: mat('#d9654b'),
      roofBlue: mat('#5d8fc9'),
      pink: mat('#f4a9c5'),
      stone: mat('#b9b2a4'),
      stoneDark: mat('#968e80'),
      dark: mat('#2b3550'),
      glass: new THREE.MeshStandardMaterial({ color: '#ffd36b', emissive: '#ffb547', emissiveIntensity: 0 }),
    }),
    [],
  );
}
type Mats = ReturnType<typeof useMaterials>;

// ------------------------------------------------------------------ pieces
function Island({ at, r, sx, sz, m, hill = 0 }: { at: V2; r: number; sx: number; sz: number; m: Mats; hill?: number }) {
  return (
    <group position={[at[0], 0, at[1]]} scale={[sx, 1, sz]}>
      <mesh material={m.sand} position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[r * 1.08, r * 1.32, 1, 40]} />
      </mesh>
      <mesh material={m.grass} position={[0, 0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r * 0.9, r * 1.02, 0.9, 40]} />
      </mesh>
      {hill > 0 && (
        <mesh material={m.grassDark} position={[-r * 0.25, 1.1, -r * 0.2]} scale={[r * 0.55, hill, r * 0.45]} castShadow receiveShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      )}
    </group>
  );
}

function Trees({ at, r, sz, count, seed, m }: { at: V2; r: number; sz: number; count: number; seed: number; m: Mats }) {
  const trees = useMemo(() => {
    const rr = rand(seed);
    return Array.from({ length: count }, () => {
      const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * r * 0.78;
      return { x: at[0] + Math.cos(a) * d, z: at[1] + Math.sin(a) * d * sz, s: 0.7 + rr() * 0.6, round: rr() > 0.45 };
    });
  }, [at, r, sz, count, seed]);
  return (
    <>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, LAND_TOP, t.z]} scale={t.s}>
          <mesh material={m.trunk} position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 0.7, 6]} />
          </mesh>
          {t.round ? (
            <mesh material={i % 2 ? m.leaf : m.leafLight} position={[0, 1.15, 0]} castShadow>
              <icosahedronGeometry args={[0.7, 0]} />
            </mesh>
          ) : (
            <mesh material={m.leaf} position={[0, 1.25, 0]} castShadow>
              <coneGeometry args={[0.6, 1.6, 7]} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

function House({ x, z, roof, m, scale = 1, rot = 0 }: { x: number; z: number; roof: THREE.Material; m: Mats; scale?: number; rot?: number }) {
  return (
    <group position={[x, LAND_TOP, z]} scale={scale} rotation={[0, rot, 0]}>
      <mesh material={m.white} position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.1, 1.3]} />
      </mesh>
      <mesh material={roof} position={[0, 1.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.3, 0.8, 4]} />
      </mesh>
    </group>
  );
}

function Castle({ x, z, m, night }: { x: number; z: number; m: Mats; night: number }) {
  const windows = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2433', emissive: '#ffcf6b', emissiveIntensity: 0 }), []);
  windows.emissiveIntensity = 0.15 + night * 2.2;
  const tower = (tx: number, tz: number, h: number) => (
    <group position={[tx, 0, tz]}>
      <mesh material={m.stone} position={[0, h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.75, 0.85, h, 10]} />
      </mesh>
      <mesh material={m.roofBlue} position={[0, h + 0.7, 0]} castShadow>
        <coneGeometry args={[0.95, 1.4, 10]} />
      </mesh>
      <mesh material={windows} position={[0, h * 0.7, 0.8]}>
        <boxGeometry args={[0.25, 0.4, 0.05]} />
      </mesh>
    </group>
  );
  return (
    <group position={[x, LAND_TOP, z]} scale={1.6}>
      <mesh material={m.stoneDark} position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 1.8, 2]} />
      </mesh>
      {tower(-2, 0, 3)}
      {tower(2, 0, 3.4)}
      {tower(0, -0.4, 4.2)}
      {[-0.9, 0.9].map((wx) => (
        <mesh key={wx} material={windows} position={[wx, 1.1, 1.01]}>
          <boxGeometry args={[0.35, 0.5, 0.05]} />
        </mesh>
      ))}
    </group>
  );
}

function WiseTree({ x, z, m }: { x: number; z: number; m: Mats }) {
  return (
    <group position={[x, LAND_TOP, z]} scale={1.9}>
      <mesh material={m.trunk} position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.45, 2, 7]} />
      </mesh>
      {[
        [0, 2.6, 0, 1.4],
        [-0.9, 2.2, 0.3, 0.95],
        [0.9, 2.3, -0.2, 1],
        [0.2, 3.3, 0.2, 0.9],
      ].map(([px, py, pz, s], i) => (
        <mesh key={i} material={i % 2 ? m.leafLight : m.leaf} position={[px, py, pz]} scale={s} castShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

function City({ at, r, sz, night }: { at: V2; r: number; sz: number; night: number }) {
  const towers = useMemo(() => {
    const rr = rand(42);
    const list: { x: number; z: number; w: number; d: number; h: number; tex: THREE.Texture }[] = [];
    for (let i = 0; i < 26; i++) {
      const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * r * 0.72;
      const h = 2.5 + rr() * rr() * 11;
      const tex = windowTexture(100 + i);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, Math.max(1, Math.round(h / 4)));
      list.push({ x: at[0] + Math.cos(a) * d, z: at[1] + Math.sin(a) * d * sz, w: 1.1 + rr() * 1.3, d: 1.1 + rr() * 1.3, h, tex });
    }
    return list;
  }, [at, r, sz]);
  const mats = useMemo(
    () => towers.map((t, i) => new THREE.MeshStandardMaterial({ color: i % 3 ? '#6f7d96' : '#56627a', roughness: 0.6, metalness: 0.15, emissive: '#ffffff', emissiveMap: t.tex, emissiveIntensity: 0 })),
    [towers],
  );
  mats.forEach((mm) => (mm.emissiveIntensity = 0.04 + night * 1.6));
  return (
    <>
      {towers.map((t, i) => (
        <mesh key={i} material={mats[i]} position={[t.x, LAND_TOP + t.h / 2, t.z]} castShadow receiveShadow>
          <boxGeometry args={[t.w, t.h, t.d]} />
        </mesh>
      ))}
      {/* the Relay mast that Warden guards */}
      <mesh position={[at[0] + 1, LAND_TOP + 9, at[1] - 3]}>
        <cylinderGeometry args={[0.08, 0.12, 18, 6]} />
        <meshStandardMaterial color="#3a4560" />
      </mesh>
      <mesh position={[at[0] + 1, LAND_TOP + 18.2, at[1] - 3]}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshStandardMaterial color="#ff4fa3" emissive="#ff4fa3" emissiveIntensity={0.4 + night * 3} />
      </mesh>
    </>
  );
}

function Lighthouse({ at, m, night, reduced }: { at: V2; m: Mats; night: number; reduced: boolean }) {
  const beam = useRef<THREE.Group>(null);
  const lamp = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffd36b', emissiveIntensity: 0 }), []);
  lamp.emissiveIntensity = 0.3 + night * 3;
  useFrame((_, dt) => {
    if (beam.current && !reduced) beam.current.rotation.y += dt * 0.35;
  });
  const stripe = (y: number) => (
    <mesh material={m.roofRed} position={[0, y, 0]}>
      <cylinderGeometry args={[0.62 - y * 0.035, 0.64 - y * 0.035, 0.7, 16]} />
    </mesh>
  );
  return (
    <group position={[at[0], LAND_TOP, at[1]]} scale={0.8}>
      <mesh material={m.rock} position={[0, -0.2, 0]} scale={[1.6, 0.8, 1.3]} castShadow receiveShadow>
        <icosahedronGeometry args={[1.3, 0]} />
      </mesh>
      <mesh material={m.white} position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.75, 6, 16]} />
      </mesh>
      {stripe(1.6)}
      {stripe(3.6)}
      <mesh material={lamp} position={[0, 6.45, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.9, 12]} />
      </mesh>
      <mesh material={m.roofRed} position={[0, 7.3, 0]} castShadow>
        <coneGeometry args={[0.75, 0.9, 12]} />
      </mesh>
      <pointLight position={[0, 6.5, 0]} color="#ffd36b" intensity={night * 30} distance={30} decay={2} />
      <group ref={beam} position={[0, 6.45, 0]}>
        <mesh position={[9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[2.2, 18, 24, 1, true]} />
          <meshBasicMaterial color="#fff3c4" transparent opacity={night * 0.16} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

type Tags = React.MutableRefObject<Record<string, HTMLButtonElement | null>>;

// 'pick': right for the chosen age group (green). 'other': still playable, greyed. 'unlit': not built yet.
function lanternState(c: Chapter, band: BandId) {
  const playable = c.status === 'live' || c.status === 'in-development';
  return !playable ? 'unlit' : suits(c, band) ? 'pick' : 'other';
}

// Keeps each label button over its lantern: project the lantern's top onto the screen each frame.
function Projector({ tags }: { tags: Tags }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    for (const c of CHAPTERS) {
      const el = tags.current[c.id];
      const at = LANTERNS[c.id];
      if (!el || !at) continue;
      v.set(at[0], LAND_TOP + 3.3, at[1]).project(camera);
      const hidden = v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2;
      el.style.visibility = hidden ? 'hidden' : 'visible';
      el.style.transform = `translate3d(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px, 0) translate(-50%, -50%)`;
    }
  });
  return null;
}

function Lantern({ c, band, lit, glow }: { c: Chapter; band: BandId; lit: boolean; glow: number }) {
  const at = LANTERNS[c.id];
  const state = lanternState(c, band);
  const pick = state === 'pick';
  const power = pick ? (lit ? 1 : 0.85) : state === 'other' ? 0.12 : 0;
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffe3a0', emissive: '#ffb547', emissiveIntensity: 0, transparent: true }), []);
  glass.color.set(pick ? '#c9f7d6' : '#d8dbe2');
  glass.emissive.set(pick ? '#3ddc84' : '#9aa3b5');
  glass.emissiveIntensity = power * (0.8 + glow * 2.4);
  glass.opacity = state === 'unlit' ? 0.45 : 1;
  return (
    <group position={[at[0], LAND_TOP, at[1]]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 1.8, 6]} />
        <meshStandardMaterial color="#26304a" />
      </mesh>
      <mesh material={glass} position={[0, 2, 0]} castShadow>
        <boxGeometry args={[0.55, 0.75, 0.55]} />
      </mesh>
      <mesh position={[0, 2.48, 0]}>
        <coneGeometry args={[0.45, 0.3, 4]} />
        <meshStandardMaterial color="#26304a" />
      </mesh>
      {pick && <pointLight position={[0, 2.1, 0]} color="#5ff0a0" intensity={power * (5 + glow * 40)} distance={9} decay={2} />}
    </group>
  );
}

// ------------------------------------------------------------------ sky, water, light
function Atmosphere({ light, reduced }: { light: Daylight; reduced: boolean }) {
  const { scene, gl } = useThree();
  const sun = useRef(new THREE.Vector3());
  const skyObj = useMemo(() => {
    const s = new Sky();
    s.scale.setScalar(90000);
    return s;
  }, []);
  const water = useMemo(() => {
    const w = new Water(new THREE.PlaneGeometry(60000, 60000), {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormals(),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x0e4a6b,
      distortionScale: 2.4,
      fog: true,
    });
    w.rotation.x = -Math.PI / 2;
    (w.material as THREE.ShaderMaterial).uniforms.size.value = 6;
    return w;
  }, []);
  const stars = useMemo(() => {
    const r = rand(7);
    const pts: number[] = [];
    for (let i = 0; i < 900; i++) {
      const th = r() * Math.PI * 2, ph = Math.acos(r() * 0.85 + 0.12);
      pts.push(Math.sin(ph) * Math.cos(th) * 40000, Math.cos(ph) * 40000, Math.sin(ph) * Math.sin(th) * 40000);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ color: '#fffbea', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  }, []);
  const moon = useMemo(() => new THREE.Mesh(new THREE.SphereGeometry(380, 32, 16), new THREE.MeshBasicMaterial({ color: '#eef3ff', transparent: true, opacity: 0, fog: false })), []);
  const fog = useMemo(() => new THREE.Fog('#ffffff', 220, 12000), []);
  // After dusk the physical sky goes black; this dome lays a deep blue night over it.
  const nightDome = useMemo(() => {
    const g = new THREE.SphereGeometry(50000, 32, 16);
    const pos = g.getAttribute('position');
    const colors: number[] = [];
    const horizon = new THREE.Color('#2b3d7e'), zenith = new THREE.Color('#050c26'), below = new THREE.Color('#0a1530');
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 50000;
      const c = y >= 0 ? horizon.clone().lerp(zenith, Math.pow(y, 0.45)) : below;
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    m.renderOrder = -1;
    return m;
  }, []);

  useEffect(() => {
    scene.add(skyObj, nightDome, water, stars, moon);
    scene.fog = fog;
    return () => {
      scene.remove(skyObj, nightDome, water, stars, moon);
      scene.fog = null;
    };
  }, [scene, skyObj, nightDome, water, stars, moon, fog]);

  // The sun really moves: its height and direction come from the time of day (see lib/daylight).
  const { day, night, warm, elevation, azimuth } = light;
  sun.current.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevation), azimuth);

  const u = skyObj.material.uniforms;
  u.sunPosition.value.copy(sun.current);
  u.turbidity.value = 3 + warm * 7;
  u.rayleigh.value = 1 + warm * 2.6;
  u.mieCoefficient.value = 0.004 + warm * 0.003;
  u.mieDirectionalG.value = 0.82;
  const wu = (water.material as THREE.ShaderMaterial).uniforms;
  wu.sunDirection.value.copy(sun.current).normalize();
  wu.sunColor.value.set(warm > 0.4 ? '#ffb07a' : '#fff6e0').multiplyScalar(0.3 + day * 0.7);
  wu.waterColor.value.set('#061a33').lerp(new THREE.Color('#0e4a6b'), day);
  (stars.material as THREE.PointsMaterial).opacity = Math.max(0, night * 1.15 - 0.15);
  (nightDome.material as THREE.MeshBasicMaterial).opacity = night * 0.96;
  const moonDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 8.5), Math.PI - 0.25);
  moon.position.copy(moonDir.multiplyScalar(36000));
  (moon.material as THREE.MeshBasicMaterial).opacity = Math.max(0, night * 1.4 - 0.4);
  fog.color.set(light.fog);
  gl.toneMappingExposure = 0.5 + day * 0.1 + night * 0.35;

  useFrame((_, dt) => {
    if (!reduced) wu.time.value += dt * 0.45;
  });

  const sunColor = warm > 0.4 ? '#ffb27a' : '#fff4dc';
  return (
    <>
      <directionalLight
        position={[sun.current.x * 80, Math.max(8, sun.current.y * 80), sun.current.z * 80]}
        color={day > 0.05 ? sunColor : '#9fb4ff'}
        intensity={day * 2.4 + night * 0.9}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-far={300}
        shadow-bias={-0.0006}
      />
      <hemisphereLight args={[day > 0.5 ? '#d6ecff' : '#4a5c96', day > 0.5 ? '#5d7a4f' : '#1d2b45', 0.8 + day * 0.5]} />
      <ambientLight intensity={0.15 + night * 0.2} color={day > 0.5 ? '#ffffff' : '#8fa2d8'} />
    </>
  );
}

// Frame the islands in the middle, with the horizon about a third of the way down for sky.
function Framing() {
  const { camera, size } = useThree();
  const placed = useRef(false);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera & { manual?: boolean };
    cam.manual = true;
    // The view is the top part of a taller frame, which drops the horizon to leave room for sky.
    // Narrow (portrait) screens step the camera back so every island still fits across.
    // Wide screens: the islands sit right of centre, leaving the left for the words.
    const aspect = size.width / size.height;
    const wide = size.width > 960;
    const fullW = wide ? size.width * 1.36 : size.width;
    const fullH = size.height * 1.4;
    cam.aspect = fullW / fullH;
    cam.setViewOffset(fullW, fullH, 0, 0, size.width, size.height);
    if (!placed.current) {
      // Start close over the islands; OrbitControls takes over from here.
      const back = aspect < 1.2 ? 1.45 : aspect < 1.5 ? 1.12 : 1;
      cam.position.set(10, 17 * back, -14 + 72 * back);
      cam.lookAt(10, 0, -14);
      placed.current = true;
    }
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function World({ light, band, lit, reduced, tags }: Omit<Props, 'active' | 'onOpen'> & { tags: Tags }) {
  const m = useMaterials();
  const night = light.night;
  return (
    <>
      <Atmosphere light={light} reduced={reduced} />
      <Framing />
      <OrbitControls
        target={[10, 0, -14]}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        zoomSpeed={0.7}
        minDistance={26}
        maxDistance={120}
        minPolarAngle={0.35}
        maxPolarAngle={1.36}
      />
      <Projector tags={tags} />
      {Object.entries(ISLES).map(([k, i]) => (
        <Island key={k} at={i.at} r={i.r} sx={i.sx} sz={i.sz} m={m} hill={k === 'kingdom' ? 3.2 : k === 'academy' ? 1.2 : 0} />
      ))}
      <Trees at={ISLES.academy.at} r={ISLES.academy.r} sz={ISLES.academy.sz} count={9} seed={3} m={m} />
      <Trees at={ISLES.kingdom.at} r={ISLES.kingdom.r} sz={ISLES.kingdom.sz} count={26} seed={11} m={m} />
      <Trees at={ISLES.post.at} r={ISLES.post.r} sz={ISLES.post.sz} count={3} seed={5} m={m} />
      <House x={0.5} z={3.5} roof={m.roofRed} m={m} />
      <House x={-2} z={0.7} roof={m.roofBlue} m={m} scale={0.8} rot={0.5} />
      {/* Dot's picture shop with its pink awning */}
      <group position={[6.5, LAND_TOP, -6.5]}>
        <mesh material={m.white} position={[0, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.6, 1.6, 1.8]} />
        </mesh>
        <mesh material={m.pink} position={[0, 1.7, 1.05]} rotation={[0.35, 0, 0]} castShadow>
          <boxGeometry args={[2.8, 0.12, 0.9]} />
        </mesh>
        <mesh material={m.pink} position={[0, 1.75, 0]} castShadow>
          <boxGeometry args={[2.7, 0.2, 1.9]} />
        </mesh>
      </group>
      <House x={3} z={11.5} roof={m.roofBlue} m={m} scale={0.85} rot={-0.3} />
      <Castle x={7} z={-44} m={m} night={night} />
      <WiseTree x={-8.5} z={-43} m={m} />
      <City at={ISLES.city.at} r={ISLES.city.r} sz={ISLES.city.sz} night={night} />
      <Lighthouse at={ISLES.rock.at} m={m} night={night} reduced={reduced} />
      {CHAPTERS.map((c) => (
        <Lantern key={c.id} c={c} band={band} lit={lit.includes(c.id)} glow={0.15 + night * 0.85} />
      ))}
    </>
  );
}

export default function Scene3D({ active = true, onOpen, ...props }: Props) {
  const tags = useRef<Record<string, HTMLButtonElement | null>>({});
  return (
    <div className="scene3d" role="group" aria-label="The Lantern Lands in 3D. Each lantern is one chapter.">
      <Canvas
        shadows
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 1.6]}
        camera={{ position: [9, 15, 50], fov: 44, near: 0.5, far: 200000 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, powerPreference: 'high-performance' }}
      >
        <World {...props} tags={tags} />
      </Canvas>
      <div className="scene-tags">
        {CHAPTERS.map((c) => {
          const state = lanternState(c, props.band);
          const lit = props.lit.includes(c.id);
          const label = `${c.title}. ${c.question} ${c.number ? `Chapter ${c.number}. ` : ''}${STATUS_LABEL[c.status]}.${state === 'pick' ? ' Right for this age group.' : ''}${lit ? ' Played.' : ''}`;
          return (
            <button
              key={c.id}
              ref={(el) => {
                tags.current[c.id] = el;
              }}
              className={`scene-tag scene-tag-${state} ${lit ? 'is-lit' : ''}`}
              onClick={() => onOpen(c)}
              aria-label={label}
            >
              <span className="scene-tag-dot" aria-hidden="true" />
              {c.number ? <b>{c.number}</b> : null}
              {c.title}
              {lit && <span className="scene-tag-check" aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
