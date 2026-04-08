import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, Text, Box, Edges, MeshTransmissionMaterial, Environment, SoftShadows, AccumulativeShadows, RandomizedLight } from '@react-three/drei';
import * as THREE from 'three';

// Agent data with colors and positions
const AGENTS = [
  { id: 1, name: 'Strategic Architect', color: '#3498db', position: [-6, 0, 0], model: 'DeepSeek-R1', status: 'active', cost: 2.0 },
  { id: 2, name: 'Lead Developer', color: '#2ecc71', position: [-3, 0, -3], model: 'DeepSeek-V3.2', status: 'active', cost: 0.3 },
  { id: 3, name: 'Security Auditor', color: '#e74c3c', position: [0, 0, -6], model: 'GPT-4o', status: 'idle', cost: 1.0 },
  { id: 4, name: 'Rapid Prototyper', color: '#f39c12', position: [3, 0, -3], model: 'grok-4-1-fast-non-reasoning', status: 'active', cost: 0.1 },
  { id: 5, name: 'Algorithm Specialist', color: '#9b59b6', position: [6, 0, 0], model: 'Kimi-K2.5', status: 'idle', cost: 1.5 },
  { id: 6, name: 'Crisis Resolver', color: '#1abc9c', position: [3, 0, 3], model: 'DeepSeek-R1', status: 'error', cost: 3.0 },
  { id: 7, name: 'Documentation Specialist', color: '#34495e', position: [0, 0, 6], model: 'text-embedding-3-small', status: 'active', cost: 0.05 },
];

// Glass Terminal Component
interface GlassTerminalProps {
  position: [number, number, number];
  color: string;
  agentName: string;
  agentModel: string;
  status: string;
  isSelected: boolean;
  onClick: () => void;
}

const GlassTerminal: React.FC<GlassTerminalProps> = ({ 
  position, 
  color, 
  agentName, 
  agentModel, 
  status,
  isSelected, 
  onClick 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.Mesh>(null);
  
  // Floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return '#52c41a';
      case 'idle': return '#fa8c16';
      case 'error': return '#f5222d';
      default: return '#8c8c8c';
    }
  };

  return (
    <group position={position}>
      {/* Floating animation wrapper */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Main glass terminal */}
        <mesh ref={meshRef} onClick={onClick} castShadow receiveShadow>
          <boxGeometry args={[2, 1.5, 0.2]} />
          <MeshTransmissionMaterial
            backside
            samples={4}
            resolution={512}
            transmission={0.8}
            roughness={0.1}
            thickness={0.5}
            ior={1.5}
            chromaticAberration={0.02}
            anisotropy={0.1}
            distortion={0.1}
            distortionScale={0.1}
            temporalDistortion={0.1}
            color={color}
            attenuationColor="#ffffff"
            attenuationDistance={0.5}
          />
        </mesh>
        
        {/* Edge lighting */}
        <mesh ref={edgesRef}>
          <boxGeometry args={[2.01, 1.51, 0.21]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
          <Edges threshold={15} scale={1} color={color} />
        </mesh>
        
        {/* Status indicator */}
        <mesh position={[0.8, 0.5, 0.11]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color={getStatusColor(status)} />
        </mesh>
        
        {/* Agent name label */}
        <Text
          position={[0, -0.6, 0.11]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {agentName.split(' ')[0]}
        </Text>
        
        {/* Selection highlight */}
        {isSelected && (
          <mesh position={[0, 0, 0.12]}>
            <ringGeometry args={[1.2, 1.3, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        )}
      </Float>
      
      {/* Connection lines to center */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, position[0] * 0.3, 0, position[2] * 0.3])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.3} linewidth={1} />
      </line>
    </group>
  );
};

// Floor Grid Component
const FloorGrid: React.FC = () => {
  const gridSize = 20;
  const gridDivisions = 20;
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <planeGeometry args={[gridSize, gridSize]} />
      <meshStandardMaterial 
        color="#1a1a2e" 
        roughness={0.8}
        metalness={0.2}
        transparent
        opacity={0.3}
      />
      <gridHelper args={[gridSize, gridDivisions, '#3498db', '#2c3e50']} />
    </mesh>
  );
};

// Central Hub Component
const CentralHub: React.FC = () => {
  const hubRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (hubRef.current) {
      hubRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Rotating central hub */}
      <mesh ref={hubRef} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1.5, 0.5, 16]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          resolution={512}
          transmission={0.9}
          roughness={0.05}
          thickness={1}
          ior={2}
          chromaticAberration={0.05}
          color="#3498db"
          attenuationColor="#ffffff"
          attenuationDistance={1}
        />
      </mesh>
      
      {/* Nairobi HQ label */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.4}
        color="#3498db"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        NAIROBI HQ
      </Text>
      
      {/* Data streams */}
      {AGENTS.map((agent, index) => {
        const angle = (index / AGENTS.length) * Math.PI * 2;
        return (
          <mesh key={agent.id} position={[Math.cos(angle) * 2, 0.5, Math.sin(angle) * 2]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color={agent.color} />
          </mesh>
        );
      })}
    </group>
  );
};

