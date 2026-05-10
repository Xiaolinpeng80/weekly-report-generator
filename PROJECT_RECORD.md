# 周报生成器项目记录

## 项目信息
- 项目名：weekly-report-generator
- GitHub：https://github.com/Xiaolinpeng80/weekly-report-generator
- 部署：https://weekly-report-generator-three.vercel.app
- 技术栈：Next.js 16 + TypeScript + Tailwind + Groq API + undici

---

## 踩坑记录

### 1. 模型停用
**问题**：`qwen-2.5-32b` 模型已停用，报错 `model not found`

**解决**：换成 `llama-3.3-70b-versatile`

---

### 2. 环境变量读取不到
**问题**：`.env.local` 文件有 Windows 回车符（\r\n），Next.js 无法正确解析

**解决**：
```bash
printf 'GROQ_API_KEY=xxx\n' > .env.local
```

---

### 3. 系统代理导致 403
**问题**：Windows 系统设置了 `HTTP_PROXY` 和 `HTTPS_PROXY` 环境变量（指向 127.0.0.1:7892），Node.js fetch 请求全部走代理，但代理对这个请求返回 403

**排查过程**：
- curl 走代理能通（curl 有 CONNECT 隧道支持）
- Node.js 原生 fetch 走代理返回 403
- Node.js undici + ProxyAgent 走代理能通
- 结论：curl 和 undici 的代理实现不同

**解决**：本地开发用 undici + 显式 ProxyAgent，生产环境（Vercel）不用代理

---

### 4. undici ProxyAgent 本地代理
**问题**：undici 不会继承系统环境变量，需要显式传入 dispatcher

**解决**：
```typescript
import { fetch, ProxyAgent } from 'undici';
const dispatcher = new ProxyAgent('http://127.0.0.1:7892');
fetch(url, { dispatcher });
```

---

### 5. Next.js 16 TypeScript 严格模式
**问题**：`response.json()` 返回 `unknown` 类型，直接访问 `data.choices` 报错

**解决**：定义接口并类型断言
```typescript
interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
}
const data = await response.json() as GroqResponse;
```

---

### 6. dev-server.js 路径问题
**问题**：Windows 下 `shell: false` 时 `./node_modules/.bin/next` 路径不存在

**解决**：使用 `shell: true` 或完整路径

---

### 7. Git 远程地址错误
**问题**：remote URL 包含中文 "你的用户名"

**解决**：
```bash
git remote set-url origin https://github.com/xiaolinpeng80/weekly-report-generator.git
```

---

## 项目结构
```
weekly-report-generator/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts      # API 路由（调用 Groq）
│   ├── layout.tsx
│   ├── page.tsx              # 首页
│   └── globals.css
├── lib/
│   └── groq.ts               # 旧版 SDK（已废弃）
├── .env.local                # 本地环境变量
├── package.json
└── next.config.js
```

---

## 关键代码

### API 路由 (app/api/generate/route.ts)
```typescript
import { NextResponse } from 'next/server';
import { fetch, ProxyAgent } from 'undici';

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export async function POST(request: Request) {
  try {
    const { summary } = await request.json();
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 500 });

    const dispatchOptions: { dispatcher?: ProxyAgent } = {};
    if (process.env.NODE_ENV === 'development') {
      dispatchOptions.dispatcher = new ProxyAgent('http://127.0.0.1:7892');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: '你是一个专业的周报生成助手...' },
          { role: 'user', content: `请将以下工作内容生成周报：\n${summary}` }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
      ...dispatchOptions
    });

    if (!response.ok) {
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json() as GroqResponse;
    return NextResponse.json({ result: data.choices?.[0]?.message?.content || '' });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

---

## 部署检查清单

### 本地开发
- [x] Node.js 安装
- [x] Next.js 项目创建
- [x] Groq API 集成
- [x] 环境变量配置
- [x] 本地测试通过

### GitHub
- [x] 创建仓库
- [x] 代码推送

### Vercel
- [x] Import 项目
- [x] 添加环境变量 GROQ_API_KEY
- [x] 部署成功
- [ ] 自定义域名（可选）

---

## 变现思路

### 方案 A：SaaS 订阅
- 免费：每天 3 次
- Pro：$9/月 无限次
- 工具：Stripe

### 方案 B：单次付费
- $1/次 或 $5/10次
- 工具：Stripe

### 方案 C：免费 + 捐赠
- 完全免费
- 支付宝/微信捐赠码

---

## 下一步

1. 选变现方案
2. 集成 Stripe
3. 添加支付按钮和用户系统
4. 监控和迭代
