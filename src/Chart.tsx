import { useState, useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import './Chart.css'

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

interface Stats {
  posts: number
  users: number
  visits: number
  avgTime: number
}

function Chart() {
  const [stats, setStats] = useState<Stats>({
    posts: 0,
    users: 0,
    visits: 0,
    avgTime: 0
  })
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setStats(data)
      } catch (e) {
        console.error('获取统计数据失败:', e)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current)
      
      const option = {
        color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        legend: {
          data: ['访问量', '文章阅读', '注册用户'],
          top: 10,
          textStyle: { color: '#94a3b8' }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
          axisLine: { lineStyle: { color: '#475569' } },
          axisLabel: { color: '#94a3b8' }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#334155' } }
        },
        series: [
          {
            name: '访问量',
            type: 'bar',
            data: [120, 200, 150, 280, 220, 180, 140],
            itemStyle: {
              borderRadius: [4, 4, 0, 0]
            }
          },
          {
            name: '文章阅读',
            type: 'bar',
            data: [80, 150, 100, 200, 160, 120, 90],
            itemStyle: {
              borderRadius: [4, 4, 0, 0]
            }
          },
          {
            name: '注册用户',
            type: 'line',
            data: [30, 45, 38, 60, 55, 48, 42],
            smooth: true,
            lineStyle: { width: 3 },
            symbol: 'circle',
            symbolSize: 8
          }
        ]
      }
      
      chartInstance.current.setOption(option)
    }

    return () => {
      chartInstance.current?.dispose()
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="chart">
      {/* Progress Bar */}
      <div className="progress-bar"></div>

      {/* Header */}
      <header className="chart-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <BackIcon />
          返回首页
        </button>
      </header>

      {/* Hero */}
      <section className="chart-hero">
        <h1>数据报表</h1>
        <p>可视化数据分析与洞察</p>
      </section>

      {/* Stats */}
      <section className="chart-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.posts}</span>
            <span className="stat-label">文章阅读</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.visits.toLocaleString()}</span>
            <span className="stat-label">访客数量</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.avgTime}</span>
            <span className="stat-label">平均时长(分钟)</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pink">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.users}</span>
            <span className="stat-label">注册用户</span>
          </div>
        </div>
      </section>

      {/* ECharts */}
      <section className="chart-section">
        <h2>周访问趋势</h2>
        <div ref={chartRef} className="chart-container" style={{ width: '100%', height: 400 }}></div>
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

export default Chart
