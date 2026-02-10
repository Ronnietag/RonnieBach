import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Resume.css'

// Icons
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const SkillIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
)

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

interface Skill {
  category: string
  items: string[]
}

function Resume() {
  const [activeTab, setActiveTab] = useState<'skills'>('skills')

  const skills: Skill[] = [
    {
      category: 'AI & 技术',
      items: ['机器学习', 'Python', 'SQL', '数据分析']
    },
    {
      category: '数据分析',
      items: ['BI 报表', '数据可视化', '业务分析', '洞察发现']
    },
    {
      category: '工具',
      items: ['Excel', 'Power BI', 'Tableau', 'Python']
    },
    {
      category: '语言',
      items: ['中文', '德语', '英语']
    }
  ]

  const navigate = useNavigate()

  return (
    <div className="resume">
      {/* Progress Bar */}
      <div className="progress-bar"></div>

      {/* Header */}
      <header className="resume-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <BackIcon />
          返回首页
        </button>
      </header>

      {/* Profile Section */}
      <section className="profile-section">
        <div className="profile-avatar"></div>
        <div className="profile-info">
          <h1>Ronnie</h1>
          <h2>BI Data Analyst</h2>
          <div className="profile-tags">
            <span className="profile-tag">数据分析</span>
            <span className="profile-tag">商业智能</span>
            <span className="profile-tag">技术创新</span>
          </div>
          <div className="contact-info">
            <span><LocationIcon /> 沈阳</span>
            <span><MailIcon /> libra4646@live.com</span>
          </div>
        </div>
      </section>

      {/* Summary Section */}
      <section className="resume-section">
        <div className="summary-section">
          <h3>关于我</h3>
          <p>
            热爱探索新技术，专注于数据驱动的商业洞察。擅长将数据分析与业务需求结合，
            为企业决策提供有力支持。持续学习，不断成长。
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="resume-section">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            <SkillIcon /> 技能专长
          </button>
        </div>
      </section>

      {/* Tab Content */}
      <section className="resume-section">
        <div className="tab-content">
          {activeTab === 'skills' && (
            <div className="skills-grid">
              {skills.map((skill, index) => (
                <div key={index} className="skill-category">
                  <h4>{skill.category}</h4>
                  <div className="skill-tags">
                    {skill.items.map((item, i) => (
                      <span key={i} className="skill-tag">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
    </div>
  )
}

export default Resume
