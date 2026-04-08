import * as React from 'react';
import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Float,
  MeshTransmissionMaterial,
  Environment,
  MeshReflectorMaterial,
  Box,
  Text as DreiText
} from '@react-three/drei';
import * as THREE from 'three';

// Simple Glass Terminal Component WITHOUT Text
const GlassTerminal: React.FC<any> = ({ position, rotation, color, agentName }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.1;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef} castShadow>
          <boxGeometry args={[1.8, 1.2, 0.1]} />
          <MeshTransmissionMaterial 
            color={color}
            transmission={0.9}
            roughness={0.1}
            thickness={0.5}
          />
        </mesh>
      </Float>
    </group>
  );
};

// Main Component - MINIMAL VERSION
const EnhancedVirtualOffice: React.FC<any> = () => {
  const agents = [
    { id: 1, name: 'Strategic Architect', color: '#3498db', position: [-5, 0, -2], rotation: [0, Math.PI/4, 0] },
    { id: 2, name: 'Lead Developer', color: '#2ecc71', position: [-3, 0, -4], rotation: [0, Math.PI/6, 0] },
    { id: 3, name: 'Security Auditor', color: '#e74c3c', position: [0, 0, -5], rotation: [0, 0, 0] },
    { id: 4, name: 'Rapid Prototyper', color: '#f39c12', position: [3, 0, -4], rotation: [0, -Math.PI/6, 0] },
    { id: 5, name: 'Algorithm Specialist', color: '#9b59b6', position: [5, 0, -2], rotation: [0, -Math.PI/4, 0] },
    { id: 6, name: 'Crisis Resolver', color: '#1abc9c', position: [3, 0, 4], rotation: [0, -Math.PI/3, 0] },
    { id: 7, name: 'Documentation Specialist', color: '#34495e', position: [-3, 0, 4], rotation: [0, Math.PI/3, 0] },
  ];

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a14' }}>
      <Canvas shadows camera={{ position: [0, 8, 12], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
        
        {/* Environment */}
        <Environment preset="city" />
        
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={50}
            color="#202020"
            metalness={0.8}
            roughness={1}
            mirror={0.5}
          />
        </mesh>
        
        {/* Agent terminals - NO TEXT COMPONENTS */}
        {agents.map((agent) => (
          <GlassTerminal
            key={agent.id}
            position={agent.position as [number, number, number]}
            rotation={agent.rotation as [number, number, number]}
            color={agent.color}
            agentName={agent.name}
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
      
      {/* Labels as HTML overlay instead of 3D Text */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        fontSize: '14px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '8px 12px',
        borderRadius: '6px'
      }}>
        7 Agent Terminals • Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default EnhancedVirtualOffice;