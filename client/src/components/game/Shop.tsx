import React, { useEffect } from 'react';
import { useGameStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { Bomb, Maximize, Layers, ArrowLeft, Coins } from 'lucide-react';
import { usePlayerProfile, useUpdateProfile } from '../../lib/api';

export function Shop() {
  const { coins, upgrades, buyUpgrade, setGameState, syncWithProfile } = useGameStore();
  const { data: profile } = usePlayerProfile();
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (profile) {
      syncWithProfile(profile);
    }
  }, [profile, syncWithProfile]);

  const handleBuyUpgrade = async (type: 'bombCount' | 'figureSize' | 'queueSize') => {
    const success = buyUpgrade(type);
    
    if (success && profile) {
      const newUpgrades = useGameStore.getState().upgrades;
      const newCoins = useGameStore.getState().coins;
      
      await updateProfile.mutateAsync({
        coins: newCoins,
        speedUpgrade: newUpgrades.bombCount,
        startSizeUpgrade: newUpgrades.figureSize,
        magnetUpgrade: newUpgrades.queueSize,
      });
    }
  };

  const UPGRADE_ITEMS = [
    {
      id: 'bombCount',
      name: 'BOMBS+',
      icon: <Bomb size={28} />,
      desc: 'Start with more bombs',
      level: upgrades.bombCount,
      cost: 150 * upgrades.bombCount,
      color: 'bg-destructive'
    },
    {
      id: 'figureSize',
      name: 'SHRINK',
      icon: <Maximize size={28} />,
      desc: 'Smaller bacteria size',
      level: upgrades.figureSize,
      cost: 100 * upgrades.figureSize,
      color: 'bg-primary'
    },
    {
      id: 'queueSize',
      name: 'PREVIEW+',
      icon: <Layers size={28} />,
      desc: 'See more upcoming',
      level: upgrades.queueSize,
      cost: 200 * upgrades.queueSize,
      color: 'bg-accent'
    }
  ] as const;

  return (
    <div className="absolute inset-0 bg-background flex flex-col items-center p-6 scanlines crt-vignette">
      <div className="absolute inset-0 grid-bg opacity-20" />
      
      <div className="w-full max-w-md flex justify-between items-center mb-8 relative z-10">
        <button 
          onClick={() => setGameState('MENU')}
          className="block-panel p-3 hover:bg-primary/20"
          data-testid="button-back"
        >
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-display text-shadow-pixel">UPGRADES</h1>
        <div className="flex items-center gap-2 block-panel px-4 py-2" data-testid="text-coins">
          <Coins className="text-secondary" size={20} />
          <span className="text-secondary font-ui text-2xl">{coins} G</span>
        </div>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4 relative z-10">
        {UPGRADE_ITEMS.map((item, index) => (
          <motion.div 
            key={item.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="block-panel p-4 flex items-center gap-4 relative"
            data-testid={`upgrade-card-${item.id}`}
          >
            <div className={`w-14 h-14 ${item.color} flex items-center justify-center text-black border-2 border-black`}>
              {item.icon}
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-display text-sm">{item.name}</h3>
                <span className="font-ui text-xl text-secondary" data-testid={`text-level-${item.id}`}>
                  LV.{item.level}
                </span>
              </div>
              <p className="font-ui text-lg text-foreground/60 mb-2">{item.desc}</p>
              
              <button
                onClick={() => handleBuyUpgrade(item.id)}
                disabled={coins < item.cost}
                className={`w-full py-2 font-display text-xs flex items-center justify-center gap-2 transition-all
                  ${coins >= item.cost 
                    ? 'pixel-btn' 
                    : 'bg-foreground/10 text-foreground/30 border-2 border-foreground/20 cursor-not-allowed'
                  }`}
                data-testid={`button-upgrade-${item.id}`}
              >
                {coins >= item.cost ? 'BUY' : 'LOCKED'}
                <span className="font-ui text-lg">
                  [{item.cost}G]
                </span>
              </button>
            </div>
            
            <div className="absolute top-2 right-2 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-4 ${i < item.level ? item.color : 'bg-foreground/20'} border border-black/50`} 
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
