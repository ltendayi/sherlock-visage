import * as React from 'react';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Box, 
  Sphere, 
  Edges, 
  MeshTransmissionMaterial,
  Float,
  Trail,
  Stars,
  Line,
  Grid
} from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// AGENT DATA - 10 AI Agents for Sherlock Visage
// ============================================================================

export type AgentStatus = 'online' | 'offline' | 'busy' | 'idle';

export interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  avatarType: 'cube' | 'sphere';
  baseColor: string;
  status: AgentStatus;
  position: [number, number, number];
  workstationId: number;
  currentTask: string;
  costAccumulated: number;
  taskProgress: number;
  pulseActive: boolean;
}

const INITIAL_AGENTS: Agent[] = [
  {
    id: 'sherlock_3d',
    name: 'Sherlock 3D',
    role: '3D Visualization Specialist',
    model: 'Kimi-K2.5',
    avatarType: 'cube',
    baseColor: '#00d4ff',
    status: 'online',
    position: [-5, 1, -3],
    workstationId: 1,
    currentTask: 'Rendering dashboard components',
    costAccumulated: 12.45,
    taskProgress: 75,
    pulseActive: true,
  },
  {
    id: 'sherlock_ux',
    name: 'Sherlock UX',
    role: 'UX/UI Design Agent',
    model: 'Claude-Sonnet-4',
    avatarType: 'sphere',
    baseColor: '#ff00ff',
    status: 'busy',
    position: [-2, 1, -5],
    workstationId: 2,
    currentTask: 'Designing interface prototypes',
    costAccumulated: 8.92,
    taskProgress: 45,
    pulseActive: true,
  },
  {
    id: 'sherlock_backend',
    name: 'Sherlock Backend',
    role: 'API & Database Architect',
    model: 'DeepSeek-V3.2',
    avatarType: 'cube',
    baseColor: '#2ecc71',
    status: 'online',
    position: [2, 1, -5],
    workstationId: 3,
    currentTask: 'Optimizing API endpoints',
    costAccumulated: 5.33,
    taskProgress: 90,
    pulseActive: false,
  },
  {
    id: 'volt_frontend',
    name: 'Volt Frontend',
    role: 'React/Vite Architect',
    model: 'DeepSeek-R1',
    avatarType: 'cube',
    baseColor: '#f39c12',
    status: 'idle',
    position: [5, 1, -3],
    workstationId: 4,
    currentTask: 'Waiting for backend changes',
    costAccumulated: 3.21,
    taskProgress: 20,
    pulseActive: false,
  },
  {
    id: 'volt_backend',
    name: 'Volt Backend',
    role: '.NET Core Engineer',
    model: 'DeepSeek-V3.2',
    avatarType: 'cube',
    baseColor: '#9b59b6',
    status: 'online',
    position: [6, 1, 0],
    workstationId: 5,
    currentTask: 'Payment gateway integration',
    costAccumulated: 15.67,
    taskProgress: 60,
    pulseActive: true,
  },
  {
    id: 'volt_fintech',
    name: 'Volt Fintech',
    role: 'M-Pesa Integration Lead',
    model: 'GPT-4o',
    avatarType: 'sphere',
    baseColor: '#e74c3c',
    status: 'busy',
    position: [5, 1, 3],
    workstationId: 6,
    currentTask: 'STK Push implementation',
    costAccumulated: 22.10,
    taskProgress: 35,
    pulseActive: true,
  },
  {
    id: 'volt_devops',
    name: 'Volt DevOps',
    role: 'Infrastructure Engineer',
    model: 'Claude-Sonnet-4',
    avatarType: 'cube',
    baseColor: '#1abc9c',
    status: 'online',
    position: [2, 1, 5],
    workstationId: 6,
    currentTask: 'Docker orchestration setup',
    costAccumulated: 7.84,
    taskProgress: 80,
    pulseActive: false,
  },
  {
    id: 'volt_data_arch',
    name: 'Volt Data Arch',
    role: 'Database Architect',
    model: 'DeepSeek-R1',
    avatarType: 'sphere',
    baseColor: '#3498db',
    status: 'idle',
    position: [-2, 1, 5],
    workstationId: 1,
    currentTask: 'Schema optimization review',
    costAccumulated: 4.56,
    taskProgress: 10,
    pulseActive: false,
  },
  {
    id: 'volt_automation',
    name: 'Volt Automation',
    role: 'SMS/Reminder Engine',
    model: 'Grok-4-1-fast',
    avatarType: 'cube',
    baseColor: '#34495e',
    status: 'online',
    position: [-5, 1, 3],
    workstationId: 2,
    currentTask: 'Africa\'s Talking API testing',
    costAccumulated: 9.33,
    taskProgress: 55,
    pulseActive: true,
  },
  {
    id: 'volt_bi',
    name: 'Volt BI',
    role: 'Business Intelligence',
    model: 'Kimi-K2.5',
    avatarType: 'sphere',
    baseColor: '#e91e63',
    status: 'offline',
    position: [-6, 1, 0],
    workstationId: 3,
    currentTask: 'Dashboard analytics update',
    costAccumulated: 0.00,
    taskProgress: 0,
    pulseActive: false,
  },
];

