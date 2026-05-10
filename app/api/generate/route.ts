import { NextResponse } from 'next/server';
import { fetch, ProxyAgent } from 'undici';

export async function POST(request: Request) {
  try {
    const { summary } = await request.json();

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    const dispatcher = new ProxyAgent('http://127.0.0.1:7892');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {role: 'system', content: '你是一个专业的周报生成助手，根据工作内容摘要生成简洁专业的周报，使用 Markdown 格式输出。'},
          {role: 'user', content: `请将以下工作内容生成周报：\n${summary}`}
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
      dispatcher
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `API error: ${response.status} - ${error}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ result: data.choices?.[0]?.message?.content || '' });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
