import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClassName?: string;
  delay?: number;
}

export function StatCard({ title, value, icon: Icon, trend, colorClassName, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-panel p-6 rounded-2xl relative overflow-hidden group"
    >
      <div className={cn(
        "absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500",
        colorClassName || "bg-primary"
      )} />
      
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-muted-foreground font-medium text-sm">{title}</h3>
        <div className={cn(
          "p-2 rounded-xl bg-black/40 border border-white/5",
          colorClassName ? colorClassName.replace('bg-', 'text-') : "text-primary"
        )}>
          <Icon size={18} />
        </div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-display font-bold text-foreground">{value}</span>
        {trend && (
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full border",
            trend.isPositive 
              ? "text-success bg-success/10 border-success/20" 
              : "text-destructive bg-destructive/10 border-destructive/20"
          )}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
