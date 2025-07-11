# PLC编程助手 - 俊杰工控PLC

专业的PLC编程AI辅助工具，集成用户认证系统和智能对话功能。

## 功能特点

- 🔐 **用户注册登录系统** - 安全的用户认证机制
- 🤖 **智能PLC编程助手** - 基于DeepSeek API的专业PLC问答
- 💬 **流式对话** - 实时打字效果，体验更流畅
- ⏱️ **响应计时** - 实时显示AI思考时间
- 🎯 **专业过滤** - 只回答PLC编程相关问题
- 📱 **响应式设计** - 支持桌面和移动端

## 技术栈

**前端：**
- HTML5 + CSS3 + JavaScript
- 响应式设计
- 本地存储（localStorage）

**后端：**
- Node.js + Express
- PostgreSQL 数据库
- JWT 身份验证
- bcrypt 密码加密

## 安装运行

### 本地开发

1. **安装依赖**
```bash
cd plc-ai-assistant
npm install
```

2. **配置环境变量**
复制 `.env` 文件并配置数据库连接：
```bash
cp .env.example .env
```

3. **启动服务器**
```bash
npm start
```

4. **访问应用**
打开浏览器访问：http://localhost:3000

### Render云服务器部署

本项目已配置为支持 Render 云服务器一键部署：

1. **连接GitHub仓库**
   - 将代码推送到GitHub仓库
   - 在 Render 控制台连接你的GitHub仓库

2. **自动部署**
   - Render 会自动检测 `render.yaml` 配置文件
   - 自动创建 PostgreSQL 数据库和 Web 服务
   - 设置必要的环境变量

3. **环境变量配置**
   - `DATABASE_URL`: 自动从PostgreSQL数据库获取
   - `JWT_SECRET`: 自动生成
   - `ADMIN_KEY`: 已设置为 plc-admin-2024
   - `NODE_ENV`: 设置为 production

## 文件结构

```
plc-ai-assistant/
├── index.html          # 主聊天页面
├── login.html          # 登录注册页面
├── style.css           # 主页面样式
├── login.css           # 登录页面样式
├── script.js           # 主页面逻辑
├── login.js            # 登录页面逻辑
├── server.js           # 后端服务器
├── package.json        # 项目配置
├── .env                # 环境变量配置
├── render.yaml         # Render部署配置
├── .gitignore          # Git忽略文件
└── README.md           # 项目说明
```

## 使用说明

### 首次使用
1. 打开应用会自动跳转到登录页面
2. 点击"注册"标签页创建新账户
3. 填写用户名（至少3字符）和密码（至少6字符）
4. 注册成功后可直接登录

### 登录使用
1. 输入注册时的用户名和密码
2. 登录成功后自动跳转到聊天页面
3. 开始与PLC编程助手对话

### PLC编程问答
- 只能询问PLC编程相关问题
- 支持多种PLC品牌（西门子、三菱、欧姆龙等）
- 包含梯形图、指令表、功能块等编程内容
- 询问AI模型时会直接回答而不调用API

## API配置

项目使用DeepSeek API提供AI对话服务：
- API Key: sk-111a4f87af724cd4b3a9c3e6bc8f85ab
- Base URL: https://api.deepseek.com

## 数据存储

用户数据存储在PostgreSQL数据库中：
- 用户名和密码（bcrypt加密）
- 问题次数和付费状态
- 注册时间和邮箱地址

## 安全特性

- 密码bcrypt加密存储
- JWT令牌身份验证  
- 会话有效期7天
- 前端路由保护
- API接口权限验证

## 开发者

俊杰工控PLC - 专业PLC编程解决方案提供商