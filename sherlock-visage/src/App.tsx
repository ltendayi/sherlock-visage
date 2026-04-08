import * as React from 'react';
import { Row, Col, Typography } from 'antd';
import { AuthOverlay } from './components/auth/AuthOverlay';
import { BentoHeader } from './components/dashboard/BentoHeader';
import { AgentRoster } from './components/dashboard/AgentRoster';
import './styles/vanta.css';

const { Title, Paragraph } = Typography;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [showAuth, setShowAuth] = React.useState(true);

  if (showAuth) {
    return <AuthOverlay onAuthenticated={() => { setIsAuthenticated(true); setShowAuth(false); }} />;
  }

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
                  Virtual Office • 7 Agent Stations
                </h3>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 text-[10px] border border-cyan-500/20">
                    LIVE
                  </span>
                  <span className="px-2 py-1 rounded bg-white/5 text-white/40 text-[10px] border border-white/10">
                    WS ACTIVE
                  </span>
                </div>
              </div>
              
              {/* Placeholder for 3D Office Visualization */}
              <div className="flex-1 rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4 opacity-20">🏢</div>
                  <p className="text-white/20 text-sm">Interactive 3D Command Center</p>
                  <p className="text-white/10 text-xs mt-2">Phase 2: Isometric glass terminals coming soon</p>
                </div>
              </div>
              
              {/* Footer Info */}
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-[10px] text-white/30">
                <span>VoltLedger Project • 7 Registered Agents</span>
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