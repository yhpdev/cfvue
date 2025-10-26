<template>
  <div class="page-management">
    <header class="page-header">
      <h1>页面管理</h1>
      <button class="add-btn" @click="showAddForm = true">添加页面</button>
    </header>

    <!-- 搜索和筛选 -->
    <div class="search-filter">
      <input 
        type="text" 
        placeholder="搜索页面名称..." 
        v-model="searchQuery"
        class="search-input"
      />
      <select v-model="selectedCategory" class="category-select">
        <option value="">全部分类</option>
        <option v-for="category in categories" :key="category.category_id" :value="category.category_id">
          {{ category.category_name }}
        </option>
      </select>
    </div>

    <!-- 页面表格 -->
    <div class="table-container">
      <table class="page-table">
        <thead>
          <tr>
            <th>页面ID</th>
            <th>页面名称</th>
            <th>所属分类</th>
            <th>页面描述</th>
            <th>创建日期</th>
            <th>页面地址</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="page in filteredPages" :key="page.page_id">
            <td>{{ page.page_id }}</td>
            <td>{{ page.page_name }}</td>
            <td>{{ getCategoryName(page.category_id) }}</td>
            <td class="description-cell">{{ page.page_description || '-' }}</td>
            <td>{{ formatDate(page.created_at) }}</td>
            <td class="url-cell">
              <a :href="page.page_url" target="_blank" rel="noopener noreferrer" v-if="page.page_url">
                {{ truncateUrl(page.page_url) }}
              </a>
              <span v-else>-</span>
            </td>
            <td class="action-buttons">
              <button class="view-btn" @click="viewPageDetails(page)">查看</button>
              <button class="edit-btn" @click="editPage(page)">编辑</button>
              <button class="delete-btn" @click="deletePage(page.page_id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredPages.length === 0" class="empty-state">
        暂无页面数据
      </div>
    </div>

    <!-- 添加/编辑页面表单 -->
    <div v-if="showAddForm || showEditForm" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ showEditForm ? '编辑页面' : '添加页面' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="submitForm" class="page-form">
          <div class="form-group">
            <label for="page_name">页面名称 *</label>
            <input 
              id="page_name"
              v-model="formData.page_name" 
              type="text" 
              placeholder="请输入页面名称"
              required
            />
          </div>
          <div class="form-group">
            <label for="category_id">所属分类</label>
            <select 
              id="category_id"
              v-model="formData.category_id"
              required
            >
              <option value="" disabled>请选择分类</option>
              <option v-for="category in categories" :key="category.category_id" :value="category.category_id">
                {{ category.category_name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="page_description">页面描述</label>
            <textarea 
              id="page_description"
              v-model="formData.page_description" 
              placeholder="请输入页面描述"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="page_url">页面地址</label>
            <input 
              id="page_url"
              v-model="formData.page_url" 
              type="url" 
              placeholder="https://example.com"
            />
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeModal">取消</button>
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              {{ isSubmitting ? '提交中...' : '确认提交' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 页面详情模态框 -->
    <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
      <div class="modal-content detail-modal" @click.stop>
        <div class="modal-header">
          <h2>页面详情</h2>
          <button class="close-btn" @click="closeDetailModal">×</button>
        </div>
        <div class="page-details" v-if="currentPage">
          <div class="detail-item">
            <label>页面ID:</label>
            <span>{{ currentPage.page_id }}</span>
          </div>
          <div class="detail-item">
            <label>页面名称:</label>
            <span>{{ currentPage.page_name }}</span>
          </div>
          <div class="detail-item">
            <label>所属分类:</label>
            <span>{{ getCategoryName(currentPage.category_id) }}</span>
          </div>
          <div class="detail-item">
            <label>页面描述:</label>
            <p>{{ currentPage.page_description || '暂无描述' }}</p>
          </div>
          <div class="detail-item">
            <label>创建日期:</label>
            <span>{{ formatDate(currentPage.created_at) }}</span>
          </div>
          <div class="detail-item">
            <label>页面地址:</label>
            <a 
              :href="currentPage.page_url" 
              target="_blank" 
              rel="noopener noreferrer"
              v-if="currentPage.page_url"
              class="page-link"
            >
              {{ currentPage.page_url }}
            </a>
            <span v-else>暂无地址</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 提示消息 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 状态管理
const pages = ref([]);
const categories = ref([]);
const searchQuery = ref('');
const selectedCategory = ref('');
const showAddForm = ref(false);
const showEditForm = ref(false);
const showDetailModal = ref(false);
const isSubmitting = ref(false);
const message = ref('');
const messageType = ref('success');
const currentPageId = ref(null);
const currentPage = ref(null);

// 表单数据
const formData = ref({
  page_name: '',
  category_id: '',
  page_description: '',
  page_url: ''
});

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await fetch('/api/categories');
    if (response.ok) {
      categories.value = await response.json();
    } else {
      showMessage('获取分类失败', 'error');
    }
  } catch (error) {
    console.error('获取分类失败:', error);
    showMessage('获取分类失败，请稍后重试', 'error');
  }
};

// 获取页面列表
const fetchPages = async () => {
  try {
    const response = await fetch('/api/pages');
    if (response.ok) {
      pages.value = await response.json();
    } else {
      showMessage('获取页面失败', 'error');
    }
  } catch (error) {
    console.error('获取页面失败:', error);
    showMessage('获取页面失败，请稍后重试', 'error');
  }
};

// 过滤后的页面列表
const filteredPages = computed(() => {
  return pages.value.filter(page => {
    // 搜索过滤
    const matchesSearch = !searchQuery.value || 
      page.page_name.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    // 分类过滤
    const matchesCategory = !selectedCategory.value || 
      page.category_id === selectedCategory.value;
    
    return matchesSearch && matchesCategory;
  });
});

// 根据分类ID获取分类名称
const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.category_id === categoryId);
  return category ? category.category_name : '未分类';
};

