import { useNavigate } from 'react-router-dom'
import Snake from './Snake'
import './GameDetail.css'

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

function SnakePage() {
  const navigate = useNavigate()

  return (
    <div className="game-detail">
      <header className="game-detail-header">
        <button className="back-btn" onClick={() => navigate('/games')}>
          <BackIcon />
          返回游戏列表
        </button>
      </header>

      <Snake />
    </div>
  )
}

export default SnakePage
