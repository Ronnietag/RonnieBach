import { useState, useEffect, useRef, useCallback } from 'react'
import './RoguelikeBreakout.css'

// ==================== 类型定义 ====================

type GameState = 'menu' | 'playing' | 'paused' | 'levelup' | 'gameover' | 'victory'
type PowerUpType = 'fire' | 'laser' | 'slow' | 'expand' | 'multiball' | 'life' | 'shield'
type EnhancementType = 'paddle_width' | 'paddle_speed' | 'ball_speed' | 'ball_size' | 'penetrate' | 'multiball' | 'missile' | 'score' | 'life'

interface PowerUp {
  id: number
  x: number
  y: number
  type: PowerUpType
  dy: number
}

interface Ball {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  size: number
  penetrateCount: number
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'spark' | 'explosion' | 'trail' | 'combo'
}

interface ComboEffect {
  id: number
  x: number
  y: number
  scale: number
  opacity: number
  text: string
}

interface Brick {
  id: number
  x: number
  y: number
  w: number
  h: number
  hp: number
  maxHp: number
  type: string
  color: string
  borderColor: string
  glowColor: string
}

interface Missile {
  id: number
  x: number
  y: number
  dy: number
  damage: number
}

interface Enhancement {
  id: EnhancementType
  name: string
  desc: string
  icon: string
  stack: number
  maxStack: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

// ==================== 主题配置 ====================

const THEMES = [
  { name: '薄荷清新', bg: '#E8F8F5', paddle: '#AED6F1', score: '#27AE60' },
  { name: '天空之境', bg: '#EBF5FB', paddle: '#D6EAF8', score: '#3498DB' },
  { name: '落日余晖', bg: '#FDEBD0', paddle: '#F8C471', score: '#E74C3C' },
  { name: '薰衣草园', bg: '#F4ECF7', paddle: '#BB8FCE', score: '#9B59B6' },
  { name: '热带雨林', bg: '#E9F7EF', paddle: '#58D68D', score: '#27AE60' },
  { name: '珊瑚礁', bg: '#EAF2F8', paddle: '#76D7C4', score: '#48C9B0' },
  { name: '深空蓝', bg: '#17202A', paddle: '#3498DB', score: '#F39C12' },
  { name: '金属工业', bg: '#212F3C', paddle: '#00D4FF', score: '#BDC3C7' },
  { name: '宝石殿', bg: '#1A1A2E', paddle: '#BDC3C7', score: '#F1C40F' },
  { name: '暗影终局', bg: '#0A0A0F', paddle: '#4A235A', score: '#E74C3C' },
]

// 8种砖块颜色配置
const BRICK_COLORS = [
  { color: '#00FFFF', border: '#00CCCC', glow: '#00FFFF' },
  { color: '#FF00FF', border: '#CC00CC', glow: '#FF00FF' },
  { color: '#FFFF00', border: '#CCCC00', glow: '#FFFF00' },
  { color: '#00FF66', border: '#00CC55', glow: '#00FF66' },
  { color: '#FF6600', border: '#CC5533', glow: '#FF6600' },
  { color: '#9900FF', border: '#7700CC', glow: '#9900FF' },
  { color: '#00FFCC', border: '#00CCAA', glow: '#00FFCC' },
  { color: '#FF1493', border: '#CC1177', glow: '#FF1493' },
]

const POWER_UPS: { type: PowerUpType; color: string; icon: string }[] = [
  { type: 'fire', color: '#ff6b6b', icon: '🔥' },
  { type: 'laser', color: '#4ecdc4', icon: '⚡' },
  { type: 'slow', color: '#ffe66d', icon: '🐢' },
  { type: 'expand', color: '#95e1d3', icon: '📏' },
  { type: 'multiball', color: '#dda0dd', icon: '⚪' },
  { type: 'life', color: '#ff69b4', icon: '❤️' },
  { type: 'shield', color: '#87ceeb', icon: '🛡️' },
]

// ==================== 音效系统 ====================

let audioContext: AudioContext | null = null

function playSound(type: 'hit' | 'destroy' | 'paddle' | 'powerup' | 'combo' | 'levelup' | 'shoot') {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  
  const ctx = audioContext!
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  
  switch (type) {
    case 'hit':
      osc.frequency.setValueAtTime(200 + Math.random() * 200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.1)
      break
    case 'destroy':
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
      break
    case 'paddle':
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.05)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.1)
      break
    case 'powerup':
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g)
        g.connect(ctx.destination)
        o.frequency.setValueAtTime(400 + i * 200, ctx.currentTime)
        g.gain.setValueAtTime(0.15, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
        o.start(ctx.currentTime + i * 0.05)
        o.stop(ctx.currentTime + i * 0.05 + 0.15)
      }
      break
    case 'combo':
      for (let i = 0; i < 4; i++) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g)
        g.connect(ctx.destination)
        o.frequency.setValueAtTime(300 + i * 150, ctx.currentTime)
        g.gain.setValueAtTime(0.2, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
        o.start(ctx.currentTime + i * 0.08)
        o.stop(ctx.currentTime + i * 0.08 + 0.2)
      }
      break
    case 'levelup':
      const notes = [523, 659, 784, 1047, 1318]
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g)
        g.connect(ctx.destination)
        o.frequency.setValueAtTime(freq, ctx.currentTime)
        g.gain.setValueAtTime(0.2, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
        o.start(ctx.currentTime + i * 0.12)
        o.stop(ctx.currentTime + i * 0.12 + 0.25)
      })
      break
    case 'shoot':
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.1)
      break
  }
}

