import { useState, useEffect } from 'react'
import './DishManagement.css'

const CATEGORIES = ['主食', '肉类', '蔬菜', '汤类', '早餐', '面食', '小吃', '饮品', '甜点', '其他']

interface Dish {
  _id?: string
  name: string
  category: string
  ingredients: (string | { name: string; amount?: number; unit?: string })[]
}

function DishManagement() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '肉类',
    ingredients: [] as string[]
  })

  // 获取菜品列表
  useEffect(() => {
    fetchDishes()
  }, [])

  async function fetchDishes() {
    try {
      const res = await fetch('/api/dishes')
      const data = await res.json()
      setDishes(data)
    } catch (e) {
      console.error('获取菜品失败:', e)
    } finally {
      setLoading(false)
    }
  }

  // 添加食材
  function addIngredient() {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }))
  }

  // 更新食材
  function updateIngredient(index: number, value: string) {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }))
  }

  // 删除食材
  function removeIngredient(index: number) {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }))
  }

  // 拖放相关
  function handleDragStart(index: number) {
    setDraggedItem(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggedItem === null || draggedItem === index) return
    
    setFormData(prev => {
      const newIngredients = [...prev.ingredients]
      const draggedItemValue = newIngredients[draggedItem]
      newIngredients.splice(draggedItem, 1)
      newIngredients.splice(index, 0, draggedItemValue)
      return { ...prev, ingredients: newIngredients }
    })
    setDraggedItem(index)
  }

  function handleDragEnd() {
    setDraggedItem(null)
  }

  // 上移
  function moveUp(index: number) {
    if (index === 0) return
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => {
        if (i === index - 1) return prev.ingredients[index]
        if (i === index) return prev.ingredients[index - 1]
        return ing
      })
    }))
  }

  // 下移
  function moveDown(index: number) {
    if (index === formData.ingredients.length - 1) return
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => {
        if (i === index) return prev.ingredients[index + 1]
        if (i === index + 1) return prev.ingredients[index]
        return ing
      })
    }))
  }

  // 提交表单
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const validIngredients = formData.ingredients.filter(ing => ing.trim())
    
    try {
      if (editingDish && editingDish._id) {
        // 编辑模式
        const res = await fetch(`/api/dishes/${editingDish._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            category: formData.category,
            ingredients: validIngredients
          })
        })
        
        if (res.ok) {
          fetchDishes()
          resetForm()
        } else {
          const error = await res.json()
          alert('编辑失败: ' + (error.error || '未知错误'))
        }
      } else {
        // 新增模式
        const res = await fetch('/api/dishes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            category: formData.category,
            ingredients: validIngredients
          })
        })

        if (res.ok) {
          fetchDishes()
          resetForm()
        } else {
          alert('保存失败')
        }
      }
    } catch (e) {
      console.error('保存失败:', e)
      alert('保存失败')
    }
  }

  // 删除菜品
  async function deleteDish(id: string) {
    if (!confirm('确定删除这个菜品？')) return
    
    try {
      const res = await fetch(`/api/dishes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDishes(prev => prev.filter(d => d._id !== id))
      }
    } catch (e) {
      console.error('删除失败:', e)
    }
  }

  // 编辑菜品
  function editDish(dish: Dish) {
    setFormData({
      name: dish.name,
      category: dish.category,
      ingredients: dish.ingredients.map(i => typeof i === 'string' ? i : (i.name || ''))
    })
    setEditingDish(dish)
    setShowForm(true)
  }

  function resetForm() {
    setFormData({ name: '', category: '肉类', ingredients: [] })
    setShowForm(false)
    setEditingDish(null)
  }

  return (
    <div className="dish-management">
      {/* Header */}
      <header className="dish-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          返回首页
        </button>
        <h1>菜单管理</h1>
      </header>

      {/* Form */}
      {showForm && (
        <section className="dish-form-section">
          <form onSubmit={handleSubmit} className="dish-form">
            <h3>{editingDish ? '编辑菜品' : '新增菜品'}</h3>
            
            <div className="form-group">
              <label>菜品名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如：红烧肉"
                required
              />
            </div>

            <div className="form-group">
              <label>分类</label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>食材（可拖动调整顺序）</label>
              {formData.ingredients.map((ing, index) => (
                <div 
                  key={index} 
                  className={`ingredient-row ${draggedItem === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="drag-handle">⋮⋮</span>
                  <input
                    type="text"
                    value={ing}
                    onChange={e => updateIngredient(index, e.target.value)}
                    placeholder="食材名称"
                  />
                  <button type="button" className="move-btn" onClick={() => moveUp(index)} disabled={index === 0}>
                    ↑
                  </button>
                  <button type="button" className="move-btn" onClick={() => moveDown(index)} disabled={index === formData.ingredients.length - 1}>
                    ↓
                  </button>
                  <button type="button" className="remove-ing-btn" onClick={() => removeIngredient(index)}>
                    ×
                  </button>
                </div>
              ))}
              <button type="button" className="add-ing-btn" onClick={addIngredient}>
                + 添加食材
              </button>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={resetForm}>
                取消
              </button>
              <button type="submit" className="submit-btn">
                保存
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Dish List */}
      <section className="dish-list-section">
        <div className="dish-list-header">
          <h2>菜品列表 ({dishes.length})</h2>
          <button className="add-btn" onClick={() => {
            setFormData({ name: '', category: '肉类', ingredients: [] })
            setShowForm(true)
          }}>
            + 新增菜品
          </button>
        </div>

        {loading ? (
          <p>加载中...</p>
        ) : (
          <div className="dish-grid">
            {dishes.map(dish => (
              <div key={dish._id} className="dish-item">
                <div className="dish-info">
                  <h4>{dish.name}</h4>
                  <span className="dish-category">{dish.category}</span>
                  <p className="dish-ingredients">
                    {dish.ingredients.slice(0, 5).map(i => typeof i === 'string' ? i : i.name).join('、')}
                    {dish.ingredients.length > 5 && '...'}
                  </p>
                </div>
                <div className="dish-actions">
                  <button className="edit-btn" onClick={() => editDish(dish)}>
                    编辑
                  </button>
                  <button className="delete-btn" onClick={() => dish._id && deleteDish(dish._id)}>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default DishManagement
