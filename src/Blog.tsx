import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import './Blog.css'

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)

interface BlogPost {
  _id: string
  title: string
  date: string
  category: string
  summary: string
  content?: string
}

const categories = ['产品', '技术', '学习', '商业', '工具']

function Blog() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [activeCategory, setActiveCategory] = useState('全部')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editorTitle, setEditorTitle] = useState('')
  const [editorCategory, setEditorCategory] = useState('产品')
  const [editorContent, setEditorContent] = useState('')
  const [editorLoading, setEditorLoading] = useState(false)
  const [editorError, setEditorError] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const res = await fetch('/api/posts')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPosts(data)
    } catch (e: any) {
      setError(e.message || '获取文章失败')
    } finally {
      setLoading(false)
    }
  }

  async function handlePostClick(post: BlogPost) {
    if (post.content) {
      setSelectedPost(post)
      return
    }
    
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/posts/${post._id}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSelectedPost(data)
    } catch (e: any) {
      setError(e.message || '获取文章详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  function handleBack() {
    setSelectedPost(null)
  }

  async function handleSubmitPost() {
    if (!editorTitle.trim() || !editorContent.trim()) {
      setEditorError('标题和内容不能为空')
      return
    }

    setEditorLoading(true)
    setEditorError('')

    try {
      // Get user from localStorage (same as AuthContext)
      const savedUser = localStorage.getItem('ronnie_user')
      const user = savedUser ? JSON.parse(savedUser) : null
      
      if (!user) {
        setEditorError('请先登录')
        setEditorLoading(false)
        return
      }

      const token = localStorage.getItem('ronnie_token') || `token-${user.id}`

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({
          title: editorTitle,
          category: editorCategory,
          content: editorContent,
        }),
      })

      const data = await res.json()
      
      if (data.error) {
        if (data.error.includes('管理员')) {
          setEditorError('只有管理员可以发布文章')
        } else {
          setEditorError(data.error)
        }
        setEditorLoading(false)
        return
      }

      // Refresh posts and close editor
      await fetchPosts()
      setShowEditor(false)
      setEditorTitle('')
      setEditorCategory('产品')
      setEditorContent('')
    } catch (e: any) {
      setEditorError('发布失败，请稍后重试')
    } finally {
      setEditorLoading(false)
    }
  }

  // Prevent copy/paste shortcuts
  function handleCopy(e: React.ClipboardEvent) {
    e.preventDefault()
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
  }

  const filteredPosts = activeCategory === '全部' 
    ? posts 
    : posts.filter(post => post.category === activeCategory)

  const isAdmin = user?.role === 'admin'

  // Article Detail View
  if (selectedPost) {
    return (
      <div className="blog">
        <div className="progress-bar"></div>
        
        <header className="blog-header">
          <button className="back-btn" onClick={handleBack}>
            <BackIcon />
            返回列表
          </button>
        </header>

        <article 
          className="blog-detail"
          onCopy={handleCopy}
          onContextMenu={handleContextMenu}
        >
          {detailLoading ? (
            <p className="loading">加载中...</p>
          ) : (
            <>
              <header className="blog-detail-header">
                <span className="blog-category">{selectedPost.category}</span>
                <span className="blog-date">{selectedPost.date}</span>
                <h1>{selectedPost.title}</h1>
              </header>
              
              <div className="blog-detail-content">
                {selectedPost.content ? (
                  <div className="markdown-content">
                    {selectedPost.content.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) {
                        return <h2 key={i}>{line.replace('## ', '')}</h2>
                      } else if (line.startsWith('- **')) {
                        const match = line.match(/- \*\*(.+?)\*\*(.*)/)
                        if (match) {
                          return (
                            <li key={i}>
                              <strong>{match[1]}</strong>{match[2]}
                            </li>
                          )
                        }
                      } else if (line.startsWith('- ')) {
                        return <li key={i}>{line.replace('- ', '')}</li>
                      } else if (line.startsWith('1. ')) {
                        return <li key={i}>{line.replace('1. ', '')}</li>
                      } else if (line.trim() === '') {
                        return <br key={i} />
                      }
                      return <p key={i}>{line}</p>
                    })}
                  </div>
                ) : (
                  <p>{selectedPost.summary}</p>
                )}
              </div>
            </>
          )}
        </article>

        <footer className="blog-footer">
          <p>© 2026 Ronnie. All rights reserved.</p>
        </footer>
      </div>
    )
  }

  // Blog Editor Modal
  if (showEditor) {
    return (
      <div className="blog">
        <div className="progress-bar"></div>
        
        <header className="blog-header">
          <button className="back-btn" onClick={() => setShowEditor(false)}>
            <BackIcon />
            返回列表
          </button>
          <h2>撰写文章</h2>
        </header>

        <div className="blog-editor">
          {editorError && <div className="editor-error">{editorError}</div>}
          
          <div className="editor-group">
            <label>标题</label>
            <input
              type="text"
              placeholder="输入文章标题..."
              value={editorTitle}
              onChange={e => setEditorTitle(e.target.value)}
            />
          </div>

          <div className="editor-group">
            <label>分类</label>
            <div className="editor-categories">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`category-btn ${editorCategory === cat ? 'active' : ''}`}
                  onClick={() => setEditorCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="editor-group">
            <label>内容 (支持 Markdown)</label>
            <textarea
              placeholder="输入文章内容..."
              value={editorContent}
              onChange={e => setEditorContent(e.target.value)}
              rows={20}
            />
          </div>

          <div className="editor-actions">
            <button 
              className="cancel-btn" 
              onClick={() => setShowEditor(false)}
            >
              取消
            </button>
            <button 
              className="submit-btn" 
              onClick={handleSubmitPost}
              disabled={editorLoading}
            >
              {editorLoading ? '发布中...' : '发布文章'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Post List View
  return (
    <div className="blog">
      {/* Progress Bar */}
      <div className="progress-bar"></div>

      {/* Header */}
      <header className="blog-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <BackIcon />
          返回首页
        </button>
        {isAdmin && (
          <button className="write-btn" onClick={() => setShowEditor(true)}>
            <PlusIcon />
            写文章
          </button>
        )}
      </header>

      {/* Hero */}
      <section className="blog-hero">
        <h1>博客文章</h1>
        <p>分享产品、技术与生活的思考</p>
      </section>

      {/* Categories */}
      <section className="blog-categories">
        <button
          className={`category-btn ${activeCategory === '全部' ? 'active' : ''}`}
          onClick={() => setActiveCategory('全部')}
        >
          全部
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Posts */}
      <section className="blog-posts">
        {loading && <p className="loading">加载中...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && filteredPosts.length === 0 && (
          <p className="empty">暂无文章</p>
        )}
        {filteredPosts.map(post => (
          <article 
            key={post._id} 
            className="blog-card"
            onClick={() => handlePostClick(post)}
            style={{ cursor: 'pointer' }}
          >
            <div className="blog-meta">
              <span className="blog-category">{post.category}</span>
              <span className="blog-date">{post.date}</span>
            </div>
            <h2>{post.title}</h2>
            <p>{post.summary}</p>
            <span className="read-more">阅读全文 →</span>
          </article>
        ))}
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

export default Blog