// ============================================================================
// STATUS COLORS
// ============================================================================

const STATUS_COLORS: Record<AgentStatus, string> = {
  online: '#52c41a',
  offline: '#8c8c8c',
  busy: '#f5222d',
  idle: '#faad14',
};

const STATUS_GLOW: Record<AgentStatus, number> = {
  online: 0.8,
  offline: 0.2,
  busy: 1.2,
  idle: 0.5,
};

// ============================================================================
// NEON LIGHT COMPONENT
// ============================================================================

function NeonLight({ position, color, intensity = 1 }: { position: [number, number, number]; color: string; intensity?: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = intensity + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={color}
      intensity={intensity}
      distance={15}
      decay={2}
    />
  );
}

// ============================================================================
// FLOOR WITH NEON ACCENTS
// ============================================================================

function NeonFloor() {
  const neonLine1Ref = useRef<THREE.Mesh>(null);
  const neonLine2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (neonLine1Ref.current) {
      const material = neonLine1Ref.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
    }
    if (neonLine2Ref.current) {
      const material = neonLine2Ref.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2 + 1) * 0.2;
    }
  });

  return (
    <group>
      {/* Base floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial 
          color="#0a0a0f" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Grid with subtle lighting - using drei Grid */}
      <Grid
        position={[0, 0, 0]}
        args={[25, 25]}
        cellColor="#1a1a2e"
        sectionColor="#0f0f1a"
        cellThickness={0.5}
        sectionThickness={1}
        fadeDistance={50}
      />
      
      {/* Cyan neon accent line */}
      <mesh 
        ref={neonLine1Ref}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.01, -5]}
      >
        <planeGeometry args={[20, 0.3]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.6} />
      </mesh>
      
      {/* Magenta neon accent line */}
      <mesh 
        ref={neonLine2Ref}
        rotation={[-Math.PI / 2, 0, Math.PI / 4]} 
        position={[5, 0.01, 5]}
      >
        <planeGeometry args={[15, 0.2]} />
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.4} />
      </mesh>
      
      {/* Additional neon accents */}
      <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} position={[-5, 0.01, 5]}>
        <planeGeometry args={[10, 0.15]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ============================================================================
// GLASS TERMINAL/WORKSTATION
// ============================================================================

interface GlassTerminalProps {
  position: [number, number, number];
  color: string;
  workstationId: number;
  isSelected: boolean;
  onClick: () => void;
}

function GlassTerminal({ position, color, workstationId, isSelected, onClick }: GlassTerminalProps) {
  const terminalRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (terminalRef.current) {
      // Subtle floating animation
      terminalRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + workstationId) * 0.05;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group position={position}>
        {/* Main glass terminal */}
        <mesh ref={terminalRef} onClick={onClick} castShadow>
          <boxGeometry args={[2.5, 1.8, 0.3]} />
          <MeshTransmissionMaterial
            backside
            samples={6}
            resolution={512}
            transmission={0.85}
            roughness={0.1}
            thickness={0.4}
            ior={1.5}
            chromaticAberration={0.02}
            color={color}
            transparent
            opacity={0.4}
          />
        </mesh>
        
        {/* Glowing edges */}
        <mesh position={[0, 0, 0.16]}>
          <boxGeometry args={[2.55, 1.85, 0.05]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
        
        {/* Selection highlight ring */}
        {isSelected && (
          <mesh position={[0, 0, -0.5]}>
            <ringGeometry args={[1.5, 1.6, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        )}
        
        {/* Terminal ID label (3D plane, not text) */}
        <mesh position={[0, -1.2, 0]}>
          <planeGeometry args={[1.2, 0.4]} />
          <meshBasicMaterial color="#0a0a0f" transparent opacity={0.8} />
        </mesh>
        
        {/* Glowing connection line to floor */}
        <Line
          points={[[0, -0.9, 0], [0, -1, 0]]}
          color={color}
          lineWidth={2}
          transparent
          opacity={0.5}
        />
        
        <Edges scale={1.02} threshold={15} color={color} />
      </group>
    </Float>
  );
}

// ============================================================================
// AGENT AVATAR COMPONENT
// ============================================================================

interface AgentAvatarProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function AgentAvatar({ agent, isSelected, onClick, onHover }: AgentAvatarProps) {
  const avatarRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const pulseRef = useRef<number>(0);

  const statusColor = STATUS_COLORS[agent.status];
  const glowIntensity = STATUS_GLOW[agent.status] * (isSelected ? 2 : 1);

  useFrame((state) => {
    if (!avatarRef.current) return;
    
    // Floating animation
    const floatY = Math.sin(state.clock.elapsedTime * 1.5 + agent.position[0]) * 0.1;
    avatarRef.current.position.y = agent.position[1] + 1 + floatY;
    
    // Rotation animation
    avatarRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    avatarRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    
    // Pulsing glow when active
    if (agent.pulseActive || isSelected) {
      pulseRef.current += 0.05;
      const pulse = Math.sin(pulseRef.current) * 0.3 + 0.7;
      if (glowRef.current) {
        glowRef.current.intensity = glowIntensity * pulse;
      }
      const scale = 1 + (agent.status === 'busy' ? Math.sin(pulseRef.current * 2) * 0.1 : 0);
      avatarRef.current.scale.setScalar(scale);
    }
  });

  const avatarGeometry = agent.avatarType === 'cube' 
    ? <boxGeometry args={[0.6, 0.6, 0.6]} />
    : <sphereGeometry args={[0.35, 32, 32]} />;

  return (
    <group position={agent.position}>
      {/* Status glow light */}
      <pointLight
        ref={glowRef}
        position={[0, 2, 0]}
        color={statusColor}
        intensity={glowIntensity}
        distance={8}
        decay={2}
      />
      
      {/* Main avatar mesh */}
      <mesh
        ref={avatarRef}
        position={[0, 1, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {avatarGeometry}
        <meshStandardMaterial
          color={agent.baseColor}
          emissive={agent.baseColor}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* Status indicator ring */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.55, 32]} />
        <meshBasicMaterial 
          color={statusColor} 
          transparent 
          opacity={isSelected ? 0.8 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.9, 32, 32]} />
          <meshBasicMaterial 
            color={agent.baseColor} 
            transparent 
            opacity={0.2}
            wireframe
          />
        </mesh>
      )}
      
      {/* Hover glow effect */}
      {(agent.pulseActive || isSelected) && (
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial 
            color={statusColor} 
            transparent 
            opacity={0.15}
          />
        </mesh>
      )}
      
      {/* Connection trail to workstation */}
      {agent.pulseActive && (
        <Trail
          width={0.05}
          color={agent.baseColor}
          length={4}
          decay={1}
          local={false}
          stride={0}
          interval={2}
          attenuation={(width) => width}
        >
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color={agent.baseColor} />
          </mesh>
        </Trail>
      )}
    </group>
  );
}

// ============================================================================
// VANTA-STYLE FOG PARTICLES
// ============================================================================

function VantaParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleCount = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = Math.random() * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3 + 1;
        positions[idx] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.002;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#00d4ff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// ============================================================================
// CAMERA CONTROLLER (ISOMETRIC - NO ROTATE)
// ============================================================================

function IsometricCameraController({ selectedPosition }: { selectedPosition: [number, number, number] | null }) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(8, 8, 8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (selectedPosition) {
      targetLookAt.current.set(selectedPosition[0], 0, selectedPosition[2]);
      targetPosition.current.set(
        selectedPosition[0] + 5,
        selectedPosition[1] + 5,
        selectedPosition[2] + 5
      );
    } else {
      targetLookAt.current.set(0, 0, 0);
      targetPosition.current.set(8, 8, 8);
    }
  }, [selectedPosition]);

  useFrame(() => {
    camera.position.lerp(targetPosition.current, 0.05);
    camera.lookAt(targetLookAt.current);
  });

  return (
    <OrbitControls
      enableRotate={false}
      enableZoom={true}
      enablePan={true}
      minDistance={5}
      maxDistance={15}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 3}
      target={[0, 0, 0]}
    />
  );
}

// ============================================================================
// WORKSTATION POSITIONS
// ============================================================================

