import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import prisma from '@/lib/prisma'; // Ensure this matches your prisma path

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || query.length < 3) {
      return NextResponse.json({ error: "Query too short" }, { status: 400 });
    }

    // 1. Fetch available Tests & Packages (Names & Descriptions only)
    // We limit fields to minimize token usage
    const [tests, packages] = await Promise.all([
      prisma.test.findMany({
        where: { isActive: true },
        select: { id: true, testName: true, description: true, category: true }
      }),
      prisma.package.findMany({
        where: { isActive: true },
        select: { id: true, packageName: true, description: true }
      })
    ]);

    // 2. Prepare Context for AI
    const availableTests = [
      ...tests.map(t => ({ id: t.id, type: 'test', name: t.testName, desc: t.description })),
      ...packages.map(p => ({ id: p.id, type: 'package', name: p.packageName, desc: p.description }))
    ];

    // 3. Ask OpenAI to match symptoms
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are a Medical Search Assistant. Map the user's symptoms to the most relevant diagnostic tests from the provided list.

**RULES:**
1. Return a JSON object with a "matches" array.
2. Select top 3-5 most relevant items.
3. "reason" must be a short, persuasive explanation of why this test is needed.
4. "confidence" should be 'High', 'Medium', or 'Low'.

**AVAILABLE INVENTORY:**
${JSON.stringify(availableTests)}
          `
        },
        {
          role: "user",
          content: `User query: "${query}"`
        }
      ]
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json(result);

  } catch (error) {
    console.error("AI Search Error:", error);
    return NextResponse.json({ error: "Failed to analyze symptoms" }, { status: 500 });
  }
}