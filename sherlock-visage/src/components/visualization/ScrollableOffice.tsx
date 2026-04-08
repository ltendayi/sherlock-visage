import * as React from 'react';
import { useScroll } from '@react-three/drei';

// Local CameraController component
const CameraController: React.FC<{ selectedAgent: number | null; scrollOffset?: number }> = ({ selectedAgent }) => {
  // Stub implementation
  return null;
};

interface ScrollableOfficeProps {
  localSelectedAgent: number | null;
  onAgentClick: (agentId: number) => void;
}

const ScrollableOffice: React.FC<ScrollableOfficeProps> = ({ 
  localSelectedAgent, 
  onAgentClick 
}) => {
  const scroll = useScroll();
  
  // Import AGENTS from parent or pass as prop
  const AGENTS = [
    { id: 1, name: 'Strategic Architect', color: '#3498db', position: [-5, 0, -2], rotation: [0, Math.PI/4, 0], model: 'DeepSeek-R1', status: 'active', cost: 2.0 },
    { id: 2, name: 'Lead Developer', color: '#2ecc71', position: [-3, 0, -4], rotation: [0, Math.PI/6, 0], model: 'DeepSeek-V3.2', status: 'active', cost: 0.3 },
    { id: 3, name: 'Security Auditor', color: '#e74c3c', position: [0, 0, -5], rotation: [0, 0, 0], model: 'GPT-4o', status: 'idle', cost: 1.0 },
    { id: 4, name: 'Rapid Prototyper', color: '#f39c12', position: [3, 0, -4], rotation: [0, -Math.PI/6, 0], model: 'grok-4-1-fast-non-reasoning', status: 'active', cost: 0.1 },
    { id: 5, name: 'Algorithm Specialist', color: '#9b59b6', position: [5, 0, -2], rotation: [0, -Math.PI/4, 0], model: 'Kimi-K2.5', status: 'idle', cost: 1.5 },
    { id: 6, name: 'Crisis Resolver', color: '#1abc9c', position: [3, 0, 4], rotation: [0, -Math.PI/3, 0], model: 'DeepSeek-R1', status: 'error', cost: 3.0 },
    { id: 7, name: 'Documentation Specialist', color: '#34495e', position: [-3, 0, 4], rotation: [0, Math.PI/3, 0], model: 'text-embedding-3-small', status: 'active', cost: 0.05 },
  ];

  // Import GlassTerminal or recreate simple version
  const GlassTerminal = ({ position, rotation, color, agentName, isSelected, onClick, scrollOffset }: any) => (
    <group position={position} rotation={rotation} onClick={onClick}>
      <mesh>
        <boxGeometry args={[1.8, 1.2, 0.1]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.3} 
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      <Text position={[0, -0.5, 0.1]} fontSize={0.2} color="white">
        {agentName}
      </Text>
    </group>
  );

  return (
    <>
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
      
      {/* Camera controller with parallax */}
      <CameraController selectedAgent={localSelectedAgent} scrollOffset={scroll?.offset || 0} />
      
      {/* Agent terminals */}
      {AGENTS.map((agent) => (
        <GlassTerminal
          key={agent.id}
          position={agent.position}
          rotation={agent.rotation}
          color={agent.color}
          agentName={agent.name}
          isSelected={localSelectedAgent === agent.id}
          onClick={() => onAgentClick(agent.id)}
          scrollOffset={scroll?.offset || 0}
        />
      ))}
    </>
  );
};

// Import Text from drei
import { Text } from '@react-three/drei';

export default ScrollableOffice;