const WORKSTATIONS = [
  { id: 1, position: [-4, 0, -4] as [number, number, number], color: '#00d4ff' },
  { id: 2, position: [-2, 0, -6] as [number, number, number], color: '#ff00ff' },
  { id: 3, position: [2, 0, -6] as [number, number, number], color: '#00d4ff' },
  { id: 4, position: [4, 0, -4] as [number, number, number], color: '#ff00ff' },
  { id: 5, position: [5, 0, 0] as [number, number, number], color: '#00d4ff' },
  { id: 6, position: [4, 0, 4] as [number, number, number], color: '#ff00ff' },
];

// ============================================================================
// SCENE COMPONENT
// ============================================================================

function Scene({ 
  agents, 
  selectedAgent, 
  onAgentSelect,
  hoveredAgent,
  onAgentHover 
}: { 
  agents: Agent[];
  selectedAgent: string | null;
  onAgentSelect: (id: string | null) => void;
  hoveredAgent: string | null;
  onAgentHover: (id: string | null) => void;
}) {
  const selectedPosition = useMemo(() => {
    if (!selectedAgent) return null;
    const agent = agents.find(a => a.id === selectedAgent);
    return agent ? agent.position : null;
  }, [selectedAgent, agents]);

  return (
    <>
      {/* Fog for depth - Vanta black aesthetic */}
      <fog attach="fog" args={['#0a0a0f', 8, 25]} />
      
      {/* Ambient lighting */}
      <ambientLight intensity={0.2} color="#1a1a2e" />
      
      {/* Directional light for shadows */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.5}
        castShadow
        color="#ffffff"
      />
      
      {/* Neon accent lights */}
      <NeonLight position={[-5, 3, -5]} color="#00d4ff" intensity={0.8} />
      <NeonLight position={[5, 3, 5]} color="#ff00ff" intensity={0.6} />
      <NeonLight position={[0, 4, 0]} color="#ffffff" intensity={0.3} />
      
      {/* Environment */}
      <NeonFloor />
      <VantaParticles />
      
      {/* Stars background */}
      <Stars radius={50} depth={50} count={500} factor={4} saturation={0} fade speed={0.5} />
      
      {/* Workstations/Terminals */}
      {WORKSTATIONS.map((ws) => (
        <GlassTerminal
          key={ws.id}
          position={ws.position}
          color={ws.color}
          workstationId={ws.id}
          isSelected={selectedAgent?.includes(`workstation_${ws.id}`) || false}
          onClick={() => onAgentSelect(`workstation_${ws.id}`)}
        />
      ))}
      
      {/* Agent Avatars */}
      {agents.map((agent) => (
        <AgentAvatar
          key={agent.id}
          agent={agent}
          isSelected={selectedAgent === agent.id}
          onClick={() => onAgentSelect(selectedAgent === agent.id ? null : agent.id)}
          onHover={(hovered) => onAgentHover(hovered ? agent.id : null)}
        />
      ))}
      
      {/* Camera controller */}
      <IsometricCameraController selectedPosition={selectedPosition} />
    </>
  );
}

