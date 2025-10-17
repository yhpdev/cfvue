// Cloudflare Worker - D1数据库API

/**
 * Cloudflare Worker 处理函数
 */
export default {
  async fetch(request, env, ctx) {
    // 路由处理
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // CORS设置
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // 处理OPTIONS请求
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      });
    }
    
    // API路由处理
    // 获取所有项目
    if (pathname === '/api/items' && request.method === 'GET') {
      try {
        const { results } = await env.DB.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
        return new Response(JSON.stringify(results), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('获取项目失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // 添加新项目
    if (pathname === '/api/items' && request.method === 'POST') {
      try {
        const data = await request.json();
        if (!data.name || typeof data.name !== 'string') {
          return new Response(JSON.stringify({ error: '名称不能为空' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        const { success, results } = await env.DB.prepare(
          'INSERT INTO items (name, created_at) VALUES (?, CURRENT_TIMESTAMP) RETURNING *'
        ).bind(data.name).run();
        
        if (success) {
          // 获取插入的行
          const insertedItem = await env.DB.prepare(
            'SELECT * FROM items WHERE id = last_insert_rowid()'
          ).get();
          return new Response(JSON.stringify(insertedItem), {
            status: 201,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        } else {
          throw new Error('插入失败');
        }
      } catch (error) {
        console.error('添加项目失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // 更新项目
    if (pathname.match(/^\/api\/items\/\d+$/) && request.method === 'PUT') {
      try {
        const id = parseInt(pathname.split('/').pop());
        const data = await request.json();
        
        if (!data.name || typeof data.name !== 'string') {
          return new Response(JSON.stringify({ error: '名称不能为空' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        const { success, meta } = await env.DB.prepare(
          'UPDATE items SET name = ? WHERE id = ?'
        ).bind(data.name, id).run();
        
        if (meta.changes === 0) {
          return new Response(JSON.stringify({ error: '项目不存在' }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        // 获取更新后的行
        const updatedItem = await env.DB.prepare(
          'SELECT * FROM items WHERE id = ?'
        ).bind(id).get();
        
        return new Response(JSON.stringify(updatedItem), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('更新项目失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // 删除项目
    if (pathname.match(/^\/api\/items\/\d+$/) && request.method === 'DELETE') {
      try {
        const id = parseInt(pathname.split('/').pop());
        
        const { success, meta } = await env.DB.prepare(
          'DELETE FROM items WHERE id = ?'
        ).bind(id).run();
        
        if (meta.changes === 0) {
          return new Response(JSON.stringify({ error: '项目不存在' }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        return new Response(JSON.stringify({ success: true }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('删除项目失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // 数据库初始化端点（仅用于开发）
    if (pathname === '/api/init-db' && request.method === 'POST') {
      try {
        // 创建表（如果不存在）
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        
        // 插入一些示例数据
        await env.DB.prepare(
          'INSERT OR IGNORE INTO items (name) VALUES (?), (?), (?)'
        ).bind('示例项目1', '示例项目2', '示例项目3').run();
        
        return new Response(JSON.stringify({ success: true, message: '数据库初始化成功' }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('数据库初始化失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // 未找到路由
    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders,
    });
  },
};

/**
 * 环境类型定义（TypeScript）
 */
/**
type Env = {
  DB: D1Database;
};
*/