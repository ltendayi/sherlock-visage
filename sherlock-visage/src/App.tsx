import * as React from 'react';
import { Row, Col, Typography, Tabs } from 'antd';
import { AuthOverlay } from './components/auth/AuthOverlay';
import { BentoHeader } from './components/dashboard/BentoHeader';
import { AgentRoster } from './components/dashboard/AgentRoster';
import IsometricOffice from './components/visualization/IsometricOffice';
import { CostChart } from './components/charts/CostChart';
import { TaskQueue } from './components/tasks/TaskQueue';
import { SystemHealthPanel } from './components/panels/SystemHealthPanel';
import { useWebSocket } from './hooks/useWebSocket';
import './styles/vanta.css';

const { Title, Paragraph } = Typography;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);
  const [showAuth, setShowAuth] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('office');
  
  // Connect to telemetry WebSocket
  const { 
    isConnected, 
    delegates: agents, 
    tasks, 
    costs: telemetry,
    health: systemHealth 
  } = useWebSocket();

  // Auth overlay bypassed for demo
  // if (showAuth) {
  //   return <AuthOverlay onAuthenticated={() => { setIsAuthenticated(true); setShowAuth(false); }} />;
  // }

  return (
    <div className="vanta-bg">
      <div className="scanlines" />
      
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
            <span className="text-cyan-400 text-lg">◈</span>
          </div>
          <div>
            <h1 className="text-white tracking-widest text-sm font-semibold">SHERLOCK VISAGE</h1>
            <p className="text-white/30 text-[10px] uppercase tracking-wider">Operations Center • Nairobi HQ</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/50">SYSTEM ONLINE</span>
          </div>
          <div className="text-white/30 font-mono">{new Date().toLocaleTimeString()}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 grid-pattern" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Bento Grid Header */}
        <BentoHeader />
        
        {/* Dashboard Grid */}
        <Row gutter={[16, 16]} className="h-full">
          {/* Agent Roster - Left Sidebar */}
          <Col span={6} className="h-full">
            <AgentRoster />
          </Col>
          
          {/* Main Visualization Area */}
          <Col span={18} className="h-full">
            <div className="glass-panel p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                  Virtual Office • 10 Agent Stations
                </h3>
                <div className="flex gap-2 items-center">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className="text-white/50 text-xs">{isConnected ? 'WS CONNECTED' : 'WS DISCONNECTED'}</span>
                  <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 text-[10px] border border-cyan-500/20">
                    LIVE
                  </span>
                </div>
              </div>
              
              {/* Tab Navigation */}
              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                className="dashboard-tabs"
                items={[
                  {
                    key: 'office',
                    label: '3D Office',
                    children: (
                      <div className="h-full rounded-xl overflow-hidden border border-white/10" style={{ minHeight: '500px' }}>
                        <IsometricOffice simulationEnabled={true} />
                      </div>
                    )
                  },
                  {
                    key: 'analytics',
                    label: 'Cost Analytics',
                    children: <CostChart data={telemetry || []} />
                  },
                  {
                    key: 'tasks',
                    label: 'Task Queue',
                    children: <TaskQueue tasks={tasks || []} />
                  },
                  {
                    key: 'health',
                    label: 'System Health',
                    children: <SystemHealthPanel health={systemHealth} />
                  }
                ]}
              />
              
              {/* Footer Info */}
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-[10px] text-white/30">
                <span>Sherlock Visage • 10 Registered Agents • 7 VoltLedger</span>
                <span>Provider: amara_foundry • Azure AI Foundry</span>
              </div>
            </div>
          </Col>
        </Row>
      </main>
    </div>
  );
};

export default App;