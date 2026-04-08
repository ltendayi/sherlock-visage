import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { Box, OrbitControls } from '@react-three/drei';

const SimpleVirtualOffice: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '600px', position: 'relative', overflow: 'hidden' }}>
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
    </div>
  );
};

export default SimpleVirtualOffice;