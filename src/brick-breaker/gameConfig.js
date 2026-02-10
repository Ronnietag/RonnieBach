/**
 * Brick Breaker Game - Complete Implementation
 *
 * This is a complete brick breaker game with:
 * - 10 unique levels with different color themes
 * - Roguelike element system (choose enhancements after each level)
 * - Endless mode with increasing difficulty
 * - Particle effects and visual polish
 * - Programmatic art generation (no external assets needed)
 */

// ============================================================================
// CORE GAME CONFIGURATION
// ============================================================================

export const GAME_CONFIG = {
  // Canvas dimensions
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,

  // Base physics parameters
  BASE_BALL_SPEED: 300,
  BASE_PADDLE_SPEED: 400,
  BASE_PADDLE_WIDTH: 100,
  BASE_PADDLE_HEIGHT: 15,
  BASE_BALL_RADIUS: 8,

  // Physics constants
  PADDLE_ELASTICITY: 1.0,
  WALL_ELASTICITY: 1.0,
  BRICK_ELASTICITY: 1.0,
  FRICTION: 0,
  MIN_VELOCITY: 50,
  MAX_VELOCITY: 600,

  // Level configuration
  BALL_SPEED_MODIFIERS: [0.8, 0.9, 1.0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35],
  PADDLE_WIDTH_MODIFIERS: [1.2, 1.0, 1.0, 0.95, 0.95, 0.9, 0.9, 0.85, 0.85, 0.8],
  SPECIAL_ANGLE_CHANCE: [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5],

  // Endless mode
  ENDLESS_BASE_DIFFICULTY: 1.0,
  ENDLESS_DIFFICULTY_GROWTH: 0.15,
  ENDLESS_TIME_PER_LEVEL: 120000,

  // Game states
  STATES: {
    MENU: 'menu',
    PLAYING: 'playing',
    LEVEL_COMPLETE: 'level_complete',
    ROGUELIKE_SELECT: 'roguelike_select',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
    ENDLESS: 'endless'
  }
};

// ============================================================================
// COLOR THEMES FOR 10 LEVELS
// ============================================================================

