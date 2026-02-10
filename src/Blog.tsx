import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Blog.css'

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
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

const categories = ['全部', '产品', '技术', '学习', '商业', '工具']

function Blog() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [activeCategory, setActiveCategory] = useState('全部')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

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
    // If full content is already in the list, show it directly
    if (post.content) {
      setSelectedPost(post)
      return
    }
    
    // Otherwise fetch from API
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
      </header>

      {/* Hero */}
      <section className="blog-hero">
        <h1>博客文章</h1>
        <p>分享产品、技术与生活的思考</p>
      </section>

      {/* Categories */}
      <section className="blog-categories">
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
      <footer className="blog-footer">
        <p>© 2026 Ronnie. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Blog
