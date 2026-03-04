import { MongoClient, ObjectId } from 'mongodb'
import fs from 'fs'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://ronnie:Ronnie2026@127.0.0.1:27017/?authSource=admin'
const DB_NAME = 'ronnie_portfolio'

async function importGermanVocabulary() {
  console.log('🔄 连接到 MongoDB...')
  const client = new MongoClient(MONGO_URL)
  
  try {
    await client.connect()
    const db = client.db(DB_NAME)
    
    // 读取词汇文件
    console.log('📖 读取词汇文件...')
    const data = JSON.parse(fs.readFileSync('./server/german-vocabulary.json', 'utf8'))
    
    // 清空现有词汇集合
    console.log('🗑️ 清空现有词汇...')
    await db.collection('germanVocabulary').deleteMany({})
    
    // 导入词汇
    console.log('📥 导入词汇...')
    const words = data.vocabulary.map(word => ({
      ...word,
      _id: word.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
    
    await db.collection('germanVocabulary').insertMany(words)
    
    // 导入主题
    console.log('📥 导入主题...')
    const topics = data.topics.map(topic => ({
      ...topic,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
    
    await db.collection('germanTopics').deleteMany({})
    await db.collection('germanTopics').insertMany(topics)
    
    // 创建索引
    console.log('📊 创建索引...')
    await db.collection('germanVocabulary').createIndex({ id: 1 }, { unique: true })
    await db.collection('germanVocabulary').createIndex({ topic_id: 1 })
    await db.collection('germanVocabulary').createIndex({ cefr_level: 1 })
    await db.collection('germanVocabulary').createIndex({ word: 'text', chinese_meaning: 'text' })
    await db.collection('germanTopics').createIndex({ id: 1 }, { unique: true })
    
    console.log('✅ 导入完成！')
    console.log(`   - 词汇: ${words.length} 条`)
    console.log(`   - 主题: ${topics.length} 条`)
    
  } catch (error) {
    console.error('❌ 导入失败:', error.message)
  } finally {
    await client.close()
  }
}

importGermanVocabulary()
