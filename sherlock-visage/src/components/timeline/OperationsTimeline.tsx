/**
 * OperationsTimeline Component
 * Chronological feed of cross-system events between Sherlock and VoltLedger
 * Dark Vanta theme with color-coded system indicators
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OperationsEvent, EventSystem } from '../../types/voltledger';

interface OperationsTimelineProps {
  events: OperationsEvent[];
  maxEvents?: number;
}

// System configuration with colors matching Vanta theme
const SYSTEM_CONFIG: Record<EventSystem, {
  label: string;
  color: string;
  bgColor: string;
  glowColor: string;
  icon: string;
}> = {
  voltledger: {
    label: 'VoltLedger',
    color: '#00f3ff', // Cyan
    bgColor: 'rgba(0, 243, 255, 0.1)',
    glowColor: 'rgba(0, 243, 255, 0.3)',
    icon: '⚡'
  },
  sherlock: {
    label: 'Sherlock',
    color: '#ff006e', // Magenta
    bgColor: 'rgba(255, 0, 110, 0.1)',
    glowColor: 'rgba(255, 0, 110, 0.3)',
    icon: '🔍'
  },
  bridge: {
    label: 'Bridge',
    color: '#9d4edd', // Purple
    bgColor: 'rgba(157, 78, 221, 0.1)',
    glowColor: 'rgba(157, 78, 221, 0.3)',
    icon: '🔗'
  }
};

// Event type icons
const EVENT_ICONS: Record<string, string> = {
  loan_created: '📋',
  payment_received: '💰',
  bike_assigned: '🚲',
  bike_returned: '🔄',
  task_completed: '✓',
  task_failed: '✕',
  sync_event: '📡',
  alert: '⚠️'
};

// Entity type icons
const ENTITY_ICONS: Record<string, string> = {
  loan: '📄',
  bike: '🚲',
  transaction: '💳',
  task: '📋'
};

/**
 * Format relative time
 */
const getRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 10) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

/**
 * Format event description with highlighting
 */
const formatEventDescription = (event: OperationsEvent): React.ReactNode => {
  const { description, agentName, entityId, entityType } = event;
  
  // Extract agent name without prefix for cleaner display
  const cleanAgentName = agentName?.replace('volt_', '').replace('_', ' ') || 'System';
  
  // Format based on event pattern: "Agent X processed Loan #1234"
  const parts = description.split(/\s+/);
  
  return (
    <span>
      <span style={{ 
        color: 'rgba(255, 255, 255, 0.9)', 
        fontWeight: 500 
      }}>
        {cleanAgentName}
      </span>
      {' '}
      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
        {parts.slice(1, -2).join(' ')}
      </span>
      {' '}
      <span style={{ 
        color: SYSTEM_CONFIG[event.system].color,
        fontWeight: 600 
      }}>
        {entityType === 'loan' ? 'Loan' : 
         entityType === 'bike' ? 'Bike' : 
         entityType === 'transaction' ? 'Trx' : 'Task'}
        {' #'}
        {entityId.slice(-4)}
      </span>
    </span>
  );
};

/**
 * Timeline Event Item Component
 */
