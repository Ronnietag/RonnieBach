export interface BlogPost {
  id: string
  title: string
  date: string
  category: string
  summary: string
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'AI 驱动的产品设计',
    date: '2026-01-15',
    category: '产品',
    summary: '探索 AI 如何改变产品设计流程'
  },
  {
    id: '2',
    title: 'React 18 新特性详解',
    date: '2026-01-08',
    category: '技术',
    summary: '深入理解 Concurrent Features'
  },
  {
    id: '3',
    title: '德语学习心得',
    date: '2025-12-20',
    category: '学习',
    summary: '我的德语学习之路'
  },
  {
    id: '4',
    title: '数字化转型实践',
    date: '2025-12-10',
    category: '商业',
    summary: '医药行业数字化思考'
  }
]

export const blogCount = blogPosts.length