export const LEVEL_THEMES = {
  1: {
    name: '极光绿',
    background: '#0D1F1A',
    brickColors: ['#00FF88', '#00CC6A', '#00A855'],
    paddleColor: '#00FFAA',
    ballColor: '#FFFFFF',
    textColor: '#00FF88',
    accentColor: '#00FFAA'
  },
  2: {
    name: '星辰蓝',
    background: '#0A1525',
    brickColors: ['#00D4FF', '#0099CC', '#006699', '#003366'],
    paddleColor: '#00D4FF',
    ballColor: '#FFFFFF',
    textColor: '#00D4FF',
    accentColor: '#00FFFF'
  },
  3: {
    name: '烈焰橙',
    background: '#1A0F0A',
    brickColors: ['#FF6B35', '#FF4500', '#FF0000', '#CC0000'],
    paddleColor: '#FF8C00',
    ballColor: '#FFD700',
    textColor: '#FF6B35',
    accentColor: '#FF4500'
  },
  4: {
    name: '紫晶魔域',
    background: '#0F0515',
    brickColors: ['#DDA0DD', '#9932CC', '#8B00FF', '#6A0DAD', '#4B0082'],
    paddleColor: '#DA70D6',
    ballColor: '#FFFFFF',
    textColor: '#DDA0DD',
    accentColor: '#9932CC'
  },
  5: {
    name: '翡翠森林',
    background: '#0A1A0D',
    brickColors: ['#32CD32', '#228B22', '#006400', '#00FF00', '#7CFC00'],
    paddleColor: '#00FF7F',
    ballColor: '#FFFFFF',
    textColor: '#32CD32',
    accentColor: '#00FF00'
  },
  6: {
    name: '珊瑚深海',
    background: '#0A1520',
    brickColors: ['#FF6B6B', '#FF4757', '#C56CF0', '#17C0EB', '#0099FF'],
    paddleColor: '#00FFFF',
    ballColor: '#FFFFFF',
    textColor: '#FF6B6B',
    accentColor: '#00FFFF'
  },
  7: {
    name: '霓虹都市',
    background: '#0A0A15',
    brickColors: ['#00D4FF', '#FF00FF', '#00FF00', '#FFFF00', '#FF4500', '#FF1493'],
    paddleColor: '#FF00FF',
    ballColor: '#FFFFFF',
    textColor: '#00FF00',
    accentColor: '#FFFF00'
  },
  8: {
    name: '钢铁风暴',
    background: '#0A0F12',
    brickColors: ['#A9A9A9', '#808080', '#696969', '#778899', '#708090', '#2F4F4F', '#1C1C1C'],
    paddleColor: '#00CED1',
    ballColor: '#FFFFFF',
    textColor: '#A9A9A9',
    accentColor: '#00FFFF'
  },
  9: {
    name: '彩虹宝石',
    background: '#0A0A12',
    brickColors: ['#00D4FF', '#00FF88', '#FFFF00', '#FF4500', '#FF1493', '#9932CC', '#FFFFFF', '#C0C0C0'],
    paddleColor: '#FFD700',
    ballColor: '#FFFFFF',
    textColor: '#00D4FF',
    accentColor: '#FFD700'
  },
  10: {
    name: '暗影终局',
    background: '#000005',
    brickColors: ['#FF0000', '#FF4444', '#8B0000', '#800000', '#FFD700', '#FFA500', '#FF1493', '#DC143C'],
    paddleColor: '#FF0000',
    ballColor: '#FFFFFF',
    textColor: '#FF0000',
    accentColor: '#FFD700',
    bossColor: '#FF0000',
    bossShield: 'rgba(255, 0, 0, 0.4)'
  }
};

// ============================================================================
// ROGUELIKE ENHANCEMENTS DATABASE
// ============================================================================

