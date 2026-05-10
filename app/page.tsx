'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setReport('');
    setError('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: input }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '生成失败');
      } else {
        setReport(data.result);
      }
    } catch (e) {
      console.error(e);
      setError(String(e));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">📋 周报生成器</h1>
        <p className="text-gray-500 text-center mb-8">输入工作内容，自动生成专业周报</p>

        <textarea
          className="w-full h-40 p-4 border border-gray-300 rounded-lg mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="输入这周做的工作内容，例如：
- 完成了用户登录功能的开发
- 修复了3个bug
- 参加了产品评审会议
- 编写了技术文档"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '生成中...' : '生成周报'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {report && (
          <div className="mt-8">
            <h2 className="font-semibold mb-3">生成的周报：</h2>
            <pre className="bg-white p-6 border border-gray-200 rounded-lg whitespace-pre-wrap text-sm leading-relaxed">
              {report}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
