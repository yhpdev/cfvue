import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './components/HomePage.vue';
import CategoryManagement from './components/CategoryManagement.vue';
import PageManagement from './components/PageManagement.vue';
import PageDetail from './components/PageDetail.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/admin/categories',
    name: 'CategoryManagement',
    component: CategoryManagement
  },
  {
    path: '/admin/pages',
    name: 'PageManagement',
    component: PageManagement
  },
  {
    path: '/page/:id',
    name: 'PageDetail',
    component: PageDetail
  },
  // 捕获所有未匹配的路由，重定向到首页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'  
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;