import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import './Admin.css'

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
  </svg>
)

interface User {
  _id: string
  email: string
  name: string
  role: string
  createdAt: string
}

interface Post {
  _id: string
  title: string
  category: string
  date: string
}

interface Visit {
  _id: string
  ip: string
  date: string
  timestamp: string
  path: string
}

type Tab = 'users' | 'posts' | 'visits'

interface Stats {
  users: number
  posts: number
  visits: number
  todayVisits?: number
  uniqueToday?: number
  avgTime?: number
}

function Admin() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [stats, setStats] = useState<Stats>({ users: 0, posts: 0, visits: 0, todayVisits: 0, uniqueToday: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('Admin page - user:', user)
    if (!user) {
      setError('请先登录')
      return
    }
    if (user.role !== 'admin') {
      setError('无权访问管理后台')
      return
    }
    fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)
    try {
      // Get token from localStorage
      const savedUser = localStorage.getItem('ronnie_user')
      const token = savedUser ? JSON.parse(savedUser).id : null
      
      // Fetch all data
      const [usersRes, postsRes, statsRes, visitsRes] = await Promise.all([
        fetch('/api/admin/users', token ? { headers: { Authorization: `token-${token}` } } : {}),
        fetch('/api/posts'),
        fetch('/api/stats'),
        fetch('/api/admin/visits', token ? { headers: { Authorization: `token-${token}` } } : {})
      ])
      
      if (usersRes.status === 403) {
        setError('无权访问管理后台')
        return
      }
      
      if (usersRes.status === 401) {
        setError('请先登录')
        return
      }
      
      const usersData = await usersRes.json()
      const postsData = await postsRes.json()
      const statsData = await statsRes.json()
      const visitsData = await visitsRes.json()
      
      if (usersData.error) throw new Error(usersData.error)
      
      setUsers(usersData)
      setPosts(postsData)
      setStats(statsData)
      setVisits(visitsData)
    } catch (e: any) {
      setError(e.message || '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  async function deleteUser(id: string) {
    if (!confirm('确定要删除这个用户吗？')) return
    
    const savedUser = localStorage.getItem('ronnie_user')
    const token = savedUser ? JSON.parse(savedUser).id : null
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `token-${token}` }
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      fetchData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  async function deletePost(id: string) {
    if (!confirm('确定要删除这篇文章吗？')) return
    
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      fetchData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  async function updateUserRole(id: string, role: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      fetchData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (error) {
    return (
      <div className="admin">
        <div className="admin-error">
          <h2>🚫 {error}</h2>
          <p>请联系管理员获取权限</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin">
      {/* Header */}
      <header className="admin-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <BackIcon />
          返回首页
        </button>
        <h1>管理后台</h1>
      </header>

      {/* Stats Overview */}
      <section className="admin-stats">
        <div className="admin-stat-card">
          <span className="stat-number">{stats.users}</span>
          <span className="stat-label">用户</span>
        </div>
        <div className="admin-stat-card">
          <span className="stat-number">{posts.length}</span>
          <span className="stat-label">文章</span>
        </div>
        <div className="admin-stat-card">
          <span className="stat-number">{stats.visits.toLocaleString()}</span>
          <span className="stat-label">总访问量</span>
        </div>
        <div className="admin-stat-card">
          <span className="stat-number">{stats.todayVisits || 0}</span>
          <span className="stat-label">今日访问</span>
        </div>
        <div className="admin-stat-card">
          <span className="stat-number">{stats.uniqueToday || 0}</span>
          <span className="stat-label">今日独立IP</span>
        </div>
      </section>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          用户管理
        </button>
        <button 
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          文章管理
        </button>
        <button 
          className={`tab ${activeTab === 'visits' ? 'active' : ''}`}
          onClick={() => setActiveTab('visits')}
        >
          访问记录
        </button>
      </div>

      {/* Content */}
      <section className="admin-content">
        {loading ? (
          <p className="loading">加载中...</p>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>用户名</th>
                      <th>邮箱</th>
                      <th>角色</th>
                      <th>注册时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <select 
                            value={user.role}
                            onChange={(e) => updateUserRole(user._id, e.target.value)}
                          >
                            <option value="user">普通用户</option>
                            <option value="admin">管理员</option>
                          </select>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="delete-btn"
                            onClick={() => deleteUser(user._id)}
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>标题</th>
                      <th>分类</th>
                      <th>发布时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(post => (
                      <tr key={post._id}>
                        <td>{post.title}</td>
                        <td><span className="category-tag">{post.category}</span></td>
                        <td>{post.date}</td>
                        <td>
                          <button 
                            className="delete-btn"
                            onClick={() => deletePost(post._id)}
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'visits' && (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>IP地址</th>
                      <th>访问时间</th>
                      <th>访问页面</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map(visit => (
                      <tr key={visit._id}>
                        <td><code className="ip-code">{visit.ip}</code></td>
                        <td>{new Date(visit.timestamp).toLocaleString()}</td>
                        <td><code className="path-code">{visit.path}</code></td>
                      </tr>
                    ))}
                    {visits.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                          暂无访问记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
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
    </div>
  )
}

export default Admin
