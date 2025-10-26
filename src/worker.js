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
    // ===== 分类表API =====
    // 获取所有分类
    if (pathname === '/api/categories' && request.method === 'GET') {
      try {
        const db = env.cfvue_database || env.cfvue_database_preview;
        const { results } = await db.prepare('SELECT * FROM categories ORDER BY category_order ASC, category_id ASC').all();
        return new Response(JSON.stringify(results), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('获取分类失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // 添加分类
    if (pathname === '/api/categories' && request.method === 'POST') {
      try {
        const data = await request.json();
        if (!data.category_name || typeof data.category_name !== 'string') {
          return new Response(JSON.stringify({ error: '分类名称不能为空' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        const db = env.cfvue_database || env.cfvue_database_preview;
        const { success } = await db.prepare(
          'INSERT INTO categories (category_name, category_order, category_note) VALUES (?, ?, ?)'
        ).bind(data.category_name, data.category_order || 0, data.category_note || '').run();
        
        if (success) {
          const { results } = await db.prepare(
            'SELECT * FROM categories WHERE category_id = last_insert_rowid()'
          ).all();
          return new Response(JSON.stringify(results[0]), {
            status: 201,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      } catch (error) {
        console.error('添加分类失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // 更新分类
    if (pathname.match(/^\/api\/categories\/\d+$/) && request.method === 'PUT') {
      try {
        const category_id = parseInt(pathname.split('/').pop());
        const data = await request.json();
        
        if (!data.category_name || typeof data.category_name !== 'string') {
          return new Response(JSON.stringify({ error: '分类名称不能为空' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        const db = env.cfvue_database || env.cfvue_database_preview;
        const { meta } = await db.prepare(
          'UPDATE categories SET category_name = ?, category_order = ?, category_note = ? WHERE category_id = ?'
        ).bind(data.category_name, data.category_order || 0, data.category_note || '', category_id).run();
        
        if (meta.changes === 0) {
          return new Response(JSON.stringify({ error: '分类不存在' }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        const { results } = await db.prepare(
          'SELECT * FROM categories WHERE category_id = ?'
        ).bind(category_id).all();
        return new Response(JSON.stringify(results[0]), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('更新分类失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // 删除分类
    if (pathname.match(/^\/api\/categories\/\d+$/) && request.method === 'DELETE') {
      try {
        const category_id = parseInt(pathname.split('/').pop());
        const db = env.cfvue_database || env.cfvue_database_preview;
        
        // 检查是否有页面使用该分类
        const { results } = await db.prepare(
          'SELECT COUNT(*) as count FROM pages WHERE category_id = ?'
        ).bind(category_id).all();
        
        if (results[0].count > 0) {
          return new Response(JSON.stringify({ error: '该分类下还有页面，无法删除' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        const { meta } = await db.prepare(
          'DELETE FROM categories WHERE category_id = ?'
        ).bind(category_id).run();
        
        if (meta.changes === 0) {
          return new Response(JSON.stringify({ error: '分类不存在' }), {
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
        console.error('删除分类失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // ===== 页面表API =====
    // 获取所有页面
    if (pathname === '/api/pages' && request.method === 'GET') {
      try {
        const db = env.cfvue_database || env.cfvue_database_preview;
        const { results } = await db.prepare(
          'SELECT p.*, c.category_name FROM pages p LEFT JOIN categories c ON p.category_id = c.category_id ORDER BY p.page_id DESC'
        ).all();
        return new Response(JSON.stringify(results), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('获取页面失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // 根据分类获取页面
    if (pathname.match(/^\/api\/categories\/\d+\/pages$/) && request.method === 'GET') {
      try {
        const category_id = parseInt(pathname.split('/')[3]);
        const db = env.cfvue_database || env.cfvue_database_preview;
        const { results } = await db.prepare(
          'SELECT * FROM pages WHERE category_id = ? ORDER BY page_id DESC'
        ).bind(category_id).all();
        return new Response(JSON.stringify(results), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('获取分类页面失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // 添加页面
    if (pathname === '/api/pages' && request.method === 'POST') {
      try {
        const data = await request.json();
        if (!data.page_name || typeof data.page_name !== 'string') {
          return new Response(JSON.stringify({ error: '页面名称不能为空' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        if (!data.page_url || typeof data.page_url !== 'string') {
          return new Response(JSON.stringify({ error: '页面地址不能为空' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        const db = env.cfvue_database || env.cfvue_database_preview;
        const { success } = await db.prepare(
          'INSERT INTO pages (page_name, page_description, page_url, category_id) VALUES (?, ?, ?, ?)'
        ).bind(data.page_name, data.page_description || '', data.page_url, data.category_id || null).run();
        
        if (success) {
          const { results } = await db.prepare(
            'SELECT * FROM pages WHERE page_id = last_insert_rowid()'
          ).all();
          return new Response(JSON.stringify(results[0]), {
            status: 201,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      } catch (error) {
        console.error('添加页面失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // 获取单个页面详情
    if (pathname.match(/^\/api\/pages\/\d+$/) && request.method === 'GET') {
      try {
        const page_id = parseInt(pathname.split('/').pop());
        const db = env.cfvue_database || env.cfvue_database_preview;
        const { results } = await db.prepare(
          'SELECT p.*, c.category_name FROM pages p LEFT JOIN categories c ON p.category_id = c.category_id WHERE p.page_id = ?'
        ).bind(page_id).all();
        
        if (results.length === 0) {
          return new Response(JSON.stringify({ error: '页面不存在' }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        return new Response(JSON.stringify(results[0]), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('获取页面详情失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // 更新页面
    if (pathname.match(/^\/api\/pages\/\d+$/) && request.method === 'PUT') {
      try {
        const page_id = parseInt(pathname.split('/').pop());
        const data = await request.json();
        
        if (!data.page_name || typeof data.page_name !== 'string') {
          return new Response(JSON.stringify({ error: '页面名称不能为空' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        if (!data.page_url || typeof data.page_url !== 'string') {
          return new Response(JSON.stringify({ error: '页面地址不能为空' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        const db = env.cfvue_database || env.cfvue_database_preview;
        const { meta } = await db.prepare(
          'UPDATE pages SET page_name = ?, page_description = ?, page_url = ?, category_id = ? WHERE page_id = ?'
        ).bind(data.page_name, data.page_description || '', data.page_url, data.category_id || null, page_id).run();
        
        if (meta.changes === 0) {
          return new Response(JSON.stringify({ error: '页面不存在' }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        const { results } = await db.prepare(
          'SELECT p.*, c.category_name FROM pages p LEFT JOIN categories c ON p.category_id = c.category_id WHERE p.page_id = ?'
        ).bind(page_id).all();
        return new Response(JSON.stringify(results[0]), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('更新页面失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // 删除页面
    if (pathname.match(/^\/api\/pages\/\d+$/) && request.method === 'DELETE') {
      try {
        const page_id = parseInt(pathname.split('/').pop());
        const db = env.cfvue_database || env.cfvue_database_preview;
        
        const { meta } = await db.prepare(
          'DELETE FROM pages WHERE page_id = ?'
        ).bind(page_id).run();
        
        if (meta.changes === 0) {
          return new Response(JSON.stringify({ error: '页面不存在' }), {
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
        console.error('删除页面失败:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // ===== 原有的items API（保留以保持兼容性） =====
    // 获取所有项目
    if (pathname === '/api/items' && request.method === 'GET') {
      try {
        // 使用正确的数据库绑定名称
        const db = env.cfvue_database || env.cfvue_database_preview;
        
        // 确保表存在
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            content TEXT,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        
        const { results } = await db.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
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
        
        // 使用正确的数据库绑定名称
        const db = env.cfvue_database || env.cfvue_database_preview;
        
        // 确保表存在
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            content TEXT,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        const { success } = await db.prepare(
          'INSERT INTO items (name, content, url, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
        ).bind(data.name, data.content || '', data.url || '').run();
        
        if (success) {
          // 获取插入的行
          const { results } = await db.prepare(
            'SELECT * FROM items WHERE id = last_insert_rowid()'
          ).all();
          const insertedItem = results[0];
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
        
        // 使用正确的数据库绑定名称
        const db = env.cfvue_database || env.cfvue_database_preview;
        
        // 确保表存在
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            content TEXT,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        const { meta } = await db.prepare(
          'UPDATE items SET name = ?, content = ?, url = ? WHERE id = ?'
        ).bind(data.name, data.content || '', data.url || '', id).run();
        
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
        const { results } = await db.prepare(
          'SELECT * FROM items WHERE id = ?'
        ).bind(id).all();
        const updatedItem = results[0];
        
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
        
        // 使用正确的数据库绑定名称
        const db = env.cfvue_database || env.cfvue_database_preview;
        
        // 确保表存在
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            content TEXT,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        const { meta } = await db.prepare(
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
        // 使用正确的数据库绑定名称
        const db = env.cfvue_database || env.cfvue_database_preview;
        
        // 创建分类表
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS categories (
            category_id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_name TEXT NOT NULL,
            category_order INTEGER DEFAULT 0,
            category_note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        
        // 创建页面表
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS pages (
            page_id INTEGER PRIMARY KEY AUTOINCREMENT,
            page_name TEXT NOT NULL,
            page_description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            page_url TEXT NOT NULL,
            category_id INTEGER,
            FOREIGN KEY (category_id) REFERENCES categories(category_id)
          )
        `).run();
        
        // 插入一些示例分类数据
        await db.prepare(
          'INSERT OR IGNORE INTO categories (category_name, category_order, category_note) VALUES (?, ?, ?)'
        ).bind('景点介绍', 1, '各种旅游景点的详细介绍').run();
        await db.prepare(
          'INSERT OR IGNORE INTO categories (category_name, category_order, category_note) VALUES (?, ?, ?)'
        ).bind('美食推荐', 2, '各地特色美食介绍').run();
        await db.prepare(
          'INSERT OR IGNORE INTO categories (category_name, category_order, category_note) VALUES (?, ?, ?)'
        ).bind('旅行攻略', 3, '旅行计划和攻略分享').run();
        
        // 插入一些示例页面数据
        await db.prepare(
          'INSERT OR IGNORE INTO pages (page_name, page_description, page_url, category_id) VALUES (?, ?, ?, ?)'
        ).bind('故宫博物院', '中国明清两代的皇家宫殿', '/pages/forbidden-city', 1).run();
        await db.prepare(
          'INSERT OR IGNORE INTO pages (page_name, page_description, page_url, category_id) VALUES (?, ?, ?, ?)'
        ).bind('北京烤鸭', '北京传统名菜', '/pages/beijing-duck', 2).run();
        await db.prepare(
          'INSERT OR IGNORE INTO pages (page_name, page_description, page_url, category_id) VALUES (?, ?, ?, ?)'
        ).bind('北京三日游', '经典北京三日游行程', '/pages/beijing-trip', 3).run();
        
        return new Response(JSON.stringify({ success: true, message: '数据库初始化成功，已创建分类表和页面表' }), {
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