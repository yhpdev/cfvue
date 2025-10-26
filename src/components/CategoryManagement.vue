<template>
  <div class="category-management">
    <header class="page-header">
      <h1>分类管理</h1>
      <button class="add-btn" @click="showAddForm = true">添加分类</button>
    </header>

    <!-- 搜索和筛选 -->
    <div class="search-filter">
      <input 
        type="text" 
        placeholder="搜索分类名称..." 
        v-model="searchQuery"
        class="search-input"
      />
    </div>

    <!-- 分类表格 -->
    <div class="table-container">
      <table class="category-table">
        <thead>
          <tr>
            <th>分类ID</th>
            <th>分类名称</th>
            <th>分类顺序</th>
            <th>分类备注</th>
            <th>创建日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in filteredCategories" :key="category.category_id">
            <td>{{ category.category_id }}</td>
            <td>{{ category.category_name }}</td>
            <td>{{ category.category_order }}</td>
            <td>{{ category.category_note || '-' }}</td>
            <td>{{ formatDate(category.created_at) }}</td>
            <td class="action-buttons">
              <button class="edit-btn" @click="editCategory(category)">编辑</button>
              <button class="delete-btn" @click="deleteCategory(category.category_id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredCategories.length === 0" class="empty-state">
        暂无分类数据
      </div>
    </div>

    <!-- 添加/编辑分类表单 -->
    <div v-if="showAddForm || showEditForm" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ showEditForm ? '编辑分类' : '添加分类' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="submitForm" class="category-form">
          <div class="form-group">
            <label for="category_name">分类名称 *</label>
            <input 
              id="category_name"
              v-model="formData.category_name" 
              type="text" 
              placeholder="请输入分类名称"
              required
            />
          </div>
          <div class="form-group">
            <label for="category_order">分类顺序</label>
            <input 
              id="category_order"
              v-model.number="formData.category_order" 
              type="number" 
              min="0"
              placeholder="请输入分类顺序"
            />
          </div>
          <div class="form-group">
            <label for="category_note">分类备注</label>
            <textarea 
              id="category_note"
              v-model="formData.category_note" 
              placeholder="请输入分类备注"
              rows="3"
            ></textarea>
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

    <!-- 提示消息 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 状态管理
const categories = ref([]);
const searchQuery = ref('');
const showAddForm = ref(false);
const showEditForm = ref(false);
const isSubmitting = ref(false);
const message = ref('');
const messageType = ref('success');
const currentCategoryId = ref(null);

// 表单数据
const formData = ref({
  category_name: '',
  category_order: 0,
  category_note: ''
});

// 过滤后的分类列表
const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return categories.value;
  }
  const query = searchQuery.value.toLowerCase();
  return categories.value.filter(category => 
    category.category_name.toLowerCase().includes(query)
  );
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

// 重置表单
const resetForm = () => {
  formData.value = {
    category_name: '',
    category_order: 0,
    category_note: ''
  };
  currentCategoryId.value = null;
};

// 打开添加表单
const openAddForm = () => {
  resetForm();
  showAddForm.value = true;
  showEditForm.value = false;
};

// 编辑分类
const editCategory = (category) => {
  formData.value = {
    category_name: category.category_name,
    category_order: category.category_order,
    category_note: category.category_note || ''
  };
  currentCategoryId.value = category.category_id;
  showEditForm.value = true;
  showAddForm.value = false;
};

// 关闭模态框
const closeModal = () => {
  showAddForm.value = false;
  showEditForm.value = false;
  resetForm();
};

// 提交表单
const submitForm = async () => {
  isSubmitting.value = true;
  try {
    let response;
    if (showEditForm.value) {
      // 更新分类
      response = await fetch(`/api/categories/${currentCategoryId.value}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData.value)
      });
    } else {
      // 添加分类
      response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData.value)
      });
    }

    const result = await response.json();
    if (response.ok) {
      showMessage(showEditForm.value ? '分类更新成功' : '分类添加成功', 'success');
      await fetchCategories();
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

// 删除分类
const deleteCategory = async (categoryId) => {
  if (confirm('确定要删除这个分类吗？如果分类下有页面，将无法删除。')) {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (response.ok) {
        showMessage('分类删除成功', 'success');
        await fetchCategories();
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
onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.category-management {
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
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.search-input:focus {
  border-color: var(--accent-color);
}

.table-container {
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.category-table {
  width: 100%;
  border-collapse: collapse;
}

.category-table th,
.category-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.category-table th {
  background: var(--bg-tertiary);
  font-weight: 600;
  font-size: 14px;
}

.category-table tr:hover {
  background: var(--bg-tertiary);
}

.action-buttons {
  display: flex;
  gap: 10px;
}

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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-color);
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

.category-form {
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
.form-group textarea {
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
.form-group textarea:focus {
  border-color: var(--accent-color);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
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

  .category-table {
    display: block;
    overflow-x: auto;
  }

  .action-buttons {
    flex-direction: column;
  }

  .edit-btn,
  .delete-btn {
    width: 100%;
  }
}
</style>