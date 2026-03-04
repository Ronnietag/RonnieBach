#!/usr/bin/env node
// Script to send order notifications via OpenClaw
import { spawn } from 'child_process'
import fs from 'fs'

const NOTIFICATIONS_FILE = '/tmp/order-notifications.json'

// Read pending notifications
function getPendingNotifications() {
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('读取通知文件失败:', e)
  }
  return []
}

// Save notifications
function saveNotifications(notifications) {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2))
  } catch (e) {
    console.error('保存通知文件失败:', e)
  }
}

// Send notification via OpenClaw message tool
function sendViaOpenClaw(channel, target, message) {
  return new Promise((resolve, reject) => {
    // Use curl to call OpenClaw API directly
    const curl = spawn('curl', [
      '-X', 'POST',
      'http://localhost:3001/api/notifications/send',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ channel, target, message })
    ], {
      cwd: '/home/ubuntu/.openclaw/workspace'
    })

    let output = ''
    let error = ''

    curl.stdout.on('data', (data) => {
      output += data.toString()
    })

    curl.stderr.on('data', (data) => {
      error += data.toString()
    })

    curl.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output)
          resolve(result)
        } catch (e) {
          resolve({ success: true, message: 'sent' })
        }
      } else {
        reject(new Error(error || `exit code ${code}`))
      }
    })

    curl.on('error', reject)
  })
}

// Process notifications
async function processNotifications() {
  const notifications = getPendingNotifications()
  
  if (notifications.length === 0) {
    console.log('没有待处理的点餐通知')
    return
  }

  console.log(`处理 ${notifications.length} 个通知...`)

  for (const notif of notifications) {
    if (notif.status !== 'pending') continue

    console.log(`\n📱 发送 WhatsApp 通知...`)
    try {
      await sendViaOpenClaw('whatsapp', notif.whatsappTo, notif.message)
      notif.whatsappSent = true
      console.log('✅ WhatsApp 发送成功')
    } catch (e) {
      console.error('❌ WhatsApp 发送失败:', e.message)
    }

    console.log(`\n📧 发送邮件通知...`)
    try {
      await sendViaOpenClaw('email', notif.emailTo, notif.message, notif.subject)
      notif.emailSent = true
      console.log('✅ 邮件发送成功')
    } catch (e) {
      console.error('❌ 邮件发送失败:', e.message)
    }

    notif.status = notif.whatsappSent || notif.emailSent ? 'sent' : 'failed'
    notif.processedAt = new Date().toISOString()
  }

  saveNotifications(notifications.filter(n => n.status === 'pending'))
  console.log('\n处理完成!')
}

// Main
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--add') || args.includes('-a')) {
    // Add a notification
    const notification = {
      id: Date.now().toString(),
      whatsappTo: '+8619512244066',
      emailTo: 'ronnie@example.com',
      subject: `🍽️ 新点餐订单 - ${new Date().toLocaleDateString('zh-CN')}`,
      message: args.find(a => a.startsWith('--message='))?.replace('--message=', '') || '测试消息',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    const notifications = getPendingNotifications()
    notifications.push(notification)
    saveNotifications(notifications)
    
    console.log('✅ 已添加通知')
  } else if (args.includes('--process') || args.includes('-p')) {
    await processNotifications()
  } else {
    console.log(`
用法:
  node send-notification.js --add --message="消息内容"   添加通知
  node send-notification.js --process                     处理待发送的通知

点餐通知自动添加到队列，通过 cron 或手动调用 --process 发送
    `)
  }
}

main().catch(console.error)
