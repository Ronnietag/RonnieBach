import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './Games.css'

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const ArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
)

const ArrowRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6"/>
  </svg>
)

interface GameCardData {
  id: string
  name: string
  icon: string
  gradient: string
  desc: string
}

const gameCards: GameCardData[] = [
  {
    id: 'breakout',
    name: '打砖块',
    icon: '🎮',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    desc: '经典打砖块游戏，击碎所有砖块！'
  },
  {
    id: 'snake',
    name: '贪吃蛇',
    icon: '🐍',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    desc: '控制贪吃蛇吃到食物，越长越高分！'
  }
]

const Dots = ({ total, active, onClick }: { total: number; active: number; onClick: (index: number) => void }) => (
  <div className="game-dots">
    {Array.from({ length: total }).map((_, idx) => (
      <button
        key={idx}
        className={`dot ${idx === active ? 'active' : ''}`}
        onClick={() => onClick(idx)}
      />
    ))}
  </div>
)

function Games() {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)

  const scrollToGame = useCallback((index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.offsetWidth
      scrollRef.current.scrollTo({
        left: cardWidth * index,
        behavior: 'smooth'
      })
      setCurrentIndex(index)
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft
      const cardWidth = scrollRef.current.offsetWidth
      const newIndex = Math.round(scrollLeft / cardWidth)
      setCurrentIndex(newIndex)
    }
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    if (isAutoPlay) {
      interval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % gameCards.length
        scrollToGame(nextIndex)
      }, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [currentIndex, isAutoPlay, scrollToGame, gameCards.length])

  return (
    <div className="games">
      {/* Progress Bar */}
      <div className="progress-bar"></div>

      {/* Header */}
      <header className="games-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <BackIcon />
          返回首页
        </button>

        <div className="games-autoplay">
          <button
            className={`autoplay-btn ${isAutoPlay ? 'active' : ''}`}
            onClick={() => setIsAutoPlay(!isAutoPlay)}
          >
            {isAutoPlay ? '⏸️ 暂停' : '▶️ 播放'}
          </button>
        </div>
      </header>

      {/* Game Cards */}
      <div
        ref={scrollRef}
        className="games-carousel"
        onScroll={handleScroll}
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
      >
        {gameCards.map((game) => (
          <div
            key={game.id}
            className="game-card"
            onClick={() => navigate(`/games/${game.id}`)}
          >
            <div className="game-card-inner" style={{ background: game.gradient }}>
              <div className="game-card-content">
                <div className="game-icon">{game.icon}</div>
                <h2>{game.name}</h2>
                <p>{game.desc}</p>
                <span className="play-hint">点击开始 →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="games-nav">
        <button
          className="nav-btn"
          onClick={() => scrollToGame(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          <ArrowLeft />
        </button>

        <Dots total={gameCards.length} active={currentIndex} onClick={scrollToGame} />

        <button
          className="nav-btn"
          onClick={() => scrollToGame(Math.min(gameCards.length - 1, currentIndex + 1))}
          disabled={currentIndex === gameCards.length - 1}
        >
          <ArrowRight />
        </button>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-logo-center">
          <div className="footer-logo"></div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Ronnie. All rights reserved.</p>
          <p className="cyber-credit">
            Created by <span className="credit-name">Ronnie</span> | Built with <span className="credit-tech">OpenClaw</span> & <span className="credit-model">MiniMax 2.1</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Games
