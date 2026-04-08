import * as React from 'react';
import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Float, 
  Text, 
  Edges, 
  MeshTransmissionMaterial, 
  Environment, 
  AccumulativeShadows,
  RandomizedLight,
  MeshReflectorMaterial
} from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from '@react-three/postprocessing';
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

// Glass Terminal Component with enhanced effects
interface GlassTerminalProps {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  agentName: string;
  isSelected: boolean;
  onClick: () => void;
}

const GlassTerminal: React.FC<GlassTerminalProps> = ({ 
  position, 
  rotation,
  color, 
  agentName, 
  isSelected, 
  onClick
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.Mesh>(null);
  
  // Parallax effect based on scroll
  useFrame((state) => {
    if (meshRef.current) {
      // Floating animation
      const time = state.clock.elapsedTime;
      meshRef.current.position.y = position[1] + Math.sin(time * 0.5 + position[0]) * 0.1;
      
      // Gentle sway animation (replaces scroll parallax)
      meshRef.current.position.x = position[0] + Math.sin(time * 0.2 + position[2]) * 0.1;
      meshRef.current.position.z = position[2] + Math.cos(time * 0.3 + position[0]) * 0.1;
      
      // Gentle rotation
      meshRef.current.rotation.y = rotation[1] + Math.sin(time * 0.3) * 0.05;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        {/* Main glass terminal with transparency */}
        <mesh ref={meshRef} onClick={onClick} castShadow receiveShadow>
          <boxGeometry args={[1.8, 1.2, 0.15]} />
          <MeshTransmissionMaterial
            backside
            samples={8}
            resolution={1024}
            transmission={0.85}
            roughness={0.05}
            thickness={0.8}
            ior={1.5}
            chromaticAberration={0.03}
            anisotropy={0.1}
            distortion={0.05}
            distortionScale={0.1}
            temporalDistortion={0.1}
            color={color}
            attenuationColor="#ffffff"
            attenuationDistance={0.8}
          />
        </mesh>
        
        {/* Edge lighting */}
        <mesh ref={edgesRef}>
          <boxGeometry args={[1.82, 1.22, 0.16]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
          <Edges threshold={30} scale={1.02} color={color} linewidth={2} />
        </mesh>
        
        {/* Agent name label */}
        <Text
          position={[0, -0.8, 0.08]}
          fontSize={0.18}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
          font="/fonts/Inter-Bold.woff"
        >
          {agentName.split(' ')[0]}
        </Text>
        
        {/* Selection highlight */}
        {isSelected && (
          <>
            <mesh position={[0, 0, 0.09]}>
              <ringGeometry args={[1.1, 1.3, 32]} />
              <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
            <pointLight position={[0, 0.5, 0.2]} color={color} intensity={2} distance={3} />
          </>
        )}
      </Float>
    </group>
  );
};

// Floor with reflective surface
const ReflectiveFloor: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={40}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#1a1a2e"
        metalness={0.5}
        mirror={0.5}
      />
    </mesh>
  );
};

// Central Data Hub
const CentralHub: React.FC = () => {
  const hubRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (hubRef.current) {
      hubRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Rotating central hub */}
      <mesh ref={hubRef} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.2, 0]} />
        <MeshTransmissionMaterial
          backside
          samples={8}
          resolution={1024}
          transmission={0.95}
          roughness={0.02}
          thickness={1.5}
          ior={2.3}
          chromaticAberration={0.05}
          color="#3498db"
          attenuationColor="#ffffff"
          attenuationDistance={1.2}
        />
      </mesh>
      
      {/* Nairobi HQ label */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.5}
        color="#3498db"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#000000"
        font="/fonts/Inter-Bold.woff"
      >
        NAIROBI HQ
      </Text>
      
      {/* Data streams/particles */}
      {[...Array(20)].map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 2 + Math.sin(i * 0.5) * 0.5;
        return (
          <mesh key={i} position={[Math.cos(angle) * radius, Math.sin(i * 0.3) * 0.5, Math.sin(angle) * radius]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#3498db" />
          </mesh>
        );
      })}
    </group>
  );
};

// Camera Controller with auto-movement
interface CameraControllerProps {
  selectedAgent: number | null;
}

