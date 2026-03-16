import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface FreshnessLoopProps {
  percentage: number;
}

export function FreshnessLoop({ percentage }: FreshnessLoopProps) {
  // Clamp between 0 and 100
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  
  return (
    <div className="glass-panel p-6 rounded-2xl mb-8 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-success/20 text-success rounded-lg">
            <Activity size={18} />
          </div>
          <h2 className="text-lg font-display font-semibold text-foreground text-glow">Freshness Loop</h2>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-success font-display">{safePercentage.toFixed(1)}%</span>
          <span className="text-sm text-muted-foreground ml-2">site fresh (&lt;90 days)</span>
        </div>
      </div>
      
      <div className="w-full h-4 bg-black/50 border border-white/5 rounded-full overflow-hidden relative">
        {/* Track markings */}
        <div className="absolute inset-0 w-full h-full flex justify-between px-1 opacity-20 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-[1px] h-full bg-white/50" />
          ))}
        </div>
        
        {/* Animated Bar */}
        <motion.div 
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]"
          initial={{ width: 0 }}
          animate={{ width: `${safePercentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {/* Shine effect on the bar */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}
