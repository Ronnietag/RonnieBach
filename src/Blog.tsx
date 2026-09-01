import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import './Blog.css'
// removed API_BASE import (config/api.ts deleted)

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

const categories = ['产品', '技术', '学习', '医药', '工具']

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
  const [comments, setComments] = useState<any[]>([])
  const [commentAuthor, setCommentAuthor] = useState('')
  const [commentContent, setCommentContent] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [showComments, setShowComments] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const res = await fetch(`/api/posts`)
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
    setComments([])
    setShowComments(false)
  }

  async function fetchComments(postId: string) {
    try {
      const res = await fetch(`/api/comments/${postId}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setComments(data)
    } catch (e: any) {
      console.error('Failed to fetch comments:', e.message)
    }
  }

  async function handleSubmitComment() {
    if (!commentContent.trim()) {
      setCommentError('评论内容不能为空')
      return
    }

    setCommentLoading(true)
    setCommentError('')

    try {
      const res = await fetch(`/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPost?._id,
          author: commentAuthor.trim() || '匿名用户',
          content: commentContent,
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setComments([data, ...comments])
      setCommentContent('')
    } catch (e: any) {
      setCommentError(e.message || '评论失败，请稍后重试')
    } finally {
      setCommentLoading(false)
    }
  }

  function toggleComments() {
    if (!showComments && selectedPost) {
      fetchComments(selectedPost._id)
    }
    setShowComments(!showComments)
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('确定要删除这条评论吗？')) return
    
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
        return
      }
      // Remove from local state
      setComments(comments.filter((c: any) => c._id !== commentId))
    } catch (e: any) {
      console.error('Delete error:', e)
      alert('删除失败: ' + e.message)
    }
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

      const res = await fetch(`/api/posts`, {
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
            <span className="back-arrow">&lt;</span>
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
                      // Code block
                      if (line.startsWith('```')) {
                        return null
                      } else if (line.trim() === '' && i > 0 && selectedPost.content!.split('\n')[i-1]?.startsWith('```')) {
                        return null
                      }
                      // Heading 2
                      if (line.startsWith('## ')) {
                        return <h2 key={i}>{line.replace('## ', '')}</h2>
                      }
                      // Heading 3
                      if (line.startsWith('### ')) {
                        return <h3 key={i}>{line.replace('### ', '')}</h3>
                      }
                      // Heading 4
                      if (line.startsWith('#### ')) {
                        return <h4 key={i}>{line.replace('#### ', '')}</h4>
                      }
                      // Blockquote
                      if (line.startsWith('> ')) {
                        return <blockquote key={i}><p>{line.replace('> ', '')}</p></blockquote>
                      }
                      // Unordered list item
                      if (line.startsWith('- ')) {
                        return <li key={i}>{line.replace('- ', '')}</li>
                      }
                      // Ordered list item
                      if (/^\d+\.\s/.test(line)) {
                        return <li key={i}>{line.replace(/^\d+\.\s/, '')}</li>
                      }
                      // Table row
                      if (line.startsWith('|') && line.includes('|')) {
                        const cells = line.split('|').filter((c: string) => c.trim())
                        const isHeader = cells.every((c: string) => c.trim().startsWith('-') || c.trim().startsWith(':'))
                        if (isHeader) return null
                        return (
                          <tr key={i}>
                            {cells.map((cell: string, j: number) => (
                              <td key={j}>{cell.trim()}</td>
                            ))}
                          </tr>
                        )
                      }
                      // Horizontal rule
                      if (line.startsWith('---')) {
                        return <hr key={i} />
                      }
                      // Inline code
                      if (line.includes('`')) {
                        const parts = line.split('`')
                        return (
                          <p key={i}>
                            {parts.map((part: string, j: number) => (
                              j % 2 === 1 ? <code key={j}>{part}</code> : part
                            ))}
                          </p>
                        )
                      }
                      // Bold text
                      if (line.includes('**')) {
                        const parts = line.split('**')
                        return (
                          <p key={i}>
                            {parts.map((part: string, j: number) => (
                              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                            ))}
                          </p>
                        )
                      }
                      // Empty line
                      if (line.trim() === '') {
                        return <br key={i} />
                      }
                      // Regular paragraph
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

        {/* Comments Section */}
        <section className="comments-section">
          <button className="comments-toggle" onClick={toggleComments}>
            💬 评论 ({comments.length})
          </button>

          {showComments && (
            <>
              <div className="comment-form">
                <input
                  type="text"
                  placeholder="你的昵称（可选）"
                  value={commentAuthor}
                  onChange={e => setCommentAuthor(e.target.value)}
                  className="comment-author"
                />
                <textarea
                  placeholder="写下你的评论..."
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  rows={3}
                  className="comment-content"
                />
                {commentError && <div className="comment-error">{commentError}</div>}
                <button 
                  className="comment-submit"
                  onClick={handleSubmitComment}
                  disabled={commentLoading}
                >
                  {commentLoading ? '提交中...' : '提交评论'}
                </button>
              </div>

              <div className="comments-list">
                {comments.length === 0 ? (
                  <p className="no-comments">暂无评论，快来抢沙发吧！</p>
                ) : (
                  comments.map((comment: any) => (
                    <div key={comment._id} className="comment">
                      <div className="comment-header">
                        <span className="comment-author">{comment.author}</span>
                        <span className="comment-date">
                          {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                        {isAdmin && (
                          <button 
                            className="comment-delete"
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            删除
                          </button>
                        )}
                      </div>
                      <p className="comment-text">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>

        <footer className="blog-footer">
          <p>© 2026 Ronnie. All rights reserved. | 辽ICP备2026003025号</p>
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
            <span className="back-arrow">&lt;</span>
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
          <span className="back-arrow">&lt;</span>
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
          <p>© 2026 Ronnie. All rights reserved. | 辽ICP备2026003025号</p>
          <p className="cyber-credit">
            Created by <span className="credit-name">Ronnie</span> | Built with <span className="credit-tech">OpenClaw</span> & <span className="credit-model">MiniMax 2.1</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Blog
