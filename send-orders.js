import { MongoClient } from 'mongodb'

const client = new MongoClient('mongodb://ronnie:Ronnie2026@127.0.0.1:27017/?authSource=admin')

const RONNIE_PHONE = '+8619512244066'

async function sendOrderNotifications() {
  await client.connect()
  const db = client.db('ronnie_portfolio')
  
  // Get orders
  const orders = await db.collection('orders').find({}).toArray()
  
  console.log('Found ' + orders.length + ' orders\n')
  
  for (const order of orders) {
    const dishNames = order.dishes.map(d => d.name + ' x' + d.quantity).join(', ')
    const mealType = order.mealType === 'breakfast' ? '早餐' : order.mealType === 'lunch' ? '午餐' : '晚餐'
    
    // Simple message format
    const message = '新点餐订单 - ' + order.userName + ' ' + order.date + ' ' + mealType + ': ' + dishNames
    
    console.log('Sending to ' + RONNIE_PHONE + ':')
    console.log(message + '\n')
    
    try {
      const response = await fetch('http://localhost:3001/api/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: RONNIE_PHONE, message })
      })
      
      const data = await response.json()
      console.log('Result:', JSON.stringify(data))
      
      // Update order
      await db.collection('orders').updateOne(
        { _id: order._id },
        { $set: { lastNotificationSent: new Date() } }
      )
      
    } catch (e) {
      console.error('Error:', e.message)
    }
  }
  
  await client.close()
}

sendOrderNotifications().catch(console.error)
