import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;
  return NextResponse.json({
    hasKey: !!apiKey,
    keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : null
  });
}
