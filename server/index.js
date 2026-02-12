// Express Server for Ronnie Portfolio - with MongoDB
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import nodemailer from 'nodemailer'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/?authSource=admin'
const DB_NAME = 'ronnie_portfolio'

// QQ邮箱 SMTP 配置
const emailTransporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true, // 使用 SSL
  auth: {
    user: '2434607378@qq.com',
    pass: 'pcsgazacluntdhib'
  }
})

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
    await db.collection('users').createIndex({ role: 1 })
    await db.collection('posts').createIndex({ date: -1 })
    await db.collection('posts').createIndex({ category: 1 })
    await db.collection('gameScores').createIndex({ score: -1 })
    await db.collection('germanProgress').createIndex({ userId: 1 })
    await db.collection('visits').createIndex({ timestamp: -1 })
    await db.collection('visits').createIndex({ ip: 1, date: 1 })
    await db.collection('talentVisits').createIndex({ ip: 1, date: 1 })
    await db.collection('talentVisits').createIndex({ date: 1 }, { expireAfterSeconds: 604800 })
    
    // New indexes for dishes and orders
    await db.collection('dishes').createIndex({ name: 1 }, { unique: true })
    await db.collection('orders').createIndex({ date: 1, mealType: 1 })
    await db.collection('orders').createIndex({ userId: 1, date: 1 })
    
    console.log('✅ Database indexes created')
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    console.log('⚠️  Running with in-memory fallback...')
  }
}

// ==================== Middleware ====================

app.use(cors())
app.use(express.json())

// ==================== 菜品相关接口 / Dishes ====================

