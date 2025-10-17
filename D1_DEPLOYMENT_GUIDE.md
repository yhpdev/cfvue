# Cloudflare D1 数据库应用部署指南

本文档详细介绍如何部署并使用Vue + Cloudflare D1数据库应用。

## 1. 前提条件

- 安装Node.js和npm
- 安装Wrangler CLI：`npm install -g wrangler`
- Cloudflare账户
- 已登录Wrangler：`wrangler login`

## 2. 创建D1数据库

```bash
# 创建生产数据库
wrangler d1 create cfvue-database

# 创建预览数据库
wrangler d1 create cfvue-database-preview
```

运行上述命令后，会得到数据库ID，需要更新到wrangler.jsonc文件中。

## 3. 配置数据库连接

编辑 `wrangler.jsonc` 文件，将实际的数据库ID填入：

```json
{
  "name": "cfvue",
  "compatibility_date": "2025-10-17",
  "assets": {
    "directory": "./dist"
  },
  "main": "./src/worker.js",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "cfvue-database",
      "database_id": "实际的数据库ID",
      "preview_database_id": "预览数据库ID"
    }
  ]
}
```

## 4. 初始化数据库表结构

### 方法1：通过API初始化（推荐）

部署应用后，访问应用并运行以下API调用来初始化数据库：

```bash
# 初始化数据库表并添加示例数据
curl -X POST https://你的应用域名/api/init-db
```

### 方法2：使用Wrangler直接执行SQL

```bash
# 创建表
wrangler d1 execute cfvue-database --command "
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )"

# 添加示例数据
wrangler d1 execute cfvue-database --command "
  INSERT OR IGNORE INTO items (name) VALUES ('示例项目1'), ('示例项目2'), ('示例项目3')"
```

## 5. 构建Vue应用

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build
```

## 6. 部署到Cloudflare Pages

```bash
# 部署到Cloudflare Pages
wrangler pages deploy dist --project-name cfvue-vue-app
```

或者使用以下命令部署Worker和资产：

```bash
# 部署Worker（包含API和静态资源）
wrangler deploy
```

## 7. 本地开发环境设置

### 启动本地开发服务器

```bash
# 启动Vue开发服务器（前端）
npm run dev

# 在另一个终端启动Worker开发服务器（后端API）
wrangler dev
```

### 本地测试数据库API

```bash
# 测试获取所有项目
curl http://localhost:8787/api/items

# 测试添加项目
curl -X POST http://localhost:8787/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "新测试项目"}'
```

## 8. API端点说明

### GET /api/items
- 描述：获取所有项目
- 返回格式：项目数组

### POST /api/items
- 描述：添加新项目
- 请求体：`{"name": "项目名称"}`
- 返回：新创建的项目对象

### PUT /api/items/:id
- 描述：更新指定项目
- 请求体：`{"name": "新名称"}`
- 返回：更新后的项目对象

### DELETE /api/items/:id
- 描述：删除指定项目
- 返回：成功或错误信息

### POST /api/init-db
- 描述：初始化数据库表结构
- 返回：成功或错误信息

## 9. 故障排除

### 常见问题

1. **数据库连接错误**
   - 确认数据库ID正确
   - 检查数据库绑定名称是否为"DB"
   - 确认数据库已在Cloudflare控制面板中创建

2. **API调用失败**
   - 检查浏览器控制台错误
   - 确认CORS设置正确
   - 验证Worker已正确部署

3. **部署错误**
   - 确认dist目录已正确构建
   - 检查wrangler.jsonc配置文件
   - 验证Cloudflare账户权限

## 10. 注意事项

- 确保在生产环境中删除或限制`/api/init-db`端点的访问
- 考虑添加适当的错误处理和重试机制
- 对于生产环境，建议添加用户认证和授权
- 定期备份数据库

---

按照以上步骤操作，您应该能够成功部署和使用Vue + Cloudflare D1数据库应用。