export const ROGUELIKE_ENHANCEMENTS = {
  // Paddle enhancements
  paddleWidthBasic: {
    id: 'paddleWidthBasic',
    name: '挡板宽度增强',
    category: 'paddle',
    description: '增加挡板宽度30%',
    icon: '⬜',
    rarity: 'common',
    minLevel: 1,
    effect: (state) => { state.paddleWidthMultiplier *= 1.3; },
    value: 0.3
  },
  paddleWidthAdvanced: {
    id: 'paddleWidthAdvanced',
    name: '高级挡板增强',
    category: 'paddle',
    description: '增加挡板宽度50%',
    icon: '🟦',
    rarity: 'uncommon',
    minLevel: 3,
    effect: (state) => { state.paddleWidthMultiplier *= 1.5; },
    value: 0.5
  },
  paddleSpeed: {
    id: 'paddleSpeed',
    name: '移动速度提升',
    category: 'paddle',
    description: '增加挡板移动速度25%',
    icon: '⚡',
    rarity: 'common',
    minLevel: 1,
    effect: (state) => { state.paddleSpeedMultiplier *= 1.25; },
    value: 0.25
  },
  paddleSuper: {
    id: 'paddleSuper',
    name: '超级挡板形态',
    category: 'paddle',
    description: '宽度+30%, 厚度+25%, 边缘吸附',
    icon: '💎',
    rarity: 'epic',
    minLevel: 5,
    effect: (state) => {
      state.paddleWidthMultiplier *= 1.3;
      state.paddleHeightMultiplier *= 1.25;
      state.edgeGrip = true;
    },
    value: 0.55
  },
  paddleDash: {
    id: 'paddleDash',
    name: '瞬移冲刺',
    category: 'paddle',
    description: '冷却8秒的短距离瞬移能力',
    icon: '🔮',
    rarity: 'rare',
    minLevel: 3,
    effect: (state) => { state.dashEnabled = true; },
    value: 0.4
  },

  // Ball enhancements
  ballSize: {
    id: 'ballSize',
    name: '球体膨胀',
    category: 'ball',
    description: '增加球体体积30%',
    icon: '🔵',
    rarity: 'common',
    minLevel: 1,
    effect: (state) => { state.ballSizeMultiplier *= 1.3; },
    value: 0.3
  },
  ballSpeed: {
    id: 'ballSpeed',
    name: '速度爆发',
    category: 'ball',
    description: '增加球体速度25%',
    icon: '🚀',
    rarity: 'common',
    minLevel: 1,
    effect: (state) => { state.ballSpeedMultiplier *= 1.25; },
    value: 0.25
  },
  ballPenetrate: {
    id: 'ballPenetrate',
    name: '穿透射击',
    category: 'ball',
    description: '球体可穿透3个砖块',
    icon: '💥',
    rarity: 'rare',
    minLevel: 2,
    effect: (state) => { state.penetrationCount = 3; },
    value: 0.5
  },
  ballSplit: {
    id: 'ballSplit',
    name: '分裂弹丸',
    category: 'ball',
    description: '击中时产生2个分裂球',
    icon: '✨',
    rarity: 'rare',
    minLevel: 2,
    effect: (state) => { state.splitEnabled = true; },
    value: 0.6
  },

  // Multi-ball system
  ballDouble: {
    id: 'ballDouble',
    name: '双球降临',
    category: 'multiball',
    description: '获得额外1个球体',
    icon: '🎱',
    rarity: 'uncommon',
    minLevel: 1,
    effect: (state) => { state.ballCount += 1; },
    value: 1.0
  },
  ballTriple: {
    id: 'ballTriple',
    name: '三球齐发',
    category: 'multiball',
    description: '获得额外2个球体',
    icon: '🎳',
    rarity: 'rare',
    minLevel: 2,
    effect: (state) => { state.ballCount += 2; },
    value: 1.6
  },
  ballHexagon: {
    id: 'ballHexagon',
    name: '六芒星阵',
    category: 'multiball',
    description: '获得额外5个球体',
    icon: '🔯',
    rarity: 'epic',
    minLevel: 4,
    effect: (state) => { state.ballCount += 5; },
    value: 3.0
  },

  // Weapon system
  weaponMissile: {
    id: 'weaponMissile',
    name: '导弹发射',
    category: 'weapon',
    description: '空格键发射导弹(3发, 冷却4秒)',
    icon: '🚀',
    rarity: 'common',
    minLevel: 1,
    effect: (state) => {
      if (!state.weapons.missile) {
        state.weapons.missile = { count: 3, cooldown: 4000, damage: 3 };
      } else {
        state.weapons.missile.count += 1;
      }
    },
    value: 0.8
  },
  weaponLaser: {
    id: 'weaponLaser',
    name: '激光束',
    category: 'weapon',
    description: '能量充能激光(穿透直线)',
    icon: '🔦',
    rarity: 'rare',
    minLevel: 3,
    effect: (state) => {
      state.weapons.laser = { energy: 100, rechargeRate: 10, damage: 1 };
    },
    value: 0.9
  },
  weaponFusion: {
    id: 'weaponFusion',
    name: '核聚变核心',
    category: 'weapon',
    description: '每关1次大范围爆炸伤害',
    icon: '☢️',
    rarity: 'legendary',
    minLevel: 7,
    effect: (state) => {
      state.weapons.fusion = { count: 1, damage: 10, radius: 100 };
    },
    value: 2.0
  },

  // Special abilities
  abilityTimeSlow: {
    id: 'abilityTimeSlow',
    name: '时间减缓',
    category: 'ability',
    description: '全场减速30%持续8秒',
    icon: '⏱️',
    rarity: 'rare',
    minLevel: 3,
    effect: (state) => {
      state.abilities.timeSlow = { cooldown: 15000, duration: 8000, slowFactor: 0.3 };
    },
    value: 0.7
  },
  abilitySpaceFreeze: {
    id: 'abilitySpaceFreeze',
    name: '空间冻结',
    category: 'ability',
    description: '冻结所有砖块3秒',
    icon: '❄️',
    rarity: 'epic',
    minLevel: 4,
    effect: (state) => {
      state.abilities.spaceFreeze = { cooldown: 20000, duration: 3000 };
    },
    value: 0.9
  },
  abilityMirror: {
    id: 'abilityMirror',
    name: '镜像复制',
    category: 'ability',
    description: '创造所有球体的镜像(70%属性)',
    icon: '🪞',
    rarity: 'rare',
    minLevel: 3,
    effect: (state) => {
      state.abilities.mirror = { cooldown: 25000, duration: 10000, power: 0.7 };
    },
    value: 0.8
  },

  // Resource bonuses
  resourceScore: {
    id: 'resourceScore',
    name: '得分倍率',
    category: 'resource',
    description: '增加所有得分50%',
    icon: '💯',
    rarity: 'common',
    minLevel: 1,
    effect: (state) => { state.scoreMultiplier *= 1.5; },
    value: 0.5
  },
  resourceHealth: {
    id: 'resourceHealth',
    name: '生命上限',
    category: 'resource',
    description: '增加生命值上限2点',
    icon: '❤️',
    rarity: 'common',
    minLevel: 1,
    effect: (state) => { state.maxHealth += 2; state.health += 2; },
    value: 0.6
  },
  resourceCrit: {
    id: 'resourceCrit',
    name: '暴击率提升',
    category: 'resource',
    description: '增加10%暴击概率(伤害翻倍)',
    icon: '💥',
    rarity: 'rare',
    minLevel: 2,
    effect: (state) => { state.critRate += 0.1; },
    value: 0.5
  }
};

