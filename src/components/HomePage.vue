<template>
  <div class="home-container">
    <!-- 导航栏 -->
    <header class="navbar">
      <div class="navbar-brand">
        <router-link to="/" class="logo"><h3>togowhere.xyz</h3></router-link>
      </div>
      <nav class="navbar-nav">
        <router-link to="/" class="nav-item">首页</router-link>
        <a href="#categories" class="nav-item">分类浏览</a>
        <a href="#pages" class="nav-item">页面浏览</a>
        <router-link to="/admin/categories" class="nav-item admin-link">分类管理</router-link>
        <router-link to="/admin/pages" class="nav-item admin-link">页面管理</router-link>
      </nav>
    </header>

    <!-- 英雄区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <h2>探索世界，发现美好</h2>
        <p>汇集全球旅游知识，为您的旅途提供全方位指南</p>
        <div class="search-box">
          <input type="text" placeholder="搜索旅游目的地或攻略..." v-model="searchQuery" />
          <button @click="handleSearch" class="search-btn">搜索</button>
        </div>
      </div>
    </section>

    <!-- 分类区域 -->
    <section class="categories-section">
      <div class="section-header">
        <h3>旅游分类</h3>
        <a href="#categories" class="view-more">查看全部</a>
      </div>
      <div class="categories-grid">
        <div v-for="category in categories" :key="category.category_id" class="category-card">
          <div class="category-content">
            <h4>{{ category.category_name }}</h4>
            <p>{{ category.category_note }}</p>
            <div class="category-stats">
              <span>页面数: {{ getCategoryPageCount(category.category_id) }}</span>
            </div>
            <router-link :to="`/category/${category.category_id}`" class="view-btn">查看页面</router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- 热门页面区域 -->
    <section class="popular-pages-section">
      <div class="section-header">
        <h3>热门页面</h3>
        <a href="#pages" class="view-more">查看全部</a>
      </div>
      <div class="pages-grid">
        <div v-for="page in popularPages" :key="page.page_id" class="page-card">
          <div class="page-content">
            <h4>{{ page.page_name }}</h4>
            <p class="page-description">{{ page.page_description }}</p>
            <div class="page-meta">
              <span class="category-tag">{{ page.category_name || '未分类' }}</span>
              <span class="created-time">{{ formatDate(page.created_at) }}</span>
            </div>
            <router-link :to="`/page/${page.page_id}`" class="read-btn">阅读详情</router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- 底部信息 -->
    <footer class="footer">
      <div class="footer-content">
        <p>&copy; 2025 togowhere.xyz. 保留所有权利。</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const categories = ref([]);
const pages = ref([]);
const searchQuery = ref('');

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await fetch('/api/categories');
    if (response.ok) {
      categories.value = await response.json();
    }
  } catch (error) {
    console.error('获取分类失败:', error);
  }
};

// 获取页面列表
const fetchPages = async () => {
  try {
    const response = await fetch('/api/pages');
    if (response.ok) {
      pages.value = await response.json();
    }
  } catch (error) {
    console.error('获取页面失败:', error);
  }
};

// 获取分类页面数量
const getCategoryPageCount = (categoryId) => {
  return pages.value.filter(page => page.category_id === categoryId).length;
};

// 获取热门页面（示例：返回最新的6个页面）
const popularPages = computed(() => {
  return pages.value.slice(0, 6);
});

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// 搜索处理
const handleSearch = () => {
  // 简单的搜索逻辑，实际项目中可能需要调用后端API
  console.log('搜索:', searchQuery.value);
  // 可以在这里添加搜索跳转逻辑
};

// 组件挂载时获取数据
onMounted(async () => {
  await fetchCategories();
  await fetchPages();
});
</script>

<style scoped>
/* 全局样式 */
.home-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: var(--text-primary);
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  background-color: var(--bg-primary);
}