// 截断URL显示
const truncateUrl = (url) => {
  if (url.length <= 30) return url;
  return url.substring(0, 27) + '...';
};

// 重置表单
const resetForm = () => {
  formData.value = {
    page_name: '',
    category_id: '',
    page_description: '',
    page_url: ''
  };
  currentPageId.value = null;
};

// 打开添加表单
const openAddForm = () => {
  resetForm();
  showAddForm.value = true;
  showEditForm.value = false;
};

// 编辑页面
const editPage = (page) => {
  formData.value = {
    page_name: page.page_name,
    category_id: page.category_id,
    page_description: page.page_description || '',
    page_url: page.page_url || ''
  };
  currentPageId.value = page.page_id;
  showEditForm.value = true;
  showAddForm.value = false;
};

// 查看页面详情
const viewPageDetails = (page) => {
  currentPage.value = page;
  showDetailModal.value = true;
};

// 关闭模态框
const closeModal = () => {
  showAddForm.value = false;
  showEditForm.value = false;
  resetForm();
};

// 关闭详情模态框
const closeDetailModal = () => {
  showDetailModal.value = false;
  currentPage.value = null;
};

// 提交表单
const submitForm = async () => {
  isSubmitting.value = true;
  try {
    let response;
    if (showEditForm.value) {
      // 更新页面
      response = await fetch(`/api/pages/${currentPageId.value}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData.value)
      });
    } else {
      // 添加页面
      response = await fetch('/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData.value)
      });
    }

    const result = await response.json();
    if (response.ok) {
      showMessage(showEditForm.value ? '页面更新成功' : '页面添加成功', 'success');
      await fetchPages();
      closeModal();
    } else {
      showMessage(result.error || '操作失败', 'error');
    }
  } catch (error) {
    console.error('操作失败:', error);
    showMessage('操作失败，请稍后重试', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

// 删除页面
const deletePage = async (pageId) => {
  if (confirm('确定要删除这个页面吗？')) {
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (response.ok) {
        showMessage('页面删除成功', 'success');
        await fetchPages();
      } else {
        showMessage(result.error || '删除失败', 'error');
      }
    } catch (error) {
      console.error('删除失败:', error);
      showMessage('删除失败，请稍后重试', 'error');
    }
  }
};

// 显示消息
const showMessage = (msg, type = 'success') => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 3000);
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 组件挂载时获取数据
onMounted(async () => {
  await fetchCategories();
  await fetchPages();
});
</script>

<style scoped>
.page-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.page-header h1 {
  font-size: 28px;
  color: var(--text-primary);
  margin: 0;
}

.add-btn {
  padding: 10px 20px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.add-btn:hover {
  background: var(--accent-hover);
}

.search-filter {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input,
.category-select {
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.search-input {
  flex: 1;
  min-width: 300px;
}

.category-select {
  min-width: 200px;
}

.search-input:focus,
.category-select:focus {
  border-color: var(--accent-color);
}

.table-container {
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.page-table {
  width: 100%;
  border-collapse: collapse;
}

.page-table th,
.page-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.page-table th {
  background: var(--bg-tertiary);
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.page-table tr:hover {
  background: var(--bg-tertiary);
}

.description-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.url-cell {
  max-width: 250px;
  overflow: hidden;
}

.url-cell a {
  color: var(--accent-color);
  text-decoration: none;
  word-break: break-all;
}

.url-cell a:hover {
  text-decoration: underline;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.view-btn,
.edit-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
  color: white;
}

.view-btn {
  background: var(--info-color);
}

.view-btn:hover {
  background: var(--info-hover);
}

.edit-btn {
  background: var(--warning-color);
}

.edit-btn:hover {
  background: var(--warning-hover);
}

.delete-btn {
  background: var(--danger-color);
}

.delete-btn:hover {
  background: var(--danger-hover);
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 16px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-color);
}

.detail-modal {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  font-size: 20px;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.page-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: var(--accent-color);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.cancel-btn,
.submit-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.cancel-btn {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.cancel-btn:hover {
  background: var(--bg-primary);
}

.submit-btn {
  background: var(--accent-color);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 页面详情样式 */
.page-details {
  padding: 20px;
}

.detail-item {
  margin-bottom: 20px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item label {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-item span {
  color: var(--text-primary);
  font-size: 16px;
}

.detail-item p {
  color: var(--text-primary);
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
}

.page-link {
  color: var(--accent-color);
  text-decoration: none;
  word-break: break-all;
}

.page-link:hover {
  text-decoration: underline;
}

/* 消息提示样式 */
.message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  z-index: 2000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  animation: slideIn 0.3s ease-out;
}

.message.success {
  background: var(--success-color);
}

.message.error {
  background: var(--danger-color);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }

  .search-filter {
    flex-direction: column;
  }

  .search-input,
  .category-select {
    width: 100%;
    min-width: unset;
  }

  .page-table {
    display: block;
    overflow-x: auto;
  }

  .action-buttons {
    flex-direction: column;
  }

  .view-btn,
  .edit-btn,
  .delete-btn {
    width: 100%;
  }
}
</style>