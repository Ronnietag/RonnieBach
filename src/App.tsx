import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Resume from './Resume'
import Blog from './Blog'
import Chart from './Chart'
import German from './German'
import Games from './Games'
import Admin from './Admin'
import SnakePage from './SnakePage'
import BreakoutPage from './BreakoutPage'
import BrickBreakerPage from './BrickBreakerPage'

// Icons
const ArrowRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)

const ResumeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="5" fill="#4A90D9"/>
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="none" stroke="#4A90D9" strokeWidth="2" strokeLinecap="round"/>
    <rect x="6" y="12" width="4" height="2" rx="1" fill="#50C878"/>
    <rect x="14" y="12" width="4" height="2" rx="1" fill="#50C878"/>
    <rect x="10" y="15" width="4" height="2" rx="1" fill="#50C878"/>
  </svg>
)

const BlogIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <rect x="4" y="4" width="16" height="18" rx="3" fill="none" stroke="#FF6B6B" strokeWidth="2"/>
    <line x1="8" y1="10" x2="16" y2="10" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round"/>
    <line x1="8" y1="14" x2="14" y2="14" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="6" r="1.5" fill="#FFD93D"/>
  </svg>
)

const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <rect x="4" y="12" width="4" height="8" rx="1" fill="#6C5CE7"/>
    <rect x="10" y="8" width="4" height="12" rx="1" fill="#A855F7"/>
    <rect x="16" y="4" width="4" height="16" rx="1" fill="#EC4899"/>
    <line x1="3" y1="21" x2="21" y2="21" stroke="#94A3B8" strokeWidth="1"/>
  </svg>
)

const GameIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <polygon points="4,4 20,12 4,20" fill="url(#gameGradient)" stroke="none"/>
    <defs>
      <linearGradient id="gameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22D3EE"/>
        <stop offset="100%" stopColor="#8B5CF6"/>
      </linearGradient>
    </defs>
    <circle cx="9" cy="12" r="1.5" fill="white" opacity="0.9"/>
  </svg>
)

const GermanIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="3" fill="none"/>
    <rect x="2" y="2" width="20" height="7" fill="#000000"/>
    <rect x="2" y="9" width="20" height="5" fill="#DD0000"/>
    <rect x="2" y="14" width="20" height="6" fill="#FFCC00"/>
  </svg>
)

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
  </svg>
)

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