/* 导航栏样式 - 优化版 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin: 10px 0;
  transition: all 0.3s ease;
}

.navbar:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.navbar-brand .logo {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: transform 0.3s ease;
}

.navbar-brand .logo:hover {
  transform: scale(1.05);
}

.navbar-brand h3 {
  margin: 0;
  font-size: 24px;
  color: var(--text-primary);
  font-weight: 700;
  background: linear-gradient(45deg, var(--accent-color), #7d5fff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
}

.navbar-brand h3::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-color), transparent);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.navbar-brand .logo:hover h3::after {
  transform: scaleX(1);
}

.navbar-nav {
  display: flex;
  gap: 25px;
  flex-wrap: wrap;
  align-items: center;
}

.nav-item {
  text-decoration: none;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 500;
  padding: 8px 15px;
  border-radius: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.nav-item:hover::before,
.nav-item.active::before {
  left: 100%;
}

.nav-item:hover,
.nav-item.active {
  color: var(--accent-color);
  background-color: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.admin-link {
  background-color: var(--accent-color);
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 600;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.admin-link:hover {
  background-color: var(--accent-hover);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

/* 英雄区域样式 */
.hero-section {
  background: linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%);
  color: var(--text-primary);
  padding: 100px 0;
  border-radius: 10px;
  margin: 30px 0;
  text-align: center;
  border: 1px solid var(--border-color);
}

.hero-content h2 {
  font-size: 48px;
  margin-bottom: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.hero-content p {
  font-size: 20px;
  margin-bottom: 30px;
  opacity: 0.9;
  color: var(--text-secondary);
}

.search-box {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
}

.search-box input {
  flex: 1;
  padding: 15px 20px;
  font-size: 16px;
  border: 1px solid var(--border-color);
  border-radius: 5px 0 0 5px;
  outline: none;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.search-btn {
  padding: 15px 30px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-left: none;
  border-radius: 0 5px 5px 0;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.search-btn:hover {
  background: var(--accent-color);
  color: white;
}

/* 分类区域样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.section-header h3 {
  font-size: 28px;
  color: var(--text-primary);
  margin: 0;
}

.view-more {
  color: var(--accent-color);
  text-decoration: none;
  font-size: 16px;
  transition: color 0.3s;
}

.view-more:hover {
  color: var(--accent-hover);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 60px;
}

.category-card {
  background: var(--bg-secondary);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  padding: 25px;
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid var(--border-color);
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
  border-color: var(--accent-color);
}

.category-content h4 {
  font-size: 20px;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.category-content p {
  color: var(--text-secondary);
  margin-bottom: 15px;
}

.category-stats {
  margin-bottom: 15px;
  font-size: 14px;
  color: var(--text-secondary);
}

.view-btn {
  display: inline-block;
  padding: 8px 16px;
  background: var(--accent-color);
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-size: 14px;
  transition: background 0.3s;
}

.view-btn:hover {
  background: var(--accent-hover);
}

/* 热门页面样式 */
.pages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
  margin-bottom: 60px;
}

.page-card {
  background: var(--bg-secondary);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  padding: 30px;
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid var(--border-color);
}

.page-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
  border-color: var(--accent-color);
}

.page-content h4 {
  font-size: 22px;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.page-description {
  color: var(--text-secondary);
  margin-bottom: 20px;
  height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.page-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
}

.category-tag {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 5px 10px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
}

.created-time {
  color: var(--text-secondary);
}

.read-btn {
  display: inline-block;
  padding: 10px 20px;
  background: var(--accent-color);
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-size: 16px;
  transition: background 0.3s;
}

.read-btn:hover {
  background: var(--accent-hover);
}

/* 底部样式 */
.footer {
  text-align: center;
  padding: 40px 0;
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
  background-color: var(--bg-secondary);
  border-radius: 10px 10px 0 0;
  margin-top: 40px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }

  .navbar-nav {
    gap: 15px;
    justify-content: center;
  }

  .nav-item {
    padding: 6px 12px;
    font-size: 15px;
  }

  .admin-link {
    padding: 6px 15px;
    font-size: 15px;
  }

  .hero-content h2 {
    font-size: 36px;
  }

  .hero-content p {
    font-size: 18px;
  }

  .search-box {
    flex-direction: column;
    max-width: 90%;
  }

  .search-box input {
    border-radius: 5px 5px 0 0;
    border: 1px solid var(--border-color);
  }

  .search-btn {
    border-radius: 0 0 5px 5px;
    border: 1px solid var(--border-color);
    border-top: none;
  }

  .categories-grid,
  .pages-grid {
    grid-template-columns: 1fr;
  }
}
</style>