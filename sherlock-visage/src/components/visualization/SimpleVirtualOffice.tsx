import * as React from 'react';
import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Text, OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

// Simple Glass Terminal Component
const GlassTerminal = ({ position, color, agentName }: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1, 0.1]} />
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.8}
            roughness={0.1}
            metalness={0.1}
            transmission={0.9}
            thickness={0.5}
          />
        </mesh>
        <Text
          position={[0, -0.7, 0.06]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {agentName.split(' ')[0]}
        </Text>
      </Float>
    </group>
  );
};

// Main Component
const SimpleVirtualOffice = () => {
  const agents = [
    { id: 1, name: 'Strategic Architect', color: '#3498db', position: [-4, 0, 0] },
    { id: 2, name: 'Lead Developer', color: '#2ecc71', position: [-2, 0, -2] },
    { id: 3, name: 'Security Auditor', color: '#e74c3c', position: [0, 0, -4] },
    { id: 4, name: 'Rapid Prototyper', color: '#f39c12', position: [2, 0, -2] },
    { id: 5, name: 'Algorithm Specialist', color: '#9b59b6', position: [4, 0, 0] },
    { id: 6, name: 'Crisis Resolver', color: '#1abc9c', position: [2, 0, 2] },
    { id: 7, name: 'Documentation Specialist', color: '#34495e', position: [0, 0, 4] },
  ];

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
        />
        
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        
        {/* Central Hub */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.8, 0.3, 16]} />
          <meshPhysicalMaterial
            color="#3498db"
            transparent
            opacity={0.9}
            transmission={0.8}
            thickness={1}
          />
        </mesh>
        
        {/* Agent Terminals */}
        {agents.map((agent) => (
          <GlassTerminal
            key={agent.id}
            position={agent.position}
            color={agent.color}
            agentName={agent.name}
          />
        ))}
        
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        Nairobi HQ - 7 Agent Terminals
      </div>
    </div>
  );
};

export default SimpleVirtualOffice;