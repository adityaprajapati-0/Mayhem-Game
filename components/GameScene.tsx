
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { PlayerRole, GameState } from '../types';

interface GameSceneProps {
  gameState: GameState;
  onStatsUpdate: (updates: Partial<GameState>) => void;
}

class SoundManager {
  private ctx: AudioContext | null = null;
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  playImpact() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.07);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.07);
  }
}

const sounds = new SoundManager();

const GameScene: React.FC<GameSceneProps> = ({ gameState, onStatsUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const meshMap = useRef<Map<string, THREE.Group>>(new Map());
  const keys = useRef<{ [key: string]: boolean }>({});
  
  const mouse = useRef({ yaw: 0, pitch: -0.1 });
  const swingRef = useRef({ active: false, timer: 0 }); 
  const shakeRef = useRef(0);
  
  const velocity = useRef(new THREE.Vector3());
  const lift = useRef(0);

  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  const buildHuman = () => {
    const group = new THREE.Group();
    
    const skinMat = new THREE.MeshPhysicalMaterial({ 
      color: 0xffdbac, 
      roughness: 0.4, 
      metalness: 0, 
      sheen: 0.6,
      sheenColor: new THREE.Color(0xffffff),
      clearcoat: 0.1 
    });
    const clothMat = new THREE.MeshPhysicalMaterial({ 
      color: 0x27272a, 
      roughness: 0.8, 
      metalness: 0,
      sheen: 0.1
    });
    const pantMat = new THREE.MeshPhysicalMaterial({ color: 0x18181b, roughness: 0.9 });
    const hairMat = new THREE.MeshPhysicalMaterial({ color: 0x09090b, roughness: 0.95 });

    const hips = new THREE.Group();
    hips.position.y = 2.8; 
    group.add(hips);

    const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.35, 8, 16), pantMat);
    pelvis.rotation.z = Math.PI / 2;
    hips.add(pelvis);

    const waistGroup = new THREE.Group();
    waistGroup.position.y = 0.15;
    hips.add(waistGroup);

    const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.5, 16), clothMat);
    waist.position.y = 0.25;
    waistGroup.add(waist);

    const chestGroup = new THREE.Group();
    chestGroup.position.y = 0.5;
    waistGroup.add(chestGroup);
    chestGroup.name = "upper_torso";

    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.32, 0.8, 16), clothMat);
    chest.position.y = 0.35;
    chest.castShadow = true;
    chestGroup.add(chest);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.25, 12), skinMat);
    neck.position.y = 0.75;
    chest.add(neck);

    const headGroup = new THREE.Group();
    headGroup.position.y = 0.22;
    neck.add(headGroup);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), skinMat);
    skull.scale.set(1, 1.2, 1.1);
    skull.castShadow = true;
    headGroup.add(skull);

    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.28), skinMat);
    jaw.position.set(0, -0.15, 0.05);
    headGroup.add(jaw);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.6), hairMat);
    hair.position.y = 0.08;
    headGroup.add(hair);

    const buildArm = (side: number) => {
      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(side * 0.58, 0.6, 0);
      chest.add(shoulderPivot);

      const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), skinMat);
      shoulderPivot.add(deltoid);

      const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.6, 12), skinMat);
      bicep.position.y = -0.3;
      bicep.castShadow = true;
      shoulderPivot.add(bicep);

      const elbowPivot = new THREE.Group();
      elbowPivot.position.y = -0.6;
      shoulderPivot.add(elbowPivot);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.65, 12), skinMat);
      forearm.position.y = -0.35;
      forearm.castShadow = true;
      elbowPivot.add(forearm);

      const wristPivot = new THREE.Group();
      wristPivot.position.y = -0.7;
      elbowPivot.add(wristPivot);

      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.06), skinMat);
      hand.position.y = -0.08;
      wristPivot.add(hand);

      return { shoulderPivot, elbowPivot, wristPivot };
    };

    const armL = buildArm(-1);
    const armR = buildArm(1);
    armL.shoulderPivot.name = "l_shoulder";
    armR.shoulderPivot.name = "r_shoulder";

    const racket = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6), new THREE.MeshPhysicalMaterial({ color: 0x111111 }));
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8), new THREE.MeshPhysicalMaterial({ color: 0x888888, metalness: 1, roughness: 0.1 }));
    shaft.position.y = 1.2;
    const headFrame = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.03, 8, 32), new THREE.MeshPhysicalMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.2 }));
    headFrame.scale.set(0.8, 1.2, 1);
    headFrame.position.y = 2.75;
    racket.add(handle, shaft, headFrame);
    racket.rotation.set(-Math.PI / 2.1, 0, 0); 
    racket.position.set(0, -0.15, 0.3);
    armR.wristPivot.add(racket);

    const buildLeg = (side: number) => {
      const hipPivot = new THREE.Group();
      hipPivot.position.set(side * 0.22, 0, 0);
      hips.add(hipPivot);

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 1.2, 16), pantMat);
      thigh.position.y = -0.6;
      thigh.castShadow = true;
      hipPivot.add(thigh);

      const kneePivot = new THREE.Group();
      kneePivot.position.y = -1.2;
      hipPivot.add(kneePivot);

      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 1.1, 16), skinMat);
      calf.position.y = -0.55;
      calf.castShadow = true;
      kneePivot.add(calf);

      const anklePivot = new THREE.Group();
      anklePivot.position.y = -1.1;
      kneePivot.add(anklePivot);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.5), new THREE.MeshPhysicalMaterial({ color: 0x09090b }));
      foot.position.set(0, -0.05, 0.12);
      anklePivot.add(foot);

      return { hipPivot, kneePivot };
    };

    const legL = buildLeg(-1); legL.hipPivot.name = "l_hip"; legL.kneePivot.name = "l_knee";
    const legR = buildLeg(1); legR.hipPivot.name = "r_hip"; legR.kneePivot.name = "r_knee";

    return group;
  };

  const buildMosquito = () => {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshPhysicalMaterial({ 
      color: 0x080808, 
      metalness: 0.9, 
      roughness: 0.2,
      iridescence: 1.0,
      iridescenceIOR: 1.5,
    });
    const wingMat = new THREE.MeshPhysicalMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.3, 
      transmission: 0.8,
      thickness: 0.1,
      roughness: 0,
      clearcoat: 1,
      side: THREE.DoubleSide
    });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x330000, metalness: 1, roughness: 0 });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), bodyMat);
    group.add(head);

    const proboscis = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.002, 0.4), bodyMat);
    proboscis.rotation.x = -Math.PI/2;
    proboscis.position.z = 0.25;
    head.add(proboscis);

    const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMat); lEye.position.set(0.07, 0.05, 0.05); head.add(lEye);
    const rEye = lEye.clone(); rEye.position.x = -0.07; head.add(rEye);

    const thorax = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.2, 8, 8), bodyMat);
    thorax.position.z = -0.15;
    thorax.rotation.x = Math.PI/2.5;
    group.add(thorax);

    const abdomen = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.45, 8, 8), bodyMat);
    abdomen.position.set(0, -0.15, -0.45);
    abdomen.rotation.x = Math.PI/3.5;
    abdomen.name = "abdomen";
    group.add(abdomen);

    for (let i = 0; i < 6; i++) {
      const legGroup = new THREE.Group();
      const side = i % 2 === 0 ? 1 : -1;
      const row = Math.floor(i / 2);
      legGroup.position.set(side * 0.1, -0.05, -0.1 - row * 0.08);
      const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4), bodyMat);
      femur.rotation.z = side * Math.PI/3; femur.position.x = side * 0.15;
      legGroup.add(femur);
      const tibia = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.5), bodyMat);
      tibia.position.set(side * 0.3, -0.2, 0); tibia.rotation.z = -side * Math.PI/6;
      legGroup.add(tibia);
      group.add(legGroup);
    }

    const wingsGroup = new THREE.Group();
    wingsGroup.position.y = 0.1; wingsGroup.position.z = -0.15;
    group.add(wingsGroup);

    const wL = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.25), wingMat);
    wL.geometry.translate(-0.3, 0, 0); wL.position.x = -0.05; wL.name = "wingL";
    wingsGroup.add(wL);
    const wR = wL.clone(); wR.scale.x = -1; wR.position.x = 0.05; wR.name = "wingR";
    wingsGroup.add(wR);

    group.castShadow = true;
    return group;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    sounds.init();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.8); scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfffaf0, 2.5); sun.position.set(40, 100, 40); sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096); 
    scene.add(sun);
    
    const bounce = new THREE.PointLight(0xbfdbfe, 0.5, 500); bounce.position.set(-50, 20, -50); scene.add(bounce);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhysicalMaterial({ 
      color: 0xf8fafc, roughness: 0.05, metalness: 0.1, clearcoat: 0.2 
    }));
    floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
    scene.add(new THREE.GridHelper(1000, 100, 0xe2e8f0, 0xf1f5f9));

    const localId = stateRef.current.localPlayerId;
    stateRef.current.players.forEach(p => {
      const m = p.role === PlayerRole.HUMAN ? buildHuman() : buildMosquito();
      m.position.set(p.position[0], p.position[1], p.position[2]);
      scene.add(m); meshMap.current.set(p.id, m);
    });

    const handleInput = () => {
      if (document.pointerLockElement !== renderer.domElement) renderer.domElement.requestPointerLock();
      else if (stateRef.current.players.find(p=>p.id===localId)?.role === PlayerRole.HUMAN && !swingRef.current.active) {
        swingRef.current.active = true; swingRef.current.timer = 0;
        shakeRef.current = 0.5; sounds.playImpact();
      }
    };
    window.addEventListener('mousedown', handleInput);
    window.addEventListener('keydown', (e) => keys.current[e.code.toUpperCase()] = true);
    window.addEventListener('keyup', (e) => keys.current[e.code.toUpperCase()] = false);

    let frameId: number;
    const animate = () => {
      const dt = Math.min(clockRef.current.getDelta(), 0.1);
      
      meshMap.current.forEach((mesh, id) => {
        const p = stateRef.current.players.find(pl => pl.id === id);
        if (!p || !p.isAlive) return;

        if (id === localId) {
          if (p.role === PlayerRole.HUMAN) {
            mesh.rotation.y = mouse.current.yaw;
            const speed = 35 * dt;
            const f = new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0), mesh.rotation.y);
            const r = new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0), mesh.rotation.y);
            if (keys.current['KEYW']) mesh.position.addScaledVector(f, speed);
            if (keys.current['KEYS']) mesh.position.addScaledVector(f, -speed);
            if (keys.current['KEYA']) mesh.position.addScaledVector(r, -speed);
            if (keys.current['KEYD']) mesh.position.addScaledVector(r, speed);

            const moving = keys.current['KEYW'] || keys.current['KEYS'] || keys.current['KEYA'] || keys.current['KEYD'];
            const cycle = performance.now() * 0.01;
            
            ['l_hip', 'r_hip', 'l_knee', 'r_knee'].forEach(n => {
              const o = mesh.getObjectByName(n);
              if (o) {
                const baseRotation = moving ? Math.sin(cycle + (n.startsWith('r') ? Math.PI : 0)) * 0.6 : 0;
                o.rotation.x = THREE.MathUtils.lerp(o.rotation.x, baseRotation, 0.15);
              }
            });
            
            const armL = mesh.getObjectByName('l_shoulder');
            if (armL) {
              const sway = moving ? Math.sin(cycle + Math.PI) * 0.4 : 0;
              armL.rotation.x = THREE.MathUtils.lerp(armL.rotation.x, sway, 0.1);
            }

            if (swingRef.current.active) {
              swingRef.current.timer += dt;
              const sh = mesh.getObjectByName('r_shoulder');
              const torso = mesh.getObjectByName('upper_torso');
              if (sh && torso) {
                // SLOW SWING CONFIGURATION (0.8s duration)
                const duration = 0.8;
                const t = Math.min(swingRef.current.timer / duration, 1);
                const val = Math.sin(t * Math.PI);
                sh.rotation.x = -val * 3.2; // Full 180 degree rotation at peak
                torso.rotation.x = val * 0.35; // Deeper torso pitch for the slow heavy hit
                
                if (swingRef.current.timer >= duration) { 
                  swingRef.current.active = false; 
                  sh.rotation.x = 0;
                  torso.rotation.x = 0;
                }
              }
            }
          } else {
            const accel = 150 * dt;
            const friction = 0.95;
            const targetVel = new THREE.Vector3();
            const f = new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(mouse.current.pitch, mouse.current.yaw, 0, 'YXZ'));
            const r = new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0), mouse.current.yaw);
            if (keys.current['KEYW']) targetVel.add(f);
            if (keys.current['KEYS']) targetVel.add(f.clone().negate());
            if (keys.current['KEYA']) targetVel.add(r.clone().negate());
            if (keys.current['KEYD']) targetVel.add(r);
            velocity.current.add(targetVel.multiplyScalar(accel));
            velocity.current.multiplyScalar(friction);
            mesh.position.add(velocity.current.clone().multiplyScalar(dt));

            if (keys.current['SPACE']) lift.current = THREE.MathUtils.lerp(lift.current, 50, 0.1);
            else if (keys.current['SHIFTLEFT']) lift.current = THREE.MathUtils.lerp(lift.current, -50, 0.1);
            else lift.current = THREE.MathUtils.lerp(lift.current, 0, 0.05);
            mesh.position.y = Math.max(0.5, mesh.position.y + lift.current * dt);

            const buzz = performance.now() * 0.05;
            mesh.position.x += Math.sin(buzz) * 0.01;
            mesh.position.y += Math.cos(buzz * 1.5) * 0.01;
            mesh.rotation.y = mouse.current.yaw;
            mesh.rotation.x = mouse.current.pitch;
            const wL = mesh.getObjectByName('wingL');
            const wR = mesh.getObjectByName('wingR');
            if (wL && wR) {
              const wingCycle = performance.now() * 0.15;
              wL.rotation.z = Math.sin(wingCycle) * 0.8;
              wR.rotation.z = -Math.sin(wingCycle) * 0.8;
            }
          }

          const camOffset = new THREE.Vector