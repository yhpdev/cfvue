<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup>
// App组件现在使用router-view来显示当前路由对应的组件
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.app-container {
  min-height: 100vh;
  background-color: var(--bg-primary);
  width: 100%;
}
</style>
