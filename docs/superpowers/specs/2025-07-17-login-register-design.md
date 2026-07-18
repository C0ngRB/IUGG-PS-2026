# IUGG-PS2026 登录/注册功能 — 设计文档

**日期**: 2025-07-17
**分支**: `feature/log`

---

## 1. 概述

为 IUGG-PS2026 学术会议官网增加登录/注册功能，包含：
- 参会者注册 / 登录
- 用户个人仪表盘
- 管理员后台（用户管理）
- 注册后扫码付费

## 2. 技术架构

```
前端 (SPA)
├── index.html          → 现有主页（导航栏增加 Log in / Register 入口）
├── auth.html           → 登录/注册页面
├── dashboard.html      → 用户仪表盘
├── payment.html        → 扫码付费页
├── admin.html          → 管理员后台
├── css/styles.css      → 现有样式 + 新增样式
├── script.js           → 现有脚本
└── js/auth.js          → 认证相关前端逻辑

后端 (Express API)
├── POST  /api/auth/register    → 注册
├── POST  /api/auth/login       → 登录
├── GET   /api/auth/me          → 获取当前用户
├── PUT   /api/auth/me          → 更新个人信息
├── GET   /api/admin/users      → 管理员：用户列表
└── GET   /api/admin/users/:id  → 管理员：用户详情

认证方式: JWT (JSON Web Token)
数据库:   阿里云 RDS MySQL
```

## 3. 数据模型

### users 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT UNSIGNED AUTO_INCREMENT | PK | 主键 |
| full_name | VARCHAR(100) | NOT NULL | 姓名 |
| email | VARCHAR(200) | UNIQUE NOT NULL | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 加密 |
| affiliation | VARCHAR(300) | NOT NULL | 单位/机构 |
| mobile | VARCHAR(30) | NOT NULL | 手机号 |
| participant_type | ENUM('student','regular') | NOT NULL | 参会类型 |
| oral_presentation | TINYINT(1) | NOT NULL | 是否口头报告 |
| job_title | VARCHAR(100) | NULL | 职称（仅中国专家） |
| role | ENUM('user','admin') | DEFAULT 'user' | 角色 |
| payment_status | ENUM('pending','paid') | DEFAULT 'pending' | 支付状态 |
| created_at | DATETIME | DEFAULT NOW() | 注册时间 |
| updated_at | DATETIME | ON UPDATE NOW() | 更新时间 |

### 预设管理员

| 邮箱 | 角色 |
|------|------|
| jgyan@whu.edu.cn | admin |
| denggaoqiu@whu.edu.cn | admin |
| miaodrb@whu.edu.cn | admin |

管理员账号通过数据库直接 INSERT，密码预设后告知甲方自行修改。

## 4. 页面设计

### 4.1 主页导航

- 桌面导航增加 "Log in / Register" 链接（最后一个 nav-link）
- 登录后显示用户名 + Dashboard 链接 + Log Out
- 移动端抽屉导航同样增加

### 4.2 登录/注册页 (auth.html)

- 选项卡切换：Log In / Register
- **Log In 表单**：Email + Password
- **Register 表单**：

| 字段 | 类型 | 必填 | 备注 |
|------|------|------|------|
| Full Name | text | ✅ | |
| Email | email | ✅ | 前端格式校验 |
| Affiliation | text | ✅ | |
| Mobile Number | tel | ✅ | |
| Participant Type | select | ✅ | Students 学生 / Regular 在职人员 |
| Oral Presentation | select | ✅ | Yes / No |
| Job Title | text | ❌ | 标注：仅中国专家填写 |
| Password | password | ✅ | 至少 8 位 |
| Confirm Password | password | ✅ | 与 Password 一致校验 |

- 注册成功后自动登录，跳转至付费页面

### 4.3 用户仪表盘 (dashboard.html)

三卡布局：
- **Registration Status**：参会类型、是否报告、注册日期
- **Payment Status**：费用金额、支付状态、支付入口
- **Profile**：完整个人信息、编辑入口

顶栏显示用户名和邮箱，Log Out 按钮。

### 4.4 扫码付费页 (payment.html)

- 金额展示：¥2,000 CNY（Regular）/ ¥1,000 CNY（Student）
- 付费说明：占位待甲方提供
- 二维码：images/QR.jpg
- 提示：支付后 1-2 工作日确认
- 按钮：Go to Dashboard / Pay Later

### 4.5 管理员后台 (admin.html)

- 选项卡：Users / Payments
- Users：用户列表（分页）+ 搜索 + 类型/支付状态筛选 + Export CSV
- Payments：支付记录管理（后续扩展）
- 点击用户名可查看详情

## 5. 视觉风格

与现有主页统一：
- 主色：`#0b2341`（深蓝）
- 强调色：`#ffb547`（金色）
- 链接：`#0055aa`
- 背景：`#f4f6f8`
- 字体：`-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif`
- 按钮：圆角 pill 形状（border-radius: 20px）
- 卡片：白底 + `#d0d7e2` 边框 + 8px 圆角

## 6. 后端 API

### POST /api/auth/register
- 请求体：`{ full_name, email, password, affiliation, mobile, participant_type, oral_presentation, job_title? }`
- 校验：邮箱格式、密码长度 ≥ 8、Confirm Password 一致、必填字段不为空
- 返回：JWT token + 用户信息
- 密码：bcrypt 加盐哈希

### POST /api/auth/login
- 请求体：`{ email, password }`
- 返回：JWT token + 用户信息

### GET /api/auth/me
- Header：`Authorization: Bearer <token>`
- 返回：当前用户信息

### PUT /api/auth/me
- 可更新字段：`full_name, affiliation, mobile, job_title`
- 不可更新：`email, participant_type, oral_presentation, role`

### GET /api/admin/users
- 管理员权限验证
- 支持查询参数：`?search=`, `?type=`, `?payment=`, `?page=`, `?limit=`

### GET /api/admin/users/:id
- 管理员权限验证
- 返回单个用户完整信息

## 7. 目录结构

```
project-root/
├── index.html
├── auth.html              # 新增
├── dashboard.html         # 新增
├── payment.html           # 新增
├── admin.html             # 新增
├── css/
│   └── styles.css         # 扩展
├── js/
│   ├── auth.js            # 新增：认证逻辑
│   └── admin.js           # 新增：管理员逻辑
├── images/
│   ├── conference.png
│   └── QR.jpg             # 新增
├── server/                # 新增：后端
│   ├── index.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── admin.js
│   ├── db.js
│   └── package.json
└── README.md
```

## 8. 待定事项

- 付费说明文本（待甲方提供）
- 阿里云 RDS 连接信息（待甲方提供）
- 管理员初始密码设定
- 扫码付费后的支付确认机制（手动验证 vs 自动回调）
