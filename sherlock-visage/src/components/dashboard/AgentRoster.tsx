import { motion } from 'framer-motion';
import { useCostTracker, AgentCost } from '../../hooks/telemetry/useCostTracker';

const AgentCard = ({ agent, index }: { agent: AgentCost; index: number }) => {
  const getStatusColor = (status: string, percent: number) => {
    if (percent > 90) return { dot: '#f43f5e', glow: 'shadow-red-500/50' };
    if (percent > 70) return { dot: '#f59e0b', glow: 'shadow-amber-500/50' };
    if (status === 'working') return { dot: '#06b6d4', glow: 'shadow-cyan-500/50' };
    return { dot: '#10b981', glow: 'shadow-emerald-500/50' };
  };

  const colors = getStatusColor(agent.status, agent.usagePercentage);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-panel p-3 flex items-center gap-3 group hover:bg-white/[0.05] transition-colors"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-xl border border-white/10">
        {agent.avatar}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{agent.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/5 uppercase">
            {agent.clearance}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/30 mt-0.5">
          <span className={agent.status === 'working' ? 'text-cyan-400' : 'text-emerald-400'}>
            {agent.status}
          </span>
          <span>•</span>
          <span>{agent.model}</span>
        </div>
      </div>
      
      {/* Cost Display */}
      <div className="text-right">
        <motion.div 
          className="text-sm font-bold digital-readout"
          style={{ 
            color: agent.usagePercentage > 80 ? '#f43f5e' : agent.usagePercentage > 60 ? '#f59e0b' : '#06b6d4',
            textShadow: `0 0 10px ${colors.dot}40`
          }}
        >
          ${agent.currentSessionCost.toFixed(2)}
        </motion.div>
        
        {/* Budget Ring */}
        <div className="flex items-center justify-end gap-1.5 mt-1">
          <motion.div
            className="text-[9px] text-white/30"
            animate={{ opacity: agent.costPerSecond > 0.0001 ? [0.5, 1, 0.5] : 0.3 }}
            transition={{ duration: 1 }}
          >
            {agent.costPerSecond > 0.0001 && `+$${(agent.costPerSecond * 60).toFixed(2)}/min`}
          </motion.div>
          
          <div className="relative w-4 h-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
              <circle
                cx="8" cy="8" r="6"
                fill="none"
                stroke={colors.dot}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(agent.usagePercentage, 100) * 0.377} 100`}
                className="transition-all duration-300"
              />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AgentRoster = () => {
  const { agents } = useCostTracker();

  return (
    <div className="glass-panel p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Agent Fleet</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow shadow-emerald-400/50 animate-pulse" />
          <span className="text-xs text-white/40">{agents.filter(a => a.status === 'working').length} active</span>
        </div>
      </div>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {agents.map((agent, index) => (
          <AgentCard key={agent.agentId} agent={agent} index={index} />
        ))}
      </div>
      
      {/* Fleet Summary */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/40">Total Fleet Budget</span>
          <span className="text-white/60">${agents.reduce((s, a) => s + a.dailyBudget, 0).toFixed(0)}/day</span>
        </div>
      </div>
    </div>
  );
};
