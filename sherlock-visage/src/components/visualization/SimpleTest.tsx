import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { Box, OrbitControls } from '@react-three/drei';

const SimpleTest: React.FC = () => {
  console.log('SimpleTest rendering');
  
  return (
    <div style={{ width: '100%', height: '600px', backgroundColor: '#0a0a14', borderRadius: '12px' }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <Box position={[-1.2, 0, 0]}>
          <meshStandardMaterial color="orange" />
        </Box>
        
        <Box position={[1.2, 0, 0]}>
          <meshStandardMaterial color="hotpink" />
        </Box>
        
        <OrbitControls />
      </Canvas>
      <div style={{ position: 'absolute', bottom: 10, left: 10, color: '#00f3ff', fontSize: '12px' }}>
        Simple Three.js Test - If you see boxes, 3D works!
      </div>
    </div>
  );
};

export default SimpleTest;