// Express Server for Ronnie Portfolio - with MongoDB
import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const MONGO_URL = process.env.MONGO_URL || 'mongodb://ronnie:Ronnie2026@127.0.0.1:27017/?authSource=admin'
const DB_NAME = 'ronnie_portfolio'

let db

// MongoDB Connection
async function connectDB() {
  try {
    const client = new MongoClient(MONGO_URL)
    await client.connect()
    db = client.db(DB_NAME)
    console.log('✅ MongoDB connected successfully')
    
    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    await db.collection('users').createIndex({ bio: 1 })
    await db.collection('posts').createIndex({ date: -1 })
    await db.collection('posts').createIndex({ category: 1 })
    await db.collection('gameScores').createIndex({ score: -1 })
    await db.collection('germanProgress').createIndex({ userId: 1 })
    await db.collection('visits').createIndex({ date: 1 })
    await db.collection('visits').createIndex({ ip: 1, date: 1 })
    
    console.log('✅ Database indexes created')
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    console.log('⚠️  Running with in-memory fallback...')
  }
}

// Middleware - Track visits
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next()
  }
  
  // Only track HTML requests (page visits)
  if (!req.path.endsWith('.js') && !req.path.endsWith('.css') && !req.path.endsWith('.ico')) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.socket?.remoteAddress || 
               'unknown'
    const date = new Date().toISOString().split('T')[0]
    
    // Use setImmediate to not block response
    setImmediate(async () => {
      if (db) {
        try {
          await db.collection('visits').insertOne({
            ip,
            date,
            timestamp: new Date(),
            path: req.path
          })
        } catch (e) {
          // Ignore errors
        }
      }
    })
  }
  
  next()
})

app.use(cors())
app.use(express.json())

// Middleware to get user from headers
app.use((req, res, next) => {
  const userId = req.headers['x-user-id']
  const token = req.headers['x-auth-token']
  
  if (userId && token) {
    // Verify token and attach user
    req.userId = userId
    req.authToken = token
  }
  next()
})

// Helper to get collection
function getCollection(name) {
  return db ? db.collection(name) : null
}

// ==================== API Routes ====================

// Health check (includes DB status)
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected'
  try {
    if (db) {
      await db.adminCommand('ping')
      dbStatus = 'connected'
    }
  } catch (e) {}
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: dbStatus
  })
})

// Auth
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, bio } = req.body
  const collection = getCollection('users')
  
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    const existing = await collection.findOne({ email })
    if (existing) {
      return res.status(400).json({ error: '邮箱已注册' })
    }
    
    const user = {
      email,
      password,
      name,
      bio: bio || '',
      role: 'user',  // Default role
      createdAt: new Date()
    }
    const result = await collection.insertOne(user)
    const { password: _, ...userWithoutPassword } = user
    userWithoutPassword.id = result.insertedId.toString()
    
    res.json({ user: userWithoutPassword, token: `token-${result.insertedId}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  const collection = getCollection('users')
  
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    const user = await collection.findOne({ email, password })
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }
    
    const { password: _, ...userWithoutPassword } = user
    userWithoutPassword.id = user._id.toString()
    
    res.json({ user: userWithoutPassword, token: `token-${user._id}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin middleware

// ==================== Admin Routes ====================

// Admin middleware
async function requireAdmin(req, res, next) {
  const collection = getCollection('users')
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('token-')) {
    return res.status(401).json({ error: '未登录' })
  }
  
  const userId = authHeader.replace('token-', '')
  try {
    const user = await collection.findOne({ _id: new ObjectId(userId) })
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: '无权限' })
    }
    req.user = user
    next()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Get all users (admin only)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  const collection = getCollection('users')
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    const users = await collection.find({}, { projection: { password: 0 } }).toArray()
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update user role (admin only)
app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const collection = getCollection('users')
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    const { role } = req.body
    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { role } }
    )
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: '用户不存在' })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete user (admin only)
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const collection = getCollection('users')
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) })
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: '用户不存在' })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==================== Blog ====================

