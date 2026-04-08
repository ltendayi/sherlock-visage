import * as React from 'react';
import { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Float, 
  Text, 
  Edges, 
  MeshTransmissionMaterial, 
  Environment, 
  MeshReflectorMaterial,
  PerspectiveCamera
} from '@react-three/drei';
import * as THREE from 'three';

// Agent data with colors and positions in isometric layout
const AGENTS = [
  { id: 1, name: 'Strategic Architect', color: '#3498db', position: [-5, 0, -2], rotation: [0, Math.PI/4, 0], model: 'DeepSeek-R1', status: 'active', cost: 2.0 },
  { id: 2, name: 'Lead Developer', color: '#2ecc71', position: [-3, 0, -4], rotation: [0, Math.PI/6, 0], model: 'DeepSeek-V3.2', status: 'active', cost: 0.3 },
  { id: 3, name: 'Security Auditor', color: '#e74c3c', position: [0, 0, -5], rotation: [0, 0, 0], model: 'GPT-4o', status: 'idle', cost: 1.0 },
  { id: 4, name: 'Rapid Prototyper', color: '#f39c12', position: [3, 0, -4], rotation: [0, -Math.PI/6, 0], model: 'grok-4-1-fast-non-reasoning', status: 'active', cost: 0.1 },
  { id: 5, name: 'Algorithm Specialist', color: '#9b59b6', position: [5, 0, -2], rotation: [0, -Math.PI/4, 0], model: 'Kimi-K2.5', status: 'idle', cost: 1.5 },
  { id: 6, name: 'Crisis Resolver', color: '#1abc9c', position: [3, 0, 4], rotation: [0, -Math.PI/3, 0], model: 'DeepSeek-R1', status: 'error', cost: 3.0 },
  { id: 7, name: 'Documentation Specialist', color: '#34495e', position: [-3, 0, 4], rotation: [0, Math.PI/3, 0], model: 'text-embedding-3-small', status: 'active', cost: 0.05 },
];

// Simple Glass Terminal Component
const GlassTerminal: React.FC<any> = ({ position, rotation, color, agentName, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Floating animation
      const time = state.clock.elapsedTime;
      meshRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.1;
      
      // Gentle sway
      meshRef.current.position.x = position[0] + Math.sin(time * 0.2) * 0.05;
      meshRef.current.position.z = position[2] + Math.cos(time * 0.3) * 0.05;
    }
  });

  return (
    <group position={position} rotation={rotation} onClick={onClick}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef} castShadow receiveShadow>
          <boxGeometry args={[1.8, 1.2, 0.1]} />
          <MeshTransmissionMaterial 
            color={color}
            transmission={0.9}
            roughness={0.1}
            thickness={0.5}
            anisotropicBlur={0.1}
            clearcoat={1}
            clearcoatRoughness={0}
          />
          <Edges threshold={30} scale={1.02} color={color} linewidth={2} />
        </mesh>
        
        {/* Agent name label - simplified to avoid Three.js compatibility issues */}
        <Text
          position={[0, -0.8, 0.08]}
          fontSize={0.18}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {agentName.split(' ')[0]}
        </Text>
        
        {/* Selection highlight */}
        {isSelected && (
          <pointLight position={[0, 0.5, 0.2]} color={color} intensity={2} distance={3} />
        )}
      </Float>
    </group>
  );
};

// Reflective Floor
const ReflectiveFloor: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={50}
        depthScale={1}
        minDepthThreshold={0.9}
        maxDepthThreshold={1}
        color="#202020"
        metalness={0.8}
        roughness={1}
        mirror={0.5}
      />
    </mesh>
  );
};

// Camera Controller
const CameraController: React.FC<{ selectedAgent: number | null }> = ({ selectedAgent }) => {
  const { camera, clock } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 8, 12));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  
  useFrame(() => {
    const time = clock.getElapsedTime();
    
    if (selectedAgent !== null && selectedAgent >= 1 && selectedAgent <= AGENTS.length) {
      const agent = AGENTS[selectedAgent - 1];
      targetPosition.current.set(
        agent.position[0] * 0.7, 
        3, 
        agent.position[2] * 0.7 + 6
      );
      targetLookAt.current.set(agent.position[0], 0, agent.position[2]);
    } else {
      // Gentle floating camera movement
      const parallaxX = Math.sin(time * 0.1) * 1.5;
      const parallaxY = 8 + Math.cos(time * 0.05) * 0.5;
      const parallaxZ = 12 + Math.sin(time * 0.08) * 1;
      
      targetPosition.current.set(parallaxX, parallaxY, parallaxZ);
      targetLookAt.current.set(0, 0, 0);
    }
    
    camera.position.lerp(targetPosition.current, 0.05);
    camera.lookAt(targetLookAt.current);
  });

  return null;
};

// Main Component
interface EnhancedVirtualOfficeProps {
  onAgentSelect?: (agentId: number) => void;
  selectedAgent?: number | null;
}

const EnhancedVirtualOffice: React.FC<EnhancedVirtualOfficeProps> = ({ 
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
      <Canvas shadows camera={{ position: [0, 8, 12], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.6} color="#3498db" />
        <pointLight position={[10, 10, 10]} intensity={0.6} color="#2ecc71" />
        
        {/* Camera controller */}
        <CameraController selectedAgent={localSelectedAgent} />
        
        {/* Environment */}
        <Environment preset="city" />
        
        {/* Floor */}
        <ReflectiveFloor />
        
        {/* Agent terminals */}
        {AGENTS.map((agent) => (
          <GlassTerminal
            key={agent.id}
            position={agent.position as [number, number, number]}
            rotation={agent.rotation as [number, number, number]}
            color={agent.color}
            agentName={agent.name}
            isSelected={localSelectedAgent === agent.id}
            onClick={() => handleAgentClick(agent.id)}
          />
        ))}
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
      
      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '8px 12px',
        borderRadius: '6px'
      }}>
        Click terminals to focus • Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default EnhancedVirtualOffice;