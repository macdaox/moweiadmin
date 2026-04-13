### 本地启动

1. 安装依赖

```bash
cd server
npm i
```

2. 启动

```bash
npm run dev
```

默认监听 `http://localhost:3000`。

### 环境变量（可选）

- `PORT`: 端口（默认 3000）
- `ADMIN_TOKEN`: 管理端查询 token（可选）

MySQL（配置后自动使用 MySQL 存储；否则使用本地 JSON 文件存储）：

- `MYSQL_HOST`
- `MYSQL_PORT`（默认 3306）
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

### 迁移本地 JSON 数据到 MySQL

前提：你已经在微信云托管里开通 MySQL（或任意 MySQL），并拿到连接信息。

1. 在本机设置环境变量（示例）

```bash
cd server
export MYSQL_HOST=你的host
export MYSQL_PORT=3306
export MYSQL_USER=你的user
export MYSQL_PASSWORD=你的password
export MYSQL_DATABASE=你的database
```

2. 执行迁移（会把 `server/data/*.json` 导入到 MySQL，重复执行会覆盖同 id 数据）

```bash
npm run migrate:mysql
```
