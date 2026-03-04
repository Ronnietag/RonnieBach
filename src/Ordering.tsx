import { useState, useEffect } from 'react'
import './Ordering.css'

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
)

interface Dish {
  _id?: string
  name: string
  category: string
  ingredients: { name: string; amount: number; unit: string }[]
  notes?: string
}

interface SelectedDish {
  dish: Dish
  quantity: number
}

const DEMO_USER_ID = 'wife-user'
const DEMO_USER_NAME = '老婆'

const MEAL_TYPES = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
]

const CATEGORIES = ['主食', '肉类', '蔬菜', '汤类', '早餐', '面食', '小吃', '饮品', '甜点', '其他']

function Ordering() {
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedMeal, setSelectedMeal] = useState<string>('lunch')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [selectedDishes, setSelectedDishes] = useState<SelectedDish[]>([])
  const [showAddDish, setShowAddDish] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [newDishName, setNewDishName] = useState('')
  const [newDishCategory, setNewDishCategory] = useState('主食')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // 获取当前用户（模拟）
    const savedUser = localStorage.getItem('orderingUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      // 模拟登录
      const mockUser = { id: DEMO_USER_ID, name: DEMO_USER_NAME, role: 'Frau' }
      setUser(mockUser)
      localStorage.setItem('orderingUser', JSON.stringify(mockUser))
    }
    
    // 默认今天
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
    
    fetchDishes()
  }, [])

  async function fetchDishes() {
    try {
      const res = await fetch('/api/dishes')
      const data = await res.json()
      setDishes(data || [])
    } catch (e) {
      console.error('获取菜品失败:', e)
    } finally {
      setLoading(false)
    }
  }

  async function addDish() {
    if (!newDishName.trim()) {
      alert('请输入菜名')
      return
    }

    try {
      const res = await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDishName.trim(),
          category: newDishCategory
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        alert(data.error || '添加失败')
        return
      }

      // 添加到列表
      setDishes(prev => [...prev, data])
      setSelectedDishes(prev => [...prev, { dish: data, quantity: 1 }])
      
      // 重置表单
      setNewDishName('')
      setNewDishCategory('主食')
      setShowAddDish(false)
      
    } catch (e) {
      alert('添加失败')
    }
  }

  function addDishToSelection(dish: Dish) {
    const existing = selectedDishes.find(s => s.dish._id === dish._id)
    if (existing) {
      // 再次点击，移除菜品
      setSelectedDishes(prev => prev.filter(s => s.dish._id !== dish._id))
    } else {
      setSelectedDishes(prev => [...prev, { dish, quantity: 1 }])
    }
  }

  function removeDish(dishId: string) {
    setSelectedDishes(prev => prev.filter(s => s.dish._id !== dishId))
  }

  async function submitOrder() {
    if (!selectedDate || selectedDishes.length === 0) {
      alert('请选择日期和菜品')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || DEMO_USER_ID,
          userName: user?.name || DEMO_USER_NAME,
          date: selectedDate,
          mealType: selectedMeal,
          dishes: selectedDishes.map(s => ({
            dishId: s.dish._id,
            name: s.dish.name,
            quantity: s.quantity,
            ingredients: s.dish.ingredients
          })),
          notes
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || '提交失败')
      }

      setSuccess(true)
      setSelectedDishes([])
      setNotes('')
      
      // 3秒后关闭成功提示
      setTimeout(() => setSuccess(false), 3000)
      
    } catch (e) {
      alert('提交失败: ' + e)
    } finally {
      setSubmitting(false)
    }
  }

  // 按类别分组显示菜品
  const dishesByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = dishes.filter(d => d.category === cat)
    return acc
  }, {} as Record<string, Dish[]>)

  return (
    <div className="ordering">
      {/* Header */}
      <header className="ordering-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <BackIcon />
          返回首页
        </button>
      </header>

      {/* Hero */}
      <section className="ordering-hero">
        <h1>大壮的食堂</h1>
      </section>

      {/* Success Toast */}
      {success && (
        <div className="success-toast">
          <CheckIcon />
          <span>订单已提交！通知已发送</span>
        </div>
      )}

      {/* Date & Meal Selection */}
      <section className="selection-bar">
        <div className="date-picker">
          <label>日期</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="meal-selector">
          <label>餐型</label>
          <div className="meal-buttons">
            {MEAL_TYPES.map(meal => (
              <button
                key={meal.value}
                className={`meal-btn ${selectedMeal === meal.value ? 'active' : ''}`}
                onClick={() => setSelectedMeal(meal.value)}
              >
                <span>{meal.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Add New Dish */}
      <section className="add-dish-section">
        <button 
          className="add-dish-btn"
          onClick={() => setShowAddDish(!showAddDish)}
        >
          <span>{showAddDish ? '取消' : '+'}</span>
          <span>{showAddDish ? '' : '添加新菜品'}</span>
        </button>

        {showAddDish && (
          <div className="add-dish-form">
            <div className="form-group">
              <label>菜名</label>
              <input
                type="text"
                value={newDishName}
                onChange={(e) => setNewDishName(e.target.value)}
                placeholder="输入菜名，如：红烧肉"
              />
            </div>
            <div className="form-group">
              <label>类别</label>
              <select 
                value={newDishCategory}
                onChange={(e) => setNewDishCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button className="save-dish-btn" onClick={addDish}>
              添加并点这个菜
            </button>
          </div>
        )}
      </section>

      {/* Dish Categories */}
      <section className="dishes-section">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>加载菜品中...</p>
          </div>
        ) : (
          <>
            {CATEGORIES.map(cat => {
              const catDishes = dishesByCategory[cat] || []
              if (catDishes.length === 0) return null
              
              return (
                <div key={cat} className="dish-category">
                  <h3>{cat}</h3>
                  <div className="dish-grid">
                    {catDishes.map(dish => {
                      const isSelected = selectedDishes.some(s => s.dish._id === dish._id)
                      return (
                        <button
                          key={dish._id}
                          className={`dish-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => addDishToSelection(dish)}
                        >
                          <span className="dish-name">{dish.name}</span>
                          <span className="dish-ingredients">
                            {dish.ingredients.slice(0, 3).map(i => i.name).join('、')}
                            {dish.ingredients.length > 3 && '...'}
                          </span>
                          {isSelected && <span className="check-mark">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </section>

      {/* Shopping Cart Floating Button */}
      {selectedDishes.length > 0 && (
        <>
          <div 
            className="cart-float-btn"
            onClick={() => setShowCart(!showCart)}
          >
            🛒
            <span className="cart-badge">{selectedDishes.length}</span>
          </div>
          
          {showCart && (
            <div className="cart-overlay" onClick={() => setShowCart(false)}>
              <div className="cart-panel" onClick={e => e.stopPropagation()}>
                <div className="cart-header">
                  <h3>已选菜品 ({selectedDishes.length})</h3>
                  <button className="close-cart-btn" onClick={() => setShowCart(false)}>×</button>
                </div>
                <div className="cart-list">
                  {selectedDishes.map(item => (
                    <div key={item.dish._id} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-name">{item.dish.name}</span>
                        <span className="cart-item-category">{item.dish.category}</span>
                      </div>
                      <button 
                        className="remove-cart-btn"
                        onClick={() => removeDish(item.dish._id!)}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
                <div className="cart-footer">
                  <div className="cart-notes">
                    <label>备注</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="有什么特殊要求..."
                    />
                  </div>
                  <button 
                    className="cart-submit-btn"
                    onClick={submitOrder}
                    disabled={submitting}
                  >
                    {submitting ? '提交中...' : '确认点菜'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Ronnie. Made with ❤️</p>
      </footer>
    </div>
  )
}

export default Ordering
