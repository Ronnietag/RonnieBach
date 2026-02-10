import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  GAME_CONFIG,
  LEVEL_THEMES,
  LEVEL_BRICK_CONFIGS,
  generateBrickLayout,
  calculateLevelDifficulty,
  DEFAULT_PLAYER_STATE,
  ROGUELIKE_ENHANCEMENTS
} from '../config/gameConfig';
import soundManager from '../config/SoundManager';

/**
 * Main Game Engine Component
 * Handles the complete game lifecycle including:
 * - Game loop management
 * - Physics simulation
 * - Collision detection
 * - Rendering
 * - State management
 */
const GameEngine = ({ onNavigate, initialLevel = 1, gameMode = 'story' }) => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef({
    // Core state
    state: GAME_CONFIG.STATES.MENU,
    level: initialLevel,
    score: 0,
    health: DEFAULT_PLAYER_STATE.maxHealth,
    maxHealth: DEFAULT_PLAYER_STATE.maxHealth,

    // Player enhancements
    enhancements: { ...DEFAULT_PLAYER_STATE },

    // Game entities
    paddle: null,
    balls: [],
    bricks: [],
    particles: [],
    projectiles: [],
    powerups: [],

    // Boss state (level 10)
    boss: null,
    bossHealth: 100,
    bossShield: false,

    // Timing
    lastTime: 0,
    accumulatedTime: 0,
    deltaTime: 0,

    // Endless mode
    endlessTimer: 0,
    endlessPhase: 1,

    // Roguelike
    availableEnhancements: [],
    skipsRemaining: DEFAULT_PLAYER_STATE.skipsRemaining,

    // Settings
    soundEnabled: true,
    difficulty: 'normal'
  });

  const animationFrameRef = useRef(null);
  const inputStateRef = useRef({
    mouseX: GAME_CONFIG.CANVAS_WIDTH / 2,
    mouseDown: false,
    keys: {}
  });

  // Initialize game
  useEffect(() => {
    initializeGame(initialLevel, gameMode);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initialLevel, gameMode]);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initializeAudio = () => {
      soundManager.initialize();
      soundManager.setSoundEnabled(gameStateRef.current.soundEnabled);
      // Remove listeners after initialization
      document.removeEventListener('click', initializeAudio);
      document.removeEventListener('keydown', initializeAudio);
    };

    document.addEventListener('click', initializeAudio);
    document.addEventListener('keydown', initializeAudio);

    return () => {
      document.removeEventListener('click', initializeAudio);
      document.removeEventListener('keydown', initializeAudio);
    };
  }, []);

  // Setup input handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = GAME_CONFIG.CANVAS_WIDTH / rect.width;
      inputStateRef.current.mouseX = (e.clientX - rect.left) * scaleX;
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = GAME_CONFIG.CANVAS_WIDTH / rect.width;
      const touch = e.touches[0];
      inputStateRef.current.mouseX = (touch.clientX - rect.left) * scaleX;
    };

    const handleMouseDown = () => {
      inputStateRef.current.mouseDown = true;
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = GAME_CONFIG.CANVAS_WIDTH / rect.width;
      const touch = e.touches[0];
      inputStateRef.current.mouseX = (touch.clientX - rect.left) * scaleX;
      inputStateRef.current.mouseDown = true;
    };

    const handleMouseUp = () => {
      inputStateRef.current.mouseDown = false;
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      inputStateRef.current.mouseDown = false;
    };

    const handleKeyDown = (e) => {
      inputStateRef.current.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        fireWeapon();
      }
      if (e.code === 'KeyR') {
        activateAbility();
      }
    };

    const handleKeyUp = (e) => {
      inputStateRef.current.keys[e.code] = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('keyup', handleKeyUp);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Start game loop
  useEffect(() => {
    const gameLoop = (timestamp) => {
      const state = gameStateRef.current;

      if (state.state === GAME_CONFIG.STATES.PLAYING ||
          state.state === GAME_CONFIG.STATES.ENDLESS) {
        update(timestamp);
      }

      render();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // Initialize the game for a specific level
  const initializeGame = useCallback((level, mode) => {
    const state = gameStateRef.current;
    const theme = LEVEL_THEMES[level];
    const brickConfig = LEVEL_BRICK_CONFIGS[level];
    const difficulty = calculateLevelDifficulty(level);

    // Reset state
    state.state = mode === 'endless' ? GAME_CONFIG.STATES.ENDLESS : GAME_CONFIG.STATES.PLAYING;
    state.level = level;
    state.boss = mode === 'story' && level === 10 ? createBoss() : null;
    state.bossHealth = mode === 'story' && level === 10 ? 100 : 0;
    state.bossShield = false;
    state.endlessTimer = 0;
    state.endlessPhase = 1;
    state.lastTime = performance.now();

    // Initialize paddle
    const paddleWidth = GAME_CONFIG.BASE_PADDLE_WIDTH *
                        state.enhancements.paddleWidthMultiplier *
                        difficulty.paddleWidthModifier;
    const paddleHeight = GAME_CONFIG.BASE_PADDLE_HEIGHT *
                         state.enhancements.paddleHeightMultiplier;

    state.paddle = {
      x: GAME_CONFIG.CANVAS_WIDTH / 2 - paddleWidth / 2,
      y: GAME_CONFIG.CANVAS_HEIGHT - 40,
      width: paddleWidth,
      height: paddleHeight,
      color: theme.paddleColor,
      speed: GAME_CONFIG.BASE_PADDLE_SPEED * state.enhancements.paddleSpeedMultiplier
    };

    // Initialize balls
    state.balls = [];
    for (let i = 0; i < state.enhancements.ballCount; i++) {
      state.balls.push(createBall(state, difficulty));
    }

    // Initialize bricks
    state.bricks = mode === 'endless' ?
      generateEndlessBricks(level) :
      generateBrickLayout(level, brickConfig);

    // Clear particles and projectiles
    state.particles = [];
    state.projectiles = [];

  }, []);

  // Create a ball entity
  const createBall = (state, difficulty) => {
    const speed = GAME_CONFIG.BASE_BALL_SPEED *
                  state.enhancements.ballSpeedMultiplier *
                  difficulty.ballSpeedModifier;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;

    return {
      x: state.paddle.x + state.paddle.width / 2,
      y: state.paddle.y - GAME_CONFIG.BASE_BALL_RADIUS - 5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: GAME_CONFIG.BASE_BALL_RADIUS * state.enhancements.ballSizeMultiplier,
      color: LEVEL_THEMES[state.level].ballColor,
      active: true,
      penetration: state.enhancements.penetrationCount,
      splitCooldown: 0
    };
  };

  // Create boss entity for level 10
  const createBoss = () => {
    const theme = LEVEL_THEMES[10];
    return {
      x: GAME_CONFIG.CANVAS_WIDTH / 2 - 60,
      y: 80,
      width: 120,
      height: 60,
      color: theme.bossColor,
      shieldColor: theme.bossShield,
      attackTimer: 0,
      attackPattern: 0
    };
  };

  // Generate endless mode bricks
  const generateEndlessBricks = (level) => {
    const config = LEVEL_BRICK_CONFIGS[Math.min(level, 10)];
    const difficultyCoefficient = Math.pow(1.15, level - 1);
    const rows = Math.min(4 + Math.floor(level / 3), 8);
    const bricks = [];
    const brickWidth = (GAME_CONFIG.CANVAS_WIDTH - 40) / 10;
    const brickHeight = 25;
    const startX = 20;
    const startY = 60;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < 10; col++) {
        const maxTier = Math.min(5 + Math.floor(level / 5), 8);
        const baseTier = Math.floor(Math.random() * row / 2) + 1;
        const tier = Math.min(baseTier, maxTier);
        const specialChance = Math.min(0.05 + level * 0.01, 0.25);
        const special = Math.random() < specialChance ? 'explosive' :
                        Math.random() < 0.5 ? 'frozen' : null;

        bricks.push({
          id: `endless-${level}-${row}-${col}`,
          x: startX + col * brickWidth,
          y: startY + row * brickHeight,
          width: brickWidth - 4,
          height: brickHeight - 4,
          tier: Math.ceil(tier * difficultyCoefficient / 2),
          maxTier: Math.ceil(tier * difficultyCoefficient / 2),
          visible: true,
          special: special,
          falling: true,
          fallSpeed: 0.5 * difficultyCoefficient
        });
      }
    }

    return bricks;
  };

  // Fire weapon
  const fireWeapon = () => {
    const state = gameStateRef.current;
    if (state.state !== GAME_CONFIG.STATES.PLAYING &&
        state.state !== GAME_CONFIG.STATES.ENDLESS) return;

    const theme = LEVEL_THEMES[state.level];

    // Missile
    if (state.enhancements.weapons.missile &&
        state.enhancements.weapons.missile.count > 0) {
      state.enhancements.weapons.missile.count--;
      soundManager.playMissileFire();
      for (let i = -1; i <= 1; i++) {
        state.projectiles.push({
          type: 'missile',
          x: state.paddle.x + state.paddle.width / 2 + i * 15,
          y: state.paddle.y,
          vx: i * 30,
          vy: -500,
          width: 6,
          height: 12,
          damage: state.enhancements.weapons.missile.damage,
          color: '#E74C3C'
        });
      }
    }

    // Laser
    if (state.enhancements.weapons.laser &&
        state.enhancements.weapons.laser.energy >= 20) {
      state.enhancements.weapons.laser.energy -= 20;
      soundManager.playLaserFire();
      state.projectiles.push({
        type: 'laser',
        x: state.paddle.x + state.paddle.width / 2 - 2,
        y: state.paddle.y,
        vy: -800,
        width: 4,
        height: GAME_CONFIG.CANVAS_HEIGHT,
        damage: state.enhancements.weapons.laser.damage,
        color: '#3498DB',
        piercing: true
      });
    }
  };

  // Activate ability
  const activateAbility = () => {
    const state = gameStateRef.current;
    if (state.state !== GAME_CONFIG.STATES.PLAYING &&
        state.state !== GAME_CONFIG.STATES.ENDLESS) return;

    const now = Date.now();

    // Time Slow
    if (state.enhancements.abilities.timeSlow &&
        !state.abilitiesCooldowns?.timeSlow) {
      state.timeSlowActive = true;
      state.timeSlowEnd = now + state.enhancements.abilities.timeSlow.duration;
      state.abilitiesCooldowns = state.abilitiesCooldowns || {};
      state.abilitiesCooldowns.timeSlow = now +
        state.enhancements.abilities.timeSlow.cooldown;
    }

    // Space Freeze
    if (state.enhancements.abilities.spaceFreeze &&
        !state.abilitiesCooldowns?.spaceFreeze) {
      state.bricks.forEach(brick => {
        if (brick.visible) {
          brick.frozen = true;
        }
      });
      state.abilitiesCooldowns = state.abilitiesCooldowns || {};
      state.abilitiesCooldowns.spaceFreeze = now +
        state.enhancements.abilities.spaceFreeze.cooldown;
    }
  };

  // Main update loop
  const update = (timestamp) => {
    const state = gameStateRef.current;
    const theme = LEVEL_THEMES[state.level];
    const difficulty = calculateLevelDifficulty(state.level);

    // Calculate delta time
    state.deltaTime = Math.min((timestamp - state.lastTime) / 1000, 0.1);
    state.lastTime = timestamp;

    // Time slow effect
    let timeScale = 1;
    if (state.timeSlowActive && state.timeSlowEnd > timestamp) {
      timeScale = 1 - state.enhancements.abilities.timeSlow?.slowFactor || 0.7;
    } else {
      state.timeSlowActive = false;
    }

    // Update paddle
    updatePaddle(state, timeScale);

    // Update balls
    updateBalls(state, difficulty, timeScale);

    // Update bricks (falling in endless mode)
    if (state.state === GAME_CONFIG.STATES.ENDLESS) {
      updateEndlessBricks(state, difficulty, timeScale);
    }

    // Update projectiles
    updateProjectiles(state, timeScale);

    // Update particles
    updateParticles(state, timeScale);

    // Update boss
    if (state.boss) {
      updateBoss(state, timeScale);
    }

    // Check win/lose conditions
    checkGameConditions(state);

    // Clear cooldowns
    if (state.abilitiesCooldowns) {
      Object.keys(state.abilitiesCooldowns).forEach(key => {
        if (state.abilitiesCooldowns[key] < timestamp) {
          delete state.abilitiesCooldowns[key];
        }
      });
    }
  };

  // Update paddle position
  const updatePaddle = (state, timeScale) => {
    const paddle = state.paddle;
    const moveSpeed = paddle.speed * timeScale;

    // Mouse control
    let targetX = inputStateRef.current.mouseX - paddle.width / 2;
    paddle.x += (targetX - paddle.x) * 0.3;

    // Keyboard control
    if (inputStateRef.current.keys['ArrowLeft'] ||
        inputStateRef.current.keys['KeyA']) {
      paddle.x -= moveSpeed * state.deltaTime;
    }
    if (inputStateRef.current.keys['ArrowRight'] ||
        inputStateRef.current.keys['KeyD']) {
      paddle.x += moveSpeed * state.deltaTime;
    }

    // Boundary check
    paddle.x = Math.max(0, Math.min(
      GAME_CONFIG.CANVAS_WIDTH - paddle.width,
      paddle.x
    ));
  };

  // Update balls
  const updateBalls = (state, difficulty, timeScale) => {
    const effectiveDelta = state.deltaTime * timeScale;

    state.balls.forEach(ball => {
      if (!ball.active) return;

      // Update position
      ball.x += ball.vx * effectiveDelta;
      ball.y += ball.vy * effectiveDelta;

      // Split cooldown
      if (ball.splitCooldown > 0) {
        ball.splitCooldown -= effectiveDelta;
      }

      // Wall collision
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = -ball.vx;
      }
      if (ball.x + ball.radius > GAME_CONFIG.CANVAS_WIDTH) {
        ball.x = GAME_CONFIG.CANVAS_WIDTH - ball.radius;
        ball.vx = -ball.vx;
      }
      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = -ball.vy;
      }

      // Paddle collision
      if (ball.vy > 0 &&
          ball.y + ball.radius > state.paddle.y &&
          ball.y - ball.radius < state.paddle.y + state.paddle.height &&
          ball.x > state.paddle.x &&
          ball.x < state.paddle.x + state.paddle.width) {

        // Calculate reflection angle based on hit position
        const hitPos = (ball.x - state.paddle.x) / state.paddle.width;
        const angle = -Math.PI / 2 + (hitPos - 0.5) * Math.PI * 0.75;

        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        ball.vx = Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
        ball.y = state.paddle.y - ball.radius - 1;

        // Edge grip effect
        if (state.enhancements.edgeGrip && (hitPos < 0.1 || hitPos > 0.9)) {
          ball.vx *= 1.1;
        }

        createParticles(ball.x, ball.y, 3, LEVEL_THEMES[state.level].accentColor);

        // Play paddle hit sound
        soundManager.playPaddleHit();
      }

      // Brick collision
      if (ball.vy !== 0) {
        state.bricks.forEach(brick => {
          if (!brick.visible || brick.frozen) return;

          if (ball.x + ball.radius > brick.x &&
              ball.x - ball.radius < brick.x + brick.width &&
              ball.y + ball.radius > brick.y &&
              ball.y - ball.radius < brick.y + brick.height) {

            // Calculate collision side
            const overlapLeft = ball.x + ball.radius - brick.x;
            const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
            const overlapTop = ball.y + ball.radius - brick.y;
            const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapX < minOverlapY) {
              ball.vx = -ball.vx;
            } else {
              ball.vy = -ball.vy;
            }

            // Damage brick
            damageBrick(state, brick, ball, difficulty);
          }
        });

        // Boss collision (Level 10)
        if (state.boss && state.bossHealth > 0 && !state.bossShield) {
          const boss = state.boss;
          if (ball.x + ball.radius > boss.x &&
              ball.x - ball.radius < boss.x + boss.width &&
              ball.y + ball.radius > boss.y &&
              ball.y - ball.radius < boss.y + boss.height) {

            ball.vy = -ball.vy;
            state.bossHealth -= 5;
            createParticles(ball.x, ball.y, 8, boss.color);
            soundManager.playBossHit();
          }
        }
      }

      // Ball lost
      if (ball.y > GAME_CONFIG.CANVAS_HEIGHT + 50) {
        ball.active = false;
      }
    });

    // Remove inactive balls
    state.balls = state.balls.filter(ball => ball.active);

    // Check if all balls lost
    if (state.balls.length === 0) {
      // Play ball lost sound
      soundManager.playBallLost();

      state.health--;
      if (state.health <= 0) {
        state.state = GAME_CONFIG.STATES.GAME_OVER;
        soundManager.playGameOver();
      } else {
        // Respawn ball
        const difficulty = calculateLevelDifficulty(state.level);
        state.balls.push(createBall(state, difficulty));
      }
    }
  };

  // Damage a brick
  const damageBrick = (state, brick, ball, difficulty) => {
    const theme = LEVEL_THEMES[state.level];
    let damage = 1;

    // Check for crit
    if (Math.random() < state.enhancements.critRate) {
      damage *= 2;
      createParticles(ball.x, ball.y, 10, '#FFD700');
      soundManager.playCriticalHit();
    }

    brick.tier -= damage;

    // Create hit particles
    createParticles(ball.x, ball.y, 5, theme.accentColor);

    // Play brick hit sound
    if (brick.frozen) {
      soundManager.playFrozenHit();
    } else if (brick.special === 'explosive') {
      soundManager.playSpecialBrickHit();
    } else {
      soundManager.playBrickHit(brick.tier + 1);
    }

    if (brick.tier <= 0) {
      brick.visible = false;

      // Explosion particles
      createParticles(
        brick.x + brick.width / 2,
        brick.y + brick.height / 2,
        15,
        brick.special === 'explosive' ? '#E74C3C' :
        brick.special === 'frozen' ? '#3498DB' :
        theme.accentColor
      );

      // Add score
      const points = brick.maxTier * 10 * state.enhancements.scoreMultiplier;
      state.score += points;
      state.endlessScore += points;

      // Special brick effects
      if (brick.special === 'explosive') {
        // Play explosion sound
        soundManager.playExplosion();

        // Damage surrounding bricks
        state.bricks.forEach(b => {
          if (b.visible && b !== brick) {
            const dx = (b.x + b.width / 2) - (brick.x + brick.width / 2);
            const dy = (b.y + brick.height / 2) - (brick.y + brick.height / 2);
            if (Math.sqrt(dx * dx + dy * dy) < 80) {
              b.tier -= 2;
              if (b.tier <= 0) {
                b.visible = false;
                state.score += b.maxTier * 10 * state.enhancements.scoreMultiplier;
              }
            }
          }
        });
      }

      // Remove frozen effect
      if (brick.frozen) {
        state.bricks.forEach(b => {
          if (b.frozen) b.frozen = false;
        });
      }
    }

    // Ball penetration
    if (ball.penetration > 0) {
      ball.penetration--;
    } else {
      // Ball split
      if (state.enhancements.splitEnabled && ball.splitCooldown <= 0) {
        ball.splitCooldown = 1;
        for (let i = -1; i <= 1; i += 2) {
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          const angle = Math.atan2(ball.vy, ball.vx) + i * 0.5;
          state.balls.push({
            ...ball,
            vx: Math.cos(angle) * speed * 0.5,
            vy: Math.sin(angle) * speed * 0.5,
            penetration: 0,
            splitCooldown: 0
          });
        }
      }
    }
  };

  // Update bricks for endless mode
  const updateEndlessBricks = (state, difficulty, timeScale) => {
    const effectiveDelta = state.deltaTime * timeScale;

    // Update timer
    state.endlessTimer += effectiveDelta * 1000;

    // Phase transitions
    if (state.endlessTimer < 30000) {
      state.endlessPhase = 1;
    } else if (state.endlessTimer < 90000) {
      state.endlessPhase = 2;
    } else {
      state.endlessPhase = 3;
    }

    // Spawn new bricks
    const spawnRate = state.endlessPhase === 1 ? 2000 :
                      state.endlessPhase === 2 ? 1500 : 1000;

    if (state.endlessTimer % spawnRate < effectiveDelta * 1000) {
      const col = Math.floor(Math.random() * 10);
      const row = 0;
      const brickWidth = (GAME_CONFIG.CANVAS_WIDTH - 40) / 10;
      const brickHeight = 25;
      const maxTier = Math.min(5 + Math.floor(state.level / 5), 8);

      state.bricks.push({
        id: `spawned-${Date.now()}-${col}`,
        x: 20 + col * brickWidth,
        y: 60 + row * brickHeight,
        width: brickWidth - 4,
        height: brickHeight - 4,
        tier: Math.floor(Math.random() * maxTier) + 1,
        maxTier: Math.floor(Math.random() * maxTier) + 1,
        visible: true,
        falling: true,
        fallSpeed: state.endlessPhase === 1 ? 5 : state.endlessPhase === 2 ? 8 : 12
      });
    }

    // Move falling bricks
    state.bricks.forEach(brick => {
      if (brick.falling) {
        brick.y += brick.fallSpeed * effectiveDelta * 60;

        // Remove if off screen
        if (brick.y > GAME_CONFIG.CANVAS_HEIGHT) {
          brick.visible = false;
          state.health -= 0.5;
        }
      }
    });

    // Clean up bricks
    state.bricks = state.bricks.filter(brick => brick.visible);
  };

  // Update projectiles
  const updateProjectiles = (state, timeScale) => {
    const effectiveDelta = state.deltaTime * timeScale;
    const theme = LEVEL_THEMES[state.level];

    state.projectiles.forEach(proj => {
      proj.x += proj.vx * effectiveDelta;
      proj.y += proj.vy * effectiveDelta;

      // Remove if off screen
      if (proj.y < -50) {
        proj.active = false;
      }

      // Brick collision
      if (proj.active && !proj.piercing) {
        state.bricks.forEach(brick => {
          if (!brick.visible || brick.frozen) return;

          if (proj.x > brick.x && proj.x < brick.x + brick.width &&
              proj.y > brick.y && proj.y < brick.y + brick.height) {
            proj.active = false;
            brick.tier -= proj.damage;

            createParticles(proj.x, proj.y, 5, proj.color);

            if (brick.tier <= 0) {
              brick.visible = false;
              const points = brick.maxTier * 10 * state.enhancements.scoreMultiplier;
              state.score += points;
              state.endlessScore += points;
              createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, 10, theme.accentColor);
            }
          }
        });
      }
    });

    // Clean up projectiles
    state.projectiles = state.projectiles.filter(p => p.active !== false);
  };

  // Update boss
  const updateBoss = (state, timeScale) => {
    const boss = state.boss;
    if (!boss) return;

    const effectiveDelta = state.deltaTime * timeScale;
    boss.attackTimer += effectiveDelta;

    // Movement pattern
    const targetX = GAME_CONFIG.CANVAS_WIDTH / 2 - boss.width / 2 +
                   Math.sin(Date.now() / 1000) * 150;
    boss.x += (targetX - boss.x) * 0.02;

    // Attack patterns
    if (boss.attackTimer > 2) {
      boss.attackTimer = 0;
      boss.attackPattern = (boss.attackPattern + 1) % 3;

      switch (boss.attackPattern) {
        case 0: // Spread shot
          for (let i = -2; i <= 2; i++) {
            state.projectiles.push({
              type: 'boss',
              x: boss.x + boss.width / 2,
              y: boss.y + boss.height,
              vx: i * 60,
              vy: 150,
              width: 8,
              height: 8,
              damage: 1,
              color: '#E74C3C'
            });
          }
          break;
        case 1: // Homing balls
          state.bricks.push({
            x: boss.x + boss.width / 2 - 15,
            y: boss.y + boss.height,
            width: 30,
            height: 30,
            tier: 3,
            maxTier: 3,
            visible: true,
            special: 'frozen'
          });
          break;
        case 2: // Shield break warning
          state.bossShield = true;
          setTimeout(() => { state.bossShield = false; }, 1500);
          break;
      }
    }

    // Boss collision with paddle
    if (boss.x < state.paddle.x + state.paddle.width &&
        boss.x + boss.width > state.paddle.x &&
        boss.y + boss.height > state.paddle.y) {
      state.health -= 0.5;
    }
  };

  // Update particles
  const updateParticles = (state, timeScale) => {
    const effectiveDelta = state.deltaTime * timeScale;

    state.particles.forEach(p => {
      p.x += p.vx * effectiveDelta;
      p.y += p.vy * effectiveDelta;
      p.life -= effectiveDelta;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.size *= 0.98;
    });

    state.particles = state.particles.filter(p => p.life > 0);
  };

  // Create particles
  const createParticles = (x, y, count, color) => {
    const state = gameStateRef.current;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 100 + 50;

      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 0.5 + Math.random() * 0.5
      });
    }
  };

  // Check game conditions
  const checkGameConditions = (state) => {
    // Check win condition
    const visibleBricks = state.bricks.filter(b => b.visible && !b.falling).length;
    if (visibleBricks === 0 && !state.boss) {
      if (state.level < 10) {
        state.state = GAME_CONFIG.STATES.LEVEL_COMPLETE;
        generateRoguelikeOptions();
        soundManager.playLevelComplete();
      } else {
        state.state = GAME_CONFIG.STATES.VICTORY;
        soundManager.playVictory();
      }
    }

    // Check boss defeat
    if (state.boss && state.bossHealth <= 0) {
      state.boss = null;
      state.bossHealth = 0;
      state.score += 1000;
      state.state = GAME_CONFIG.STATES.VICTORY;
      soundManager.playVictory();
    }

    // Check endless mode level complete
    if (state.state === GAME_CONFIG.STATES.ENDLESS &&
        state.endlessTimer >= GAME_CONFIG.ENDLESS_TIME_PER_LEVEL) {
      state.level++;
      state.endlessLevel++;
      state.endlessTimer = 0;
      generateRoguelikeOptions();
      initializeGame(state.level, 'endless');
    }
  };

  // Generate roguelike options
  const generateRoguelikeOptions = () => {
    const state = gameStateRef.current;
    const options = [];
    const availableEnhancements = Object.values(ROGUELIKE_ENHANCEMENTS);

    // Filter by level
    const eligibleEnhancements = availableEnhancements.filter(
      e => e.minLevel <= state.level
    );

    // Weight selection
    const weights = eligibleEnhancements.map(e => {
      let weight = 1;
      if (e.rarity === 'common') weight = 100;
      if (e.rarity === 'uncommon') weight = 60;
      if (e.rarity === 'rare') weight = 35;
      if (e.rarity === 'epic') weight = 15;
      if (e.rarity === 'legendary') weight = 5;
      return weight;
    });

    // Select 3 options
    for (let i = 0; i < 3; i++) {
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let random = Math.random() * totalWeight;

      for (let j = 0; j < eligibleEnhancements.length; j++) {
        random -= weights[j];
        if (random <= 0) {
          options.push(eligibleEnhancements[j]);
          break;
        }
      }
    }

    state.availableEnhancements = options;
  };

  // Select enhancement
  const selectEnhancement = (enhancement) => {
    const state = gameStateRef.current;
    enhancement.effect(state.enhancements);
    state.enhancementCount++;

    // Play enhancement selection sound
    soundManager.playEnhancementSelect();

    // Continue to next level
    if (state.level < 10) {
      initializeGame(state.level + 1, 'story');
      state.state = GAME_CONFIG.STATES.PLAYING;
    } else {
      state.state = GAME_CONFIG.STATES.ENDLESS;
      initializeGame(1, 'endless');
    }
  };

  // Skip enhancement
  const skipEnhancement = () => {
    const state = gameStateRef.current;
    if (state.skipsRemaining > 0) {
      state.skipsRemaining--;
      state.state = state.level < 10 ? GAME_CONFIG.STATES.PLAYING : GAME_CONFIG.STATES.ENDLESS;
    }
  };

  // Render the game
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const state = gameStateRef.current;
    const theme = LEVEL_THEMES[state.level];

    // Clear canvas
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    // Draw particles
    state.particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw bricks
    state.bricks.forEach(brick => {
      if (!brick.visible) return;

      const tierIndex = Math.min(brick.tier - 1, theme.brickColors.length - 1);
      const tierRatio = brick.tier / brick.maxTier;

      // 保存上下文状态
      ctx.save();

      // 全息投影风格 - 背景填充
      const brickGradient = ctx.createLinearGradient(
        brick.x, brick.y,
        brick.x, brick.y + brick.height
      );
      brickGradient.addColorStop(0, theme.brickColors[tierIndex]);
      brickGradient.addColorStop(0.5, adjustColorBrightness(theme.brickColors[tierIndex], -20));
      brickGradient.addColorStop(1, adjustColorBrightness(theme.brickColors[tierIndex], -40));

      ctx.fillStyle = brick.frozen ? 'rgba(52, 152, 219, 0.6)' :
                      brick.special === 'explosive' ? 'rgba(231, 76, 60, 0.6)' :
                      brick.special === 'bonus' ? 'rgba(244, 208, 63, 0.6)' :
                      brickGradient;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

      // 全息投影风格 - 内部扫描线效果
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < brick.height; i += 3) {
        ctx.beginPath();
        ctx.moveTo(brick.x + 2, brick.y + i);
        ctx.lineTo(brick.x + brick.width - 2, brick.y + i);
        ctx.stroke();
      }

      // 全息投影风格 - 边框发光
      ctx.shadowColor = brick.frozen ? '#3498DB' :
                       brick.special === 'explosive' ? '#E74C3C' :
                       brick.special === 'bonus' ? '#F4D03F' :
                       theme.brickColors[tierIndex];
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      ctx.shadowBlur = 0;

      // 全息投影风格 - 四角装饰
      const cornerSize = 4;
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.4)';
      ctx.lineWidth = 2;

      // 左上角
      ctx.beginPath();
      ctx.moveTo(brick.x, brick.y + cornerSize);
      ctx.lineTo(brick.x, brick.y);
      ctx.lineTo(brick.x + cornerSize, brick.y);
      ctx.stroke();

      // 右上角
      ctx.beginPath();
      ctx.moveTo(brick.x + brick.width - cornerSize, brick.y);
      ctx.lineTo(brick.x + brick.width, brick.y);
      ctx.lineTo(brick.x + brick.width, brick.y + cornerSize);
      ctx.stroke();

      // 左下角
      ctx.beginPath();
      ctx.moveTo(brick.x, brick.y + brick.height - cornerSize);
      ctx.lineTo(brick.x, brick.y + brick.height);
      ctx.lineTo(brick.x + cornerSize, brick.y + brick.height);
      ctx.stroke();

      // 右下角
      ctx.beginPath();
      ctx.moveTo(brick.x + brick.width - cornerSize, brick.y + brick.height);
      ctx.lineTo(brick.x + brick.width, brick.y + brick.height);
      ctx.lineTo(brick.x + brick.width, brick.y + brick.height - cornerSize);
      ctx.stroke();

      // 科技感内部菱形
      ctx.fillStyle = 'rgba(0, 245, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(brick.x + brick.width / 2, brick.y + 5);
      ctx.lineTo(brick.x + brick.width - 5, brick.y + brick.height / 2);
      ctx.lineTo(brick.x + brick.width / 2, brick.y + brick.height - 5);
      ctx.lineTo(brick.x + 5, brick.y + brick.height / 2);
      ctx.closePath();
      ctx.fill();

      // Tier指示器 - 全息风格
      const tierColor = brick.tier > 1 ? '#FFD700' : 'rgba(255,255,255,0.7)';
      ctx.fillStyle = tierColor;
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#00F5FF';
      ctx.shadowBlur = 5;
      ctx.fillText(`${brick.tier}`, brick.x + brick.width / 2, brick.y + brick.height / 2 + 4);
      ctx.shadowBlur = 0;

      // 恢复上下文状态
      ctx.restore();
    });

    // Draw boss
    if (state.boss) {
      const boss = state.boss;

      // Shield effect
      if (state.bossShield) {
        ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.fillRect(boss.x - 10, boss.y - 10,
                     boss.width + 20, boss.height + 20);
      }

      // Boss body
      ctx.fillStyle = boss.color;
      ctx.beginPath();
      ctx.moveTo(boss.x + boss.width / 2, boss.y);
      ctx.lineTo(boss.x + boss.width, boss.y + boss.height);
      ctx.lineTo(boss.x, boss.y + boss.height);
      ctx.closePath();
      ctx.fill();

      // Boss eye
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(boss.x + boss.width / 2, boss.y + boss.height / 2, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.arc(boss.x + boss.width / 2, boss.y + boss.height / 2, 8, 0, Math.PI * 2);
      ctx.fill();

      // Health bar
      ctx.fillStyle = '#333';
      ctx.fillRect(boss.x, boss.y - 15, boss.width, 8);
      ctx.fillStyle = '#E74C3C';
      ctx.fillRect(boss.x, boss.y - 15, boss.width * (state.bossHealth / 100), 8);
    }

    // Draw projectiles
    state.projectiles.forEach(p => {
      ctx.fillStyle = p.color;
      if (p.type === 'missile') {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 3, p.y + 10);
        ctx.lineTo(p.x + 3, p.y + 10);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'laser') {
        ctx.fillRect(p.x, p.y, p.width, p.height);
      } else if (p.type === 'boss') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.width / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw paddle
    const paddle = state.paddle;
    const paddleGradient = ctx.createLinearGradient(
      paddle.x, paddle.y,
      paddle.x, paddle.y + paddle.height
    );
    paddleGradient.addColorStop(0, '#FFFFFF');
    paddleGradient.addColorStop(0.5, paddle.color);
    paddleGradient.addColorStop(1, paddle.color);

    ctx.fillStyle = paddleGradient;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 5);
    ctx.fill();

    // Draw glow effect
    ctx.shadowColor = paddle.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'transparent';
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 5);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw balls
    state.balls.forEach(ball => {
      if (!ball.active) return;

      // Ball glow
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.fillStyle = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ball highlight
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3,
              ball.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Penetration indicator
      if (ball.penetration > 0) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw HUD
    drawHUD(ctx, state, theme);

    // Draw overlays
    if (state.state === GAME_CONFIG.STATES.LEVEL_COMPLETE) {
      drawRoguelikeOverlay(ctx, state, theme);
    } else if (state.state === GAME_CONFIG.STATES.GAME_OVER) {
      drawGameOverOverlay(ctx, state, theme);
    } else if (state.state === GAME_CONFIG.STATES.VICTORY) {
      drawVictoryOverlay(ctx, state, theme);
    }
  };

  // 辅助函数：调整颜色亮度
  const adjustColorBrightness = (hex, percent) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `rgb(${R}, ${G}, ${B})`;
  };

  // 绘制全息风格血量
  const drawHolographicHealth = (ctx, health, maxHealth, x, y) => {
    const heartSize = 16;
    const spacing = 2;
    const totalWidth = maxHealth * (heartSize + spacing);

    ctx.save();

    // 从右向左绘制，确保血量不会超出右边界
    for (let i = 0; i < maxHealth; i++) {
      // 从右边缘向左计算位置
      const hx = x - i * (heartSize + spacing) - heartSize;
      const hy = y;
      const isActive = i < Math.ceil(health);

      // 全息投影风格 - 能量胶囊背景
      const capsuleGradient = ctx.createLinearGradient(hx, hy - heartSize / 2, hx, hy + heartSize / 2);

      if (isActive) {
        capsuleGradient.addColorStop(0, '#00F5FF');
        capsuleGradient.addColorStop(0.5, '#00CED1');
        capsuleGradient.addColorStop(1, '#008B8B');

        // 发光效果
        ctx.shadowColor = '#00F5FF';
        ctx.shadowBlur = 10;
      } else {
        capsuleGradient.addColorStop(0, 'rgba(0, 245, 255, 0.1)');
        capsuleGradient.addColorStop(1, 'rgba(0, 245, 255, 0.05)');
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = capsuleGradient;
      ctx.beginPath();
      ctx.roundRect(hx, hy - heartSize / 2, heartSize, heartSize, 4);
      ctx.fill();

      // 全息投影风格 - 内部扫描线
      if (isActive) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx + 2, hy - heartSize / 2 + 4);
        ctx.lineTo(hx + heartSize - 2, hy - heartSize / 2 + 4);
        ctx.stroke();

        // 能量核心
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(hx + heartSize / 2, hy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 全息投影风格 - 边框
      ctx.strokeStyle = isActive ? 'rgba(0, 245, 255, 0.8)' : 'rgba(0, 245, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  };

  // 绘制全息风格分数
  const drawHolographicScore = (ctx, score, x, y) => {
    ctx.save();

    // 文本发光效果
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${score.toLocaleString()}`, x, y);

    // 装饰性文字
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 245, 255, 0.6)';
    ctx.font = '10px Arial';
    ctx.fillText('SCORE', x, y + 15);

    ctx.restore();
  };

  // 绘制全息风格关卡显示
  const drawHolographicLevel = (ctx, level, x, y) => {
    ctx.save();

    // 关卡数字背景框
    const boxWidth = 60;
    const boxHeight = 28;

    // 背景渐变
    const boxGradient = ctx.createLinearGradient(x - boxWidth / 2, y - boxHeight / 2, x - boxWidth / 2, y + boxHeight / 2);
    boxGradient.addColorStop(0, 'rgba(0, 245, 255, 0.15)');
    boxGradient.addColorStop(1, 'rgba(0, 245, 255, 0.05)');
    ctx.fillStyle = boxGradient;
    ctx.beginPath();
    ctx.roundRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight, 6);
    ctx.fill();

    // 边框
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 装饰角标
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - boxWidth / 2 + 4, y - boxHeight / 2);
    ctx.lineTo(x - boxWidth / 2, y - boxHeight / 2);
    ctx.lineTo(x - boxWidth / 2, y - boxHeight / 2 + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + boxWidth / 2 - 4, y + boxHeight / 2);
    ctx.lineTo(x + boxWidth / 2, y + boxHeight / 2);
    ctx.lineTo(x + boxWidth / 2, y + boxHeight / 2 - 4);
    ctx.stroke();

    // 关卡文字
    ctx.shadowColor = '#00F5FF';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#00F5FF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${level}`, x, y + 5);

    ctx.restore();
  };

  // Draw HUD
  const drawHUD = (ctx, state, theme) => {
    // Score
    drawHolographicScore(ctx, state.score, 20, 25);

    // Health - 全息风格
    drawHolographicHealth(ctx, state.health, state.maxHealth, GAME_CONFIG.CANVAS_WIDTH - 20, 25);

    // Level - 全息风格
    drawHolographicLevel(ctx, state.level, GAME_CONFIG.CANVAS_WIDTH / 2, 25);

    // Weapon ammo
    if (state.enhancements.weapons.missile) {
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#E74C3C';
      ctx.fillText(`🚀 ${state.enhancements.weapons.missile.count}`, 20, 55);
    }

    if (state.enhancements.weapons.laser) {
      ctx.fillStyle = '#3498DB';
      ctx.fillText(`🔦 ${Math.floor(state.enhancements.weapons.laser.energy)}%`,
                   80, 55);
    }

    // Endless mode timer
    if (state.state === GAME_CONFIG.STATES.ENDLESS) {
      const timeLeft = Math.ceil((GAME_CONFIG.ENDLESS_TIME_PER_LEVEL - state.endlessTimer) / 1000);
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = theme.textColor;
      ctx.fillText(`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`,
                   GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT - 20);
    }
  };

  // Draw roguelike selection overlay
  const drawRoguelikeOverlay = (ctx, state, theme) => {
    // Semi-transparent background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('关卡完成!', GAME_CONFIG.CANVAS_WIDTH / 2, 80);
    ctx.fillText('选择你的增强道具', GAME_CONFIG.CANVAS_WIDTH / 2, 120);

    // Draw options
    const options = state.availableEnhancements;
    const cardWidth = 200;
    const cardHeight = 250;
    const cardSpacing = 50;
    const startX = (GAME_CONFIG.CANVAS_WIDTH - (options.length * cardWidth + (options.length - 1) * cardSpacing)) / 2;
    const cardY = 180;

    options.forEach((option, index) => {
      const x = startX + index * (cardWidth + cardSpacing);

      // Card background
      ctx.fillStyle = '#2C3E50';
      ctx.beginPath();
      ctx.roundRect(x, cardY, cardWidth, cardHeight, 10);
      ctx.fill();

      // Card border
      ctx.strokeStyle = getRarityColor(option.rarity);
      ctx.lineWidth = 3;
      ctx.stroke();

      // Icon
      ctx.font = '48px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(option.icon, x + cardWidth / 2, cardY + 70);

      // Name
      ctx.font = 'bold 18px Arial';
      ctx.fillText(option.name, x + cardWidth / 2, cardY + 110);

      // Description
      ctx.font = '14px Arial';
      ctx.fillStyle = '#BDC3C7';
      const words = option.description.split('');
      const lines = [];
      let currentLine = '';
      for (let i = 0; i < words.length; i++) {
        currentLine += words[i];
        if (currentLine.length > 20 || words[i] === ' ') {
          lines.push(currentLine.trim());
          currentLine = '';
        }
      }
      if (currentLine) lines.push(currentLine);
      lines.forEach((line, i) => {
        ctx.fillText(line, x + cardWidth / 2, cardY + 140 + i * 20);
      });

      // Rarity
      ctx.font = '12px Arial';
      ctx.fillStyle = getRarityColor(option.rarity);
      ctx.fillText(option.rarity.toUpperCase(), x + cardWidth / 2, cardY + 230);

      // Click area indicator
      ctx.font = '12px Arial';
      ctx.fillStyle = '#7F8C8D';
      ctx.fillText('点击选择', x + cardWidth / 2, cardY + 270);
    });

    // Skip option
    if (state.skipsRemaining > 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#7F8C8D';
      ctx.textAlign = 'center';
      ctx.fillText(`跳过 (剩余 ${state.skipsRemaining} 次) - 按 S 键`,
                   GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT - 60);
    }
  };

  // Draw game over overlay
  const drawGameOverOverlay = (ctx, state, theme) => {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    ctx.fillStyle = '#E74C3C';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 - 50);

    ctx.fillStyle = theme.textColor;
    ctx.font = '24px Arial';
    ctx.fillText(`最终得分: ${state.score}`, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 20);
    ctx.fillText(`到达关卡: ${state.level}`, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 60);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#7F8C8D';
    ctx.fillText('按空格键重新开始，按ESC返回主菜单', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 120);
  };

  // Draw victory overlay
  const drawVictoryOverlay = (ctx, state, theme) => {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('胜利!', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 - 80);

    ctx.fillStyle = theme.textColor;
    ctx.font = '24px Arial';
    ctx.fillText(`最终得分: ${state.score}`, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2);
    ctx.fillText(`获得增强: ${state.enhancementCount} 个`, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 40);

    if (state.level >= 10) {
      ctx.font = '20px Arial';
      ctx.fillStyle = '#3498DB';
      ctx.fillText('已解锁无尽模式!', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 100);
    }

    ctx.font = '18px Arial';
    ctx.fillStyle = '#7F8C8D';
    ctx.fillText('按空格键进入无尽模式，按ESC返回主菜单', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT - 60);
  };

  // Get rarity color
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#95A5A6';
      case 'uncommon': return '#27AE60';
      case 'rare': return '#3498DB';
      case 'epic': return '#9B59B6';
      case 'legendary': return '#F39C12';
      default: return '#BDC3C7';
    }
  };

  // Handle clicks for roguelike selection
  const handleCanvasClick = (e) => {
    const state = gameStateRef.current;

    if (state.state === GAME_CONFIG.STATES.LEVEL_COMPLETE) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (GAME_CONFIG.CANVAS_WIDTH / rect.width);

      const options = state.availableEnhancements;
      const cardWidth = 200;
      const cardSpacing = 50;
      const startX = (GAME_CONFIG.CANVAS_WIDTH - (options.length * cardWidth + (options.length - 1) * cardSpacing)) / 2;
      const cardY = 180;

      options.forEach((option, index) => {
        const cardX = startX + index * (cardWidth + cardSpacing);
        if (x >= cardX && x <= cardX + cardWidth) {
          selectEnhancement(option);
        }
      });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CONFIG.CANVAS_WIDTH}
      height={GAME_CONFIG.CANVAS_HEIGHT}
      onClick={handleCanvasClick}
      style={{
        width: '100%',
        maxWidth: '800px',
        height: 'auto',
        border: '2px solid #333',
        borderRadius: '8px',
        cursor: 'crosshair'
      }}
    />
  );
};

export default GameEngine;
