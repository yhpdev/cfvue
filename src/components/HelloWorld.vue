<script setup>
import { ref, onMounted, computed } from 'vue'

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

// 谷歌定位和翻译相关状态
const userLocation = ref(null)
const isTranslating = ref(false)
const targetLanguage = ref('en') // 默认目标语言为英语
const showTranslated = ref(false) // 是否显示翻译后的文本
const translationCache = ref({}) // 翻译缓存，避免重复请求

// 语言选项
const languageOptions = [
  { code: 'en', name: '英语' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'ja', name: '日语' },
  { code: 'ko', name: '韩语' },
  { code: 'fr', name: '法语' },
  { code: 'de', name: '德语' },
  { code: 'es', name: '西班牙语' },
  { code: 'ru', name: '俄语' }
]

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
onMounted(() => {
  // 直接获取数据，不再每次加载页面都初始化数据库
  // 数据库初始化应该只在必要时手动触发
  fetchItems();
});

// 计算属性：根据showTranslated状态显示原始或翻译后的项目
const displayItems = computed(() => {
  if (!showTranslated.value) return items.value;
  
  return items.value.map(item => ({
    ...item,
    name: translationCache.value[item.id] || item.name
  }));
});

// 获取用户位置
const getUserLocation = () => {
  if (!navigator.geolocation) {
    error.value = '浏览器不支持地理定位功能';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        userLocation.value = {
          latitude,
          longitude,
          timestamp: new Date().toLocaleString()
        };
        
        // 可以选择调用谷歌地理编码API获取更详细的位置信息
        // 这里为了简化，只保存了经纬度
        successMessage.value = '位置获取成功';
        setTimeout(() => { successMessage.value = '' }, 3000);
      } catch (err) {
        error.value = '处理位置信息失败: ' + err.message;
      } finally {
        loading.value = false;
      }
    },
    (err) => {
      error.value = '获取位置失败: ' + err.message;
      loading.value = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};

// 使用谷歌翻译API翻译文本
const translateText = async (text, targetLang) => {
  // 检查缓存
  const cacheKey = `${text}-${targetLang}`;
  if (translationCache.value[cacheKey]) {
    return translationCache.value[cacheKey];
  }
  
  try {
    // 注意：实际使用时需要替换为有效的API密钥
    const API_KEY = 'YOUR_GOOGLE_TRANSLATE_API_KEY';
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        format: 'text'
      })
    });
    
    if (!response.ok) {
      throw new Error(`翻译API错误: ${response.status}`);
    }
    
    const data = await response.json();
    const translatedText = data.data.translations[0].translatedText;
    
    // 缓存结果
    translationCache.value[cacheKey] = translatedText;
    
    return translatedText;
  } catch (err) {
    console.error('翻译失败:', err);
    // 翻译失败时返回原文
    return text;
  }
};

// 翻译所有项目
const translateAllItems = async () => {
  if (!items.value.length) {
    error.value = '没有数据需要翻译';
    return;
  }
  
  isTranslating.value = true;
  error.value = '';
  
  try {
    // 逐个翻译项目名称
    for (const item of items.value) {
      // 为每个项目创建一个独立的缓存键
      const cacheKey = `${item.name}-${targetLanguage.value}`;
      if (!translationCache.value[cacheKey]) {
        translationCache.value[cacheKey] = await translateText(item.name, targetLanguage.value);
      }
      // 保存到项目特定的缓存，用于displayItems计算属性
      translationCache.value[item.id] = translationCache.value[cacheKey];
    }
    
    showTranslated.value = true;
    successMessage.value = '翻译完成';
    setTimeout(() => { successMessage.value = '' }, 3000);
  } catch (err) {
    error.value = '批量翻译失败: ' + err.message;
  } finally {
    isTranslating.value = false;
  }
};

// 翻译单个项目
const translateItem = async (item) => {
  try {
    isTranslating.value = true;
    const translatedText = await translateText(item.name, targetLanguage.value);
    translationCache.value[item.id] = translatedText;
    showTranslated.value = true;
    return translatedText;
  } catch (err) {
    error.value = '翻译失败: ' + err.message;
    return item.name;
  } finally {
    isTranslating.value = false;
  }
};

// 切换翻译模式
const toggleTranslation = () => {
  showTranslated.value = !showTranslated.value;
};

// 清空翻译缓存
const clearTranslations = () => {
  translationCache.value = {};
  showTranslated.value = false;
  successMessage.value = '翻译缓存已清空';
  setTimeout(() => { successMessage.value = '' }, 3000);
};
</script>

<template>
  <!-- <h1>{{ msg }}</h1> -->

  <div class="card">
    <h2>Cloudflare D1 数据库示例</h2>
    
    <!-- 成功消息 -->
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    
    <!-- 错误消息 -->
    <div v-if="error" class="error-message">{{ error }}</div>
    
    <!-- 地理位置功能 -->
    <div class="location-section">
      <h3>地理位置功能</h3>
      <button @click="getUserLocation" :disabled="loading">
        {{ loading ? '获取位置中...' : '获取当前位置' }}
      </button>
      <div v-if="userLocation" class="location-info">
        <p>当前位置信息:</p>
        <div class="location-details">
          <span>纬度: {{ userLocation.latitude }}</span>
          <span>经度: {{ userLocation.longitude }}</span>
          <span>获取时间: {{ userLocation.timestamp }}</span>
        </div>
      </div>
    </div>
    
    <!-- 翻译功能 -->
    <div class="translation-section">
      <h3>翻译功能</h3>
      <div class="translation-controls">
        <select v-model="targetLanguage" :disabled="isTranslating">
          <option v-for="lang in languageOptions" :key="lang.code" :value="lang.code">
            {{ lang.name }}
          </option>
        </select>
        <button @click="translateAllItems" :disabled="isTranslating || !items.length">
          {{ isTranslating ? '翻译中...' : '翻译所有项目' }}
        </button>
        <button @click="toggleTranslation" :disabled="isTranslating || !showTranslated">
          切换显示{{ showTranslated ? '(显示原始文本)' : '(显示翻译文本)' }}
        </button>
        <button @click="clearTranslations" :disabled="isTranslating">
          清空翻译
        </button>
      </div>
    </div>
    
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
        <tr v-for="item in displayItems" :key="item.id">
          <td>{{ item.id }}</td>
          <td>
            <span v-if="editingItem !== item.id">
              {{ item.name }}
              <span v-if="showTranslated && translationCache[item.id] !== item.name" class="original-text">
                (原始: {{ items.find(i => i.id === item.id)?.name }})
              </span>
            </span>
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
              <button @click="translateItem(items.find(i => i.id === item.id))" :disabled="isTranslating || loading">
                翻译
              </button>
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

h3 {
  color: #444;
  margin-top: 20px;
  margin-bottom: 15px;
  font-size: 1.1em;
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

/* 地理位置功能样式 */
.location-section {
  background-color: #f0f8ff;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #1976d2;
}

.location-info {
  margin-top: 10px;
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.location-details {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 5px;
}

.location-details span {
  background-color: #f5f5f5;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.9em;
}

/* 翻译功能样式 */
.translation-section {
  background-color: #fff8e1;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #ff9800;
}

.translation-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.translation-controls select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.original-text {
  font-size: 0.85em;
  color: #666;
  font-style: italic;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .location-details {
    flex-direction: column;
    gap: 8px;
  }
  
  .translation-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .translation-controls button {
    width: 100%;
  }
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
