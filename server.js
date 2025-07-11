require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'plc-ai-assistant-secret-key-2024';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// PostgreSQL数据库连接
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 数据库初始化
async function initializeDatabase() {
    try {
        // 创建用户表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                questions_remaining INTEGER DEFAULT 2,
                is_premium BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('数据库表创建成功');
    } catch (err) {
        console.error('数据库初始化失败:', err);
    }
}

// 初始化数据库
initializeDatabase();

// 验证JWT令牌的中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: '访问令牌缺失' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: '令牌无效' });
        }
        req.user = user;
        next();
    });
};

// 路由：用户注册
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;

    // 验证输入
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: '用户名和密码不能为空' 
        });
    }

    if (username.length < 3) {
        return res.status(400).json({ 
            success: false, 
            message: '用户名至少需要3个字符' 
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: '密码至少需要6个字符' 
        });
    }

    try {
        // 检查用户名是否已存在
        const userCheck = await pool.query('SELECT username FROM users WHERE username = $1', [username]);
        
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: '用户名已存在' 
            });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 插入新用户
        await pool.query(
            'INSERT INTO users (username, password, email, questions_remaining, is_premium) VALUES ($1, $2, $3, $4, $5)',
            [username, hashedPassword, email || null, 2, false]
        );

        res.json({ 
            success: true, 
            message: '注册成功！请登录' 
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ 
            success: false, 
            message: '服务器错误' 
        });
    }
});

// 路由：用户登录
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: '用户名和密码不能为空' 
        });
    }

    try {
        // 查找用户
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: '用户名或密码错误' 
            });
        }

        const user = result.rows[0];

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(400).json({ 
                success: false, 
                message: '用户名或密码错误' 
            });
        }

        // 生成JWT令牌
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ 
            success: true, 
            message: '登录成功',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ 
            success: false, 
            message: '服务器错误' 
        });
    }
});

// 路由：验证令牌
app.get('/api/verify', authenticateToken, (req, res) => {
    res.json({ 
        success: true, 
        user: req.user 
    });
});

// 路由：获取用户信息
app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, questions_remaining, is_premium, created_at FROM users WHERE id = $1', 
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: '用户不存在' 
            });
        }

        res.json({ 
            success: true, 
            user: result.rows[0] 
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ 
            success: false, 
            message: '数据库错误' 
        });
    }
});

// 路由：检查问题次数
app.get('/api/check-questions', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT questions_remaining, is_premium FROM users WHERE id = $1', 
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: '用户不存在' 
            });
        }

        const user = result.rows[0];
        const canAsk = user.is_premium || user.questions_remaining > 0;
        
        res.json({ 
            success: true, 
            canAsk: canAsk,
            questionsRemaining: user.questions_remaining,
            isPremium: user.is_premium
        });
    } catch (error) {
        console.error('检查问题次数错误:', error);
        res.status(500).json({ 
            success: false, 
            message: '数据库错误' 
        });
    }
});

// 路由：消费问题次数
app.post('/api/use-question', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT questions_remaining, is_premium FROM users WHERE id = $1', 
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: '用户不存在' 
            });
        }

        const user = result.rows[0];

        // 付费用户无限制
        if (user.is_premium) {
            return res.json({ 
                success: true, 
                questionsRemaining: -1,
                isPremium: true
            });
        }

        // 检查免费次数
        if (user.questions_remaining <= 0) {
            return res.status(403).json({ 
                success: false, 
                message: '免费提问次数已用完，请升级账户',
                needUpgrade: true
            });
        }

        // 减少问题次数
        await pool.query(
            'UPDATE users SET questions_remaining = questions_remaining - 1 WHERE id = $1', 
            [req.user.id]
        );

        res.json({ 
            success: true, 
            questionsRemaining: user.questions_remaining - 1,
            isPremium: false
        });
    } catch (error) {
        console.error('消费问题次数错误:', error);
        res.status(500).json({ 
            success: false, 
            message: '数据库错误' 
        });
    }
});

// 路由：管理员更新用户问题次数
app.post('/api/admin/update-questions', async (req, res) => {
    const { adminKey, username, questionsToAdd, setPremium } = req.body;
    
    // 简单的管理员验证
    if (adminKey !== (process.env.ADMIN_KEY || 'plc-admin-2024')) {
        return res.status(403).json({ 
            success: false, 
            message: '管理员权限验证失败' 
        });
    }

    if (!username) {
        return res.status(400).json({ 
            success: false, 
            message: '用户名不能为空' 
        });
    }

    try {
        let query;
        let params;

        if (setPremium !== undefined) {
            // 设置/取消付费用户
            query = 'UPDATE users SET is_premium = $1 WHERE username = $2';
            params = [setPremium, username];
        } else if (questionsToAdd !== undefined) {
            // 增加问题次数
            query = 'UPDATE users SET questions_remaining = questions_remaining + $1 WHERE username = $2';
            params = [parseInt(questionsToAdd), username];
        } else {
            return res.status(400).json({ 
                success: false, 
                message: '请提供要更新的数据' 
            });
        }

        const result = await pool.query(query, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: '用户不存在' 
            });
        }

        res.json({ 
            success: true, 
            message: '更新成功' 
        });
    } catch (error) {
        console.error('管理员更新错误:', error);
        res.status(500).json({ 
            success: false, 
            message: '数据库错误' 
        });
    }
});

// 路由：管理员获取用户列表
app.post('/api/admin/get-users', async (req, res) => {
    const { adminKey } = req.body;
    
    // 验证管理员权限
    if (adminKey !== (process.env.ADMIN_KEY || 'plc-admin-2024')) {
        return res.status(403).json({ 
            success: false, 
            message: '管理员权限验证失败' 
        });
    }
    
    try {
        // 获取所有用户信息（不包含密码）
        const result = await pool.query(`
            SELECT 
                id, 
                username, 
                email, 
                questions_remaining, 
                is_premium, 
                created_at,
                '已加密' as password_status
            FROM users 
            ORDER BY created_at DESC
        `);

        res.json({ 
            success: true, 
            users: result.rows 
        });
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({ 
            success: false, 
            message: '数据库错误' 
        });
    }
});

// 默认路由 - 重定向到登录页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: '页面未找到' 
    });
});

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n正在关闭服务器...');
    try {
        await pool.end();
        console.log('数据库连接已关闭');
    } catch (err) {
        console.error('关闭数据库连接时出错:', err);
    }
    process.exit(0);
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`PLC编程助手服务器运行在端口 ${PORT}`);
});