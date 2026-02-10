import { useState, useEffect } from 'react'
import './German.css'

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

interface WordCard {
  german: string
  chinese: string
  example?: string
  category: string
}

interface Progress {
  words: Record<string, number>
  lastStudy: string | null
  streak: number
}

const vocabulary: Record<string, WordCard[]> = {
  'Greetings': [
    { german: 'Guten Tag', chinese: '你好', example: 'Guten Tag, wie geht es Ihnen?', category: 'Greetings' },
    { german: 'Hallo', chinese: '哈喽', example: 'Hallo, schön dich kennenzulernen!', category: 'Greetings' },
    { german: 'Auf Wiedersehen', chinese: '再见', example: 'Auf Wiedersehen, bis morgen!', category: 'Greetings' },
    { german: 'Danke', chinese: '谢谢', example: 'Vielen Dank für Ihre Hilfe!', category: 'Greetings' },
    { german: 'Bitte', chinese: '请/不客气', example: 'Bitte schön!', category: 'Greetings' },
    { german: 'Ja', chinese: '是', example: 'Ja, das ist richtig.', category: 'Greetings' },
    { german: 'Nein', chinese: '否/不是', example: 'Nein, danke.', category: 'Greetings' }
  ],
  'Basics': [
    { german: 'Guten Morgen', chinese: '早上好', example: 'Guten Morgen!', category: 'Basics' },
    { german: 'Guten Abend', chinese: '晚上好', example: 'Guten Abend!', category: 'Basics' },
    { german: 'Gute Nacht', chinese: '晚安', example: 'Gute Nacht!', category: 'Basics' }
  ],
  'Numbers': [
    { german: 'Eins', chinese: '一', example: 'Ich habe eins, zwei, drei.', category: 'Numbers' },
    { german: 'Zwei', chinese: '二', example: 'Zwei Äpfel, bitte.', category: 'Numbers' },
    { german: 'Drei', chinese: '三', category: 'Numbers' },
    { german: 'Vier', chinese: '四', category: 'Numbers' },
    { german: 'Fünf', chinese: '五', category: 'Numbers' },
    { german: 'Sechs', chinese: '六', category: 'Numbers' },
    { german: 'Sieben', chinese: '七', category: 'Numbers' },
    { german: 'Acht', chinese: '八', category: 'Numbers' },
    { german: 'Neun', chinese: '九', category: 'Numbers' },
    { german: 'Zehn', chinese: '十', category: 'Numbers' }
  ],
  'Food': [
    { german: 'Wasser', chinese: '水', example: 'Ein Glas Wasser, bitte.', category: 'Food' },
    { german: 'Brot', chinese: '面包', example: 'Ich möchte Brot kaufen.', category: 'Food' },
    { german: 'Kaffee', chinese: '咖啡', example: 'Ein Kaffee, bitte.', category: 'Food' },
    { german: 'Apfel', chinese: '苹果', example: 'Ein roter Apfel.', category: 'Food' },
    { german: 'Milch', chinese: '牛奶', example: 'Milch ist gesund.', category: 'Food' }
  ]
}

const categories = ['Greetings', 'Basics', 'Numbers', 'Food']

// Demo user ID for local development
const DEMO_USER_ID = 'demo-user'

function German() {
  const [activeCategory, setActiveCategory] = useState('Greetings')
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({})
  const [progress, setProgress] = useState<Progress>({ words: {}, lastStudy: null, streak: 0 })

  useEffect(() => {
    fetchProgress()
  }, [])

  async function fetchProgress() {
    try {
      const res = await fetch(`/api/german/progress/${DEMO_USER_ID}`)
      const data = await res.json()
      setProgress(data)
    } catch (e) {
      console.error('获取学习进度失败:', e)
    }
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
      fetchProgress()
    } catch (e) {
      console.error('保存学习进度失败:', e)
    }
  }

  function getStudyCount(word: string): number {
    return progress.words?.[word] || 0
  }

  return (
    <div className="german">
      {/* Progress Bar */}
      <div className="progress-bar"></div>

      {/* Header */}
      <header className="german-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <BackIcon />
          返回首页
        </button>
        <div className="german-progress">
          <span>学习天数: {progress.streak || 1}</span>
          <span>已学: {Object.keys(progress.words || {}).length} 个词</span>
        </div>
      </header>

      {/* Hero */}
      <section className="german-hero">
        <h1>德语学习</h1>
        <p>Deutsch lernen mit AI</p>
      </section>

      {/* Categories */}
      <section className="german-categories">
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

      {/* Vocabulary Cards */}
      <section className="german-cards">
        {vocabulary[activeCategory]?.map((word, index) => {
          const cardKey = `${activeCategory}-${index}`
          const studyCount = getStudyCount(word.german)
          return (
            <div 
              key={index} 
              className={`german-card ${flippedCards[cardKey] ? 'flipped' : ''} ${studyCount > 0 ? 'studied' : ''}`}
              onClick={() => handleCardClick(cardKey, word.german)}
            >
              <div className="card-front">
                <span className="card-category">{word.category}</span>
                <h3>{word.german}</h3>
                <span className="card-hint">点击查看释义</span>
                {studyCount > 0 && <span className="card-count">已学 {studyCount} 次</span>}
              </div>
              <div className="card-back">
                <h3>{word.chinese}</h3>
                {word.example && <p className="card-example">{word.example}</p>}
              </div>
            </div>
          )
        })}
      </section>

      {/* Footer */}
      <footer className="german-footer">
        <p>© 2026 Ronnie. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default German
