import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface AuthOverlayProps {
  onAuthenticated?: () => void;
}

export const AuthOverlay = ({ onAuthenticated }: AuthOverlayProps) => {
  const [scanProgress, setScanProgress] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scanPhase, setScanPhase] = useState<'scanning' | 'processing' | 'granted'>('scanning');

  useEffect(() => {
    if (isAuthenticated) return;
    
    // Simulate biometric handprint scan
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanPhase('processing');
          setTimeout(() => {
            setScanPhase('granted');
            setIsAuthenticated(true);
            setTimeout(() => onAuthenticated?.(), 1500);
          }, 800);
          return 100;
        }
        return prev + 5;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isAuthenticated, onAuthenticated]);

  return (
    <AnimatePresence>
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            backdropFilter: 'blur(0px)',
            transition: { duration: 1.2, ease: 'easeInOut' }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backdropFilter: 'blur(20px)',
            background: 'radial-gradient(circle at center, rgba(10, 10, 15, 0.97) 0%, rgba(5, 5, 5, 0.99) 100%)'
          }}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 grid-pattern opacity-30" />
          
          <div className="text-center relative z-10">
            {/* Biometric Handprint Scanner */}
            <div className="relative w-56 h-56 mx-auto mb-10">
              {/* Outer Ring */}
              <motion.div 
                className="absolute inset-0 rounded-full border border-cyan-500/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-500 rounded-full" />
              </motion.div>
              
              {/* Middle Ring */}
              <motion.div 
                className="absolute inset-4 rounded-full border border-cyan-500/30"
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Inner Ring */}
              <div className="absolute inset-8 rounded-full border-2 border-cyan-500/40" />
              
              {/* Handprint Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500">
                  <path d="M12 11c0-3-1.5-3-1.5-7 0-2 1-3 1-5" className="opacity-60" />
                  <path d="M8.5 14c0-3-1-4-1-8 0-1.5.5-2.5 1-4" className="opacity-60" />
                  <path d="M15.5 14c0-3 1-4 1-8 0-1.5-.5-2.5-1-4" className="opacity-60" />
                  <path d="M6.5 17c-1.5-1-2.5-2.5-2.5-6 0-2 1-3 2-5" className="opacity-60" />
                  <path d="M17.5 17c1.5-1 2.5-2.5 2.5-6 0-2-1-3-2-5" className="opacity-60" />
                  <path d="M9 23c0-3.5 1-7 1-9s-1-1.5-.5-4c.5-2 2-3 4.5-3s4 1 4.5 3c.5 2.5-.5 2-.5 4s1 5.5 1 9" />
                </svg>
              </div>
              
              {/* Scanning Line */}
              <motion.div
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                style={{ top: '50%' }}
                animate={{ 
                  top: ['10%', '90%', '10%'],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              {/* Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="26" fill="none" stroke="rgba(0, 243, 255, 0.1)" strokeWidth="2" />
                <motion.circle
                  cx="28" cy="28" r="26"
                  fill="none"
                  stroke="#00f3ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: scanProgress / 100 }}
                  transition={{ duration: 0.1 }}
                />
              </svg>
            </div>
            
            {/* Authentication Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <h1 className="text-4xl font-bold tracking-[0.3em] text-white">
                SHERLOCK
              </h1>
              <p className="text-cyan-400 text-lg tracking-[0.5em] font-light">
                OPERATIONS CENTER
              </p>
              
              {/* Status Text */}
              <div className="h-6 mt-8">
                {scanPhase === 'scanning' && (
                  <motion.p 
                    className="text-cyan-500/70 text-sm tracking-widest"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    BIOMETRIC SCAN: {scanProgress}%
                  </motion.p>
                )}
                {scanPhase === 'processing' && (
                  <motion.p 
                    className="text-cyan-400 text-sm tracking-widest"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    VERIFYING IDENTITY...
                  </motion.p>
                )}
                {scanPhase === 'granted' && (
                  <motion.p 
                    className="text-emerald-400 text-lg tracking-[0.2em] font-medium"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textShadow: '0 0 20px rgba(52, 211, 153, 0.5)' }}
                  >
                    ACCESS GRANTED
                  </motion.p>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
