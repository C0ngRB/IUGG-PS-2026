# IUGG-PS2026 会议官网

2nd IUGG Symposium on Planetary Sciences 官方网站。

## 项目结构

- `index.html` — 主页
- `auth.html` — 登录/注册
- `dashboard.html` — 用户仪表盘
- `payment.html` — 扫码付费
- `admin.html` — 管理员后台
- `css/styles.css` — 样式
- `js/auth.js` — 认证模块
- `js/admin.js` — 管理模块
- `server/` — Express 后端

## 部署

### 前端

静态文件直接部署到 Web 服务器，`css/`、`js/`、`images/` 和 HTML 文件放到同一目录。

### 后端

```bash
cd server
cp .env.example .env
# 编辑 .env 填写阿里云 RDS 连接信息和 JWT_SECRET
npm install
node migrate.js     # 创建数据库表
node seed.js        # 创建管理员账号
npm start           # 启动 API 服务（默认 3000 端口）
```

### 配置前端 API 地址

编辑 `js/auth.js` 中的 `API_BASE` 变量，改为后端实际部署地址。

### 管理员

预设管理员账号（密码见 .env 中的 ADMIN_DEFAULT_PASSWORD）：

- jgyan@whu.edu.cn
- denggaoqiu@whu.edu.cn
- miaodrb@whu.edu.cn