// Parallax Camera Controller
interface CameraControllerProps {
  selectedAgent: number | null;
}

const CameraController: React.FC<CameraControllerProps> = ({ selectedAgent }) => {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 10, 15));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  
  useEffect(() => {
    if (selectedAgent !== null) {
      const agent = AGENTS[selectedAgent - 1];
      targetPosition.current.set(agent.position[0] * 0.5, 3, agent.position[2] * 0.5 + 5);
      targetLookAt.current.set(agent.position[0], 0, agent.position[2]);
    } else {
      targetPosition.current.set(0, 10, 15);
      targetLookAt.current.set(0, 0, 0);
    }
  }, [selectedAgent]);
  
  useFrame(() => {
    camera.position.lerp(targetPosition.current, 0.05);
    camera.lookAt(targetLookAt.current);
  });
  
  return null;
};

// Main Virtual Office Component
interface VirtualOffice3DProps {
  onAgentSelect?: (agentId: number) => void;
  selectedAgent?: number | null;
}

const VirtualOffice3D: React.FC<VirtualOffice3DProps> = ({ 
  onAgentSelect = () => {}, 
  selectedAgent = null 
}) => {
  const [localSelectedAgent, setLocalSelectedAgent] = useState<number | null>(selectedAgent);
  
  const handleAgentClick = (agentId: number) => {
    const newSelection = localSelectedAgent === agentId ? null : agentId;
    setLocalSelectedAgent(newSelection);
    onAgentSelect(newSelection || 0);
  };
  
  return (
    <div style={{ width: '100%', height: '600px', position: 'relative', overflow: 'hidden' }}>
      {/* Canvas with custom camera setup */}
      <Canvas shadows camera={{ position: [0, 10, 15], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#3498db" />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#2ecc71" />
        
        {/* Environment */}
        <Environment preset="city" />
        <SoftShadows size={25} samples={16} />
        
        {/* Camera controller */}
        <CameraController selectedAgent={localSelectedAgent} />
        
        {/* Scene elements */}
        <FloorGrid />
        <CentralHub />
        
        {/* Agent terminals */}
        {AGENTS.map((agent) => (
          <GlassTerminal
            key={agent.id}
            position={agent.position as [number, number, number]}
            color={agent.color}
            agentName={agent.name}
            agentModel={agent.model}
            status={agent.status}
            isSelected={localSelectedAgent === agent.id}
            onClick={() => handleAgentClick(agent.id)}
          />
        ))}
        
        {/* Parallax scrolling effect helper */}
        <mesh position={[0, 5, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="transparent" />
        </mesh>
        
        {/* Accent lighting */}
        <AccumulativeShadows temporal frames={100} alphaTest={0.9} scale={20}>
          <RandomizedLight amount={8} radius={10} ambient={0.5} position={[10, 20, 10]} />
        </AccumulativeShadows>
        
        {/* Fog for depth */}
        <fog attach="fog" args={['#1a1a2e', 10, 30]} />
      </Canvas>
      
      {/* Overlay controls */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px 15px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Virtual Office Controls</div>
        <div>• Click terminals to focus</div>
        <div>• Scroll to zoom</div>
        <div>• Drag to rotate view</div>
      </div>
      
      {/* Selected agent info */}
      {localSelectedAgent && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '15px',
          borderRadius: '8px',
          color: 'white',
          fontSize: '14px',
          width: '250px',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${AGENTS[localSelectedAgent - 1].color}`
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            paddingBottom: '10px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: AGENTS[localSelectedAgent - 1].color,
              marginRight: '10px'
            }} />
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
              {AGENTS[localSelectedAgent - 1].name}
            </div>
          </div>
          <div style={{ marginBottom: '5px' }}>
            <strong>Model:</strong> {AGENTS[localSelectedAgent - 1].model}
          </div>
          <div style={{ marginBottom: '5px' }}>
            <strong>Status:</strong> {AGENTS[localSelectedAgent - 1].status.toUpperCase()}
          </div>
          <div style={{ marginBottom: '5px' }}>
            <strong>Cost Multiplier:</strong> {AGENTS[localSelectedAgent - 1].cost}x
          </div>
          <div style={{ 
            marginTop: '10px', 
            padding: '5px 10px', 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            View Detailed Metrics →
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualOffice3D;