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
    await db.collection('posts').createIndex({ date: -1 })
    await db.collection('posts').createIndex({ category: 1 })
    await db.collection('gameScores').createIndex({ score: -1 })
    await db.collection('germanProgress').createIndex({ userId: 1 })
    
    console.log('✅ Database indexes created')
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    console.log('⚠️  Running with in-memory fallback...')
  }
}

// Middleware
app.use(cors())
app.use(express.json())

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
  const { email, password, name } = req.body
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

// Blog
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
    const post = {
      title,
      content,
      category,
      date: new Date().toISOString().split('T')[0],
      summary: content?.substring(0, 50) + '...',
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

// Stats
app.get('/api/stats', async (req, res) => {
  const postsCol = getCollection('posts')
  const usersCol = getCollection('users')
  
  try {
    const posts = postsCol ? await postsCol.countDocuments() : 0
    const users = usersCol ? await usersCol.countDocuments() : 0
    
    res.json({
      posts,
      users,
      visits: Math.floor(Math.random() * 10000) + 1000,
      avgTime: Math.floor(Math.random() * 60) + 10
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// German Learning
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

app.post('/api/german/learn', async (req, res) => {
  const { userId, word, correct } = req.body
  const collection = getCollection('germanProgress')
  
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    await collection.updateOne(
      { userId },
      { 
        $inc: { [`words.${word}`]: 1 },
        $set: { lastStudy: new Date() }
      },
      { upsert: true }
    )
    
    const progress = await collection.findOne({ userId })
    res.json(progress)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Game Scores
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
