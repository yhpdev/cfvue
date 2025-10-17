<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  msg: String,
})

// 数据列表相关状态
const items = ref([])
const newItemName = ref('')
const editingItem = ref(null)
const editName = ref('')
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

// 模拟Cloudflare D1数据库操作
// 注意：实际使用时需要通过API或Worker与D1交互

// 获取所有数据项
const fetchItems = async () => {
  loading.value = true
  error.value = ''
  try {
    // 调用Cloudflare Worker API
    const response = await fetch('/api/items')
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态: ${response.status}`)
    }
    const data = await response.json()
    items.value = data
  } catch (err) {
    error.value = '获取数据失败: ' + err.message
    console.error('获取数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 添加新数据项
const addItem = async () => {
  if (!newItemName.value.trim()) {
    error.value = '请输入项目名称'
    return
  }
  
  loading.value = true
  error.value = ''
  try {
    // 调用Cloudflare Worker API
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newItemName.value })
    })
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态: ${response.status}`)
    }
    const newItem = await response.json()
    items.value.unshift(newItem) // 添加到列表开头
    
    newItemName.value = ''
    successMessage.value = '添加成功'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (err) {
    error.value = '添加失败: ' + err.message
    console.error('添加失败:', err)
  } finally {
    loading.value = false
  }
}

// 删除数据项
const deleteItem = async (id) => {
  if (!confirm('确定要删除此项吗？')) return
  
  loading.value = true
  error.value = ''
  try {
    // 调用Cloudflare Worker API
    const response = await fetch(`/api/items/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP错误! 状态: ${response.status}`)
    }
    
    items.value = items.value.filter(item => item.id !== id)
    
    successMessage.value = '删除成功'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (err) {
    error.value = '删除失败: ' + err.message
    console.error('删除失败:', err)
  } finally {
    loading.value = false
  }
}

// 开始编辑
const startEdit = (item) => {
  editingItem.value = item.id
  editName.value = item.name
}

// 保存编辑
const saveEdit = async (id) => {
  if (!editName.value.trim()) {
    error.value = '请输入项目名称'
    return
  }
  
  loading.value = true
  error.value = ''
  try {
    // 调用Cloudflare Worker API
    const response = await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.value })
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP错误! 状态: ${response.status}`)
    }
    
    const updatedItem = await response.json()
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index] = updatedItem
    }
    
    cancelEdit()
    successMessage.value = '更新成功'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (err) {
    error.value = '更新失败: ' + err.message
    console.error('更新失败:', err)
  } finally {
    loading.value = false
  }
}

// 取消编辑
const cancelEdit = () => {
  editingItem.value = null
  editName.value = ''
}

// 组件挂载时获取数据
onMounted(async () => {
  // 首先初始化数据库
  try {
    const initResponse = await fetch('/api/init-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    await initResponse.json();
    console.log('数据库初始化完成');
  } catch (initError) {
    console.warn('数据库初始化失败，但将继续尝试获取数据:', initError);
  }
  
  // 然后获取数据
  fetchItems();
});
</script>

<template>
  <!-- <h1>{{ msg }}</h1> -->

  <div class="card">
    <h2>Cloudflare D1 数据库示例</h2>
    
    <!-- 成功消息 -->
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    
    <!-- 错误消息 -->
    <div v-if="error" class="error-message">{{ error }}</div>
    
    <!-- 添加新项 -->
    <div class="add-form">
      <input 
        type="text" 
        v-model="newItemName" 
        placeholder="输入新的项目名称"
        :disabled="loading"
      />
      <button @click="addItem" :disabled="loading">
        {{ loading ? '添加中...' : '添加项目' }}
      </button>
    </div>
    
    <!-- 数据列表 -->
    <div v-if="loading && !items.length" class="loading">加载中...</div>
    
    <table v-else-if="items.length" class="items-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>名称</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.id }}</td>
          <td>
            <span v-if="editingItem !== item.id">{{ item.name }}</span>
            <input 
              v-else 
              type="text" 
              v-model="editName" 
              :disabled="loading"
            />
          </td>
          <td>{{ new Date(item.created_at).toLocaleString() }}</td>
          <td>
            <span v-if="editingItem !== item.id">
              <button @click="startEdit(item)" :disabled="loading">编辑</button>
              <button @click="deleteItem(item.id)" :disabled="loading" class="delete-btn">删除</button>
            </span>
            <span v-else>
              <button @click="saveEdit(item.id)" :disabled="loading">保存</button>
              <button @click="cancelEdit" :disabled="loading">取消</button>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div v-else-if="!loading" class="no-items">暂无数据</div>
  </div>

  <p class="read-the-docs">
    Cloudflare D1数据库增删改查示例
    <br>
    注意：部署前需要在Cloudflare控制面板创建D1数据库并更新wrangler.jsonc中的database_id
  </p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
  font-size: 0.9em;
  margin-top: 20px;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
}

.card {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

h2 {
  color: #333;
  margin-top: 0;
  margin-bottom: 20px;
}

.add-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.add-form input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  color: #000;
}

.items-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.items-table tr:hover {
  background-color: #f5f5f5;
}

.delete-btn {
  background-color: #f44336;
}

.delete-btn:hover:not(:disabled) {
  background-color: #d32f2f;
}

.error-message {
  color: #f44336;
  background-color: #ffebee;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.success-message {
  color: #4caf50;
  background-color: #e8f5e9;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.no-items {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

@media (max-width: 600px) {
  .add-form {
    flex-direction: column;
  }
  
  .items-table {
    font-size: 0.9em;
  }
  
  .items-table th,
  .items-table td {
    padding: 8px;
  }
}
</style>