// ============================================================================
// AGENT DETAIL PANEL (HTML OVERLAY)
// ============================================================================

function AgentDetailPanel({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  if (!agent) return null;

  const statusColor = STATUS_COLORS[agent.status];
  
  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '320px',
        background: 'rgba(10, 10, 15, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: `2px solid ${agent.baseColor}`,
        padding: '20px',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: `0 0 30px ${agent.baseColor}40`,
        zIndex: 100,
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      {/* Glass morphism header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            marginRight: '12px',
            boxShadow: `0 0 10px ${statusColor}`,
            animation: agent.pulseActive ? 'pulse 1s ease-in-out infinite' : 'none',
          }}
        />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: agent.baseColor }}>
            {agent.name}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7 }}>
            {agent.role}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '20px',
            cursor: 'pointer',
            opacity: 0.6,
          }}
        >
          ×
        </button>
      </div>

      {/* Agent details */}
      <div style={{ marginBottom: '16px' }}>
        <DetailRow label="ID" value={agent.id} />
        <DetailRow label="Model" value={agent.model} />
        <DetailRow label="Status" value={agent.status.toUpperCase()} color={statusColor} />
        <DetailRow label="Workstation" value={`WS-${agent.workstationId}`} />
      </div>

      {/* Current task */}
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
        }}
      >
        <p style={{ margin: '0 0 8px 0', fontSize: '11px', opacity: 0.5, textTransform: 'uppercase' }}>
          Current Task
        </p>
        <p style={{ margin: 0, fontSize: '14px' }}>{agent.currentTask}</p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', opacity: 0.5 }}>Task Progress</span>
          <span style={{ fontSize: '11px', color: agent.baseColor }}>{agent.taskProgress}%</span>
        </div>
        <div
          style={{
            height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${agent.taskProgress}%`,
              background: `linear-gradient(90deg, ${agent.baseColor}, ${statusColor})`,
              borderRadius: '2px',
              transition: 'width 0.5s ease',
              boxShadow: `0 0 10px ${agent.baseColor}`,
            }}
          />
        </div>
      </div>

      {/* Cost accumulation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px',
          background: 'rgba(0, 212, 255, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 212, 255, 0.2)',
        }}
      >
        <span style={{ fontSize: '12px', opacity: 0.7 }}>Cost Accumulated</span>
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#00d4ff' }}>
          ${agent.costAccumulated.toFixed(2)}
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontSize: '12px', opacity: 0.5 }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 500, color: color || '#ffffff' }}>{value}</span>
    </div>
  );
}

// ============================================================================
// AGENT LIST OVERLAY
// ============================================================================

function AgentListOverlay({ agents, selectedAgent, onSelect }: { 
  agents: Agent[]; 
  selectedAgent: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(10, 10, 15, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: '12px',
        padding: '16px',
        maxHeight: '300px',
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>
        Active Agents
      </h4>
      {agents.map((agent) => (
        <div
          key={agent.id}
          onClick={() => onSelect(agent.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            marginBottom: '4px',
            borderRadius: '8px',
            cursor: 'pointer',
            background: selectedAgent === agent.id ? 'rgba(255,255,255,0.1)' : 'transparent',
            borderLeft: `3px solid ${agent.baseColor}`,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: STATUS_COLORS[agent.status],
              marginRight: '10px',
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 500 }}>{agent.name}</div>
            <div style={{ fontSize: '10px', opacity: 0.5 }}>{agent.status}</div>
          </div>
          <div style={{ fontSize: '11px', color: '#00d4ff' }}>
            ${agent.costAccumulated.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface IsometricOfficeProps {
  onAgentSelect?: (agent: Agent | null) => void;
  simulationEnabled?: boolean;
}

export default function IsometricOffice({ 
  onAgentSelect,
  simulationEnabled = true 
}: IsometricOfficeProps) {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);

  // Calculate total cost
  useEffect(() => {
    const total = agents.reduce((sum, agent) => sum + agent.costAccumulated, 0);
    setTotalCost(total);
  }, [agents]);

  // Real-time simulation - rotate status every 10 seconds
  useEffect(() => {
    if (!simulationEnabled) return;

    const statusRotationInterval = setInterval(() => {
      setAgents(prevAgents => {
        const statuses: AgentStatus[] = ['online', 'offline', 'busy', 'idle'];
        return prevAgents.map(agent => {
          // 30% chance to change status
          if (Math.random() < 0.3) {
            const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
            return {
              ...agent,
              status: newStatus,
              pulseActive: newStatus === 'online' || newStatus === 'busy',
            };
          }
          return agent;
        });
      });
    }, 10000);

    return () => clearInterval(statusRotationInterval);
  }, [simulationEnabled]);

  // Real-time simulation - accumulating costs
  useEffect(() => {
    if (!simulationEnabled) return;

    const costInterval = setInterval(() => {
      setAgents(prevAgents => 
        prevAgents.map(agent => {
          if (agent.status === 'online' || agent.status === 'busy') {
            // Add small random cost increment
            const costIncrement = Math.random() * 0.05;
            // Slowly increase task progress
            const progressIncrement = agent.taskProgress < 100 ? Math.random() * 2 : 0;
            return {
              ...agent,
              costAccumulated: agent.costAccumulated + costIncrement,
              taskProgress: Math.min(100, agent.taskProgress + progressIncrement),
            };
          }
          return agent;
        })
      );
    }, 1000);

    return () => clearInterval(costInterval);
  }, [simulationEnabled]);

  // Handle agent selection
  const handleAgentSelect = useCallback((id: string | null) => {
    setSelectedAgent(id);
    const agent = id ? agents.find(a => a.id === id) || null : null;
    onAgentSelect?.(agent);
  }, [agents, onAgentSelect]);

  const selectedAgentData = useMemo(() => {
    return agents.find(a => a.id === selectedAgent) || null;
  }, [selectedAgent, agents]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0f' }}>
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ 
          position: [8, 8, 8], 
          fov: 50,
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: '#0a0a0f' }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <Scene 
          agents={agents}
          selectedAgent={selectedAgent}
          onAgentSelect={handleAgentSelect}
          hoveredAgent={hoveredAgent}
          onAgentHover={setHoveredAgent}
        />
      </Canvas>

      {/* Agent Detail Panel */}
      <AgentDetailPanel 
        agent={selectedAgentData} 
        onClose={() => handleAgentSelect(null)} 
      />

      {/* Agent List Overlay */}
      <AgentListOverlay 
        agents={agents}
        selectedAgent={selectedAgent}
        onSelect={handleAgentSelect}
      />

      {/* Total Cost Counter */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(10, 10, 15, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          padding: '16px 24px',
          border: '1px solid rgba(0, 212, 255, 0.3)',
        }}
      >
        <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px', textTransform: 'uppercase' }}>
          Total Session Cost
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#00d4ff' }}>
          ${totalCost.toFixed(2)}
        </div>
        <div style={{ fontSize: '10px', opacity: 0.4, marginTop: '4px' }}>
          Updating in real-time
        </div>
      </div>

      {/* Controls hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(10, 10, 15, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '4px', color: '#fff' }}>🎮 Controls</div>
        <div>🖱️ Drag to pan</div>
        <div>🔍 Scroll to zoom</div>
        <div>👆 Click avatars for details</div>
      </div>

      {/* Nairobi HQ Label */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.03)',
            textTransform: 'uppercase',
            letterSpacing: '20px',
            userSelect: 'none',
          }}
        >
          Nairobi HQ
        </div>
      </div>
    </div>
  );
}

// Re-export types for external use
export { INITIAL_AGENTS, STATUS_COLORS, STATUS_GLOW, WORKSTATIONS };