// ============================================================================
// BRICK CONFIGURATIONS FOR LEVELS
// ============================================================================

export const LEVEL_BRICK_CONFIGS = {
  1: { rows: 3, cols: 10, maxTier: 2, pattern: 'standard', brickTypes: { 1: 0.7, 2: 0.3 } },
  2: { rows: 4, cols: 10, maxTier: 3, pattern: 'pyramid', brickTypes: { 1: 0.5, 2: 0.35, 3: 0.15 } },
  3: { rows: 5, cols: 10, maxTier: 4, pattern: 'diamond', brickTypes: { 1: 0.4, 2: 0.3, 3: 0.2, 4: 0.1 } },
  4: { rows: 6, cols: 10, maxTier: 5, pattern: 'castle', brickTypes: { 1: 0.3, 2: 0.25, 3: 0.2, 4: 0.15, 5: 0.1 } },
  5: { rows: 5, cols: 10, maxTier: 4, pattern: 'jungle', brickTypes: { 1: 0.35, 2: 0.3, 3: 0.2, 4: 0.1, special: 0.05 } },
  6: { rows: 6, cols: 10, maxTier: 5, pattern: 'reef', brickTypes: { 1: 0.3, 2: 0.25, 3: 0.2, 4: 0.15, 5: 0.1, hidden: 0.05 } },
  7: { rows: 7, cols: 10, maxTier: 6, pattern: 'space', brickTypes: { 1: 0.25, 2: 0.2, 3: 0.18, 4: 0.15, 5: 0.12, 6: 0.1 } },
  8: { rows: 7, cols: 10, maxTier: 7, pattern: 'factory', brickTypes: { 1: 0.2, 2: 0.18, 3: 0.15, 4: 0.15, 5: 0.12, 6: 0.1, 7: 0.1 } },
  9: { rows: 8, cols: 10, maxTier: 8, pattern: 'treasure', brickTypes: { 1: 0.15, 2: 0.12, 3: 0.12, 4: 0.1, 5: 0.1, 6: 0.1, 7: 0.1, 8: 0.11 } },
  10: { rows: 9, cols: 10, maxTier: 8, pattern: 'boss', brickTypes: { 1: 0.15, 2: 0.12, 3: 0.12, 4: 0.1, 5: 0.1, 6: 0.1, 7: 0.1, 8: 0.11 }, hasBoss: true }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function generateBrickLayout(level, config) {
  const { rows, cols, pattern, maxTier } = config;
  const bricks = [];
  const brickWidth = (GAME_CONFIG.CANVAS_WIDTH - 40) / cols;
  const brickHeight = 25;
  const startX = 20;
  const startY = 60;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let visible = true;
      let tier = 1;

      // Apply pattern rules
      switch (pattern) {
        case 'pyramid':
          if (row < Math.floor(rows / 2)) {
            tier = Math.min(maxTier, Math.floor(row / 2) + 1);
          }
          break;
        case 'diamond':
          const centerRow = rows / 2 - 0.5;
          const centerCol = cols / 2 - 0.5;
          const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
          tier = Math.min(maxTier, Math.floor(distance / 1.5) + 1);
          break;
        case 'castle':
          if (row === 0 || row === rows - 1) {
            tier = Math.min(maxTier, Math.floor(cols / 5) + 1);
          } else if (row === 1 || row === rows - 2) {
            tier = Math.min(maxTier - 1, Math.floor(cols / 4) + 1);
          }
          break;
        case 'jungle':
        case 'reef':
        case 'space':
        case 'factory':
        case 'treasure':
          tier = Math.min(maxTier, Math.floor(Math.random() * row / 2) + 1);
          break;
        case 'boss':
          if (row === 0) {
            tier = maxTier;
            visible = col % 2 === 0;
          } else if (row === 1) {
            tier = Math.max(1, maxTier - 2);
          }
          break;
        default: // standard
          tier = Math.min(maxTier, Math.floor(row / 2) + 1);
      }

      if (visible) {
        bricks.push({
          id: `${level}-${row}-${col}`,
          x: startX + col * brickWidth,
          y: startY + row * brickHeight,
          width: brickWidth - 4,
          height: brickHeight - 4,
          tier: tier,
          maxTier: tier,
          visible: true,
          special: pattern === 'jungle' && Math.random() < 0.05 ? 'bonus' : null,
          hidden: pattern === 'reef' && Math.random() < 0.05
        });
      }
    }
  }

  return bricks;
}

