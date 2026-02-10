import { useState, useEffect, useCallback, useRef } from 'react'
import './BrickBreaker.css'

// Game constants
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

// Game states
const STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER: 'game_over',
  VICTORY: 'victory'
}

// Level themes
const LEVEL_THEMES = [
  { name: '赛博霓虹', bg: '#0a0a1a', brickColors: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'], paddle: '#00ffff', accent: '#ff00ff' },
  { name: '极光森林', bg: '#0a1a0a', brickColors: ['#00ff88', '#88ff00', '#00ffaa', '#88ffaa'], paddle: '#00ff88', accent: '#aaff00' },
  { name: '深渊之蓝', bg: '#0a0a2a', brickColors: ['#0066ff', '#0066cc', '#0099ff', '#0033aa'], paddle: '#0066ff', accent: '#00aaff' },
  { name: '熔岩之怒', bg: '#1a0a0a', brickColors: ['#ff3300', '#ff6600', '#ff9900', '#cc0000'], paddle: '#ff3300', accent: '#ff6600' },
  { name: '紫晶要塞', bg: '#1a0a1a', brickColors: ['#9900ff', '#cc00ff', '#aa00ff', '#6600cc'], paddle: '#9900ff', accent: '#cc00ff' },
  { name: '黄金海岸', bg: '#1a1a0a', brickColors: ['#ffcc00', '#ffaa00', '#ffdd00', '#cc9900'], paddle: '#ffcc00', accent: '#ffdd00' },
  { name: '深海恐惧', bg: '#001a1a', brickColors: ['#00aaaa', '#00dddd', '#00cccc', '#008888'], paddle: '#00aaaa', accent: '#00dddd' },
  { name: '暗影之心', bg: '#0a0a0a', brickColors: ['#333333', '#555555', '#777777', '#222222'], paddle: '#888888', accent: '#aaaaaa' },
  { name: '晶体未来', bg: '#0a1a2a', brickColors: ['#00ddff', '#00aadd', '#00bbff', '#0099cc'], paddle: '#00ddff', accent: '#00bbff' },
  { name: 'Boss战场', bg: '#1a0000', brickColors: ['#ff0000', '#cc0000', '#990000', '#660000', '#ff3333'], paddle: '#ff0000', accent: '#ff3333' },
]

// Sound manager
let audioContext: AudioContext | null = null
function playSound(type: string) {
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
      osc.frequency.setValueAtTime(200 + Math.random() * 100, ctx.currentTime)
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
    case 'levelup':
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g)
        g.connect(ctx.destination)
        o.frequency.setValueAtTime(freq, ctx.currentTime)
        g.gain.setValueAtTime(0.2, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
        o.start(ctx.currentTime + i * 0.1)
        o.stop(ctx.currentTime + i * 0.1 + 0.2)
      })
      break
  }
}

interface GameState {
  state: string
  level: number
  score: number
  health: number
  paddleX: number
  player: any
  balls: any[]
  bricks: any[]
  particles: any[]
  projectiles: any[]
  missileCooldown: number
}

function BrickBreaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState(STATES.MENU)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  // health managed in gameRef, only setHealth needed for updates
  const [, setHealth] = useState(3)
  const [availableEnhancements, setAvailableEnhancements] = useState<any[]>([])
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([])
  
  const gameRef = useRef<GameState>({
    state: STATES.MENU,
    level: 1,
    score: 0,
    health: 3,
    paddleX: CANVAS_WIDTH / 2,
    player: {
      paddleWidth: 120,
      paddleSpeed: 500,
      ballSpeed: 400,
      ballSize: 10,
      ballPenetrate: 0,
      missileDamage: 3,
      missileCooldown: 1000,
      scoreMultiplier: 1,
    },
    balls: [],
    bricks: [],
    particles: [],
    projectiles: [],
    missileCooldown: 0,
  })

  const initGame = useCallback((_mode: string) => {
    gameRef.current = {
      state: STATES.PLAYING,
      level: 1,
      score: 0,
      health: 3,
      paddleX: CANVAS_WIDTH / 2,
      player: {
        paddleWidth: 120,
        paddleSpeed: 500,
        ballSpeed: 400,
        ballSize: 10,
        ballPenetrate: 0,
        missileDamage: 3,
        missileCooldown: 1000,
        scoreMultiplier: 1,
      },
      balls: [],
      bricks: [],
      particles: [],
      projectiles: [],
      missileCooldown: 0,
    }
    setGameState(STATES.PLAYING)
    setLevel(1)
    setScore(0)
    setHealth(3)
    setSelectedEnhancements([])
    initLevel(1)
  }, [])

  const initLevel = useCallback((levelNum: number) => {
    const game = gameRef.current
    const theme = LEVEL_THEMES[Math.min(levelNum - 1, LEVEL_THEMES.length - 1)]
    const rows = Math.min(3 + Math.floor(levelNum / 2), 8)
    const cols = 8
    const padding = 8
    const brickWidth = 75
    const brickHeight = 28
    const offsetTop = 60
    const offsetLeft = (CANVAS_WIDTH - cols * (brickWidth + padding)) / 2

    const bricks: any[] = []
    const maxHp = Math.min(1 + Math.floor((levelNum - 1) / 2), 5)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rand = Math.random()
        let hp = 1
        if (rand > 0.7) hp = Math.min(Math.floor(rand * maxHp) + 1, maxHp)
        
        bricks.push({
          x: offsetLeft + c * (brickWidth + padding),
          y: offsetTop + r * (brickHeight + padding),
          w: brickWidth,
          h: brickHeight,
          hp,
          color: theme.brickColors[hp - 1] || theme.brickColors[0],
        })
      }
    }

    game.bricks = bricks
    game.balls = [{
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 80,
      dx: 0,
      dy: -game.player.ballSpeed,
      size: game.player.ballSize,
    }]
    game.missileCooldown = 0
  }, [])

  const generateEnhancements = useCallback(() => {
    const allEnhancements = [
      { id: 'paddle_width', name: '挡板扩展', desc: '+25%挡板宽度', icon: '↔️', rarity: 'common' },
      { id: 'paddle_speed', name: '挡板加速', desc: '+20%挡板速度', icon: '💨', rarity: 'common' },
      { id: 'ball_speed', name: '球速提升', desc: '+15%球速', icon: '⚡', rarity: 'common' },
      { id: 'ball_size', name: '球体膨胀', desc: '+20%球体大小', icon: '🔵', rarity: 'common' },
      { id: 'ball_penetrate', name: '穿透攻击', desc: '球可穿透1砖块', icon: '🎯', rarity: 'uncommon' },
      { id: 'multiball', name: '双球模式', desc: '额外增加1球', icon: '🔴', rarity: 'rare' },
      { id: 'missile', name: '导弹发射', desc: '空格键发射导弹', icon: '🚀', rarity: 'uncommon' },
      { id: 'health', name: '生命上限', desc: '+1最大生命', icon: '❤️', rarity: 'rare' },
      { id: 'score', name: '得分加成', desc: '+30%得分', icon: '💎', rarity: 'common' },
    ]
    
    const shuffled = allEnhancements.sort(() => Math.random() - 0.5).slice(0, 6)
    setAvailableEnhancements(shuffled)
    setSelectedEnhancements([])
  }, [])

  const selectEnhancement = useCallback((id: string) => {
    setSelectedEnhancements(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length < 3) return [...prev, id]
      return prev
    })
  }, [])

  const confirmEnhancements = useCallback(() => {
    const game = gameRef.current
    selectedEnhancements.forEach(id => {
      const enhancement = availableEnhancements.find((e: any) => e.id === id)
      if (!enhancement) return
      
      const player = { ...game.player }
      switch (id) {
        case 'paddle_width': player.paddleWidth *= 1.25; break
        case 'paddle_speed': player.paddleSpeed *= 1.2; break
        case 'ball_speed': player.ballSpeed *= 1.15; break
        case 'ball_size': player.ballSize *= 1.2; break
        case 'ball_penetrate': player.ballPenetrate += 1; break
        case 'multiball': 
          game.balls.push({
            x: CANVAS_WIDTH / 2 + 20,
            y: CANVAS_HEIGHT - 80,
            dx: 100,
            dy: -player.ballSpeed,
            size: player.ballSize,
          })
          break
        case 'missile': player.missileDamage += 2; break
        case 'health': break
        case 'score': player.scoreMultiplier *= 1.3; break
      }
      game.player = player
    })
    
    setGameState(STATES.PLAYING)
    game.level++
    setLevel(game.level)
    initLevel(game.level)
  }, [availableEnhancements, selectedEnhancements, initLevel])

  const createParticles = useCallback((x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5
      const speed = 2 + Math.random() * 3
      gameRef.current.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 3 + Math.random() * 3,
      })
    }
  }, [])

  useEffect(() => {
    if (gameState !== STATES.PLAYING) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const game = gameRef.current

    let animationId: number
    let mouseX = game.paddleX

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && game.missileCooldown <= 0) {
        game.projectiles.push({
          x: game.paddleX,
          y: CANVAS_HEIGHT - 30,
          dy: -600,
          damage: game.player.missileDamage,
        })
        game.missileCooldown = game.player.missileCooldown
        playSound('powerup')
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('keydown', handleKeyDown)

    const update = (deltaTime: number) => {
      game.missileCooldown = Math.max(0, game.missileCooldown - deltaTime)

      game.paddleX = Math.max(0, Math.min(CANVAS_WIDTH - game.player.paddleWidth, mouseX - game.player.paddleWidth / 2))

      const speedMult = game.player.ballSpeed / 400
      game.balls.forEach((ball: any) => {
        if (ball.dx === 0 && ball.dy === 0) return

        ball.x += ball.dx * speedMult * (deltaTime / 1000)
        ball.y += ball.dy * speedMult * (deltaTime / 1000)

        if (ball.x <= ball.size || ball.x >= CANVAS_WIDTH - ball.size) {
          ball.dx = -ball.dx
          ball.x = Math.max(ball.size, Math.min(CANVAS_WIDTH - ball.size, ball.x))
        }
        if (ball.y <= 0) {
          ball.dy = -ball.dy
          ball.y = 0
        }

        if (ball.y >= CANVAS_HEIGHT - 30 - ball.size &&
            ball.y <= CANVAS_HEIGHT - 20 &&
            ball.x >= game.paddleX && ball.x <= game.paddleX + game.player.paddleWidth) {
          const hitPos = (ball.x - game.paddleX) / game.player.paddleWidth
          const angle = (hitPos - 0.5) * Math.PI * 0.7
          const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)
          ball.dx = Math.sin(angle) * speed
          ball.dy = -Math.cos(angle) * speed
          ball.y = CANVAS_HEIGHT - 30 - ball.size
          playSound('paddle')
          createParticles(ball.x, CANVAS_HEIGHT - 25, '#00ffff', 8)
        }

        if (ball.y >= CANVAS_HEIGHT) {
          ball.dx = 0
          ball.dy = 0
        }
      })

      game.balls = game.balls.filter((b: any) => b.dy !== 0 || b.y < CANVAS_HEIGHT)

      if (game.balls.length === 0) {
        game.health--
        setHealth(game.health)
        if (game.health <= 0) {
          setGameState(STATES.GAME_OVER)
        } else {
          game.balls = [{
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 80,
            dx: 0,
            dy: -game.player.ballSpeed,
            size: game.player.ballSize,
          }]
        }
      }

      game.projectiles = game.projectiles.filter((p: any) => {
        p.y += p.dy * (deltaTime / 1000)
        return p.y > 0
      })

      const hitBricks = new Set<number>()
      game.balls.forEach((ball: any) => {
        if (ball.dx === 0 && ball.dy === 0) return

        for (let i = 0; i < game.bricks.length; i++) {
          const brick: any = game.bricks[i]
          if (hitBricks.has(i)) continue

          if (ball.x >= brick.x - ball.size && ball.x <= brick.x + brick.w + ball.size &&
              ball.y >= brick.y - ball.size && ball.y <= brick.y + brick.h + ball.size) {

            playSound('hit')
            createParticles(ball.x, ball.y, brick.color, 8)

            const prevY = ball.y - ball.dy * (deltaTime / 1000)
            if (prevY < brick.y || prevY > brick.y + brick.h) {
              ball.dy = -ball.dy
            } else {
              ball.dx = -ball.dx
            }

            if (game.player.ballPenetrate > 0) {
              ball.size += 0.5
            } else {
              hitBricks.add(i)
            }

            brick.hp--
            game.score += Math.ceil(10 * game.player.scoreMultiplier)
            setScore(game.score)

            if (brick.hp <= 0) {
              playSound('destroy')
              createParticles(brick.x + brick.w/2, brick.y + brick.h/2, brick.color, 20)
            }
            break
          }
        }
      })

      game.projectiles = game.projectiles.filter((p: any) => {
        let hit = false
        game.bricks = game.bricks.filter((brick: any) => {
          if (hit) return true
          if (p.x >= brick.x && p.x <= brick.x + brick.w &&
              p.y >= brick.y && p.y <= brick.y + brick.h) {
            hit = true
            playSound('hit')
            createParticles(p.x, p.y, brick.color, 10)
            brick.hp -= p.damage
            game.score += Math.ceil(5 * game.player.scoreMultiplier)
            setScore(game.score)
            if (brick.hp <= 0) {
              playSound('destroy')
              createParticles(brick.x + brick.w/2, brick.y + brick.h/2, brick.color, 20)
              return false
            }
          }
          return true
        })
        return !hit
      })

      game.particles = game.particles.filter((p: any) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 50 * (deltaTime / 1000)
        p.life -= deltaTime / 1000
        return p.life > 0
      })

      if (game.bricks.length === 0) {
        if (game.level >= 10) {
          setGameState(STATES.VICTORY)
        } else {
          setGameState(STATES.LEVEL_COMPLETE)
          playSound('levelup')
          generateEnhancements()
        }
      }
    }

    const draw = () => {
      const theme = LEVEL_THEMES[Math.min(game.level - 1, LEVEL_THEMES.length - 1)]
      
      ctx.fillStyle = theme.bg
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)'
      ctx.lineWidth = 1
      for (let x = 0; x < CANVAS_WIDTH; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, CANVAS_HEIGHT)
        ctx.stroke()
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(CANVAS_WIDTH, y)
        ctx.stroke()
      }

      game.bricks.forEach((brick: any) => {
        ctx.fillStyle = brick.color
        ctx.shadowColor = brick.color
        ctx.shadowBlur = 10
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h)
        ctx.shadowBlur = 0
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.strokeRect(brick.x, brick.y, brick.w, brick.h)
        
        if (brick.hp > 1) {
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 12px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(String(brick.hp), brick.x + brick.w/2, brick.y + brick.h/2 + 4)
        }
      })

      const paddleGradient = ctx.createLinearGradient(game.paddleX, 0, game.paddleX + game.player.paddleWidth, 0)
      paddleGradient.addColorStop(0, theme.accent)
      paddleGradient.addColorStop(1, theme.paddle)
      ctx.fillStyle = paddleGradient
      ctx.shadowColor = theme.paddle
      ctx.shadowBlur = 15
      ctx.fillRect(game.paddleX, CANVAS_HEIGHT - 20, game.player.paddleWidth, 20)
      ctx.shadowBlur = 0

      game.balls.forEach((ball: any) => {
        if (ball.dx === 0 && ball.dy === 0) return
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2)
        ctx.fillStyle = game.player.ballPenetrate > 0 ? '#ff00ff' : '#fff'
        ctx.shadowColor = '#00ffff'
        ctx.shadowBlur = 15
        ctx.fill()
        ctx.shadowBlur = 0
      })

      game.projectiles.forEach((p: any) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = '#ff6600'
        ctx.shadowColor = '#ff6600'
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0
      })

      game.particles.forEach((p: any) => {
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = theme.paddle
      ctx.shadowColor = theme.paddle
      ctx.shadowBlur = 10
      ctx.fillText(`关卡 ${game.level}`, 20, 30)
      ctx.fillText(`得分 ${game.score}`, 130, 30)
      
      ctx.textAlign = 'right'
      for (let i = 0; i < game.health; i++) {
        ctx.fillStyle = '#ff69b4'
        ctx.beginPath()
        ctx.arc(CANVAS_WIDTH - 20 - i * 25, 25, 10, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
    }

    let lastTime = performance.now()
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      update(deltaTime)
      draw()
      animationId = requestAnimationFrame(gameLoop)
    }

    animationId = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animationId)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('keydown', handleKeyDown)
    }
  }, [gameState, createParticles, generateEnhancements])

  return (
    <div className="brick-breaker">
      {gameState === STATES.MENU && (
        <div className="game-menu">
          <h1>🧱 砖块破坏者</h1>
          <p>经典街机游戏 - 带有Roguelike元素</p>
          <button className="start-btn" onClick={() => initGame('story')}>
            开始剧情模式
          </button>
          <button className="start-btn secondary" onClick={() => initGame('endless')}>
            无尽模式
          </button>
          <div className="menu-info">
            <span>🖱️ 鼠标移动控制挡板</span>
            <span>⌨️ 空格键发射导弹</span>
          </div>
        </div>
      )}

      {gameState === STATES.LEVEL_COMPLETE && (
        <div className="level-complete">
          <h2>🎉 第 {level} 关完成!</h2>
          <p>选择 3 个增强:</p>
          <div className="enhancement-list">
            {availableEnhancements.map((enh: any) => (
              <div
                key={enh.id}
                className={`enh-card ${selectedEnhancements.includes(enh.id) ? 'selected' : ''}`}
                onClick={() => selectEnhancement(enh.id)}
              >
                <span className="enh-icon">{enh.icon}</span>
                <span className="enh-name">{enh.name}</span>
                <span className="enh-desc">{enh.desc}</span>
              </div>
            ))}
          </div>
          <div className="enh-actions">
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

      {gameState === STATES.GAME_OVER && (
        <div className="game-over">
          <h1>💀 游戏结束</h1>
          <p>最终得分: {score}</p>
          <p>到达关卡: {level}</p>
          <button className="start-btn" onClick={() => initGame('story')}>
            重新开始
          </button>
        </div>
      )}

      {gameState === STATES.VICTORY && (
        <div className="victory">
          <h1>🏆 恭喜通关!</h1>
          <p>最终得分: {score}</p>
          <button className="start-btn" onClick={() => initGame('story')}>
            再来一局
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="game-canvas"
      />
    </div>
  )
}

export default BrickBreaker
