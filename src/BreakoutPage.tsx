import { useNavigate } from 'react-router-dom'
import RoguelikeBreakout from './RoguelikeBreakout'
import './RoguelikeBreakout.css'

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

function BreakoutPage() {
  const navigate = useNavigate()

  return (
    <div className="roguelike-breakout-container">
      <header className="game-header">
        <button className="back-btn" onClick={() => navigate('/games')}>
          <BackIcon />
          返回游戏列表
        </button>
      </header>
      <RoguelikeBreakout />
    </div>
  )
}

export default BreakoutPage