// ==================== 主游戏组件 ====================

function RoguelikeBreakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('menu')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([])
  const [availableEnhancements, setAvailableEnhancements] = useState<Enhancement[]>([])

  const gameRef = useRef({
    balls: [] as Ball[],
    paddleX: 350,
    paddleWidth: 120,
    bricks: [] as Brick[],
    powerUps: [] as PowerUp[],
    missiles: [] as Missile[],
    particles: [] as Particle[],
    comboEffects: [] as ComboEffect[],
    ballSpeed: 6,
    paddleSpeed: 8,
    hitCountSincePaddle: 0,
    missileCount: 3,
    missileCooldown: 0,
    nextBrickId: 0,
    nextBallId: 0,
    nextPowerUpId: 0,
    nextMissileId: 0,
    nextParticleId: 0,
    nextComboId: 0,
    enhancements: {} as Record<string, number>,
  })

  const ALL_ENHANCEMENTS: Enhancement[] = [
    { id: 'paddle_width', name: '挡板扩展', desc: '+25%挡板宽度', icon: '↔️', stack: 0, maxStack: 4, rarity: 'common' },
    { id: 'paddle_speed', name: '挡板加速', desc: '+20%移动速度', icon: '💨', stack: 0, maxStack: 3, rarity: 'common' },
    { id: 'ball_speed', name: '球速提升', desc: '+15%球体速度', icon: '⚡', stack: 0, maxStack: 4, rarity: 'common' },
    { id: 'ball_size', name: '球体膨胀', desc: '+20%球体大小', icon: '🔵', stack: 0, maxStack: 3, rarity: 'common' },
    { id: 'penetrate', name: '穿透攻击', desc: '球可穿透1砖块', icon: '🎯', stack: 0, maxStack: 3, rarity: 'uncommon' },
    { id: 'multiball', name: '双球模式', desc: '额外增加1球', icon: '🔴', stack: 0, maxStack: 5, rarity: 'rare' },
    { id: 'missile', name: '导弹发射', desc: '空格键发射导弹', icon: '🚀', stack: 0, maxStack: 3, rarity: 'uncommon' },
    { id: 'score', name: '得分加成', desc: '+30%得分', icon: '💎', stack: 0, maxStack: 5, rarity: 'common' },
    { id: 'life', name: '生命上限', desc: '+1初始生命', icon: '❤️', stack: 0, maxStack: 3, rarity: 'rare' },
  ]

  // ==================== 关卡初始化 ====================

  const initLevel = useCallback((levelNum: number) => {
    const rows = Math.min(3 + Math.floor(levelNum / 2), 8)
    const cols = 8
    const padding = 8
    const brickWidth = 75
    const brickHeight = 28
    const offsetTop = 60
    const offsetLeft = (800 - cols * (brickWidth + padding)) / 2

    const bricks: Brick[] = []
    const maxHp = Math.min(1 + Math.floor((levelNum - 1) / 2), 8)
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rand = Math.random()
        let hp = 1
        let colorInfo = BRICK_COLORS[0]
        
        if (rand > 0.7) {
          hp = Math.min(Math.floor(rand * maxHp) + 1, maxHp)
        }
        colorInfo = BRICK_COLORS[Math.min(hp - 1, BRICK_COLORS.length - 1)]
        
        bricks.push({
          id: gameRef.current.nextBrickId++,
          x: offsetLeft + c * (brickWidth + padding),
          y: offsetTop + r * (brickHeight + padding),
          w: brickWidth,
          h: brickHeight,
          hp,
          maxHp: hp,
          type: 'normal',
          color: colorInfo.color,
          borderColor: colorInfo.border,
          glowColor: colorInfo.glow,
        })
      }
    }

    const ballSize = 8 * (1 + (gameRef.current.enhancements['ball_size'] || 0) * 0.2)
    gameRef.current.balls = [{
      id: gameRef.current.nextBallId++,
      x: 400,
      y: 550,
      dx: 0,
      dy: -gameRef.current.ballSpeed,
      size: ballSize,
      penetrateCount: gameRef.current.enhancements['penetrate'] || 0,
    }]

    // 多球
    const multiballCount = gameRef.current.enhancements['multiball'] || 0
    for (let i = 0; i < multiballCount; i++) {
      gameRef.current.balls.push({
        id: gameRef.current.nextBallId++,
        x: 400 + (i + 1) * 20,
        y: 550,
        dx: (Math.random() - 0.5) * gameRef.current.ballSpeed,
        dy: -gameRef.current.ballSpeed,
        size: ballSize,
        penetrateCount: gameRef.current.enhancements['penetrate'] || 0,
      })
    }

    gameRef.current.paddleX = 340
    gameRef.current.bricks = bricks
    gameRef.current.powerUps = []
    gameRef.current.missiles = []
    gameRef.current.particles = []
    gameRef.current.comboEffects = []
    gameRef.current.hitCountSincePaddle = 0
    gameRef.current.missileCount = 3 + (gameRef.current.enhancements['missile'] || 0) * 2
    gameRef.current.missileCooldown = 0
    
    setGameState('playing')
  }, [])

  // ==================== 粒子特效 ====================

  const createParticles = (x: number, y: number, color: string, count: number, type: Particle['type'] = 'spark') => {
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5
      const speed = type === 'explosion' ? 4 + Math.random() * 6 : 2 + Math.random() * 4
      const size = type === 'explosion' ? 6 + Math.random() * 6 : 3 + Math.random() * 4
      
      particles.push({
        id: gameRef.current.nextParticleId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size,
        type,
      })
    }
    gameRef.current.particles.push(...particles)
  }

  const createComboText = (x: number, y: number, count: number) => {
    if (count >= 3) {
      gameRef.current.comboEffects.push({
        id: gameRef.current.nextComboId++,
        x,
        y,
        scale: 1,
        opacity: 1,
        text: `${count}x COMBO!`,
      })
    }
  }

  // ==================== 游戏循环 ====================

  useEffect(() => {
    if (gameState !== 'playing') return

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let animationId: number
    const game = gameRef.current

    let keys = { left: false, right: false }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true
      if (e.key === ' ' && game.missileCount > 0 && game.missileCooldown <= 0) {
        playSound('shoot')
        game.missiles.push({
          id: game.nextMissileId++,
          x: game.paddleX + game.paddleWidth / 2,
          y: canvas.height - 30,
          dy: -12,
          damage: 3,
        })
        game.missileCount--
        game.missileCooldown = 30
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setGameState('paused')
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false
    }

    let mouseX = game.paddleX + game.paddleWidth / 2
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      game.paddleX = Math.max(0, Math.min(canvas.width - game.paddleWidth, mouseX - game.paddleWidth / 2))
    }

    const handleClick = () => {
      if (game.balls.length === 1 && game.balls[0].dx === 0 && game.balls[0].dy === 0) {
        const ball = game.balls[0]
        const speed = game.ballSpeed * (1 + (game.enhancements['ball_speed'] || 0) * 0.15)
        ball.dx = (Math.random() - 0.5) * speed
        ball.dy = -speed
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)

    const update = () => {
      if (game.missileCooldown > 0) game.missileCooldown--

      const paddleSpeed = game.paddleSpeed * (1 + (game.enhancements['paddle_speed'] || 0) * 0.2)
      if (keys.left) game.paddleX -= paddleSpeed
      if (keys.right) game.paddleX += paddleSpeed
      game.paddleX = Math.max(0, Math.min(canvas.width - game.paddleWidth, game.paddleX))

      const paddleWidth = 120 * (1 + (game.enhancements['paddle_width'] || 0) * 0.25)
      game.paddleWidth = paddleWidth

      // 导弹
      game.missiles = game.missiles.filter(m => {
        m.y += m.dy
        return m.y > 0
      })

      game.missiles = game.missiles.filter(missile => {
        let hit = false
        game.bricks = game.bricks.filter(brick => {
          if (hit) return true
          if (missile.x >= brick.x && missile.x <= brick.x + brick.w &&
              missile.y >= brick.y && missile.y <= brick.y + brick.h) {
            hit = true
            brick.hp -= missile.damage
            createParticles(missile.x, missile.y, brick.color, 10, 'explosion')
            playSound('hit')
            
            if (brick.hp <= 0) {
              playSound('destroy')
              createParticles(brick.x + brick.w/2, brick.y + brick.h/2, brick.color, 20, 'explosion')
              const scoreMult = 1 + (game.enhancements['score'] || 0) * 0.3
              setScore(s => s + Math.ceil(brick.maxHp * 10 * scoreMult))
              
              if (Math.random() < 0.15) {
                const types: PowerUpType[] = ['fire', 'laser', 'expand', 'multiball', 'life', 'shield']
                const type = types[Math.floor(Math.random() * types.length)]
                game.powerUps.push({
                  id: game.nextPowerUpId++,
                  x: brick.x + brick.w / 2,
                  y: brick.y + brick.h / 2,
                  type,
                  dy: 2,
                })
              }
              return false
            }
          }
          return true
        })
        return !hit
      })

      const speedMult = 1 + (game.enhancements['ball_speed'] || 0) * 0.15
      
      game.balls.forEach(ball => {
        if (ball.dx === 0 && ball.dy === 0) return

        ball.x += ball.dx * speedMult
        ball.y += ball.dy * speedMult

        if (ball.x <= 0 || ball.x >= canvas.width) {
          ball.dx = -ball.dx
          ball.x = Math.max(0, Math.min(canvas.width, ball.x))
        }
        if (ball.y <= 0) {
          ball.dy = -ball.dy
          ball.y = 0
        }

        if (ball.y >= canvas.height - 30 && ball.y <= canvas.height - 20 &&
            ball.x >= game.paddleX && ball.x <= game.paddleX + game.paddleWidth) {
          const hitPos = (ball.x - game.paddleX) / game.paddleWidth
          const angle = (hitPos - 0.5) * Math.PI * 0.7
          const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)
          ball.dx = Math.sin(angle) * speed
          ball.dy = -Math.cos(angle) * speed
          ball.y = canvas.height - 21
          
          playSound('paddle')
          createParticles(ball.x, canvas.height - 25, '#00FFFF', 8)
          game.hitCountSincePaddle = 0
          setCombo(0)
        }

        if (ball.y >= canvas.height) {
          ball.dx = 0
          ball.dy = 0
        }
      })

      game.balls = game.balls.filter(b => b.dy !== 0 || b.y < canvas.height)

      if (game.balls.length === 0 || game.balls.every(b => b.dx === 0 && b.dy === 0)) {
        setLives(l => {
          const newLives = l - 1
          if (newLives <= 0) {
            setGameState('gameover')
          } else {
            const ballSize = 8 * (1 + (game.enhancements['ball_size'] || 0) * 0.2)
            game.balls = [{
              id: game.nextBallId++,
              x: 400,
              y: 550,
              dx: 0,
              dy: -game.ballSpeed,
              size: ballSize,
              penetrateCount: game.enhancements['penetrate'] || 0,
            }]
            game.hitCountSincePaddle = 0
          }
          return newLives
        })
      }

      const hitBricks = new Set<number>()
      
      game.balls.forEach(ball => {
        if (ball.dx === 0 && ball.dy === 0) return

        for (let i = 0; i < game.bricks.length; i++) {
          const brick = game.bricks[i]
          if (hitBricks.has(brick.id)) continue

          if (ball.x >= brick.x - ball.size && ball.x <= brick.x + brick.w + ball.size &&
              ball.y >= brick.y - ball.size && ball.y <= brick.y + brick.h + ball.size) {

            playSound('hit')
            createParticles(ball.x, ball.y, brick.color, 8)

            const prevY = ball.y - ball.dy * speedMult
            if (prevY < brick.y || prevY > brick.y + brick.h) {
              ball.dy = -ball.dy
            } else {
              ball.dx = -ball.dx
            }

            if (ball.penetrateCount > 0) {
              ball.penetrateCount--
            } else {
              hitBricks.add(brick.id)
            }

            brick.hp -= 1
            
            game.hitCountSincePaddle++
            const currentCombo = game.hitCountSincePaddle
            setCombo(c => Math.max(c, currentCombo))
            setMaxCombo(m => Math.max(m, currentCombo))
            if (currentCombo >= 3) {
              createParticles(ball.x, ball.y, '#FFFF00', 15)
              createComboText(ball.x, ball.y, currentCombo)
              if (currentCombo >= 5) playSound('combo')
            }

            if (brick.hp <= 0) {
              playSound('destroy')
              createParticles(brick.x + brick.w/2, brick.y + brick.h/2, brick.color, 25, 'explosion')
              const scoreMult = 1 + (game.enhancements['score'] || 0) * 0.3
              setScore(s => s + Math.ceil(brick.maxHp * 10 * scoreMult))
              
              if (Math.random() < 0.15) {
                const types: PowerUpType[] = ['fire', 'laser', 'expand', 'multiball', 'life', 'shield']
                const type = types[Math.floor(Math.random() * types.length)]
                game.powerUps.push({
                  id: game.nextPowerUpId++,
                  x: brick.x + brick.w / 2,
                  y: brick.y + brick.h / 2,
                  type,
                  dy: 2,
                })
              }
            }
            break
          }
        }
      })

      game.bricks = game.bricks.filter(b => b.hp > 0 && !hitBricks.has(b.id))

      game.particles = game.particles.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += p.type === 'explosion' ? -0.05 : 0.1
        p.life -= 0.02
        p.size *= 0.98
        return p.life > 0
      })

      game.comboEffects = game.comboEffects.filter(e => {
        e.scale += 0.03
        e.opacity -= 0.02
        return e.opacity > 0
      })

      game.powerUps.forEach(p => {
        p.y += p.dy
      })
      game.powerUps = game.powerUps.filter(p => p.y < canvas.height)

      game.powerUps = game.powerUps.filter(p => {
        if (p.y >= canvas.height - 30 && p.y >= canvas.height - 50 &&
            p.x >= game.paddleX && p.x <= game.paddleX + game.paddleWidth) {
          playSound('powerup')
          createParticles(p.x, p.y, POWER_UPS.find(u => u.type === p.type)!.color, 15, 'explosion')
          
          switch (p.type) {
            case 'fire': case 'laser':
              game.balls.forEach(b => b.penetrateCount = (game.enhancements['penetrate'] || 0) + 2)
              break
            case 'expand':
              game.enhancements['paddle_width'] = (game.enhancements['paddle_width'] || 0) + 1
              break
            case 'multiball':
              const newBalls = [...game.balls]
              game.balls.forEach(b => {
                if (b.dy !== 0) {
                  newBalls.push({ ...b, id: game.nextBallId++, dx: -b.dx, size: b.size, penetrateCount: b.penetrateCount })
                }
              })
              game.balls = newBalls
              break
            case 'life':
              setLives(l => l + 1)
              break
          }
          return false
        }
        return true
      })

      if (game.bricks.length === 0) {
        if (level >= 10) {
          setGameState('victory')
        } else {
          playSound('levelup')
          setLevel(l => l + 1)
          const options = ALL_ENHANCEMENTS.filter(e => {
            const current = gameRef.current.enhancements[e.id] || 0
            return current < e.maxStack
          }).slice(0, 6)
          
          setAvailableEnhancements(options.map(e => ({
            ...e,
            stack: gameRef.current.enhancements[e.id] || 0
          })))
          setSelectedEnhancements([])
          setGameState('levelup')
        }
      }
    }

    const draw = () => {
      const theme = THEMES[Math.min(level - 1, THEMES.length - 1)]
      
      ctx.fillStyle = theme.bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)'
      ctx.lineWidth = 1
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      game.bricks.forEach(brick => {
        ctx.shadowColor = brick.glowColor
        ctx.shadowBlur = 10
        
        ctx.fillStyle = brick.color
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h)
        
        ctx.shadowBlur = 0
        ctx.strokeStyle = brick.borderColor
        ctx.lineWidth = 2
        ctx.strokeRect(brick.x, brick.y, brick.w, brick.h)

        if (brick.maxHp > 1) {
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 14px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(`${brick.hp}`, brick.x + brick.w / 2, brick.y + brick.h / 2 + 5)
        }
      })

      const paddleGradient = ctx.createLinearGradient(game.paddleX, 0, game.paddleX + game.paddleWidth, 0)
      paddleGradient.addColorStop(0, '#FF0055')
      paddleGradient.addColorStop(0.5, '#00FFFF')
      paddleGradient.addColorStop(1, '#FF00FF')
      ctx.fillStyle = paddleGradient
      ctx.shadowColor = '#00FFFF'
      ctx.shadowBlur = 15
      ctx.fillRect(game.paddleX, canvas.height - 20, game.paddleWidth, 20)
      ctx.shadowBlur = 0

      game.missiles.forEach(m => {
        ctx.fillStyle = '#FF6600'
        ctx.shadowColor = '#FF6600'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(m.x, m.y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })

      game.balls.forEach(ball => {
        if (ball.dx === 0 && ball.dy === 0) return

        ctx.beginPath()
        ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2)
        
        if (ball.penetrateCount > 0) {
          ctx.fillStyle = '#FF00FF'
          ctx.shadowColor = '#FF00FF'
        } else {
          ctx.fillStyle = '#fff'
          ctx.shadowColor = '#00FFFF'
        }
        ctx.shadowBlur = 15
        ctx.fill()
        ctx.shadowBlur = 0
      })

      game.particles.forEach(p => {
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      game.comboEffects.forEach(e => {
        ctx.globalAlpha = e.opacity
        ctx.save()
        ctx.translate(e.x, e.y)
        ctx.scale(e.scale, e.scale)
        ctx.font = 'bold 24px monospace'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#FFFF00'
        ctx.shadowColor = '#FFFF00'
        ctx.shadowBlur = 20
        ctx.fillText(e.text, 0, 0)
        ctx.restore()
      })
      ctx.globalAlpha = 1

      game.powerUps.forEach(p => {
        const powerUp = POWER_UPS.find(u => u.type === p.type)!
        ctx.beginPath()
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2)
        ctx.fillStyle = powerUp.color
        ctx.shadowColor = powerUp.color
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(powerUp.icon, p.x, p.y)
      })

      // HUD
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = theme.score
      ctx.shadowColor = theme.score
      ctx.shadowBlur = 10
      ctx.fillText(`关卡 ${level}`, 20, 30)
      ctx.fillText(`得分 ${score}`, 120, 30)
      ctx.fillText(`生命 ${lives}`, 220, 30)
      
      ctx.textAlign = 'right'
      ctx.fillStyle = '#FFFF00'
      ctx.fillText(`连击 ${combo}`, canvas.width - 20, 30)
      
      ctx.textAlign = 'center'
      ctx.fillStyle = '#888'
      ctx.font = '12px monospace'
      ctx.fillText('← → 移动 | 空格 导弹 | P 暂停', canvas.width / 2, canvas.height - 10)
    }

    const gameLoop = () => {
      update()
      draw()
      animationId = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
    }
  }, [gameState, level, combo])

  // ==================== 开始游戏 ====================

  const startGame = () => {
    setLevel(1)
    setScore(0)
    setLives(3 + (gameRef.current.enhancements['life'] || 0))
    setCombo(0)
    setMaxCombo(0)
    gameRef.current.enhancements = {}
    gameRef.current.ballSpeed = 6
    initLevel(1)
  }

  // ==================== 关卡奖励选择 ====================

  const selectEnhancement = (id: string) => {
    setSelectedEnhancements(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id)
      }
      if (prev.length < 3) {
        return [...prev, id]
      }
      return prev
    })
  }

  const confirmEnhancements = () => {
    selectedEnhancements.forEach(id => {
      gameRef.current.enhancements[id] = (gameRef.current.enhancements[id] || 0) + 1
      if (id === 'life') {
        setLives(l => l + 1)
      }
    })
    setSelectedEnhancements([])
    initLevel(level)
  }

  const skipEnhancements = () => {
    setSelectedEnhancements([])
    initLevel(level)
  }

  // ==================== 渲染界面 ====================

  return (
    <div className="roguelike-breakout">
      {/* Menu */}
      {gameState === 'menu' && (
        <div className="game-menu">
          <h1>🎮 肉鸽打砖块</h1>
          <p>消灭所有砖块，升级你的能力！</p>
          <div className="menu-info">
            <span>🧱 8种砖块类型</span>
            <span>🚀 导弹武器系统</span>
            <span>💥 粒子特效</span>
            <span>🔥 连击系统</span>
          </div>
          <button className="start-btn" onClick={startGame}>开始游戏</button>
        </div>
      )}

      {/* Game Over */}
      {gameState === 'gameover' && (
        <div className="game-over">
          <h1>💀 游戏结束</h1>
          <p>最终得分: {score}</p>
          <p>最高连击: {maxCombo}</p>
          <p>到达关卡: {level}</p>
          <button className="start-btn" onClick={startGame}>重新开始</button>
        </div>
      )}

      {/* Victory */}
      {gameState === 'victory' && (
        <div className="victory">
          <h1>🏆 恭喜通关!</h1>
          <p>最终得分: {score}</p>
          <p>最高连击: {maxCombo}</p>
          <button className="start-btn" onClick={startGame}>再来一局</button>
        </div>
      )}

      {/* Level Up */}
      {gameState === 'levelup' && (
        <div className="levelup">
          <h2>🎉 第 {level} 关完成!</h2>
          <p>选择 3 个增强:</p>
          <div className="enhancement-list">
            {availableEnhancements.map(enh => (
              <div
                key={enh.id}
                className={`enhancement-card ${selectedEnhancements.includes(enh.id) ? 'selected' : ''} ${enh.stack >= enh.maxStack ? 'maxed' : ''}`}
                onClick={() => selectEnhancement(enh.id)}
              >
                <span className="enh-icon">{enh.icon}</span>
                <span className="enh-name">{enh.name}</span>
                <span className="enh-desc">{enh.desc}</span>
                <span className="enh-stack">{enh.stack}/{enh.maxStack}</span>
              </div>
            ))}
          </div>
          <div className="enhancement-actions">
            <button className="skip-btn" onClick={skipEnhancements}>跳过</button>
            <button 
              className="confirm-btn" 
              disabled={selectedEnhancements.length === 0}
              onClick={confirmEnhancements}
            >
              确认 ({selectedEnhancements.length}/3)
            </button>
          </div>
        </div>
      )}

      {/* Pause */}
      {gameState === 'paused' && (
        <div className="pause-screen">
          <h1>⏸️ 暂停</h1>
          <p>按 P 继续</p>
          <button className="start-btn" onClick={() => setGameState('playing')}>继续</button>
        </div>
      )}

      <canvas ref={canvasRef} width={800} height={600} className="game-canvas" />
    </div>
  )
}

export default RoguelikeBreakout
