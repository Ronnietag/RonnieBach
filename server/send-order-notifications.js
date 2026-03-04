#!/usr/bin/env node
/**
 * Send order notifications via OpenClaw (WhatsApp only)
 * Usage: node send-order-notifications.js
 */

import { MongoClient } from 'mongodb'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://ronnie:Ronnie2026@127.0.0.1:27017/?authSource=admin'

const RONNIE_PHONE = '+8619512244066'

// Process notifications and send via OpenClaw
async function processNotifications() {
  const client = new MongoClient(MONGO_URL)
  
  try {
    await client.connect()
    const db = client.db('ronnie_portfolio')
    
    // Get pending notifications
    const notifications = await db.collection('notifications')
      .find({ status: 'pending' })
      .toArray()
    
    console.log('\n📱 发现 ' + notifications.length + ' 个待处理的通知\n')
    
    for (const notif of notifications) {
      console.log('\n📋 处理通知: ' + notif._id)
      console.log('消息预览: ' + notif.message?.substring(0, 100) + '...')
      
      // Send WhatsApp via OpenClaw message tool
      try {
        const result = await sendWhatsApp(RONNIE_PHONE, notif.message)
        console.log('✅ WhatsApp 发送成功: ' + result.messageId)
        
        await db.collection('notifications').updateOne(
          { _id: notif._id },
          { 
            $set: { 
              status: 'sent', 
              processedAt: new Date(),
              whatsappSent: true,
              whatsappMessageId: result.messageId
            } 
          }
        )
      } catch (e) {
        console.error('❌ WhatsApp 发送失败:', e.message)
        
        await db.collection('notifications').updateOne(
          { _id: notif._id },
          { 
            $set: { 
              status: 'failed',
              error: e.message,
              processedAt: new Date()
            } 
          }
        )
      }
    }
    
    console.log('\n✅ 所有通知处理完成\n')
    
  } catch (error) {
    console.error('处理通知失败:', error)
  } finally {
    await client.close()
  }
}

// Send WhatsApp using OpenClaw API directly
async function sendWhatsApp(to, message) {
  const response = await fetch('http://localhost:3001/api/notifications/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, message })
  })
  
  if (!response.ok) {
    throw new Error('发送失败: ' + await response.text())
  }
  
  return response.json()
}

// Main
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--test')) {
    // Test send
    console.log('\n🧪 测试发送 WhatsApp 通知...\n')
    
    const testMessage = `
🍽️ **测试点餐通知**

👤 用户: 老婆
📅 日期: 2026-02-11
🍴 餐型: 晚餐
🍲 菜品: 红烧肉
📝 备注: 测试消息
⏰ 时间: ${new Date().toLocaleString('zh-CN')}
    `.trim()
    
    try {
      const result = await sendWhatsApp(RONNIE_PHONE, testMessage)
      console.log('✅ WhatsApp 测试发送成功')
      console.log('MessageId:', result)
    } catch (e) {
      console.error('❌ WhatsApp 测试失败:', e.message)
    }
  } else {
    await processNotifications()
  }
}

main().catch(console.error)