// Auth Modal Component
function AuthModal({ isOpen, onClose, mode, onSwitchMode }: { 
  isOpen: boolean
  onClose: () => void
  mode: 'login' | 'register'
  onSwitchMode: () => void
}) {
  const { login, register } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '', name: '', bio: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password)
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('两次密码输入不一致')
        }
        await register(formData.email, formData.password, formData.name, formData.bio)
      }
      onClose()
      setFormData({ email: '', password: '', name: '', bio: '', confirmPassword: '' })
    } catch (err: any) {
      setError(err.message || '操作失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <CloseIcon />
        </button>
        
        <div className="modal-header">
          <h2>{mode === 'login' ? '欢迎回来' : '创建账户'}</h2>
          <p>{mode === 'login' ? '登录你的账户' : '开始你的旅程'}</p>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>用户名</label>
              <input
                type="text"
                placeholder="请输入用户名"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label>邮箱</label>
            <input
              type="email"
              placeholder="请输入邮箱"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>密码</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                <EyeIcon />
              </button>
            </div>
          </div>
          
          {mode === 'register' && (
            <div className="form-group">
              <label>确认密码</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                />
              </div>
            </div>
          )}
          
          {mode === 'register' && (
            <div className="form-group">
              <label>介绍一下自己 <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>(选填)</span></label>
              <textarea
                placeholder="介绍一下自己..."
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                rows={3}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          )}
          
          {mode === 'login' && (
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>记住我</span>
              </label>
            </div>
          )}
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '请稍后...' : (mode === 'login' ? '登录' : '注册')}
          </button>
        </form>

        <div className="modal-footer">
          <p>
            {mode === 'login' ? '还没有账户?' : '已有账户?'}
            <button onClick={onSwitchMode}>
              {mode === 'login' ? '立即注册' : '立即登录'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// Header with User Info

function AppContent() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isExpanded, setIsExpanded] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [stats, setStats] = useState({ posts: 0, users: 0, visits: 0 })
  const heroRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const scrollThreshold = windowHeight * 0.6
      
      const progress = Math.min(scrollY / scrollThreshold, 1)
      setScrollProgress(progress)
      setIsExpanded(scrollY < 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch stats
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {})
  }, [])

  const navigate = useNavigate()
  const location = useLocation()

  if (location.pathname === '/resume' || location.pathname === '/resume/') {
    return <Resume />
  }
  
  if (location.pathname === '/blog' || location.pathname === '/blog/') {
    return <Blog />
  }
  
  if (location.pathname === '/chart' || location.pathname === '/chart/') {
    return <Chart />
  }
  
  if (location.pathname === '/german' || location.pathname === '/german/') {
    return <German />
  }
  
  if (location.pathname === '/games/snake' || location.pathname === '/games/snake/') {
    return <SnakePage />
  }
  
  if (location.pathname === '/games/breakout' || location.pathname === '/games/breakout/') {
    return <BreakoutPage />
  }
  
  if (location.pathname === '/games/brickbreaker' || location.pathname === '/games/brickbreaker/') {
    return <BrickBreakerPage />
  }
  
  if (location.pathname === '/games' || location.pathname === '/games.html' || location.pathname === '/games/') {
    return <Games />
  }
  
  if (location.pathname === '/admin' || location.pathname === '/admin/') {
    return <Admin />
  }

  return (
    <div className="app">
      {/* Progress Bar */}
      <div className="progress-bar" style={{ transform: `scaleX(${scrollProgress})` }} />

      {/* Hero Section - Collapsible */}
      <section 
        ref={heroRef}
        className={`hero ${isExpanded ? 'expanded' : 'collapsed'}`}
        style={{
          '--progress': scrollProgress,
        } as React.CSSProperties}
      >
        <div 
          className="hero-content"
          style={{
            opacity: 1 - scrollProgress * 1.5,
            transform: `translateY(${scrollProgress * -30}px) scale(${1 - scrollProgress * 0.3})`,
          } as React.CSSProperties}
        >
          <div className="hero-badge">
            <span className="dot"></span>
            <span>AI 开发者 & 使用者</span>
          </div>
          <h1 
            className="hero-title"
            style={{
              transform: `scale(${1 - scrollProgress * 0.4})`,
              transformOrigin: 'left center',
            } as React.CSSProperties}
          >
            Ronnie<span className="cursor">|</span>
          </h1>
          <p className="hero-subtitle">致力于用技术改变生活</p>
          <p className="hero-desc">
            对新技术发自内心的喜爱和好奇<br/>
            对自己产品和代码的尊重与自豪<br/>
            是技术人员从优秀走向杰出的关键因素
          </p>
          <div className="tags">
            <button className="chip">人工智能</button>
            <button className="chip">技术创新</button>
            <button className="chip">持续成长</button>
            <button className="chip">产品思维</button>
            <button className="chip">设计驱动</button>
            <button className="chip">商业智能</button>
            <button className="chip">医药数字化</button>
          </div>
        </div>
        <div 
          className="hero-visual"
          style={{
            opacity: 1 - scrollProgress * 1.2,
            transform: `translateY(${scrollProgress * 50}px) scale(${1 - scrollProgress * 0.5})`,
          } as React.CSSProperties}
        >
          <div className="avatar"></div>
        </div>
        <div 
          className="scroll-indicator"
          style={{
            opacity: Math.max(0, 1 - scrollProgress * 4),
            transform: `translateX(-50%) translateY(${scrollProgress * 20}px)`,
          } as React.CSSProperties}
        >
          <div className="mouse-icon">
            <svg viewBox="0 0 24 36" width="22" height="36">
              <rect x="4" y="4" width="16" height="28" rx="8" fill="none" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="10" r="2" fill="currentColor">
                <animate attributeName="cy" values="10;16;10" dur="1.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
          <span>探索</span>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" width="20" height="20">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </div>
      </section>

      {/* Collapsed Header (shows when scrolled) */}
      <header 
        className={`collapsed-header ${isExpanded ? 'hidden' : 'visible'}`}
        style={{
          opacity: scrollProgress,
          transform: `translateY(${Math.max(0, (scrollProgress - 0.3) * -100)}px)`,
        } as React.CSSProperties}
      >
        {/* Left - Ronnie Text */}
        <span className="header-logo-text">Ronnie</span>
        
        {/* Center - Logo Image */}
        <div className="header-center">
          <div className="header-logo"></div>
        </div>
        
        {/* Right - Menu + Auth */}
        <div className="header-right">
          {/* Menu Button */}
          <div className="menu-container">
            <button 
              className="menu-btn"
              onClick={() => setShowMenu(!showMenu)}
            >
              {showMenu ? <CloseIcon /> : <MenuIcon />}
            </button>
            
            {showMenu && (
              <div className="menu-dropdown">
                <button onClick={() => { navigate('/resume/'); setShowMenu(false); }}>介绍</button>
                <button onClick={() => { navigate('/blog'); setShowMenu(false); }}>博客</button>
                <button onClick={() => { navigate('/chart'); setShowMenu(false); }}>报表</button>
                <button onClick={() => { navigate('/german'); setShowMenu(false); }}>德语</button>
                <button onClick={() => { navigate('/games'); setShowMenu(false); }}>游戏</button>
              </div>
            )}
          </div>
          
          {/* Auth */}
          {user ? (
            <div className="user-menu">
              <button className="user-btn">
                <UserIcon />
              </button>
              <div className="user-dropdown">
                {user.role === 'admin' && (
                  <button onClick={() => navigate('/admin')}>管理后台</button>
                )}
                <button onClick={logout}>退出登录</button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <button className="btn-login" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
                登录
              </button>
              <button className="btn-register" onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}>
                注册
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Stats Bar */}
      <div 
        className="stats-bar"
        style={{
          opacity: 1 - scrollProgress * 0.5,
          transform: `translateY(${scrollProgress * 20}px) scale(${1 - scrollProgress * 0.1})`,
        } as React.CSSProperties}
      >
        <div className="stat-item">
          <div className="stat-value">10+</div>
          <div className="stat-label">年工作经验</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.posts}</div>
          <div className="stat-label">篇博客</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">100%</div>
          <div className="stat-label">代码质量</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">∞</div>
          <div className="stat-label">学习热情</div>
        </div>
      </div>

      {/* Navigation Section */}
      <section id="explore">
        <div className="section-header">
          <span className="section-label">Discover</span>
          <h2 className="section-title">探索更多</h2>
          <p className="section-subtitle">发现更多精彩内容，开启你的探索之旅</p>
        </div>

        <div className="bento">
          {/* Resume - Large Card */}
          <div 
            className="card card-large"
            onClick={() => navigate('/resume/')}
          >
            <div className="card-icon-wrapper">
              <ResumeIcon />
            </div>
            <h3 className="card-title">个人介绍</h3>
            <div className="card-arrow">
              了解更多
              <ArrowRight />
            </div>
          </div>

          {/* Blog */}
          <div 
            className="card"
            onClick={() => navigate('/blog')}
          >
            <div className="card-icon-wrapper">
              <BlogIcon />
            </div>
            <h3 className="card-title">博客</h3>
            <p className="card-desc">技术分享与思考</p>
            <div className="card-arrow">
              阅读更多
              <ArrowRight />
            </div>
          </div>

          {/* Chart */}
          <div 
            className="card"
            onClick={() => navigate('/chart')}
          >
            <div className="card-icon-wrapper">
              <ChartIcon />
            </div>
            <h3 className="card-title">数据报表</h3>
            <p className="card-desc">数据分析与可视化</p>
            <div className="card-arrow">
              查看更多
              <ArrowRight />
            </div>
          </div>

          {/* German */}
          <div 
            className="card"
            onClick={() => navigate('/german')}
          >
            <div className="card-icon-wrapper">
              <GermanIcon />
            </div>
            <h3 className="card-title">德语学习</h3>
            <p className="card-desc">Deutsch lernen</p>
            <div className="card-arrow">
              开始学习
              <ArrowRight />
            </div>
          </div>

          {/* Games */}
          <div 
            className="card"
            onClick={() => navigate('/games')}
          >
            <div className="card-icon-wrapper">
              <GameIcon />
            </div>
            <h3 className="card-title">小游戏</h3>
            <p className="card-desc">放松时刻</p>
            <div className="card-arrow">
              开始游戏
              <ArrowRight />
            </div>
          </div>
        </div>
      </section>

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

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
