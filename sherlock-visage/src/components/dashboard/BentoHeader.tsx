import { motion } from 'framer-motion';
import { useCostTracker } from '../../hooks/telemetry/useCostTracker';

export const BentoHeader = () => {
  const { totalFleetCost, activeAgents, totalBudget, fleetEfficiency } = useCostTracker();
  
  const cells = [
    {
      label: 'FLEET SPEND',
      value: `$${totalFleetCost.toFixed(2)}`,
      subtext: `of $${totalBudget.toFixed(0)} daily`,
      percent: fleetEfficiency,
      color: 'cyan',
      delay: 0
    },
    {
      label: 'SYSTEM LATENCY',
      value: '12ms',
      subtext: 'Heartbeat stable',
      percent: 8,
      color: 'emerald',
      delay: 0.1
    },
    {
      label: 'ACTIVE AGENTS',
      value: `${activeAgents}`,
      subtext: 'of 7 working',
      percent: (activeAgents / 7) * 100,
      color: 'purple',
      delay: 0.2
    },
    {
      label: 'API CALLS/MIN',
      value: '1.2k',
      subtext: 'Processing rate',
      percent: 45,
      color: 'amber',
      delay: 0.3
    }
  ];

  const getColorClasses = (color: string, percent: number) => {
    const isWarning = percent > 75;
    const isDanger = percent > 90;
    
    const colors: Record<string, { bg: string; text: string; bar: string }> = {
      cyan: { 
        bg: 'from-cyan-500/10 to-transparent', 
        text: isWarning ? 'text-amber-400' : isDanger ? 'text-red-400' : 'text-cyan-400',
        bar: isWarning ? '#f59e0b' : isDanger ? '#f43f5e' : '#06b6d4'
      },
      emerald: { bg: 'from-emerald-500/10 to-transparent', text: 'text-emerald-400', bar: '#10b981' },
      purple: { bg: 'from-purple-500/10 to-transparent', text: 'text-purple-400', bar: '#a855f7' },
      amber: { bg: 'from-amber-500/10 to-transparent', text: 'text-amber-400', bar: '#f59e0b' },
    };
    
    return colors[color] || colors.cyan;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cells.map((cell) => {
        const colors = getColorClasses(cell.color, cell.percent);
        
        return (
          <motion.div
            key={cell.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: cell.delay, duration: 0.5 }}
            className="glass-panel p-4 relative overflow-hidden group"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">{cell.label}</p>
              </div>
              
              <motion.p 
                className={`text-2xl font-bold ${colors.text} digital-readout`}
                style={{ textShadow: `0 0 20px ${colors.bar}40` }}
                key={cell.value}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
              >
                {cell.value}
              </motion.p>
              
              <p className="text-[10px] text-white/30 mt-1">{cell.subtext}</p>
              
              {/* Progress Bar */}
              <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: colors.bar }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(cell.percent, 100)}%` }}
                  transition={{ duration: 1, delay: cell.delay + 0.3 }}
                />
              </div>
            </div>
            
            {/* Shine Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full"
              animate={{ translateX: ['100%', '-100%'] }}
              transition={{ duration: 3, repeat: Infinity, delay: cell.delay + 2 }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};