// 获取所有菜品
app.get('/api/dishes', async (req, res) => {
  const collection = getCollection('dishes')
  if (!collection) {
    return res.json([])
  }
  
  try {
    const dishes = await collection.find({}, { sort: { name: 1 } }).toArray()
    res.json(dishes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取单个菜品
app.get('/api/dishes/:id', async (req, res) => {
  const collection = getCollection('dishes')
  if (!collection) {
    return res.status(404).json({ error: 'Not found' })
  }
  
  try {
    const dish = await collection.findOne({ _id: new ObjectId(req.params.id) })
    if (!dish) {
      return res.status(404).json({ error: '菜品不存在' })
    }
    res.json(dish)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 创建新菜品（自动生成食材）
app.post('/api/dishes', async (req, res) => {
  const collection = getCollection('dishes')
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    const { name, category, notes } = req.body
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '请输入菜名' })
    }
    
    // 检查是否已存在
    const existing = await collection.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } })
    if (existing) {
      return res.status(400).json({ error: '该菜品已存在' })
    }
    
    // 根据菜名自动生成食材
    const ingredients = generateIngredients(name, category)
    
    const dish = {
      name: name.trim(),
      category: category || '其他',
      ingredients,
      notes: notes || '',
      createdAt: new Date()
    }
    
    const result = await collection.insertOne(dish)
    dish._id = result.insertedId
    
    res.json(dish)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 根据菜名生成食材
function generateIngredients(dishName, category) {
  const name = dishName.toLowerCase()
  
  // 基础食材模板
  const templates = {
    '主食': ['米饭', '面条', '面粉', '水', '盐', '食用油'],
    '肉类': ['猪肉', '牛肉', '鸡肉', '葱', '姜', '蒜', '生抽', '料酒'],
    '蔬菜': ['青菜', '胡萝卜', '土豆', '蒜', '盐', '食用油'],
    '汤类': ['水', '盐', '葱', '姜', '少许胡椒'],
    '早餐': ['鸡蛋', '牛奶', '面包', '果酱', '黄油'],
    '面食': ['面条', '面粉', '水', '盐', '鸡蛋'],
    '小吃': ['面粉', '鸡蛋', '盐', '食用油'],
    '饮品': ['水', '糖', '冰块'],
    '甜点': ['面粉', '糖', '鸡蛋', '黄油', '牛奶'],
  }
  
  // 根据关键词判断类别
  let detectedCategory = category || '其他'
  const keywords = {
    '主食': ['饭', '粥', '馒头', '包子', '饺子', '馄饨'],
    '肉类': ['肉', '鸡', '鸭', '鱼', '虾', '牛', '猪', '羊'],
    '蔬菜': ['菜', '青菜', '番茄', '土豆', '胡萝卜', '豆', '菇'],
    '汤': ['汤', '羹'],
    '早餐': ['早餐', '三明治', '吐司', '煎蛋', '煮蛋'],
    '面食': ['面', '粉', '拉面', '炒面', '拌面'],
    '小吃': ['小吃', '零食', '薯条', '炸鸡'],
    '饮品': ['茶', '咖啡', '奶', '果汁', '可乐'],
    '甜点': ['蛋糕', '甜点', '布丁', '冰淇淋', '饼干']
  }
  
  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(w => name.includes(w))) {
      detectedCategory = cat
      break
    }
  }
  
  // 获取对应模板或默认
  const baseIngredients = templates[detectedCategory] || templates['主食']
  
  // 根据菜名添加特定食材
  const specificIngredients = []
  
  if (name.includes('番茄') || name.includes('西红柿')) {
    specificIngredients.push('番茄', '糖')
  }
  if (name.includes('鸡蛋') || name.includes('蛋')) {
    specificIngredients.push('鸡蛋', '葱')
  }
  if (name.includes('土豆') || name.includes('薯')) {
    specificIngredients.push('土豆', '盐', '胡椒粉')
  }
  if (name.includes('牛肉') || name.includes('牛排')) {
    specificIngredients.push('牛肉', '黑胡椒', '黄油')
  }
  if (name.includes('鸡肉') || name.includes('鸡腿')) {
    specificIngredients.push('鸡肉', '姜', '料酒')
  }
  if (name.includes('鱼') || name.includes('鱼排')) {
    specificIngredients.push('鱼', '姜', '葱', '料酒')
  }
  if (name.includes('豆腐')) {
    specificIngredients.push('豆腐', '葱', '生抽')
  }
  if (name.includes('面条') || name.includes('面')) {
    specificIngredients.push('面条', '青菜', '鸡蛋')
  }
  if (name.includes('米饭') || name.includes('饭')) {
    specificIngredients.push('米饭', '青菜', '肉类')
  }
  if (name.includes('披萨')) {
    specificIngredients.push('面粉', '番茄酱', '奶酪', '香肠')
  }
  if (name.includes('汉堡')) {
    specificIngredients.push('面包', '肉饼', '生菜', '番茄', '奶酪')
  }
  
  // 合并食材，去重
  const allIngredients = [...new Set([...specificIngredients, ...baseIngredients])]
  
  return allIngredients.map(name => ({
    name,
    amount: calculateAmount(name, detectedCategory),
    unit: getUnit(name)
  }))
}

function calculateAmount(ingredient, category) {
  const amounts = {
    '肉类': Math.floor(Math.random() * 200) + 150,
    '蔬菜': Math.floor(Math.random() * 300) + 200,
    '主食': Math.floor(Math.random() * 300) + 200,
    '早餐': Math.floor(Math.random() * 2) + 1,
    '汤类': Math.floor(Math.random() * 400) + 300,
  }
  return amounts[category] || Math.floor(Math.random() * 200) + 100
}

function getUnit(ingredient) {
  const units = {
    '米': '克',
    '面': '克',
    '肉': '克',
    '菜': '克',
    '蛋': '个',
    '奶': '毫升',
    '水': '毫升',
    '油': '毫升',
    '盐': '克',
    '糖': '克',
    '酱': '勺',
  }
  
  for (const [key, unit] of Object.entries(units)) {
    if (ingredient.includes(key)) return unit
  }
  return '适量'
}

// 删除菜品
app.delete('/api/dishes/:id', async (req, res) => {
  const collection = getCollection('dishes')
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) })
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: '菜品不存在' })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==================== 点餐相关接口 / Orders ====================

