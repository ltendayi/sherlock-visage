import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import AgentAvatar, { AgentAvatarProps } from './AgentAvatar';
import type { DelegateNode } from '../../types';

const { Title } = Typography;

export interface AgentAvatarGridProps {
  delegates: DelegateNode[];
  onAgentClick?: (agentId: string) => void;
  size?: 'small' | 'medium' | 'large';
  showStatus?: boolean;
}

const AgentAvatarGrid: React.FC<AgentAvatarGridProps> = ({
  delegates,
  onAgentClick,
  size = 'medium',
  showStatus = true,
}) => {
  const [avatars, setAvatars] = useState<AgentAvatarProps[]>([]);

  useEffect(() => {
    // Map delegates to avatar props
    const mappedAvatars = delegates.map(delegate => ({
      agentId: delegate.id,
      agentName: delegate.name,
      agentType: delegate.type,
      status: delegate.status,
      size,
      onClick: () => onAgentClick?.(delegate.id),
      className: 'avatar-card'
    }));
    setAvatars(mappedAvatars);
  }, [delegates, size, onAgentClick]);

  // Get avatar description based on agent type
  const getAgentDescription = (agentType: string, agentName: string) => {
    switch (agentName) {
      case 'Strategic Architect':
        return 'Cyborg architect designing system blueprints with precision circuits';
      case 'Security Auditor':
        return 'Sentinel guardian monitoring threats with shield-core scanning';
      case 'Crisis Resolver':
        return 'Firefighter AI extinguishing emergencies with rapid response protocols';
      case 'Lead Developer':
        return 'Code commander orchestrating development with headset-linked precision';
      case 'Rapid Prototyper':
        return 'Gear dynamo spinning prototypes with blueprint-guided innovation';
      case 'Algorithm Specialist':
        return 'Crystal oracle processing algorithms through neural network pathways';
      case 'Documentation Specialist':
        return 'Scroll scribe archiving knowledge with quill-pen documentation';
      default:
        return `${agentType} agent performing specialized tasks`;
    }
  };

  // Get status description
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢 Active - Processing tasks normally';
      case 'busy':
        return '🔵 Busy - High cognitive load with thought streams';
      case 'idle':
        return '🟡 Idle - Resting with power-saving mode';
      case 'error':
        return '🔴 Error - Requires attention with alert strobing';
      default:
        return '⚪ Unknown status';
    }
  };

  // Animation states for demo
  const [demoStatus, setDemoStatus] = useState<'active' | 'idle' | 'busy' | 'error'>('active');
  
  useEffect(() => {
    if (!showStatus) return;
    
    // Cycle through statuses for demo
    const statuses: Array<'active' | 'idle' | 'busy' | 'error'> = ['active', 'idle', 'busy', 'error'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % statuses.length;
      setDemoStatus(statuses[currentIndex]);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [showStatus]);

  return (
    <Card 
      title={
        <span>
          <TeamOutlined style={{ marginRight: 8 }} />
          AI Agent Avatars - 7 Unique Personas
        </span>
      }
      style={{ marginBottom: 24 }}
    >
      <div style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginBottom: 8 }}>Status Demo: {getStatusDescription(demoStatus)}</Title>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 16 }}>
          Each avatar has state-specific animations: pulsing effects (active/busy), thought streams (busy), 
          Zzz timer (idle), red alert strobing (error). Hover for interactive effects.
        </div>
      </div>

      <Row gutter={[16, 24]} justify="center">
        {avatars.map((avatar, index) => (
          <Col 
            key={avatar.agentId} 
            xs={24} 
            sm={12} 
            md={8} 
            lg={6}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <div style={{ textAlign: 'center' }}>
              <AgentAvatar
                {...avatar}
                status={showStatus ? demoStatus : avatar.status}
              />
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>
                  {getAgentDescription(avatar.agentType, avatar.agentName)}
                </div>
                <div style={{ 
                  fontSize: 10, 
                  padding: '2px 8px', 
                  borderRadius: 10,
                  backgroundColor: 
                    demoStatus === 'active' ? 'rgba(76, 175, 80, 0.1)' :
                    demoStatus === 'busy' ? 'rgba(33, 150, 243, 0.1)' :
                    demoStatus === 'idle' ? 'rgba(255, 152, 0, 0.1)' :
                    'rgba(244, 67, 54, 0.1)',
                  color:
                    demoStatus === 'active' ? '#4CAF50' :
                    demoStatus === 'busy' ? '#2196F3' :
                    demoStatus === 'idle' ? '#FF9800' :
                    '#F44336',
                  display: 'inline-block'
                }}>
                  {demoStatus.toUpperCase()}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f6ffed', borderRadius: 8 }}>
        <Title level={5} style={{ marginBottom: 8 }}>Animation States Explained</Title>
        <Row gutter={[16, 8]}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#4CAF50' }}>Active State</div>
              <div style={{ fontSize: 10, color: '#8c8c8c' }}>Pulsing green aura</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#2196F3' }}>Busy State</div>
              <div style={{ fontSize: 10, color: '#8c8c8c' }}>Thought streams + pulse</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#FF9800' }}>Idle State</div>
              <div style={{ fontSize: 10, color: '#8c8c8c' }}>Zzz animation + lean back</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#F44336' }}>Error State</div>
              <div style={{ fontSize: 10, color: '#8c8c8c' }}>Red alert strobing</div>
            </div>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

export default AgentAvatarGrid;