# 安全策略 (Security Policy)

## 架构说明

**Wanderlust AI Planner** 是一个**前端应用**，具有特定的安全含义。

### 已知限制

1. **API 密钥暴露**：API 密钥在客户端使用，可在浏览器开发者工具中看到
2. **无服务端验证**：所有验证都在客户端进行
3. **CORS 要求**：必须配置 API 提供商允许你的域名

### 缓解策略

#### 对于个人使用
- ✅ 使用有配额限制的 API 密钥
- ✅ 定期监控 API 使用情况
- ✅ 定期轮换 API 密钥

#### 对于生产部署
如需部署到生产环境，强烈建议：

1. **实现后端代理**
   - 将所有 API 调用通过后端服务转发
   - 在后端存储和管理 API 密钥
   - 实现速率限制和请求签名

2. **添加认证和授权**
   - 实现用户认证系统
   - 添加使用配额管理
   - 实现请求审计日志

3. **使用 CDN**
   - 静态资源通过 CDN 分发
   - 减轻服务器负载

### 报告漏洞

如果你发现安全漏洞，请私下报告：
- 📧 Email: security@example.com
- 🔐 请勿在公开 issue 中报告安全漏洞

### 安全最佳实践

#### 开发环境
- ✅ 使用 `.env.local` 存储密钥（已添加到 `.gitignore`）
- ✅ 不要提交 `.env.local` 到版本控制
- ✅ 使用 `.env.example` 作为模板

#### 生产环境
- ⚠️ 当前架构**不适合**无限制的公共访问
- ⚠️ API 密钥会被暴露给所有用户
- ⚠️ 需要实施额外的安全措施

### 当前已实施的安全措施

| 措施 | 状态 |
|------|------|
| postMessage 来源验证 | ✅ 已实施 |
| 文件上传大小限制 | ✅ 已实施 |
| 文件类型验证 | ✅ 已实施 |
| API 密钥环境变量 | ✅ 已实施 |
| 错误处理和日志 | ✅ 已实施 |
| Content Security Policy | ⚠️ 建议添加 |
| HTTPS 强制 | ⚠️ 需配置 |

### 推荐的安全配置

#### 1. API 提供商配置

对于使用的每个 API，建议：

**GLM-4.7 (智谱AI)**
- 启用量额限制
- 设置每日调用上限
- 监控异常使用模式

**Pexels / Pixabay**
- 使用免费开发密钥
- 设置引用来源限制
- 启用速率限制

**高德地图**
- 设置服务 IP 白名单（如果有后端）
- 限制每日请求次数

#### 2. 浏览器安全头

建议在生产环境添加：

```
Content-Security-Policy: default-src 'self'; connect-src 'self' https://open.bigmodel.cn https://api.pexels.com https://pixabay.com https://restapi.amap.com; img-src 'self' https: data:;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### 免责声明

此应用为演示项目，展示了现代前端技术与 AI 的结合。对于生产使用，请根据你的具体需求实施适当的安全措施。

---

**最后更新**: 2026-01-09
