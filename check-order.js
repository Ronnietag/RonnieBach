import { MongoClient } from 'mongodb'

const client = new MongoClient('mongodb://ronnie:Ronnie2026@127.0.0.1:27017/?authSource=admin')

async function checkLatestOrder() {
  await client.connect()
  const db = client.db('ronnie_portfolio')
  
  const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).limit(1).toArray()
  
  if (orders.length > 0) {
    const order = orders[0]
    console.log('最新订单:')
    console.log('用户:', order.userName)
    console.log('日期:', order.date, order.mealType)
    console.log('菜品:')
    order.dishes.forEach(d => {
      console.log('  -', d.name + ' x' + d.quantity)
      if (d.ingredients) {
        console.log('    食材:', d.ingredients.map(i => i.name).join('、'))
      }
    })
  } else {
    console.log('没有订单')
  }
  
  await client.close()
}

checkLatestOrder().catch(console.error)
