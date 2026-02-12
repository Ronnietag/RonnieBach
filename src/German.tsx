import { useState, useEffect } from 'react'
import './German.css'

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

interface Word {
  id: number
  word: string
  chinese_meaning: string
  examples?: { sentence: string; translation: string }[]
  topic_id: number
  cefr_level: string
}

interface Topic {
  id: number
  name_de: string
  name_zh: string
  order: number
}

const DEMO_USER_ID = 'demo-user'

function German() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeTopicId, setActiveTopicId] = useState<number>(0)  // Store topic_id for API filtering
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({})
  const [topics, setTopics] = useState<Topic[]>([])
  const [allWords, setAllWords] = useState<Word[]>([])  // Store all words
  const [filteredWords, setFilteredWords] = useState<Word[]>([])  // Store filtered words
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopics()
  }, [])

  // Fetch vocabulary when topic changes
  useEffect(() => {
    fetchVocabulary(activeTopicId === 0 ? undefined : activeTopicId)
  }, [activeTopicId])

  async function fetchTopics() {
    try {
      const res = await fetch('/api/german/topics')
      const data = await res.json()
      setTopics(data)
      // Topics loaded, now fetch vocabulary
      fetchVocabulary(undefined)
    } catch (e) {
      console.error('获取主题失败:', e)
      setLoading(false)
    }
  }

  async function fetchVocabulary(topicId?: number) {
    try {
      setLoading(true)
      const url = topicId ? `/api/german/vocabulary?topic_id=${topicId}` : '/api/german/vocabulary'
      const res = await fetch(url)
      const words: Word[] = await res.json()
      
      setAllWords(prev => {
        // If no filter, store all words
        if (!topicId) return words
        // If filtered, keep previous allWords and add filtered results
        return prev.length > 0 ? prev : words
      })
      
      setFilteredWords(words)
    } catch (e) {
      console.error('获取词汇失败:', e)
    } finally {
      setLoading(false)
    }
  }

  function handleCategoryClick(category: string, topicId: number) {
    setActiveCategory(category)
    setActiveTopicId(topicId)
  }

  async function handleCardClick(index: string, word: string) {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }))

    // Track learning progress
    try {
      await fetch('/api/german/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: DEMO_USER_ID, word, correct: true })
      })
    } catch (e) {
      console.error('保存学习进度失败:', e)
    }
  }

  return (
    <div className="german">
      {/* Header */}
      <header className="german-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <BackIcon />
          返回首页
        </button>
      </header>

      {/* Hero */}
      <section className="german-hero">
        <h1>德语学习</h1>
        <p>Deutsch lernen mit AI</p>
      </section>

      {/* Categories */}
      <section className="german-categories">
        <div className="category-scroll">
          <button
            className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('all', 0)}
          >
            全部
          </button>
          {topics.map((topic: Topic) => (
            <button
              key={topic.id}
              className={`category-btn ${activeCategory === topic.name_zh ? 'active' : ''}`}
              onClick={() => handleCategoryClick(topic.name_zh, topic.id)}
            >
              {topic.name_zh}
            </button>
          ))}
        </div>
      </section>

      {/* Vocabulary Cards */}
      <section className="german-cards">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>加载词汇中...</p>
          </div>
        ) : (
          <>
            {(activeCategory === 'all' ? allWords : filteredWords).map((word, index) => {
              const cardKey = `${word.word}-${index}` // Unique key per card
              return (
                <div 
                  key={cardKey} 
                  className={`german-card ${flippedCards[cardKey] ? 'flipped' : ''}`}
                  onClick={() => handleCardClick(cardKey, word.word)}
                >
                  <div className="card-front">
                    <span className="card-category">{word.cefr_level}</span>
                    <h3>{word.word}</h3>
                    <span className="card-hint">点击查看释义</span>
                  </div>
                  <div className="card-back">
                    <h3>{word.chinese_meaning}</h3>
                    {word.examples && word.examples.length > 0 && (
                      <p className="card-example">
                        {word.examples[0].sentence}<br/>
                        <span>{word.examples[0].translation}</span>
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Ronnie. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default German
