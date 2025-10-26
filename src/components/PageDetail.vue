<template>
  <div class="page-detail">
    <!-- 导航栏 -->
    <nav class="nav-bar">
      <div class="nav-content">
        <a href="/" class="logo">旅游知识网站</a>
        <div class="nav-links">
          <a href="/" class="nav-link">首页</a>
          <a href="#categories" class="nav-link">分类浏览</a>
          <a href="#popular" class="nav-link">热门页面</a>
        </div>
      </div>
    </nav>

    <!-- 返回按钮 -->
    <div class="back-section">
      <button class="back-btn" @click="goBack">
        <span class="back-arrow">←</span> 返回上一页
      </button>
    </div>

    <!-- 页面加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 页面详情内容 -->
    <div v-else-if="page" class="detail-container">
      <div class="detail-header">
        <div class="category-badge" v-if="category">
          {{ category.category_name }}
        </div>
        <h1 class="page-title">{{ page.page_name }}</h1>
        <div class="page-meta">
          <span class="create-date">创建于：{{ formatDate(page.created_at) }}</span>
        </div>
      </div>

      <!-- 页面描述 -->
      <div class="page-description" v-if="page.page_description">
        <h2>页面描述</h2>
        <p>{{ page.page_description }}</p>
      </div>

      <!-- 页面链接 -->
      <div class="page-url-section" v-if="page.page_url">
        <h2>相关链接</h2>
        <a 
          :href="page.page_url" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="page-link"
        >
          <span class="link-icon">🔗</span>
          {{ page.page_url }}
        </a>
      </div>

      <!-- 相关页面 -->
      <div class="related-pages-section">
        <h2>相关页面</h2>
        <div v-if="relatedPages.length > 0" class="related-pages-list">
          <div v-for="relatedPage in relatedPages" :key="relatedPage.page_id" class="related-page-item">
            <router-link :to="`/page/${relatedPage.page_id}`" class="related-page-link">
              <h3>{{ relatedPage.page_name }}</h3>
              <p class="related-page-desc">{{ truncateDescription(relatedPage.page_description) }}</p>
            </router-link>
          </div>
        </div>
        <p v-else class="no-related">暂无相关页面</p>
      </div>

      <!-- 页面内容 -->
      <div class="page-content-section">
        <h2>页面内容</h2>
        <div class="page-content">
          <!-- 这里可以放置富文本内容 -->
          <div class="content-placeholder">
            <p>页面详情内容将显示在这里。</p>
            <p>如果您希望添加更多详细信息，可以编辑页面并添加相关内容。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-container">
      <div class="error-icon">❌</div>
      <h2>页面不存在</h2>
      <p>抱歉，您访问的页面不存在或已被删除。</p>
      <router-link to="/" class="home-link">返回首页</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// 状态管理
const isLoading = ref(true);
const page = ref(null);
const category = ref(null);
const relatedPages = ref([]);
const error = ref(null);

// 获取页面详情
const fetchPageDetails = async () => {
  const pageId = route.params.id;
  if (!pageId) {
    isLoading.value = false;
    return;
  }

  try {
    isLoading.value = true;
    // 获取页面信息
    const pageResponse = await fetch(`/api/pages/${pageId}`);
    if (!pageResponse.ok) {
      throw new Error('获取页面信息失败');
    }
    const pageData = await pageResponse.json();
    page.value = pageData;

    // 如果页面有分类，获取分类信息
    if (pageData.category_id) {
      const categoryResponse = await fetch(`/api/categories/${pageData.category_id}`);
      if (categoryResponse.ok) {
        category.value = await categoryResponse.json();
      }
    }

    // 获取相关页面（同分类下的其他页面）
    if (pageData.category_id) {
      const relatedResponse = await fetch(`/api/pages?category_id=${pageData.category_id}`);
      if (relatedResponse.ok) {
        const allPages = await relatedResponse.json();
        relatedPages.value = allPages.filter(p => p.page_id !== pageId).slice(0, 5);
      }
    }
  } catch (err) {
    console.error('获取页面详情失败:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// 截断描述
const truncateDescription = (description) => {
  if (!description) return '暂无描述';
  return description.length > 100 ? description.substring(0, 100) + '...' : description;
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 组件挂载时获取数据
onMounted(() => {
  fetchPageDetails();
});
</script>

<style scoped>
.page-detail {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 导航栏样式 */
.nav-bar {
  background-color: #2c3e50;
  color: white;
  padding: 15px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: white;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 30px;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-size: 16px;
  transition: color 0.3s;
}

.nav-link:hover {
  color: #3498db;
}

/* 返回按钮 */
.back-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  color: #333;
  transition: all 0.3s;
}

.back-btn:hover {
  background-color: #f8f9fa;
  border-color: #3498db;
  color: #3498db;
}

.back-arrow {
  font-size: 18px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 详情容器 */
.detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 60px;
}

/* 详情头部 */
.detail-header {
  background: white;
  padding: 40px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.category-badge {
  display: inline-block;
  background-color: #3498db;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  margin-bottom: 20px;
}

.page-title {
  font-size: 36px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0 0 20px 0;
  line-height: 1.3;
}

.page-meta {
  display: flex;
  gap: 30px;
  color: #7f8c8d;
  font-size: 14px;
}

/* 各部分内容样式 */
.page-description,
.page-url-section,
.related-pages-section,
.page-content-section {
  background: white;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.page-description h2,
.page-url-section h2,
.related-pages-section h2,
.page-content-section h2 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.page-description p {
  font-size: 16px;
  line-height: 1.8;
  color: #555;
  margin: 0;
}

/* 页面链接 */
.page-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
  color: #3498db;
  text-decoration: none;
  font-size: 16px;
  transition: all 0.3s;
  word-break: break-all;
}

.page-link:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.link-icon {
  font-size: 20px;
}

/* 相关页面 */
.related-pages-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.related-page-item {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
}

.related-page-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.related-page-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.related-page-link h3 {
  font-size: 18px;
  color: #2c3e50;
  margin: 0 0 10px 0;
  transition: color 0.3s;
}

.related-page-link:hover h3 {
  color: #3498db;
}

.related-page-desc {
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.6;
  margin: 0;
}

.no-related {
  color: #7f8c8d;
  text-align: center;
  padding: 40px 0;
  font-size: 16px;
}

/* 页面内容 */
.page-content {
  min-height: 300px;
}

.content-placeholder {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
  font-size: 16px;
  line-height: 1.8;
}

.content-placeholder p {
  margin: 10px 0;
}

/* 错误状态 */
.error-container {
  max-width: 800px;
  margin: 60px auto;
  padding: 60px 20px;
  text-align: center;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-container h2 {
  font-size: 28px;
  color: #e74c3c;
  margin: 0 0 15px 0;
}

.error-container p {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0 0 30px 0;
}

.home-link {
  display: inline-block;
  padding: 12px 30px;
  background-color: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-size: 16px;
  transition: background-color 0.3s;
}

.home-link:hover {
  background-color: #2980b9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-content {
    flex-direction: column;
    gap: 15px;
    padding: 0 15px;
  }

  .nav-links {
    gap: 20px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .detail-header {
    padding: 30px 20px;
  }

  .page-title {
    font-size: 28px;
  }

  .page-meta {
    flex-direction: column;
    gap: 10px;
  }

  .page-description,
  .page-url-section,
  .related-pages-section,
  .page-content-section {
    padding: 20px;
  }

  .related-pages-list {
    grid-template-columns: 1fr;
  }

  .content-placeholder {
    padding: 40px 15px;
  }
}
</style>