import { MongoClient } from 'mongodb'
const client = new MongoClient('mongodb://ronnie:Ronnie2026@127.0.0.1:27017/?authSource=admin')

async function check() {
  await client.connect()
  const db = client.db('ronnie_portfolio')
  
  const notifs = await db.collection('notifications').find({}).toArray()
  console.log('Notifications:', notifs.length)
  notifs.forEach(n => {
    console.log('  - ID:', n._id.toString().slice(-8))
    console.log('    Status:', n.status)
    console.log('    WhatsApp Sent:', n.whatsappSent || 'pending')
    console.log('    Message:', n.message?.substring(0, 80))
  })
  
  await client.close()
}

check().catch(console.error)
