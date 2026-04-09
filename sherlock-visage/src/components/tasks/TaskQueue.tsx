/**
 * TaskQueue Component
 * Real-time task list with progress bars and status indicators
 * Dark glass-morphism styling with Vanta theme
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskUpdateMessage } from '../../hooks/useWebSocket';

interface TaskQueueProps {
  tasks: TaskUpdateMessage['payload'][];
  maxTasks?: number;
}

// Status configuration
const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  glowColor: string;
  icon: string;
}> = {
  'pending': {
    label: 'Pending',
    color: '#ff8c00',
    bgColor: 'rgba(255, 140, 0, 0.1)',
    glowColor: 'rgba(255, 140, 0, 0.3)',
    icon: '⏳'
  },
  'running': {
    label: 'Running',
    color: '#00f3ff',
    bgColor: 'rgba(0, 243, 255, 0.1)',
    glowColor: 'rgba(0, 243, 255, 0.3)',
    icon: '⚡'
  },
  'completed': {
    label: 'Completed',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.1)',
    glowColor: 'rgba(0, 255, 136, 0.3)',
    icon: '✓'
  },
  'failed': {
    label: 'Failed',
    color: '#ff4444',
    bgColor: 'rgba(255, 68, 68, 0.1)',
    glowColor: 'rgba(255, 68, 68, 0.3)',
    icon: '✕'
  }
};

// Priority configuration
const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  'low': { color: 'rgba(255, 255, 255, 0.4)', label: 'Low' },
  'medium': { color: '#00f3ff', label: 'Medium' },
  'high': { color: '#ff8c00', label: 'High' },
  'critical': { color: '#ff006e', label: 'Critical' }
};

// Agent avatars mapping
const AGENT_AVATARS: Record<string, string> = {
  'volt_backend': '🔧',
  'volt_fintech': '💰',
  'volt_frontend': '🎨',
  'volt_devops': '🚀',
  'volt_data_arch': '🗄️',
  'volt_automation': '⚡',
  'volt_bi': '📊',
  'default': '🤖'
};

// Agent colors mapping
const AGENT_COLORS: Record<string, string> = {
  'volt_backend': '#00f3ff',
  'volt_fintech': '#9d4edd',
  'volt_frontend': '#00ff88',
  'volt_devops': '#ff8c00',
  'volt_data_arch': '#1890ff',
  'volt_automation': '#ff006e',
  'volt_bi': '#fb5607',
  'default': '#00f3ff'
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

  if (diffSecs < 10) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

/**
 * Status Badge Component
 */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['pending'];
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        background: config.bgColor,
        border: `1px solid ${config.color}`,
        boxShadow: `0 0 15px ${config.glowColor}`,
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: config.color
      }}
    >
      <span>{config.icon}</span>
      {config.label}
    </motion.div>
  );
};

/**
 * Progress Bar Component with animation
 */
const ProgressBar: React.FC<{ 
  progress: number; 
  status: string;
  agentId: string;
}> = ({ progress, status, agentId }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['pending'];
  const agentColor = AGENT_COLORS[agentId] || AGENT_COLORS.default;
  const color = status === 'running' ? agentColor : config.color;
  
  return (
    <div style={{
      width: '100%',
      height: '6px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '3px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          height: '100%',
          background: `linear-gradient(90deg, ${color}, ${color}80)`,
          borderRadius: '3px',
          boxShadow: `0 0 10px ${color}50`
        }}
      />
      {status === 'running' && (
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '30%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
            borderRadius: '3px'
          }}
        />
      )}
    </div>
  );
};

/**
 * Task Item Component
 */
const TaskItem: React.FC<{ 
  task: TaskUpdateMessage['payload'];
  index: number;
}> = ({ task, index }) => {
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['medium'];
  const agentAvatar = AGENT_AVATARS[task.agentId] || AGENT_AVATARS['default'];
  const agentColor = AGENT_COLORS[task.agentId] || AGENT_COLORS.default;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={{
        padding: '16px 20px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: '12px',
        transition: 'all 0.3s ease'
      }}
      whileHover={{
        scale: 1.01,
        background: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Header Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div style={{ flex: 1, marginRight: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '6px'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.95)',
              lineHeight: 1.4
            }}>
              {task.title}
            </span>
            <span style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: priorityConfig.color + '20',
              color: priorityConfig.color,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600
            }}>
              {priorityConfig.label}
            </span>
          </div>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {task.description}
          </p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {/* Progress Section */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px'
        }}>
          <span style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Progress
          </span>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: agentColor,
            fontFamily: 'monospace'
          }}>
            {task.progress}%
          </span>
        </div>
        <ProgressBar 
          progress={task.progress} 
          status={task.status}
          agentId={task.agentId}
        />
      </div>

      {/* Footer Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Agent Assignment */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${agentColor}30, ${agentColor}10)`,
              border: `1px solid ${agentColor}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              boxShadow: `0 0 15px ${agentColor}30`
            }}
          >
            {agentAvatar}
          </motion.div>
          <div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Assigned to
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 500,
              color: agentColor
            }}>
              {task.agentName.replace('volt_', '').replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.4)',
          fontFamily: 'monospace'
        }}>
          {getRelativeTime(task.timestamp)}
        </div>
      </div>
    </motion.div>
  );
};

export const TaskQueue: React.FC<TaskQueueProps> = ({ 
  tasks, 
  maxTasks = 10 
}) => {
  // Sort tasks by status (running first) then by timestamp
  const sortedTasks = useMemo(() => {
    const statusPriority: Record<string, number> = {
      'running': 0,
      'pending': 1,
      'failed': 2,
      'completed': 3
    };

    return [...tasks]
      .sort((a, b) => {
        const statusDiff = (statusPriority[a.status] ?? 4) - (statusPriority[b.status] ?? 4);
        if (statusDiff !== 0) return statusDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, maxTasks);
  }, [tasks, maxTasks]);

  // Count by status
  const counts = useMemo(() => {
    return tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [tasks]);

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
            background: 'linear-gradient(90deg, #00f3ff, #9d4edd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Task Queue
          </h3>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '4px'
          }}>
            {tasks.length} total tasks • {counts['running'] || 0} active
          </div>
        </div>

        {/* Status Counts */}
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          {['running', 'pending', 'completed', 'failed'].map(status => (
            <div key={status} style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: STATUS_CONFIG[status].bgColor,
              border: `1px solid ${STATUS_CONFIG[status].color}30`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '12px' }}>{STATUS_CONFIG[status].icon}</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: STATUS_CONFIG[status].color
              }}>
                {counts[status] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '8px',
        marginRight: '-8px'
      }} className="vanta-scrollbar">
        <AnimatePresence mode="popLayout">
          {sortedTasks.length > 0 ? (
            sortedTasks.map((task, index) => (
              <TaskItem key={task.taskId} task={task} index={index} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'rgba(255, 255, 255, 0.4)'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div style={{ fontSize: '14px' }}>No tasks in queue</div>
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                Tasks will appear here when agents start working
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      {sortedTasks.length > 0 && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <span>Showing {sortedTasks.length} of {tasks.length} tasks</span>
          <span>Real-time updates active</span>
        </div>
      )}
    </motion.div>
  );
};

export default TaskQueue;
