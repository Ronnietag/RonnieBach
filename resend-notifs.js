import { MongoClient } from 'mongodb'

const client = new MongoClient('mongodb://ronnie:Ronnie2026@127.0.0.1:27017/?authSource=admin')

const RONNIE_PHONE = '+8619512244066'

async function resendNotifications() {
  await client.connect()
  const db = client.db('ronnie_portfolio')
  
  // Get orders that weren't notified
  const orders = await db.collection('orders')
    .find({ 
      $or: [
        { notified: { $exists: false } },
        { notified: false }
      ]
    })
    .toArray()
  
  console.log('Found ' + orders.length + ' orders without notification')
  
  for (const order of orders) {
    const dishNames = order.dishes.map(d => d.name).join('、')
    const mealType = order.mealType === 'breakfast' ? '早餐' : order.mealType === 'lunch' ? '午餐' : '晚餐'
    
    const message = `
🍽️ **新点餐订单**

👤 用户: ${order.userName}
📅 日期: ${order.date}
🍴 餐型: ${mealType}
🍲 菜品: ${dishNames}
📝 备注: ${order.notes || '无'}
⏰ 时间: ${new Date(order.createdAt).toLocaleString('zh-CN')}
    `.trim()
    
    console.log('\n📱 Sending WhatsApp to ' + RONNIE_PHONE + ':')
    console.log(message)
    
    try {
      const result = await fetch('http://localhost:3001/api/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: RONNIE_PHONE, message })
      })
      
      const data = await result.json()
      console.log('Result:', JSON.stringify(data))
      
      // Mark as notified
      await db.collection('orders').updateOne(
        { _id: order._id },
        { $set: { notified: true, notifiedAt: new Date() } }
      )
      
      console.log('✅ Order ' + order._id + ' marked as notified')
      
    } catch (e) {
      console.error('❌ Failed:', e.message)
    }
  }
  
  await client.close()
}

resendNotifications().catch(console.error)
