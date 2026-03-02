import React, { useEffect, useCallback } from 'react';
import { useGameStore, UPGRADE_MAX_LEVELS, UPGRADE_COSTS, SKILL_COSTS } from '../../lib/store';
import { motion } from 'framer-motion';
import { Bomb, Maximize, Layers, ArrowLeft, Coins, Clock, Zap, Gauge, Shield, TrendingUp, Clover, RotateCcw, Snowflake, Wand2 } from 'lucide-react';
import { usePlayerProfile, useUpdateProfile } from '../../lib/api';
import { offlineStorage } from '../../lib/offline-storage';
import { useAuth } from '../../hooks/use-auth';

type UpgradeType = keyof typeof UPGRADE_COSTS;

const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
};
const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export function Shop() {
  const { coins, upgrades, buyUpgrade, setGameState, syncWithProfile, freezeCount, cleanserCount, buySkillConsumable } = useGameStore();
  const { data: profile } = usePlayerProfile();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (profile) {
      syncWithProfile(profile);
    }
  }, [profile, syncWithProfile]);

  const handleBuyUpgrade = useCallback(async (type: UpgradeType) => {
    const success = buyUpgrade(type);
    
    if (success) {
      const newUpgrades = useGameStore.getState().upgrades;
      const newCoins = useGameStore.getState().coins;
      
      offlineStorage.setPlayerStats({
        coins: newCoins,
        ...newUpgrades,
      });
      
      if (user && navigator.onLine) {
        try {
          await updateProfile.mutateAsync({
            coins: newCoins,
            speedUpgrade: newUpgrades.bombCount,
            startSizeUpgrade: newUpgrades.figureSize,
            magnetUpgrade: newUpgrades.queueSize,
          });
        } catch (error) {
          offlineStorage.addPendingProfileSync({
            coins: newCoins,
            speedUpgrade: newUpgrades.bombCount,
            startSizeUpgrade: newUpgrades.figureSize,
            magnetUpgrade: newUpgrades.queueSize,
          });
        }
      }
    }
  }, [buyUpgrade, user]);

  const UPGRADE_ITEMS: {
    id: UpgradeType;
    name: string;
    icon: React.ReactNode;
    desc: string;
    level: number;
    maxLevel: number;
    cost: number;
    color: string;
    glow: string;
  }[] = [
    {
      id: 'bombCount',
      name: 'BOMBS+',
      icon: <Bomb size={24} />,
      desc: '+1 tactical bomb',
      level: upgrades.bombCount,
      maxLevel: UPGRADE_MAX_LEVELS.bombCount,
      cost: UPGRADE_COSTS.bombCount * upgrades.bombCount,
      color: 'bg-destructive',
      glow: 'rgba(255,68,68,0.4)'
    },
    {
      id: 'figureSize',
      name: 'SHRINK',
      icon: <Maximize size={24} />,
      desc: '-5% bacteria size',
      level: upgrades.figureSize,
      maxLevel: UPGRADE_MAX_LEVELS.figureSize,
      cost: UPGRADE_COSTS.figureSize * upgrades.figureSize,
      color: 'bg-primary',
      glow: 'rgba(34,242,162,0.4)'
    },
    {
      id: 'queueSize',
      name: 'PREVIEW+',
      icon: <Layers size={24} />,
      desc: '+1 preview figure',
      level: upgrades.queueSize,
      maxLevel: UPGRADE_MAX_LEVELS.queueSize,
      cost: UPGRADE_COSTS.queueSize * upgrades.queueSize,
      color: 'bg-accent',
      glow: 'rgba(255,106,213,0.4)'
    },
    {
      id: 'timeBonus',
      name: 'TIME+',
      icon: <Clock size={24} />,
      desc: '+3s starting time',
      level: upgrades.timeBonus,
      maxLevel: UPGRADE_MAX_LEVELS.timeBonus,
      cost: UPGRADE_COSTS.timeBonus * upgrades.timeBonus,
      color: 'bg-blue-500',
      glow: 'rgba(59,130,246,0.4)'
    },
    {
      id: 'placementBonus',
      name: 'BONUS+',
      icon: <Zap size={24} />,
      desc: '+0.3s per placement',
      level: upgrades.placementBonus,
      maxLevel: UPGRADE_MAX_LEVELS.placementBonus,
      cost: UPGRADE_COSTS.placementBonus * upgrades.placementBonus,
      color: 'bg-yellow-500',
      glow: 'rgba(234,179,8,0.4)'
    },
    {
      id: 'slowMo',
      name: 'SLOW-MO',
      icon: <Gauge size={24} />,
      desc: 'Slower vibration',
      level: upgrades.slowMo,
      maxLevel: UPGRADE_MAX_LEVELS.slowMo,
      cost: UPGRADE_COSTS.slowMo * upgrades.slowMo,
      color: 'bg-purple-500',
      glow: 'rgba(168,85,247,0.4)'
    },
    {
      id: 'shield',
      name: 'SHIELD',
      icon: <Shield size={24} />,
      desc: 'Forgive 1 collision',
      level: upgrades.shield,
      maxLevel: UPGRADE_MAX_LEVELS.shield,
      cost: UPGRADE_COSTS.shield,
      color: 'bg-cyan-500',
      glow: 'rgba(6,182,212,0.4)'
    },
    {
      id: 'coinBoost',
      name: 'COIN+',
      icon: <TrendingUp size={24} />,
      desc: '+10% coin earnings',
      level: upgrades.coinBoost,
      maxLevel: UPGRADE_MAX_LEVELS.coinBoost,
      cost: UPGRADE_COSTS.coinBoost * upgrades.coinBoost,
      color: 'bg-secondary',
      glow: 'rgba(249,233,0,0.4)'
    },
    {
      id: 'lucky',
      name: 'LUCKY',
      icon: <Clover size={24} />,
      desc: 'More bombs in queue',
      level: upgrades.lucky,
      maxLevel: UPGRADE_MAX_LEVELS.lucky,
      cost: UPGRADE_COSTS.lucky * upgrades.lucky,
      color: 'bg-green-600',
      glow: 'rgba(22,163,74,0.4)'
    },
    {
      id: 'secondChance',
      name: '2ND CHANCE',
      icon: <RotateCcw size={24} />,
      desc: 'Undo last move on game over',
      level: upgrades.secondChance,
      maxLevel: UPGRADE_MAX_LEVELS.secondChance,
      cost: UPGRADE_COSTS.secondChance,
      color: 'bg-orange-500',
      glow: 'rgba(249,115,22,0.4)'
    }
  ];

  const SKILL_ITEMS = [
    {
      id: 'freeze' as const,
      name: 'FREEZE',
      icon: <Snowflake size={24} />,
      desc: 'Stop vibrations for 5 seconds',
      count: freezeCount,
      cost: SKILL_COSTS.freeze,
      color: 'bg-blue-500',
      glow: 'rgba(59,130,246,0.4)'
    },
    {
      id: 'cleanser' as const,
      name: 'CLEANSER',
      icon: <Wand2 size={24} />,
      desc: 'Draw to remove bacteria',
      count: cleanserCount,
      cost: SKILL_COSTS.cleanser,
      color: 'bg-purple-500',
      glow: 'rgba(168,85,247,0.4)'
    }
  ];

  return (
    <div className="min-h-screen overflow-y-auto bg-background flex flex-col items-center p-4 scanlines crt-vignette scrollable-screen">
      <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none" />
      
      <div className="w-full max-w-lg flex justify-between items-center mb-4 relative z-10 sticky top-0 bg-background/80 backdrop-blur-sm py-2">
        <button 
          onClick={() => setGameState('MENU')}
          className="block-panel p-2 hover:border-primary transition-colors active:scale-95"
          data-testid="button-back"
        >
          <ArrowLeft className="text-primary" size={20} />
        </button>
        <h1 
          className="text-xl font-display"
          style={{
            color: '#22F2A2',
            textShadow: '0 0 10px #22F2A2, 0 0 20px #22F2A2'
          }}
        >
          UPGRADES
        </h1>
        <div className="flex items-center gap-2 block-panel px-3 py-1" data-testid="text-coins">
          <Coins className="text-secondary" size={18} />
          <span className="coin-display font-ui text-xl">{coins}</span>
        </div>
      </div>

      <motion.div 
        className="w-full max-w-lg grid grid-cols-1 gap-3 relative z-10 pb-4"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {UPGRADE_ITEMS.map((item) => {
          const isConsumable = item.id === 'secondChance' || item.id === 'shield';
          const isMaxed = !isConsumable && item.level >= item.maxLevel;
          const canAfford = coins >= item.cost;
          
          return (
            <motion.div 
              key={item.id}
              variants={slideIn}
              className={`block-panel p-3 flex items-center gap-3 relative overflow-hidden ${isMaxed ? 'opacity-60' : ''}`}
              data-testid={`upgrade-card-${item.id}`}
            >
              <div 
                className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center text-black shadow-lg flex-shrink-0`}
                style={{ boxShadow: `0 0 20px ${item.glow}` }}
              >
                {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-display text-xs text-foreground">{item.name}</h3>
                  <span className="font-ui text-lg text-primary text-glow" data-testid={`text-level-${item.id}`}>
                    {isConsumable ? `x${item.level}` : (isMaxed ? 'MAX' : `LV.${item.level}`)}
                  </span>
                </div>
                <p className="font-ui text-sm text-muted-foreground mb-2 truncate">{item.desc}</p>
                
                {isMaxed ? (
                  <div className="w-full py-1.5 font-display text-xs flex items-center justify-center gap-2 bg-muted text-muted-foreground border-2 border-border rounded-md">
                    MAXED OUT
                  </div>
                ) : (
                  <button
                    onClick={() => handleBuyUpgrade(item.id)}
                    disabled={!canAfford}
                    className={`w-full py-1.5 font-display text-xs flex items-center justify-center gap-2 rounded-md active:scale-[0.97] transition-transform
                      ${canAfford 
                        ? 'pixel-btn' 
                        : 'bg-muted text-muted-foreground border-2 border-border cursor-not-allowed'
                      }`}
                    data-testid={`button-upgrade-${item.id}`}
                  >
                    {canAfford ? (isConsumable ? 'BUY +1' : 'BUY') : 'NEED'}
                    <span className="font-ui text-sm">
                      [{item.cost}G]
                    </span>
                  </button>
                )}
              </div>
              
              {!isConsumable && (
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  {[...Array(item.maxLevel)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-3 rounded-sm ${i < item.level ? item.color : 'bg-muted'} transition-all`}
                      style={i < item.level ? { boxShadow: `0 0 6px ${item.glow}` } : {}}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}

        <motion.div variants={slideIn} className="w-full mt-4 mb-2">
          <h2 className="font-display text-sm text-center" style={{ color: '#FF6AD5', textShadow: '0 0 8px #FF6AD5' }}>
            SKILL CONSUMABLES
          </h2>
        </motion.div>

        {SKILL_ITEMS.map((item) => {
          const canAfford = coins >= item.cost;
          
          return (
            <motion.div 
              key={item.id}
              variants={slideIn}
              className="block-panel p-3 flex items-center gap-3 relative overflow-hidden"
              data-testid={`skill-card-${item.id}`}
            >
              <div 
                className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center text-white shadow-lg flex-shrink-0`}
                style={{ boxShadow: `0 0 20px ${item.glow}` }}
              >
                {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-display text-xs text-foreground">{item.name}</h3>
                  <span className="font-ui text-lg text-primary text-glow" data-testid={`text-count-${item.id}`}>
                    x{item.count}
                  </span>
                </div>
                <p className="font-ui text-sm text-muted-foreground mb-2 truncate">{item.desc}</p>
                
                <button
                  onClick={() => buySkillConsumable(item.id)}
                  disabled={!canAfford}
                  className={`w-full py-1.5 font-display text-xs flex items-center justify-center gap-2 rounded-md active:scale-[0.97] transition-transform
                    ${canAfford 
                      ? 'pixel-btn' 
                      : 'bg-muted text-muted-foreground border-2 border-border cursor-not-allowed'
                    }`}
                  data-testid={`button-buy-${item.id}`}
                >
                  {canAfford ? 'BUY +1' : 'NEED'}
                  <span className="font-ui text-sm">
                    [{item.cost}G]
                  </span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
