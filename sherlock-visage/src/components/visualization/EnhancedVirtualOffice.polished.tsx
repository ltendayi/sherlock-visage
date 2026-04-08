import * as React from 'react';
import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Float,
  MeshTransmissionMaterial,
  Environment,
  MeshReflectorMaterial,
  Edges,
  AccumulativeShadows,
  RandomizedLight
} from '@react-three/drei';
import * as THREE from 'three';

// Enhanced Glass Terminal Component
const GlassTerminal: React.FC<any> = ({ position, rotation, color, agentName, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      // Enhanced floating animation with gentle sway
      meshRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.15;
      meshRef.current.position.x = position[0] + Math.sin(time * 0.2) * 0.08;
      meshRef.current.position.z = position[2] + Math.cos(time * 0.3) * 0.08;
      
      // Gentle rotation sway
      meshRef.current.rotation.y = rotation[1] + Math.sin(time * 0.1) * 0.1;
    }
  });

  return (
    <group position={position} rotation={rotation} onClick={onClick}>
      <Float speed={3} rotationIntensity={0.8} floatIntensity={0.8}>
        {/* Terminal base with enhanced glass effects */}
        <mesh ref={meshRef} castShadow receiveShadow>
          <boxGeometry args={[2.0, 1.4, 0.15]} />
          <MeshTransmissionMaterial 
            color={color}
            transmission={0.95}
            roughness={0.05}
            thickness={0.8}
            anisotropicBlur={0.1}
            clearcoat={1}
            clearcoatRoughness={0}
            ior={1.5}
            chromaticAberration={0.02}
          />
          {/* Neon edge glow */}
          <Edges threshold={30} scale={1.02} color={color} linewidth={3} />
        </mesh>
        
        {/* Selection highlight */}
        {isSelected && (
          <pointLight position={[0, 0.8, 0.2]} color={color} intensity={3} distance={4} />
        )}
      </Float>
      
      {/* Subtle shadow under terminal */}
      <AccumulativeShadows
        position={[0, -0.75, 0]}
        scale={2.5}
        color="black"
        opacity={0.4}
        frames={60}
      >
        <RandomizedLight amount={4} radius={2} intensity={0.8} position={[0, 3, 0]} />
      </AccumulativeShadows>
    </group>
  );
};

// Enhanced Floor with reflections
const ReflectiveFloor: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <MeshReflectorMaterial
        blur={[400, 100]}
        resolution={2048}
        mixBlur={1}
        mixStrength={80}
        depthScale={1.2}
        minDepthThreshold={0.9}
        maxDepthThreshold={1}
        color="#151520"
        metalness={0.9}
        roughness={0.8}
        mirror={0.5}
      />
    </mesh>
  );
};

// Main Component - POLISHED VERSION
interface EnhancedVirtualOfficeProps {
  onAgentSelect?: (agentId: number) => void;
  selectedAgent?: number | null;
}

const EnhancedVirtualOffice: React.FC<EnhancedVirtualOfficeProps> = ({ 
  onAgentSelect = () => {}, 
  selectedAgent = null 
}) => {
  const [localSelectedAgent, setLocalSelectedAgent] = useState<number | null>(selectedAgent);
  
  const agents = [
    { id: 1, name: 'Strategic Architect', color: '#3498db', position: [-5, 0, -2], rotation: [0, Math.PI/4, 0] },
    { id: 2, name: 'Lead Developer', color: '#2ecc71', position: [-3, 0, -4], rotation: [0, Math.PI/6, 0] },
    { id: 3, name: 'Security Auditor', color: '#e74c3c', position: [0, 0, -5], rotation: [0, 0, 0] },
    { id: 4, name: 'Rapid Prototyper', color: '#f39c12', position: [3, 0, -4], rotation: [0, -Math.PI/6, 0] },
    { id: 5, name: 'Algorithm Specialist', color: '#9b59b6', position: [5, 0, -2], rotation: [0, -Math.PI/4, 0] },
    { id: 6, name: 'Crisis Resolver', color: '#1abc9c', position: [3, 0, 4], rotation: [0, -Math.PI/3, 0] },
    { id: 7, name: 'Documentation Specialist', color: '#34495e', position: [-3, 0, 4], rotation: [0, Math.PI/3, 0] },
  ];

  const handleAgentClick = (agentId: number) => {
    const newSelection = localSelectedAgent === agentId ? null : agentId;
    setLocalSelectedAgent(newSelection);
    onAgentSelect(newSelection || 0);
  };

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative', overflow: 'hidden' }}>
      <Canvas shadows camera={{ position: [0, 10, 15], fov: 50 }}>
        {/* Enhanced Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[15, 25, 15]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <pointLight position={[-10, 15, -10]} intensity={0.8} color="#3498db" />
        <pointLight position={[10, 15, 10]} intensity={0.8} color="#2ecc71" />
        <pointLight position={[0, 20, 0]} intensity={0.5} color="#ffffff" />
        
        {/* Environment */}
        <Environment preset="night" />
        
        {/* Floor */}
        <ReflectiveFloor />
        
        {/* Agent terminals with enhanced visuals */}
        {agents.map((agent) => (
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
          maxDistance={25}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 6}
        />
      </Canvas>
      
      {/* Enhanced HTML overlay */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px 16px',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#00f3ff' }}>
          AGENT OPERATIONS CENTER
        </div>
        <div>Click terminals to select • Drag to rotate • Scroll to zoom</div>
        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
          {localSelectedAgent ? `Selected: ${agents.find(a => a.id === localSelectedAgent)?.name}` : 'No agent selected'}
        </div>
      </div>
      
      {/* Agent labels as HTML overlay (instead of 3D Text) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {agents.map((agent, index) => {
          // Convert 3D position to screen position (approximation)
          const screenX = 50 + (agent.position[0] / 10) * 25;
          const screenY = 50 + (agent.position[2] / 10) * 25;
          
          return (
            <div
              key={agent.id}
              style={{
                position: 'absolute',
                left: `${screenX}%`,
                top: `${screenY}%`,
                transform: 'translate(-50%, -50%)',
                color: agent.color,
                fontSize: '12px',
                fontWeight: 'bold',
                textShadow: '0 0 10px currentColor',
                opacity: localSelectedAgent === agent.id ? 1 : 0.7,
                transition: 'opacity 0.3s',
                pointerEvents: 'auto',
                cursor: 'pointer',
                padding: '4px 8px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '4px',
                backdropFilter: 'blur(4px)'
              }}
              onClick={() => handleAgentClick(agent.id)}
            >
              {agent.name.split(' ')[0]}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedVirtualOffice;