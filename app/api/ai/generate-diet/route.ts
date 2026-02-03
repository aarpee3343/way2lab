import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    // 1. Get Current Order
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!currentOrder) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // 2. Fetch History (Strict 30 Days Limit)
    const timeLimit = new Date();
    timeLimit.setDate(timeLimit.getDate() - 30);

    const history = await prisma.order.findMany({
      where: {
        userId: currentOrder.userId,
        // Remove 'COMPLETED' filter to allow Partial reports to be analyzed too
        reports: { some: {} }, 
        createdAt: { gte: timeLimit },
      },
      orderBy: { createdAt: 'desc' },
      include: { reportSummary: true }
    });

    const reportCount = history.length; 
    
    // 3. Build Unique Data Fingerprint
    const sortedHistory = history.sort((a, b) => a.id - b.id);
    let combinedContext = "";
    let analyzedCount = 0;

    sortedHistory.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (order.reportSummary?.content) {
        analyzedCount++;
        try {
          const json = JSON.parse(order.reportSummary.content);
          const abnormal = json.results?.filter((r: any) => r.status !== 'Normal') || [];
          if (abnormal.length > 0) {
            combinedContext += `|${date}:${JSON.stringify(abnormal)}`;
          }
        } catch (e) {}
      }
    });

    // 4. THE SMART LOCK (Hashing)
    const currentDataHash = crypto.createHash('md5').update(combinedContext || "empty").digest('hex');

    const existingSummaryRaw = await prisma.orderReportSummary.findUnique({
      where: { orderId: currentOrder.id }
    });

    // If Data Hasn't Changed, Return Cache
    if (existingSummaryRaw) {
       try {
         const existingJson = JSON.parse(existingSummaryRaw.content);
         if (existingJson.dataHash === currentDataHash && existingJson.healthScore) {
           return NextResponse.json({ ...existingJson, cached: true });
         }
       } catch(e) {}
    }

    // --- RUN AI --- //

    // 5. Fetch Inventory
    const [tests, packages] = await Promise.all([
      prisma.test.findMany({ 
        where: { isActive: true },
        select: { id: true, testName: true, price: true, description: true }
      }),
      prisma.package.findMany({
        where: { isActive: true },
        select: { id: true, packageName: true, price: true, description: true }
      })
    ]);

    const inventory = [
      ...tests.map(t => ({ id: t.id, type: 'test', name: t.testName, price: Number(t.price), desc: t.description })),
      ...packages.map(p => ({ id: p.id, type: 'package', name: p.packageName, price: Number(p.price), desc: p.description }))
    ];

    // 6. AI Prompt
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
You are a Medical Analysis Engine. 
Input: ${reportCount} lab reports.
Inventory: ${JSON.stringify(inventory)}

**OUTPUT SCHEMA (JSON):**
{
  "healthScore": 75,
  "summaryHeadline": "Short, punchy summary of health status",
  "lifestyle": [ 
     { "icon": "hydration", "title": "Hydration", "desc": "Drink 3L water daily" },
     { "icon": "sleep", "title": "Sleep", "desc": "Aim for 8 hours" },
     { "icon": "activity", "title": "Exercise", "desc": "30 mins cardio" }
  ],
  "dietPlan": { 
    "include": ["Spinach", "Almonds"], "avoid": ["Sugar", "Fried Food"], 
    "plan": [ { "day": "Day 1", "breakfast": "Oats", "lunch": "Salad", "dinner": "Soup" } ] 
  },
  "recommendations": [ 
     { "type": "test", "name": "Vitamin D", "reason": "Levels are low" } 
  ]
}
Note: For recommendations, try to pick exact names from Inventory. If not found, suggest a generic test name.
          `
        },
        { role: "user", content: `Data Hash: ${currentDataHash}\nMedical Data:${combinedContext}` }
      ]
    });

    const aiResult = JSON.parse(completion.choices[0].message.content || "{}");

    // 7. Enrich Recommendations (FIXED LOGIC)
    const enrichedRecs = (aiResult.recommendations || []).map((rec: any) => {
      if (!rec || !rec.name) return null;
      
      // Try to find in DB
      let dbItem = inventory.find(i => i.name.toLowerCase() === rec.name.toLowerCase());
      
      // Fuzzy search if exact match fails
      if (!dbItem) {
         dbItem = inventory.find(i => i.name.toLowerCase().includes(rec.name.toLowerCase()));
      }
      
      if (dbItem) {
        // Found in DB: Return full details including Price and ID
        return { ...rec, ...dbItem, isBookable: true };
      } else {
        // Not in DB: Return AI suggestion but mark as generic (User can search for it)
        return { ...rec, price: 0, isBookable: false };
      }
    }).filter(Boolean);

    // 8. Define Final Data
    const finalData = {
      ...aiResult,
      recommendations: enrichedRecs,
      reportCount,
      analyzedCount,
      dataHash: currentDataHash,
      lastUpdated: new Date().toISOString()
    };

    // 9. Save
    await prisma.orderReportSummary.upsert({
      where: { orderId: currentOrder.id },
      update: { content: JSON.stringify(finalData) },
      create: { orderId: currentOrder.id, content: JSON.stringify(finalData) }
    });

    return NextResponse.json(finalData);

  } catch (error) {
    console.error("Aggregation Error:", error);
    return NextResponse.json({ error: "Failed to generate profile" }, { status: 500 });
  }
}