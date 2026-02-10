// @ts-nocheck
import { useEffect, useRef, useCallback, useReducer, useState } from 'react'
import './Games.css'

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

interface Score {
  _id: string
  userName: string
  score: number
  game: string
  date: string
}

function Breakout() {
  const canvasRef = useRef(null)
  const scoreRef = useRef(0)
  const livesRef = useRef(3)
  const gameOverRef = useRef(false)
  const gameStartedRef = useRef(false)
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  const [leaderboard, setLeaderboard] = useState<Score[]>([])
  
  const animationRef = useRef(null)
  const paddleRef = useRef({ x: 150, width: 100, height: 15 })
  const ballRef = useRef({ x: 200, y: 300, dx: 4, dy: -4, radius: 8 })
  const bricksRef = useRef([])
  const keysRef = useRef({ left: false, right: false })
  const gameLoopRef = useRef(false)

  // Fetch leaderboard
  useEffect(() => {
    async function fetchScores() {
      try {
        const res = await fetch('/api/scores')
        const data = await res.json()
        setLeaderboard(data)
      } catch (e) {
        console.error('获取排行榜失败:', e)
      }
    }
    fetchScores()
  }, [])

  // Submit score
  async function submitScore(score: number) {
    if (score <= 0) return
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'anonymous',
          userName: 'Guest',
          score,
          game: 'breakout'
        })
      })
      // Refresh leaderboard
      const res = await fetch('/api/scores')
      const data = await res.json()
      setLeaderboard(data)
    } catch (e) {
      console.error('提交分数失败:', e)
    }
  }

  const initBricks = useCallback(() => {
    const bricks = []
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 8; col++) {
        bricks.push({
          x: 60 + col * 55,
          y: 80 + row * 30,
          width: 50,
          height: 20,
          visible: true,
          color: colors[row % colors.length]
        })
      }
    }
    bricksRef.current = bricks
  }, [])

  const resetBall = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    ballRef.current = {
      x: canvas.width / 2,
      y: canvas.height - 50,
      dx: 4 * (Math.random() > 0.5 ? 1 : -1),
      dy: -4,
      radius: 8
    }
  }, [])

  const startGame = useCallback(() => {
    gameOverRef.current = false
    scoreRef.current = 0
    livesRef.current = 3
    gameStartedRef.current = true
    paddleRef.current = { x: 150, width: 100, height: 15 }
    resetBall()
    initBricks()
    forceUpdate()
  }, [initBricks, resetBall])

  useEffect(() => {
    initBricks()
  }, [initBricks])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = true
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = true
    }
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (!gameStartedRef.current || gameOverRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    gameLoopRef.current = true

    const animate = () => {
      if (!gameLoopRef.current) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw background
      ctx.fillStyle = '#FAFAFA'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw bricks
      bricksRef.current.forEach(brick => {
        if (brick.visible) {
          ctx.fillStyle = brick.color
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
        }
      })

      // Draw paddle
      const paddle = paddleRef.current
      ctx.fillStyle = '#5C5CAA'
      ctx.fillRect(paddle.x, canvas.height - 40, paddle.width, paddle.height)

      // Draw ball
      const ball = ballRef.current
      ctx.fillStyle = '#E8B86D'
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fill()

      // Move paddle
      if (keysRef.current.left && paddle.x > 0) {
        paddle.x -= 7
      }
      if (keysRef.current.right && paddle.x < canvas.width - paddle.width) {
        paddle.x += 7
      }

      // Move ball
      ball.x += ball.dx
      ball.y += ball.dy

      // Ball collision with walls
      if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.dx = -ball.dx
      }
      if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy
      }

      // Ball collision with paddle
      if (
        ball.y + ball.radius > canvas.height - 40 &&
        ball.y + ball.radius < canvas.height - 30 &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
      ) {
        ball.dy = -Math.abs(ball.dy) * 1.02
        const hitPos = (ball.x - paddle.x) / paddle.width
        ball.dx = (hitPos - 0.5) * 10
      }

      // Ball fell out
      if (ball.y + ball.radius > canvas.height) {
        if (livesRef.current > 1) {
          livesRef.current--
          forceUpdate()
          resetBall()
        } else {
          gameOverRef.current = true
          gameLoopRef.current = false
          submitScore(scoreRef.current)
          forceUpdate()
        }
      }

      // Ball collision with bricks
      let hitBrick = false
      bricksRef.current.forEach(brick => {
        if (brick.visible) {
          if (
            ball.x > brick.x &&
            ball.x < brick.x + brick.width &&
            ball.y - ball.radius < brick.y + brick.height &&
            ball.y + ball.radius > brick.y
          ) {
            brick.visible = false
            ball.dy = -ball.dy
            hitBrick = true
          }
        }
      })
      if (hitBrick) {
        scoreRef.current += 10
        forceUpdate()
      }

      // Check win
      if (bricksRef.current.every(b => !b.visible)) {
        gameOverRef.current = true
        gameLoopRef.current = false
        submitScore(scoreRef.current)
        forceUpdate()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      gameLoopRef.current = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [resetBall])

  return (
    <div className="games">
      <div className="progress-bar"></div>

      <header className="games-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <BackIcon />
          返回首页
        </button>
        <div className="games-score">
          <span>得分: {scoreRef.current}</span>
          <span>生命: {'❤️'.repeat(livesRef.current)}</span>
        </div>
      </header>

      <section className="games-area">
        {!gameStartedRef.current ? (
          <div className="game-start">
            <h2>打砖块</h2>
            <p>使用 ← → 方向键或 A/D 键移动挡板</p>
            <button className="start-btn" onClick={startGame}>
              开始游戏
            </button>
            
            {/* Leaderboard */}
            <div className="leaderboard">
              <h3>排行榜</h3>
              {leaderboard.length === 0 ? (
                <p className="empty">暂无分数</p>
              ) : (
                <ol>
                  {leaderboard.slice(0, 5).map((s, i) => (
                    <li key={i}>
                      <span>{s.userName}</span>
                      <span>{s.score} 分</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        ) : gameOverRef.current ? (
          <div className="game-over">
            <h2>{scoreRef.current > 0 && bricksRef.current.every(b => !b.visible) ? '🎉 恭喜通关!' : '游戏结束'}</h2>
            <p>最终得分: {scoreRef.current}</p>
            <button className="start-btn" onClick={startGame}>
              再玩一次
            </button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={500}
            height={400}
            className="game-canvas"
          />
        )}
      </section>

      <footer className="games-footer">
        <p>© 2026 Ronnie. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Breakout
