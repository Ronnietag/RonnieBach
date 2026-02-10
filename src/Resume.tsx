import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Resume.css'

// Icons
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const WorkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
  </svg>
)

const EducationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
)

const SkillIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
)

const ProjectIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
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

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
  </svg>
)

interface Experience {
  company: string
  position: string
  period: string
  description: string[]
}

interface Education {
  school: string
  degree: string
  period: string
}

interface Skill {
  category: string
  items: string[]
}

interface Project {
  name: string
  role: string
  period: string
  description: string[]
}

function Resume() {
  const [activeTab, setActiveTab] = useState<'experience' | 'education' | 'skills' | 'projects'>('experience')

  const experiences: Experience[] = [
    {
      company: '某科技公司',
      position: 'AI 产品经理',
      period: '2020 - 至今',
      description: [
        '负责 AI 驱动的产品规划和设计',
        '带领团队完成多个 AI 应用项目',
        '推动产品数字化转型，提升用户体验'
      ]
    },
    {
      company: '某互联网公司',
      position: '产品经理',
      period: '2018 - 2020',
      description: [
        '负责移动端产品迭代',
        '数据分析驱动产品决策',
        '跨部门协作推进项目落地'
      ]
    }
  ]

  const education: Education[] = [
    {
      school: '某大学',
      degree: '本科',
      period: '2014 - 2018'
    }
  ]

  const skills: Skill[] = [
    {
      category: 'AI & 技术',
      items: ['AI 产品设计', '机器学习基础', 'Python', '数据分析']
    },
    {
      category: '产品',
      items: ['产品规划', '需求分析', '用户研究', '竞品分析']
    },
    {
      category: '工具',
      items: ['Figma', 'Axure', 'Notion', 'SQL']
    },
    {
      category: '语言',
      items: ['中文', '德语', '英语']
    }
  ]

  const projects: Project[] = [
    {
      name: 'AI 助手应用',
      role: '产品负责人',
      period: '2023',
      description: [
        '设计并上线 AI 驱动的个人助理产品',
        '用户增长 200%，获得行业奖项'
      ]
    },
    {
      name: '医药数字化平台',
      role: '产品经理',
      period: '2022',
      description: [
        '为医药行业定制数字化解决方案',
        '提升企业内部效率 40%'
      ]
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
          <h2>AI 产品经理 & 创造者</h2>
          <div className="profile-tags">
            <span className="profile-tag">人工智能</span>
            <span className="profile-tag">产品设计</span>
            <span className="profile-tag">技术创新</span>
            <span className="profile-tag">持续成长</span>
          </div>
          <div className="contact-info">
            <span><LocationIcon /> 北京</span>
            <span><MailIcon /> ronnie@example.com</span>
            <span><PhoneIcon /> +86 19512244066</span>
          </div>
        </div>
      </section>

      {/* Summary Section */}
      <section className="resume-section">
        <div className="summary-section">
          <h3>关于我</h3>
          <p>
            热爱探索新技术，专注于 AI 应用开发与创新。10+ 年工作经验，
            擅长将 AI 技术与产品设计结合，创造有价值的产品体验。
            相信科技可以让生活更美好，让世界更简单。
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="resume-section">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'experience' ? 'active' : ''}`}
            onClick={() => setActiveTab('experience')}
          >
            <WorkIcon /> 工作经验
          </button>
          <button 
            className={`tab ${activeTab === 'education' ? 'active' : ''}`}
            onClick={() => setActiveTab('education')}
          >
            <EducationIcon /> 教育背景
          </button>
          <button 
            className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            <SkillIcon /> 技能专长
          </button>
          <button 
            className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <ProjectIcon /> 项目经验
          </button>
        </div>
      </section>

      {/* Tab Content */}
      <section className="resume-section">
        <div className="tab-content">
          {activeTab === 'experience' && (
            <div className="experience-list">
              {experiences.map((exp, index) => (
                <div key={index} className="experience-card">
                  <div className="exp-header">
                    <h4>{exp.position}</h4>
                    <span className="period">{exp.period}</span>
                  </div>
                  <h5>{exp.company}</h5>
                  <ul>
                    {exp.description.map((desc, i) => (
                      <li key={i}>{desc}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'education' && (
            <div className="education-list">
              {education.map((edu, index) => (
                <div key={index} className="education-card">
                  <div className="edu-info">
                    <h4>{edu.school}</h4>
                    <h5>{edu.degree}</h5>
                  </div>
                  <span className="edu-period">{edu.period}</span>
                </div>
              ))}
            </div>
          )}

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

          {activeTab === 'projects' && (
            <div className="projects-list">
              {projects.map((project, index) => (
                <div key={index} className="project-card">
                  <div className="project-header">
                    <h4>{project.name}</h4>
                    <span className="period">{project.period}</span>
                  </div>
                  <h5>{project.role}</h5>
                  <ul>
                    {project.description.map((desc, i) => (
                      <li key={i}>{desc}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="resume-footer">
        <p>© 2026 Ronnie. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Resume