export function calculateLevelDifficulty(level) {
  return {
    ballSpeedModifier: GAME_CONFIG.BALL_SPEED_MODIFIERS[level - 1] || 1.0,
    paddleWidthModifier: GAME_CONFIG.PADDLE_WIDTH_MODIFIERS[level - 1] || 1.0,
    specialAngleChance: GAME_CONFIG.SPECIAL_ANGLE_CHANCE[level - 1] || 0.1
  };
}

// ============================================================================
// DEFAULT PLAYER STATE
// ============================================================================

export const DEFAULT_PLAYER_STATE = {
  // Paddle
  paddleWidthMultiplier: 1.0,
  paddleHeightMultiplier: 1.0,
  paddleSpeedMultiplier: 1.0,
  edgeGrip: false,
  dashEnabled: false,

  // Ball
  ballSizeMultiplier: 1.0,
  ballSpeedMultiplier: 1.0,
  ballCount: 1,
  penetrationCount: 0,
  splitEnabled: false,

  // Weapons
  weapons: {},

  // Abilities
  abilities: {},

  // Resources
  scoreMultiplier: 1.0,
  maxHealth: 3,
  health: 3,
  critRate: 0.0,

  // Tracking
  enhancementCount: 0,
  skipsRemaining: 3,

  // Endless mode
  endlessLevel: 1,
  endlessScore: 0
};

export default {
  GAME_CONFIG,
  LEVEL_THEMES,
  ROGUELIKE_ENHANCEMENTS,
  LEVEL_BRICK_CONFIGS,
  generateBrickLayout,
  calculateLevelDifficulty,
  DEFAULT_PLAYER_STATE
};