const CameraController: React.FC<CameraControllerProps> = ({ selectedAgent }) => {
  const { camera, clock } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 8, 12));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  
  useEffect(() => {
    if (selectedAgent !== null && AGENTS && selectedAgent >= 1 && selectedAgent <= AGENTS.length) {
      const agent = AGENTS[selectedAgent - 1];
      if (agent && agent.position) {
        targetPosition.current.set(
          agent.position[0] * 0.7, 
          3, 
          agent.position[2] * 0.7 + 6
        );
        targetLookAt.current.set(agent.position[0], 0, agent.position[2]);
      }
    }
  }, [selectedAgent]);
  
  useFrame(() => {
    if (selectedAgent === null) {
      // Gentle floating camera movement based on time
      const time = clock.getElapsedTime();
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

// Main Enhanced Virtual Office Component
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
        {/* Scene */}
        <Suspense fallback={null}>
              {/* Lighting */}
              <ambientLight intensity={0.4} />
              <directionalLight
                position={[10, 20, 10]}
                intensity={1.2}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
              />
              <pointLight position={[-10, 10, -10]} intensity={0.6} color="#3498db" />
              <pointLight position={[10, 10, 10]} intensity={0.6} color="#2ecc71" />
              
              {/* Camera controller */}
              <CameraController selectedAgent={localSelectedAgent} />
              
              {/* Environment */}
              <Environment preset="city" />
              
              {/* Scene elements */}
              <ReflectiveFloor />
              <CentralHub />
              
              {/* Agent terminals with parallax */}
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
              
              {/* Connection lines */}
              {AGENTS.map((agent) => (
                <line key={`line-${agent.id}`}>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={2}
                      array={new Float32Array([
                        0, 0.5, 0,
                        agent.position[0] * 0.5, 0.5, agent.position[2] * 0.5
                      ])}
                      itemSize={3}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial color={agent.color} transparent opacity={0.2} linewidth={1} />
                </line>
              ))}
              
              {/* Accent particles */}
              {[...Array(50)].map((_, i) => (
                <mesh key={`particle-${i}`} position={[
                  (Math.random() - 0.5) * 20,
                  Math.random() * 5,
                  (Math.random() - 0.5) * 20
                ]}>
                  <sphereGeometry args={[0.02 + Math.random() * 0.03, 4, 4]} />
                  <meshBasicMaterial 
                    color={AGENTS[i % AGENTS.length].color} 
                    transparent 
                    opacity={0.3 + Math.random() * 0.3}
                  />
                </mesh>
              ))}
            </Suspense>
        
        {/* Post-processing effects */}
        <EffectComposer>
          <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={3} />
          <Bloom intensity={0.2} luminanceThreshold={0.9} />
          <Noise opacity={0.02} />
        </EffectComposer>
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={true} 
          enablePan={true} 
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
      
      {/* Overlay UI */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '12px 16px',
        borderRadius: '10px',
        color: 'white',
        fontSize: '14px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#3498db' }}>
          <span style={{ marginRight: '8px' }}>🗺️</span>
          Virtual Office Controls
        </div>
        <div>• <strong>Click</strong> terminals to focus</div>
        <div>• <strong>Scroll</strong> for parallax effect</div>
        <div>• <strong>Drag</strong> to rotate view</div>
        <div>• <strong>Zoom</strong> with mouse wheel</div>
      </div>
      
      {/* Selected agent info */}
      {localSelectedAgent && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '16px',
          borderRadius: '10px',
          color: 'white',
          fontSize: '14px',
          width: '280px',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${AGENTS[localSelectedAgent - 1].color}`,
          boxShadow: `0 0 20px ${AGENTS[localSelectedAgent - 1].color}40`
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            paddingBottom: '12px'
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: AGENTS[localSelectedAgent - 1].color,
              marginRight: '12px',
              boxShadow: `0 0 10px ${AGENTS[localSelectedAgent - 1].color}`
            }} />
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
              {AGENTS[localSelectedAgent - 1].name}
            </div>
          </div>
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>Model:</strong></span>
            <span>{AGENTS[localSelectedAgent - 1].model}</span>
          </div>
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>Status:</strong></span>
            <span style={{ 
              color: AGENTS[localSelectedAgent - 1].status === 'active' ? '#52c41a' : 
                     AGENTS[localSelectedAgent - 1].status === 'idle' ? '#fa8c16' : '#f5222d'
            }}>
              {AGENTS[localSelectedAgent - 1].status.toUpperCase()}
            </span>
          </div>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>Cost Multiplier:</strong></span>
            <span>{AGENTS[localSelectedAgent - 1].cost}x</span>
          </div>
          <div style={{ 
            marginTop: '12px', 
            padding: '8px 12px', 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            textAlign: 'center',
            cursor: 'pointer',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.2s'
          }}>
            <span style={{ marginRight: '8px' }}>📊</span>
            View Detailed Metrics
          </div>
        </div>
      )}
      
      {/* Scroll indicator */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        display: 'flex',
        alignItems: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '12px'
      }}>
        <span style={{ marginRight: '8px' }}>↕️</span>
        Scroll for parallax
      </div>
    </div>
  );
};

export default EnhancedVirtualOffice;