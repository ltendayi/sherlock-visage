import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Avatar.css';

export interface AgentAvatarProps {
  agentId: string;
  agentName: string;
  agentType: 'strategist' | 'analyst' | 'executor' | 'validator' | 'monitor' | 'archivist' | 'coordinator';
  status: 'active' | 'idle' | 'busy' | 'error';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  className?: string;
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({
  agentId,
  agentName,
  agentType,
  status,
  size = 'medium',
  onClick,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Get avatar component based on agent type
  const getAvatarComponent = () => {
    switch (agentId) {
      case 'strategic_architect':
        return <ArchitectCyborg />;
      case 'security_auditor':
        return <SecuritySentinel />;
      case 'crisis_resolver':
        return <CrisisFirefighter />;
      case 'lead_developer':
        return <CodeCommander />;
      case 'rapid_prototyper':
        return <PrototypeDynamo />;
      case 'algorithm_specialist':
        return <AlgorithmOracle />;
      case 'documentation_specialist':
        return <ArchiveScribe />;
      default:
        return <GenericAgent />;
    }
  };

  const getStatusAnimations = () => {
    switch (status) {
      case 'active':
        return {
          pulse: true,
          thoughtStreams: false,
          zzz: false,
          alert: false
        };
      case 'busy':
        return {
          pulse: true,
          thoughtStreams: true,
          zzz: false,
          alert: false
        };
      case 'idle':
        return {
          pulse: false,
          thoughtStreams: false,
          zzz: true,
          alert: false
        };
      case 'error':
        return {
          pulse: false,
          thoughtStreams: false,
          zzz: false,
          alert: true
        };
      default:
        return {
          pulse: false,
          thoughtStreams: false,
          zzz: false,
          alert: false
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'avatar-small';
      case 'large': return 'avatar-large';
      default: return 'avatar-medium';
    }
  };

  const statusAnims = getStatusAnimations();

  return (
    <motion.div
      className={`agent-avatar ${getSizeClasses()} ${className} avatar-status-${status}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Status effects */}
      <AnimatePresence>
        {statusAnims.pulse && (
          <motion.div
            className="status-pulse"
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
          />
        )}
        
        {statusAnims.alert && (
          <motion.div
            className="status-alert"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 0.7 }}
          />
        )}
        
        {statusAnims.thoughtStreams && (
          <div className="thought-streams">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="thought-bubble"
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x: 10 + i * 5, y: -15 - i * 3, opacity: [0, 0.7, 0] }}
                transition={{ repeat: Infinity, duration: 2 + i * 0.3, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}
        
        {statusAnims.zzz && (
          <motion.div
            className="status-zzz"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 1, 0], y: -20 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            Zzz
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar SVG */}
      <div className="avatar-svg-container">
        {getAvatarComponent()}
      </div>

      {/* Agent name */}
      <div className="agent-name">{agentName}</div>
      
      {/* Status indicator */}
      <div className={`status-indicator status-${status}`}></div>
    </motion.div>
  );
};

// Individual avatar components
const ArchitectCyborg: React.FC = () => (
  <svg viewBox="0 0 100 100" className="avatar-svg architect-cyborg">
    <defs>
      <linearGradient id="cyborgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#2E7D32" stopOpacity="0.9" />
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    {/* Head */}
    <circle cx="50" cy="35" r="20" fill="url(#cyborgGradient)" stroke="#1B5E20" strokeWidth="1.5" filter="url(#glow)" />
    
    {/* Visor */}
    <path d="M40,30 Q50,35 60,30" stroke="#00BCD4" strokeWidth="3" fill="none" />
    <rect x="42" y="28" width="16" height="8" rx="2" fill="rgba(0, 188, 212, 0.3)" />
    
    {/* Body */}
    <rect x="35" y="55" width="30" height="25" rx="5" fill="url(#cyborgGradient)" stroke="#1B5E20" strokeWidth="1.5" />
    
    {/* Circuit patterns */}
    <path d="M40,60 L60,60" stroke="#00BCD4" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M40,65 L60,65" stroke="#00BCD4" strokeWidth="1" strokeDasharray="2,2" />
    <path d="M40,70 L60,70" stroke="#00BCD4" strokeWidth="1" strokeDasharray="2,2" />
    
    {/* Arm joints */}
    <circle cx="30" cy="45" r="3" fill="#00BCD4" />
    <circle cx="70" cy="45" r="3" fill="#00BCD4" />
    
    {/* Base */}
    <ellipse cx="50" cy="85" rx="20" ry="5" fill="#1B5E20" opacity="0.7" />
  </svg>
);

const SecuritySentinel: React.FC = () => (
  <svg viewBox="0 0 100 100" className="avatar-svg security-sentinel">
    <defs>
      <linearGradient id="sentinelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF9800" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#EF6C00" stopOpacity="0.9" />
      </linearGradient>
      <radialGradient id="shieldGradient">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
        <stop offset="100%" stopColor="rgba(255, 152, 0, 0.3)" />
      </radialGradient>
    </defs>
    
    {/* Shield body */}
    <path d="M50,20 L75,40 L75,70 L50,90 L25,70 L25,40 Z" 
          fill="url(#sentinelGradient)" stroke="#D84315" strokeWidth="2" />
    
    {/* Shield core */}
    <circle cx="50" cy="55" r="15" fill="url(#shieldGradient)" stroke="#FFC107" strokeWidth="1.5" />
    
    {/* Security eye */}
    <circle cx="50" cy="55" r="8" fill="#212121" />
    <circle cx="50" cy="55" r="4" fill="#4CAF50" />
    <circle cx="52" cy="53" r="1.5" fill="#FFFFFF" />
    
    {/* Scanning lines */}
    <path d="M50,40 L50,70" stroke="#FFC107" strokeWidth="1" strokeDasharray="3,3" />
    <path d="M35,55 L65,55" stroke="#FFC107" strokeWidth="1" strokeDasharray="3,3" />
    
    {/* Lock symbols */}
    <rect x="40" y="30" width="5" height="7" rx="1" fill="#FFC107" />
    <rect x="55" y="30" width="5" height="7" rx="1" fill="#FFC107" />
  </svg>
);

const CrisisFirefighter: React.FC = () => (
  <svg viewBox="0 0 100 100" className="avatar-svg crisis-firefighter">
    <defs>
      <linearGradient id="firefighterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F44336" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#C62828" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="flameGradient" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#FF9800" />
        <stop offset="50%" stopColor="#FF5722" />
        <stop offset="100%" stopColor="#F44336" />
      </linearGradient>
    </defs>
    
    {/* Helmet */}
    <ellipse cx="50" cy="35" rx="18" ry="15" fill="#607D8B" stroke="#37474F" strokeWidth="1.5" />
    <rect x="32" y="30" width="36" height="15" rx="5" fill="#78909C" />
    
    {/* Visor */}
    <path d="M40,32 Q50,38 60,32" stroke="#00BCD4" strokeWidth="2.5" fill="none" />
    
    {/* Body */}
    <rect x="35" y="50" width="30" height="25" rx="5" fill="url(#firefighterGradient)" stroke="#B71C1C" strokeWidth="1.5" />
    
    {/* Fire hose */}
    <path d="M30,60 L20,80" stroke="#795548" strokeWidth="4" />
    <circle cx="20" cy="80" r="5" fill="#795548" />
    
    {/* Flame */}
    <path d="M20,75 Q15,65 20,55 Q25,50 20,45 Q15,40 20,35" 
          fill="url(#flameGradient)" stroke="#FF9800" strokeWidth="1" />
    
    {/* Emergency lights */}
    <circle cx="40" cy="45" r="3" fill="#FFEB3B">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
    </circle>
    <circle cx="60" cy="45" r="3" fill="#FFEB3B">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.5s" />
    </circle>
  </svg>
);

const CodeCommander: React.FC = () => (
  <svg viewBox="0 0 100 100" className="avatar-svg code-commander">
    <defs>
      <linearGradient id="commanderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2196F3" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#0D47A1" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    
    {/* Head with headset */}
    <circle cx="50" cy="35" r="18" fill="url(#commanderGradient)" stroke="#1565C0" strokeWidth="1.5" />
    
    {/* Headset */}
    <path d="M30,35 L40,35" stroke="#212121" strokeWidth="3" />
    <path d="M60,35 L70,35" stroke="#212121" strokeWidth="3" />
    <ellipse cx="50" cy="30" rx="25" ry="8" fill="none" stroke="#212121" strokeWidth="3" />
    
    {/* Monitor screen face */}
    <rect x="40" y="30" width="20" height="12" rx="2" fill="#1A237E" />
    
    {/* Code lines on screen */}
    <rect x="42" y="33" width="12" height="1" fill="#4FC3F7" />
    <rect x="42" y="36" width="8" height="1" fill="#4FC3F7" />
    <rect x="42" y="39" width="14" height="1" fill="#4FC3F7" />
    
    {/* Body with keyboard */}
    <rect x="35" y="55" width="30" height="25" rx="5" fill="url(#commanderGradient)" stroke="#1565C0" strokeWidth="1.5" />
    
    {/* Keyboard keys */}
    <rect x="38" y="58" width="6" height="4" rx="1" fill="#E3F2FD" />
    <rect x="46" y="58" width="6" height="4" rx="1" fill="#E3F2FD" />
    <rect x="54" y="58" width="6" height="4" rx="1" fill="#E3F2FD" />
    
    <rect x="38" y="64" width="6" height="4" rx="1" fill="#E3F2FD" />
    <rect x="46" y="64" width="6" height="4" rx="1" fill="#E3F2FD" />
    <rect x="54" y="64" width="6" height="4" rx="1" fill="#E3F2FD" />
    
    {/* Circuit lines */}
    <path d="M40,75 L60,75" stroke="#4FC3F7" strokeWidth="1" strokeDasharray="2,2" />
  </svg>
);

const PrototypeDynamo: React.FC = () => (
  <svg viewBox="0 0 100 100" className="avatar-svg prototype-dynamo">
    <defs>
      <linearGradient id="dynamoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9C27B0" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#6A1B9A" stopOpacity="0.9" />
      </linearGradient>
      <radialGradient id="gearGradient">
        <stop offset="0%" stopColor="#CE93D8" />
        <stop offset="100%" stopColor="#9C27B0" />
      </radialGradient>
    </defs>
    
    {/* Central gear head */}
    <circle cx="50" cy="40" r="18" fill="url(#dynamoGradient)" stroke="#4A148C" strokeWidth="1.5" />
    
    {/* Gear teeth */}
    {[...Array(8)].map((_, i) => {
      const angle = (i * 45) * Math.PI / 180;
      const x1 = 50 + 15 * Math.cos(angle);
      const y1 = 40 + 15 * Math.sin(angle);
      const x2 = 50 + 22 * Math.cos(angle);
      const y2 = 40 + 22 * Math.sin(angle);
      return (
        <rect 
          key={i}
          x={x2 - 2} 
          y={y2 - 4} 
          width="4" 
          height="8" 
          rx="1"
          fill="#CE93D8"
          transform={`rotate(${i * 45}, ${x2}, ${y2})`}
        />
      );
    })}
    
    {/* Body with blueprint */}
    <rect x="35" y="60" width="30" height="25" rx="5" fill="url(#dynamoGradient)" stroke="#4A148C" strokeWidth="1.5" />
    
    {/* Blueprint lines */}
    <rect x="38" y="63" width="24" height="19" fill="none" stroke="#CE93D8" strokeWidth="0.5" strokeDasharray="1,1" />
    <path d="M38,70 L62,70" stroke="#CE93D8" strokeWidth="0.5" strokeDasharray="1,1" />
    <path d="M45,63 L45,82" stroke="#CE93D8" strokeWidth="0.5" strokeDasharray="1,1" />
    <path d="M55,63 L55,82" stroke="#CE93D8" strokeWidth="0.5" strokeDasharray="1,1" />
    
    {/* Rotating outer gears */}
    <circle cx="30" cy="30" r="8" fill="url(#gearGradient)" stroke="#4A148C" strokeWidth="1">
      <animateTransform 
        attributeName="transform" 
        type="rotate" 
        from="0 30 30" 
        to="360 30 30" 
        dur="3s" 
        repeatCount="indefinite" 
      />
    </circle>
    <circle cx="70" cy="30" r="8" fill="url(#gearGradient)" stroke="#4A148C" strokeWidth="1">
      <animateTransform 
        attributeName="transform" 
        type="rotate" 
        from="360 70 30" 
        to="0 70 30" 
        dur="3s" 
        repeatCount="indefinite" 
      />
    </circle>
  </svg>
);

const AlgorithmOracle: React.FC = () => (
  <svg viewBox="0 0 100 100" className="avatar-svg algorithm-oracle">
    <defs>
      <linearGradient id="oracleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF5722" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#D84315" stopOpacity="0.9" />
      </linearGradient>
      <radialGradient id="nodeGradient">
        <stop offset="0%" stopColor="#FFCCBC" />
        <stop offset="100%" stopColor="#FF5722" />
      </radialGradient>
    </defs>
    
    {/* Crystal head */}
    <polygon points="50,20 65,40 50,60 35,40" fill="url(#oracleGradient)" stroke="#BF360C" strokeWidth="1.5" />
    
    {/* Inner crystal facets */}
    <polygon points="50,30 58,40 50,50 42,40" fill="rgba(255, 255, 255, 0.3)" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="0.5" />
    
    {/* Neural network body */}
    <rect x="35" y="65" width="30" height="20" rx="5" fill="url(#oracleGradient)" stroke="#BF360C" strokeWidth="1.5" />
    
    {/* Neural nodes */}
    <circle cx="40" cy="70" r="3" fill="url(#nodeGradient)" />
    <circle cx="50" cy="70" r="3" fill="url(#nodeGradient)" />
    <circle cx="60" cy="70" r="3" fill="url(#nodeGradient)" />
    
    <circle cx="40" cy="80" r="3" fill="url(#nodeGradient)" />
    <circle cx="50" cy="80" r="3" fill="url(#nodeGradient)" />
    <circle cx="60" cy="80" r="3" fill="url(#nodeGradient)" />
    
    {/* Neural connections */}
    <path d="M40,70 L50,80" stroke="#FFCCBC" strokeWidth="1" opacity="0.7" />
    <path d="M50,70 L60,80" stroke="#FFCCBC" strokeWidth="1" opacity="0.7" />
    <path d="M60,70 L40,80" stroke="#FFCCBC" strokeWidth="1" opacity="0.7" />
    
    {/* Data streams */}
    <path d="M30,50 L20,65" stroke="#FF9800" strokeWidth="1.5" strokeDasharray="2,2">
      <animate attributeName="stroke-dashoffset" values="0;10" dur="1s" repeatCount="indefinite" />
    </path>
    <path d="M70,50 L80,65" stroke="#FF9800" strokeWidth="1.5" strokeDasharray="2,2">
      <animate attributeName="stroke-dashoffset" values="0;10" dur="1s" repeatCount="indefinite" />
    </path>
  </svg>
);

const ArchiveScribe: React.FC = () => (
  <svg viewBox="0 0 100 100" className="avatar-svg archive-scribe">
    <defs>
      <linearGradient id="scribeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#795548" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#4E342E" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    
    {/* Scroll head */}
    <ellipse cx="50" cy="35" rx="18" ry="15" fill="url(#scribeGradient)" stroke="#3E2723" strokeWidth="1.5" />
    
    {/* Scroll details */}
    <path d="M35,30 L65,30" stroke="#D7CCC8" strokeWidth="2" />
    <path d="M35,40 L65,40" stroke="#D7CCC8" strokeWidth="2" />
    
    {/* Glasses */}
    <circle cx="44" cy="35" r="6" fill="none" stroke="#5D4037" strokeWidth="1.5" />
    <circle cx="56" cy="35" r="6" fill="none" stroke="#5D4037" strokeWidth="1.5" />
    <path d="M50,35 L50,33" stroke="#5D4037" strokeWidth="1" />
    
    {/* Book body */}
    <rect x="35" y="55" width="30" height="25" rx="3" fill="url(#scribeGradient)" stroke="#3E2723" strokeWidth="1.5" />
    
    {/* Book spine */}
    <rect x="35" y="55" width="5" height="25" fill="#3E2723" />
    
    {/* Page lines */}
    <path d="M42,58 L62,58" stroke="#D7CCC8" strokeWidth="0.8" />
    <path d="M42,62 L62,62" stroke="#D7CCC8" strokeWidth="0.8" />
    <path d="M42,66 L62,66" stroke="#D7CCC8" strokeWidth="0.8" />
    <path d="M42,70 L62,70" stroke="#D7CCC8" strokeWidth="0.8" />
    <path d="M42,74 L62,74" stroke="#D7CCC8" strokeWidth="0.8" />
    
    {/* Quill pen */}
    <path d="M70,60 L75,55" stroke="#5D4037" strokeWidth="2" />
    <path d="M75,55 L80,50" stroke="#FF5722" strokeWidth="3" />
  </svg>
);

const GenericAgent: React.FC = () => (
  <svg viewBox="0 0 100 100" className="avatar-svg generic-agent">
    <defs>
      <linearGradient id="genericGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#607D8B" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#37474F" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    
    <circle cx="50" cy="35" r="18" fill="url(#genericGradient)" stroke="#263238" strokeWidth="1.5" />
    <rect x="35" y="55" width="30" height="25" rx="5" fill="url(#genericGradient)" stroke="#263238" strokeWidth="1.5" />
    <circle cx="50" cy="45" r="3" fill="#FFFFFF" />
  </svg>
);

export default AgentAvatar;