const TimelineEvent: React.FC<{ 
  event: OperationsEvent;
  index: number;
  isLast: boolean;
}> = ({ event, index, isLast }) => {
  const systemConfig = SYSTEM_CONFIG[event.system];
  const eventIcon = EVENT_ICONS[event.type] || '📌';
  const entityIcon = ENTITY_ICONS[event.entityType] || '📄';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        padding: '12px 0',
        position: 'relative'
      }}
    >
      {/* Timeline Connector */}
      {!isLast && (
        <div style={{
          position: 'absolute',
          left: '19px',
          top: '44px',
          width: '2px',
          height: 'calc(100% - 24px)',
          background: `linear-gradient(180deg, ${systemConfig.color}40, transparent)`
        }} />
      )}
      
      {/* System Icon */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: systemConfig.bgColor,
          border: `1px solid ${systemConfig.color}50`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0,
          boxShadow: `0 0 15px ${systemConfig.glowColor}`,
          zIndex: 1
        }}
      >
        {eventIcon}
      </motion.div>
      
      {/* Event Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px'
        }}>
          {/* System Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: systemConfig.bgColor,
            border: `1px solid ${systemConfig.color}30`,
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: systemConfig.color
          }}>
            <span>{systemConfig.icon}</span>
            {systemConfig.label}
          </div>
          
          {/* Timestamp */}
          <div style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.4)',
            fontFamily: 'monospace'
          }}>
            {getRelativeTime(event.timestamp)}
          </div>
        </div>
        
        {/* Description */}
        <div style={{
          fontSize: '13px',
          lineHeight: 1.5,
          color: 'rgba(255, 255, 255, 0.85)',
          marginBottom: '6px'
        }}>
          {formatEventDescription(event)}
        </div>
        
        {/* Entity Tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          <span>{entityIcon}</span>
          <span style={{ textTransform: 'capitalize' }}>{event.entityType}</span>
          <span>•</span>
          <span style={{ 
            fontFamily: 'monospace',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            {event.id.slice(-8)}
          </span>
        </div>
        
        {/* Metadata (if present) */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '8px',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {Object.entries(event.metadata).slice(0, 3).map(([key, value]) => (
              <span key={key}>
                <span style={{ textTransform: 'capitalize', opacity: 0.7 }}>
                  {key.replace(/_/g, ' ')}:
                </span>
                {' '}
                <span style={{ color: systemConfig.color, fontFamily: 'monospace' }}>
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Empty State Component
 */
const EmptyState: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    style={{
      textAlign: 'center',
      padding: '40px 20px',
      color: 'rgba(255, 255, 255, 0.4)'
    }}
  >
    <div style={{ 
      fontSize: '48px', 
      marginBottom: '16px',
      opacity: 0.5 
    }}>
      ⏱️
    </div>
    <div style={{ fontSize: '14px' }}>No recent activity</div>
    <div style={{ 
      fontSize: '12px', 
      marginTop: '8px', 
      opacity: 0.7 
    }}>
      Cross-system events will appear here in real-time
    </div>
  </motion.div>
);

/**
 * Loading State Component
 */
const LoadingState: React.FC = () => (
  <div style={{ padding: '20px' }}>
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          delay: i * 0.2 
        }}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          padding: '12px 0'
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)'
        }} />
        <div style={{ flex: 1 }}>
          <div style={{
            height: '12px',
            width: '80px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            marginBottom: '8px'
          }} />
          <div style={{
            height: '16px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
            marginBottom: '8px'
          }} />
          <div style={{
            height: '10px',
            width: '60%',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px'
          }} />
        </div>
      </motion.div>
    ))}
  </div>
);

export const OperationsTimeline: React.FC<OperationsTimelineProps & { isLoading?: boolean }> = ({ 
  events, 
  maxEvents = 20,
  isLoading = false
}) => {
  // Sort events by timestamp (newest first) and limit
  const sortedEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxEvents);
  }, [events, maxEvents]);

  // Count by system
  const systemCounts = useMemo(() => {
    return events.reduce((acc, event) => {
      acc[event.system] = (acc[event.system] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [events]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel-vanta"
        style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'var(--glass-layer-2)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 80px rgba(0, 0, 0, 0.8)',
          maxHeight: '600px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              background: 'linear-gradient(90deg, #00f3ff, #9d4edd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Operations Timeline
            </h3>
          </div>
        </div>
        <LoadingState />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel-vanta"
      style={{
        padding: '24px',
        borderRadius: '16px',
        background: 'var(--glass-layer-2)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 80px rgba(0, 0, 0, 0.8)',
        maxHeight: '600px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            background: 'linear-gradient(90deg, #00f3ff, #ff006e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Operations Timeline
          </h3>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '4px'
          }}>
            Cross-system event feed • {events.length} total events
          </div>
        </div>

        {/* System Counts */}
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          {(['voltledger', 'sherlock', 'bridge'] as EventSystem[]).map(system => {
            const count = systemCounts[system] || 0;
            const config = SYSTEM_CONFIG[system];
            return (
              <motion.div
                key={system}
                whileHover={{ scale: 1.05 }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: config.bgColor,
                  border: `1px solid ${config.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '12px' }}>{config.icon}</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: config.color
                }}>
                  {count}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Timeline List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '8px',
        marginRight: '-8px'
      }} className="vanta-scrollbar">
        <AnimatePresence mode="popLayout">
          {sortedEvents.length > 0 ? (
            sortedEvents.map((event, index) => (
              <TimelineEvent 
                key={event.id} 
                event={event} 
                index={index}
                isLast={index === sortedEvents.length - 1}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      {sortedEvents.length > 0 && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.4)'
        }}>
          <span>Real-time sync • Updates every second</span>
          <span style={{ fontFamily: 'monospace' }}>
            Last: {sortedEvents[0]?.timestamp 
              ? new Date(sortedEvents[0].timestamp).toLocaleTimeString() 
              : 'Never'}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default OperationsTimeline;