// 更新菜品
app.put('/api/dishes/:id', async (req, res) => {
  const collection = getCollection('dishes')
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    const { id } = req.params
    const { name, category, ingredients } = req.body
    
    if (!name) {
      return res.status(400).json({ error: '菜品名称不能为空' })
    }
    
    // 转换 ingredients 格式（过滤空值）
    const processedIngredients = (ingredients || [])
      .filter(ing => {
        if (typeof ing === 'string') return ing.trim() !== ''
        if (typeof ing === 'object' && ing.name) return ing.name.trim() !== ''
        return false
      })
      .map(ing => {
        if (typeof ing === 'string') {
          return { name: ing.trim(), amount: Math.floor(Math.random() * 200) + 100, unit: getUnit(ing) }
        }
        return { 
          name: ing.name.trim(), 
          amount: ing.amount || Math.floor(Math.random() * 200) + 100, 
          unit: ing.unit || getUnit(ing.name) 
        }
      })
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, category, ingredients: processedIngredients, updatedAt: new Date() } }
    )
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: '菜品不存在' })
    }
    
    console.log('✅ 菜品更新成功:', name)
    res.json({ success: true, updatedId: id })
  } catch (error) {
    console.error('❌ 更新菜品失败:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// 获取某天的点餐记录
app.get('/api/orders', async (req, res) => {
  const collection = getCollection('orders')
  if (!collection) {
    return res.json([])
  }
  
  try {
    const { date, mealType } = req.query
    const filter = {}
    
    if (date) {
      filter.date = date
    }
    if (mealType) {
      filter.mealType = mealType
    }
    
    const orders = await collection.find(filter).sort({ createdAt: -1 }).toArray()
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取用户的所有点餐记录
app.get('/api/orders/user/:userId', async (req, res) => {
  const collection = getCollection('orders')
  if (!collection) {
    return res.json([])
  }
  
  try {
    const orders = await collection.find({ userId: req.params.userId })
      .sort({ date: -1, mealType: 1 })
      .limit(30)
      .toArray()
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 提交点餐
app.post('/api/orders', async (req, res) => {
  const collection = getCollection('orders')
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  const dishesCollection = getCollection('dishes')
  
  try {
    const { userId, userName, date, mealType, dishes, notes } = req.body
    
    if (!userId || !date || !mealType || !dishes || dishes.length === 0) {
      return res.status(400).json({ error: '缺少必要信息' })
    }
    
    // 为每个菜品补充食材（从数据库查询，不自动生成）
    const enrichedDishes = await Promise.all(dishes.map(async (dish) => {
      // 检查是否有有效食材
      const hasValidIngredients = dish.ingredients && 
                                   dish.ingredients.length > 0 && 
                                   dish.ingredients.some(i => i && typeof i === 'object' && i.name && i.name.trim() !== '')
      
      if (hasValidIngredients) {
        // 已有有效食材，去重返回
        const uniqueIngredients = [...new Map(dish.ingredients.map(i => [i.name, i])).values()]
        return { ...dish, ingredients: uniqueIngredients }
      }
      
      // 从数据库查询
      let fullIngredients = []
      if (dish.dishId && dishesCollection) {
        try {
          const dbDish = await dishesCollection.findOne({ _id: new ObjectId(dish.dishId) })
          if (dbDish && dbDish.ingredients && dbDish.ingredients.length > 0) {
            fullIngredients = dbDish.ingredients
          }
        } catch (e) {
          console.error('查询菜品失败:', e.message)
        }
      }
      
      // 如果数据库也没有食材，返回空
      return { ...dish, ingredients: fullIngredients }
    }))
    
    const order = {
      userId,
      userName: userName || '妻子',
      date,
      mealType,
      dishes: enrichedDishes,
      notes: notes || '',
      status: 'pending',
      createdAt: new Date()
    }
    
    const result = await collection.insertOne(order)
    order._id = result.insertedId
    
    // 发送通知
    await sendOrderNotification(order)
    
    res.json({ success: true, order })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 辅助函数：根据菜名判断类别
function getDishCategory(dishName) {
  const name = dishName.toLowerCase()
  const keywords = {
    '主食': ['饭', '粥', '馒头', '包子', '饺子', '馄饨'],
    '肉类': ['肉', '鸡', '鸭', '鱼', '虾', '牛', '猪', '羊', '红烧', '排骨'],
    '蔬菜': ['菜', '青菜', '番茄', '土豆', '胡萝卜', '豆', '菇', '西蓝花'],
    '汤': ['汤', '羹'],
    '面食': ['面', '粉', '拉面', '炒面', '拌面'],
    '早餐': ['早餐', '三明治', '吐司', '煎蛋', '煮蛋'],
  }
  
  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(w => name.includes(w))) return cat
  }
  return '肉类'
}

// 发送点餐通知
async function sendOrderNotification(order) {
  const dishNames = order.dishes.map(d => d.name).join('、')
  const mealType = order.mealType === 'breakfast' ? '早餐' : order.mealType === 'lunch' ? '午餐' : '晚餐'
  
  // 收集所有食材（不重复）
  const ingredientsSet = new Set()
  order.dishes.forEach(d => {
    if (d.ingredients) {
      d.ingredients.forEach(i => ingredientsSet.add(i.name))
    }
  })
  const ingredients = Array.from(ingredientsSet).join('、')
  
  let message = `🍽️ 壮壮又馋啦
${order.date} ${mealType}
想吃${dishNames}
需要的食材是${ingredients}`
  
  if (order.notes) {
    message += `
备注：${order.notes}`
  }
  
  message = message.trim()
  
  // 只发送邮件通知（取消 WhatsApp）
  try {
    const mealTypeText = order.mealType === 'breakfast' ? '早餐' : order.mealType === 'lunch' ? '午餐' : '晚餐'
    
    await emailTransporter.sendMail({
      from: '"Klaus" <2434607378@qq.com>',
      to: '735801970@qq.com',
      subject: `🍽️ 壮壮又馋啦 - ${order.date} ${mealTypeText}`,
      text: message,
      html: `<pre style="font-family: sans-serif; white-space: pre-wrap;">${message}</pre>`
    })
    console.log('✅ 邮件发送成功')
  } catch (e) {
    console.error('❌ 邮件发送失败:', e.message)
  }
  
  // 存储通知记录
  try {
    const notificationCollection = getCollection('notifications')
    if (notificationCollection) {
      await notificationCollection.insertOne({
        type: 'order',
        message,
        order: order,
        status: 'sent',
        sentAt: new Date(),
        channels: ['whatsapp', 'email'],
        createdAt: new Date()
      })
    }
  } catch (e) {
    console.error('存储通知失败:', e)
  }
}

// ==================== 通知接口 / Notifications ====================

// 发送 WhatsApp 通知（通过 OpenClaw CLI - 异步）
import { spawn } from 'child_process'

app.post('/api/notifications/whatsapp', async (req, res) => {
  const { to, message } = req.body
  
  if (!to || !message) {
    return res.status(400).json({ error: '缺少手机号或消息内容' })
  }
  
  // 立即返回，不等待
  res.json({ success: true, message: '通知已提交' })
  
  // 异步发送
  try {
    const openclaw = spawn('openclaw', ['message', 'send', '--channel', 'whatsapp', '--target', to, '--message', message], {
      cwd: '/home/ubuntu/.openclaw/workspace',
      stdio: ['ignore', 'ignore', 'pipe']
    })
    
    let stderr = ''
    openclaw.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    openclaw.on('close', (code) => {
      if (code === 0) {
        console.log('✅ WhatsApp 通知发送给 ' + to + ': 成功')
      } else {
        console.error('❌ WhatsApp 通知失败:', stderr)
      }
    })
  } catch (error) {
    console.error('❌ WhatsApp 通知错误:', error)
  }
})

// 发送邮件通知
app.post('/api/notifications/email', async (req, res) => {
  const { to, subject, body } = req.body
  
  if (!to || !subject || !body) {
    return res.status(400).json({ error: '缺少邮件信息' })
  }
  
  try {
    // 使用 OpenClaw message 工具发送邮件
    const result = await fetch('http://localhost:3001/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'email',
        target: to,
        subject: subject,
        message: body
      })
    })
    
    const data = await result.json()
    console.log(`📧 邮件通知发送给 ${to}: ${data.success ? '成功' : '失败'}`)
    
    res.json({ success: true, message: '邮件已发送' })
  } catch (error) {
    console.error('邮件通知错误:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== 其他接口（保持原有）====================

// Middleware - Track visits
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next()
  }
  
  if (!req.path.endsWith('.js') && !req.path.endsWith('.css') && !req.path.endsWith('.ico')) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.socket?.remoteAddress || 
               'unknown'
    const date = new Date().toISOString().split('T')[0]
    
    setImmediate(async () => {
      if (db) {
        try {
          await db.collection('visits').insertOne({
            ip,
            date,
            timestamp: new Date(),
            path: req.path
          })
        } catch (e) {}
      }
    })
  }
  
  next()
})

// Middleware to get user from headers
app.use((req, res, next) => {
  const userId = req.headers['x-user-id']
  const token = req.headers['x-auth-token']
  
  if (userId && token) {
    req.userId = userId
    req.authToken = token
  }
  next()
})

// Helper to get collection
function getCollection(name) {
  return db ? db.collection(name) : null
}

// Health check
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
  const { email, password, name, bio, role } = req.body
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
      role: role || 'user',
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
    if (!user || (user.role !== 'admin' && user.role !== 'Frau')) {
      return res.status(403).json({ error: '无权限' })
    }
    req.user = user
    next()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Admin routes
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

// Blog routes
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

// Admin - 获取访问记录
app.get('/api/admin/visits', requireAdmin, async (req, res) => {
  const collection = getCollection('visits')
  if (!collection) {
    return res.status(503).json({ error: '数据库未连接' })
  }
  
  try {
    const visits = await collection.find({})
      .sort({ timestamp: -1 })
      .limit(200)
      .toArray()
    res.json(visits)
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
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('token-')) {
      return res.status(401).json({ error: '请先登录' })
    }
    
    const tokenId = authHeader.replace('token-', '')
    const usersCol = getCollection('users')
    const { ObjectId } = await import('mongodb')
    const user = await usersCol?.findOne({ _id: new ObjectId(tokenId) })
    
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

// Stats
app.get('/api/stats', async (req, res) => {
  const postsCol = getCollection('posts')
  const usersCol = getCollection('users')
  const visitsCol = getCollection('visits')
  
  try {
    const posts = postsCol ? await postsCol.countDocuments() : 0
    const users = usersCol ? await usersCol.countDocuments() : 0
    
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

// German Learning routes (保留)
app.get('/api/german/topics', async (req, res) => {
  const collection = getCollection('words')
  if (!collection) {
    return res.json([])
  }
  
  try {
    const topics = await collection.distinct('topic')
    const topicList = topics.map((name, index) => ({
      id: index + 1,
      name_de: name,
      name_zh: name,
      order: index + 1
    }))
    res.json(topicList)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

function transformWord(word) {
  const id = parseInt(word._id.toString().slice(0, 8), 16) % 1000000
  const examples = word.examples?.map(ex => ({
    sentence: ex.german || ex.sentence || '',
    translation: ex.chinese || ex.translation || ''
  })) || []
  
  const topicId = word.topic ? 
    word.topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100 : 0
  
  return {
    id,
    word: word.word,
    chinese_meaning: word.meaning || '',
    examples,
    topic_id: topicId,
    cefr_level: word.level || 'A1'
  }
}

app.get('/api/german/vocabulary', async (req, res) => {
  const collection = getCollection('words')
  if (!collection) {
    return res.json([])
  }
  
  try {
    const { topic, topic_id, level } = req.query
    const filter = {}
    
    if (topic_id && topic_id !== '0' && topic_id !== 'all') {
      const topics = await collection.distinct('topic')
      const topicIndex = parseInt(topic_id.toString()) - 1
      if (topicIndex >= 0 && topicIndex < topics.length) {
        filter.topic = topics[topicIndex]
      }
    } else if (topic && topic !== 'all') {
      filter.topic = topic
    }
    
    if (level) {
      filter.level = level
    }
    
    const words = await collection.find(filter).toArray()
    const vocabulary = words.map(transformWord)
    res.json(vocabulary)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/german/vocabulary/:id', async (req, res) => {
  const collection = getCollection('words')
  if (!collection) {
    return res.status(404).json({ error: 'Not found' })
  }
  
  try {
    const word = await collection.findOne({ _id: new ObjectId(req.params.id) })
    if (!word) {
      return res.status(404).json({ error: 'Not found' })
    }
    res.json(transformWord(word))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

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

// Game scores
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

// Static files
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
