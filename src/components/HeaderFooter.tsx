import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Icons
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12h18M3 6h18M3 18h18"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="5"/>
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
  </svg>
)

interface HeaderProps {
  showMenu?: boolean
  setShowMenu?: (show: boolean) => void
  user?: { email: string; role: string } | null
  onLogout?: () => void
}

export function Header({ showMenu: propShowMenu, setShowMenu: propSetShowMenu, user, onLogout }: HeaderProps) {
  const navigate = useNavigate()
  const [localShowMenu, setLocalShowMenu] = useState(false)
  const [localUser, setLocalUser] = useState(user)
  
  const showMenu = propShowMenu !== undefined ? propShowMenu : localShowMenu
  const setShowMenu = propSetShowMenu || setLocalShowMenu

  useEffect(() => {
    if (user === undefined && !localUser) {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data.email) setLocalUser(data)
        })
        .catch(() => {})
    }
  }, [user])

  const currentUser = user !== undefined ? user : localUser
  const handleLogout = () => {
    fetch('/api/auth/logout')
    if (onLogout) {
      onLogout()
    } else {
      window.location.reload()
    }
  }

  return (
    <header className="collapsed-header">
      <span className="header-logo-text">Ronnie</span>
      
      <div className="header-center">
        <div className="header-logo"></div>
      </div>
      
      <div className="header-right">
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
        
        {currentUser ? (
          <div className="user-menu">
            <button className="user-btn">
              <UserIcon />
            </button>
            <div className="user-dropdown">
              {currentUser.role === 'admin' && (
                <>
                  <button onClick={() => navigate('/admin/config')}>提示词配置</button>
                  <button onClick={() => navigate('/admin')}>管理后台</button>
                </>
              )}
              <button onClick={handleLogout}>退出登录</button>
            </div>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="btn-login" onClick={() => navigate('/login')}>
              登录
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export function Footer() {
  return (
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
  )
}
