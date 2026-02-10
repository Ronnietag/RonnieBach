import { useState, useEffect, useCallback, useRef } from 'react'
import './Snake.css'

const GRID_SIZE = 20
const SPEED = 150

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

interface Position {
  x: number
  y: number
}

function Snake() {
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ])
  const [food, setFood] = useState<Position>({ x: 15, y: 10 })
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const gameRef = useRef<HTMLDivElement>(null)

  const generateFood = useCallback((): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [snake])

  const resetGame = () => {
    setSnake([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ])
    setFood({ x: 15, y: 10 })
    setDirection('RIGHT')
    setScore(0)
    setGameOver(false)
    setGameStarted(false)
  }

  useEffect(() => {
    if (!gameStarted || gameOver) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP')
          break
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN')
          break
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT')
          break
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [direction, gameStarted, gameOver])

  useEffect(() => {
    if (!gameStarted || gameOver) return

    const gameLoop = setInterval(() => {
      setSnake(prevSnake => {
        const head = prevSnake[0]
        let newHead: Position

        switch (direction) {
          case 'UP':
            newHead = { x: head.x, y: head.y - 1 }
            break
          case 'DOWN':
            newHead = { x: head.x, y: head.y + 1 }
            break
          case 'LEFT':
            newHead = { x: head.x - 1, y: head.y }
            break
          case 'RIGHT':
            newHead = { x: head.x + 1, y: head.y }
            break
        }

        // Check wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true)
          return prevSnake
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true)
          return prevSnake
        }

        const newSnake = [newHead, ...prevSnake]

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 1)
          setFood(generateFood())
        } else {
          newSnake.pop()
        }

        return newSnake
      })
    }, SPEED)

    return () => clearInterval(gameLoop)
  }, [direction, food, gameStarted, gameOver, generateFood])

  useEffect(() => {
    // Focus game area for keyboard controls
    gameRef.current?.focus()
  }, [])

  return (
    <div className="snake-game" ref={gameRef} tabIndex={0}>
      <div className="snake-header">
        <h2>贪吃蛇</h2>
        <span className="snake-score">得分: {score}</span>
      </div>

      <div className="snake-grid">
        {Array.from({ length: GRID_SIZE }).map((_, y) => (
          <div key={y} className="snake-row">
            {Array.from({ length: GRID_SIZE }).map((_, x) => {
              const isSnake = snake.some(s => s.x === x && s.y === y)
              const isFood = food.x === x && food.y === y
              const isHead = snake[0].x === x && snake[0].y === y

              return (
                <div
                  key={x}
                  className={`snake-cell ${isSnake ? 'snake' : ''} ${isHead ? 'snake-head' : ''} ${isFood ? 'food' : ''}`}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="snake-controls">
        {!gameStarted && !gameOver && (
          <button className="start-btn" onClick={() => setGameStarted(true)}>
            开始游戏
          </button>
        )}

        {gameOver && (
          <div className="game-over">
            <h3>游戏结束</h3>
            <p>最终得分: {score}</p>
            <button className="start-btn" onClick={resetGame}>
              再玩一次
            </button>
          </div>
        )}
      </div>

      <div className="snake-instructions">
        <p>使用方向键 ↑ ↓ ← → 控制移动</p>
      </div>
    </div>
  )
}

export default Snake
