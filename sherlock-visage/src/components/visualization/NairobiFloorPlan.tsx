import React, { useState } from 'react';
import { Card, Row, Col, Button, Statistic, Tag, Progress } from 'antd';
import { 
  DesktopOutlined, 
  TeamOutlined, 
  EyeOutlined,
  RadarChartOutlined,
  CloudOutlined 
} from '@ant-design/icons';
import EnhancedVirtualOffice from './EnhancedVirtualOffice.polished';

const NairobiFloorPlan: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  
  const agents = [
    { id: 1, name: 'Strategic Architect', status: 'active', model: 'DeepSeek-R1', cost: 2.0, tasks: 12, efficiency: 92 },
    { id: 2, name: 'Lead Developer', status: 'active', model: 'DeepSeek-V3.2', cost: 0.3, tasks: 8, efficiency: 88 },
    { id: 3, name: 'Security Auditor', status: 'idle', model: 'GPT-4o', cost: 1.0, tasks: 3, efficiency: 95 },
    { id: 4, name: 'Rapid Prototyper', status: 'active', model: 'grok-4-1-fast-non-reasoning', cost: 0.1, tasks: 15, efficiency: 78 },
    { id: 5, name: 'Algorithm Specialist', status: 'idle', model: 'Kimi-K2.5', cost: 1.5, tasks: 5, efficiency: 90 },
    { id: 6, name: 'Crisis Resolver', status: 'error', model: 'DeepSeek-R1', cost: 3.0, tasks: 1, efficiency: 65 },
    { id: 7, name: 'Documentation Specialist', status: 'active', model: 'text-embedding-3-small', cost: 0.05, tasks: 20, efficiency: 85 },
  ];
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'green';
      case 'idle': return 'orange';
      case 'error': return 'red';
      default: return 'gray';
    }
  };
  
  const handleAgentSelect = (agentId: number) => {
    setSelectedAgent(agentId === selectedAgent ? null : agentId);
  };
  
  const selectedAgentData = selectedAgent ? agents.filter(a => a.id === selectedAgent)[0] : null;
  
  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Card
        title={
          <span>
            <TeamOutlined style={{ marginRight: 8 }} />
            Nairobi HQ - Virtual Office
          </span>
        }
        extra={
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={() => setSelectedAgent(null)}
          >
            Reset View
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        {/* 3D Virtual Office */}
<div style={{
          borderRadius: '12px',
          overflow: 'hidden',
          height: '600px',
          marginBottom: '24px',
          border: '1px solid #303030',
          backgroundColor: '#0a0a14'
        }}>
          <EnhancedVirtualOffice 
            onAgentSelect={handleAgentSelect}
            selectedAgent={selectedAgent}
          />
        </div>
        
        {/* Office Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Active Terminals"
                value={agents.filter(a => a.status === 'active').length}
                suffix={`/ ${agents.length}`}
                prefix={<DesktopOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Avg. Efficiency"
                value={Math.round(agents.reduce((sum, a) => sum + a.efficiency, 0) / agents.length)}
                suffix="%"
                prefix={<RadarChartOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Total Tasks"
                value={agents.reduce((sum, a) => sum + a.tasks, 0)}
                prefix={<CloudOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Cost Efficiency"
                value={85}
                suffix="%"
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
        
        {/* Selected Agent Details */}
        {selectedAgentData && (
          <Card 
            title="Selected Agent Details" 
            size="small"
            style={{ marginBottom: 24, borderLeft: `4px solid ${selectedAgentData.status === 'active' ? '#52c41a' : selectedAgentData.status === 'idle' ? '#fa8c16' : '#f5222d'}` }}
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ marginBottom: 8 }}>
                  <strong>Agent:</strong> {selectedAgentData.name}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Model:</strong> {selectedAgentData.model}
                </div>
                <div>
                  <strong>Cost Multiplier:</strong> {selectedAgentData.cost}x
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 8 }}>
                  <strong>Status:</strong>{' '}
                  <Tag color={getStatusColor(selectedAgentData.status)}>
                    {selectedAgentData.status.toUpperCase()}
                  </Tag>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Active Tasks:</strong> {selectedAgentData.tasks}
                </div>
                <div>
                  <strong>Efficiency:</strong>{' '}
                  <Progress 
                    percent={selectedAgentData.efficiency} 
                    size="small" 
                    strokeColor={selectedAgentData.efficiency > 80 ? '#52c41a' : selectedAgentData.efficiency > 60 ? '#fa8c16' : '#f5222d'}
                  />
                </div>
              </Col>
              <Col span={8}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Button type="primary" size="small">
                    View Task Log
                  </Button>
                  <Button size="small">
                    Performance Metrics
                  </Button>
                  <Button size="small" danger={selectedAgentData.status === 'error'}>
                    {selectedAgentData.status === 'error' ? 'Restart Agent' : 'Send Command'}
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>
        )}
        
        {/* All Agents Grid */}
        <Card title="Agent Terminals Overview" size="small">
          <Row gutter={[16, 16]}>
            {agents.map((agent) => (
              <Col span={8} key={agent.id}>
                <Card 
                  size="small"
                  hoverable
                  onClick={() => handleAgentSelect(agent.id)}
                  style={{ 
                    cursor: 'pointer',
                    border: selectedAgent === agent.id ? `2px solid ${getStatusColor(agent.status)}` : '1px solid #d9d9d9',
                    backgroundColor: selectedAgent === agent.id ? '#f6ffed' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{agent.name}</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>{agent.model}</div>
                      <Tag color={getStatusColor(agent.status)}>
                        {agent.status.toUpperCase()}
                      </Tag>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#1890ff' }}>
                        {agent.tasks}
                      </div>
                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>tasks</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      Cost: {agent.cost}x
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: agent.efficiency > 80 ? '#52c41a' : '#fa8c16' }}>
                      {agent.efficiency}% eff.
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
        
        {/* Legend */}
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          backgroundColor: '#f6ffed', 
          borderRadius: 8,
          fontSize: 12,
          color: '#8c8c8c'
        }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Virtual Office Legend:</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#3498db' }} />
              <span>Strategic Architect</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#2ecc71' }} />
              <span>Lead Developer</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#e74c3c' }} />
              <span>Security Auditor</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f39c12' }} />
              <span>Rapid Prototyper</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#9b59b6' }} />
              <span>Algorithm Specialist</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#1abc9c' }} />
              <span>Crisis Resolver</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#34495e' }} />
              <span>Documentation Specialist</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NairobiFloorPlan;