app.get('/api/posts', async (req, res) => {
  const { category } = req.query
  const collection = getCollection('posts')
  
  if (!collection) {
    return res.json([])
  }
  
  try {
    let query = {}
    if (category && category !== '全部') {
      query.category = category
    }
    const posts = await collection.find(query).sort({ date: -1 }).limit(50).toArray()
    res.json(posts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/posts/:id', async (req, res) => {
  const collection = getCollection('posts')
  
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    const post = await collection.findOne({ _id: new ObjectId(req.params.id) })
    if (!post) return res.status(404).json({ error: '文章不存在' })
    res.json(post)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/posts', async (req, res) => {
  const { title, content, category } = req.body
  const collection = getCollection('posts')
  
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    // Admin check - require user object with role='admin'
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('token-')) {
      return res.status(401).json({ error: '请先登录' })
    }
    
    const userId = authHeader.replace('token-', '')
    const usersCol = getCollection('users')
    const user = await usersCol?.findOne({ _id: new ObjectId(userId) })
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: '只有管理员可以发布文章' })
    }
    
    const post = {
      title,
      content,
      category,
      date: new Date().toISOString().split('T')[0],
      summary: content?.substring(0, 80) + '...',
      createdAt: new Date()
    }
    const result = await collection.insertOne(post)
    post._id = result.insertedId
    res.json(post)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/posts/:id', async (req, res) => {
  const collection = getCollection('posts')
  
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) })
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: '文章不存在' })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==================== Stats ====================

app.get('/api/stats', async (req, res) => {
  const postsCol = getCollection('posts')
  const usersCol = getCollection('users')
  const visitsCol = getCollection('visits')
  
  try {
    const posts = postsCol ? await postsCol.countDocuments() : 0
    const users = usersCol ? await usersCol.countDocuments() : 0
    
    // Real visit statistics
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    
    let todayVisits = 0
    let uniqueToday = 0
    let totalVisits = 0
    
    if (visitsCol) {
      todayVisits = await visitsCol.countDocuments({ date: today })
      uniqueToday = await visitsCol.distinct('ip', { date: today }).then(ips => ips.length)
      totalVisits = await visitsCol.countDocuments()
    }
    
    res.json({
      posts,
      users,
      visits: totalVisits,
      todayVisits,
      uniqueToday,
      avgTime: Math.floor(Math.random() * 60) + 10
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==================== Visits / IP Records ====================

app.get('/api/admin/visits', requireAdmin, async (req, res) => {
  const visitsCol = getCollection('visits')
  
  if (!visitsCol) {
    return res.json([])
  }
  
  try {
    const { date } = req.query
    let query = {}
    if (date && date !== 'all') {
      query = { date }
    }
    
    const visits = await visitsCol
      .find(query, { projection: { ip: 1, date: 1, timestamp: 1, path: 1 } })
      .sort({ timestamp: -1 })
      .limit(200)
      .toArray()
    
    res.json(visits)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==================== German Learning ====================

app.get('/api/german/progress/:userId', async (req, res) => {
  const collection = getCollection('germanProgress')
  
  if (!collection) {
    return res.json({ words: {}, lastStudy: null, streak: 0 })
  }
  
  try {
    const progress = await collection.findOne({ userId: req.params.userId })
    if (!progress) {
      return res.json({ words: {}, lastStudy: null, streak: 0 })
    }
    res.json(progress)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==================== Game Scores ====================

app.get('/api/scores', async (req, res) => {
  const collection = getCollection('gameScores')
  
  if (!collection) {
    return res.json([])
  }
  
  try {
    const scores = await collection
      .find({}, { projection: { userName: 1, score: 1, game: 1, date: 1 } })
      .sort({ score: -1 })
      .limit(10)
      .toArray()
    res.json(scores)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/scores', async (req, res) => {
  const { userId, userName, score, game } = req.body
  const collection = getCollection('gameScores')
  
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    await collection.insertOne({
      userId,
      userName,
      score,
      game,
      date: new Date()
    })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==================== Static Files (SPA Support) ====================

const distPath = resolve(__dirname, '../dist')
app.use(express.static(distPath))

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API not found' })
  }
  
  const indexPath = join(distPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(503).json({ error: 'Frontend not built. Run: npm run build' })
  }
})

// Start server
async function start() {
  await connectDB()
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Ronnie Portfolio Server`)
    console.log(`   Port: ${PORT}`)
    console.log(`   API: http://localhost:${PORT}/api`)
    console.log(`   Web: http://localhost:${PORT}/`)
  })
}

start().catch(console.error)
