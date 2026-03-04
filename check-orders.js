import { MongoClient } from 'mongodb';
const client = new MongoClient('mongodb://ronnie:Ronnie2026@127.0.0.1:27017/?authSource=admin');

async function check() {
  await client.connect();
  const db = client.db('ronnie_portfolio');
  
  const orders = await db.collection('orders').find({}).toArray();
  console.log('Orders:', orders.length);
  
  const notifs = await db.collection('notifications').find({}).toArray();
  console.log('Notifications:', notifs.length);
  if (notifs.length > 0) {
    console.log('\nLatest notification:');
    console.log('Status:', notifs[0].status);
    console.log('Message preview:', notifs[0].message?.substring(0, 200));
  }
  
  await client.close();
}

check().catch(console.error);
