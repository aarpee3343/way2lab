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
        status: 'COMPLETED',
        createdAt: { gte: timeLimit },
        patientName: { contains: currentOrder.patientName.split(' ')[0], mode: 'insensitive' }
      },
      orderBy: { createdAt: 'desc' },
      include: { reportSummary: true }
    });

    const reportCount = history.length; 
    
    // 3. Build Unique Data Fingerprint
    // Sort by ID so the string is always consistent
    const sortedHistory = history.sort((a, b) => a.id - b.id);
    
    let combinedContext = "";
    let analyzedCount = 0;

    sortedHistory.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (order.reportSummary?.content) {
        analyzedCount++;
        try {
          const json = JSON.parse(order.reportSummary.content);
          // We only care about abnormal results for the hash
          const abnormal = json.results?.filter((r: any) => r.status !== 'Normal') || [];
          if (abnormal.length > 0) {
            combinedContext += `|${date}:${JSON.stringify(abnormal)}`;
          }
        } catch (e) {}
      }
    });

    // 🔒 4. THE SMART LOCK (Hashing)
    // This string represents the exact state of the patient's health right now
    const currentDataHash = crypto.createHash('md5').update(combinedContext || "empty").digest('hex');

    // Fetch what we saved last time
    const existingSummaryRaw = await prisma.orderReportSummary.findUnique({
      where: { orderId: currentOrder.id }
    });

    // 🛑 STOP: If Data Hasn't Changed, Return Cache
    if (existingSummaryRaw) {
       try {
         const existingJson = JSON.parse(existingSummaryRaw.content);
         
         // If the fingerprint matches, it means NO new reports have been added/changed.
         // We return the existing analysis immediately. Zero AI Cost. Zero Variation.
         if (existingJson.dataHash === currentDataHash && existingJson.healthScore) {
            console.log("🔒 Data unchanged (Hash Match). Returning cached result.");
            return NextResponse.json({ ...existingJson, cached: true });
         }
       } catch(e) {}
    }

    // --- IF WE REACH HERE, DATA HAS CHANGED. RUN AI. --- //

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
      temperature: 0, // Zero Creativity = Consistent Results
      seed: 12345,
      messages: [
        {
          role: "system",
          content: `
You are a Medical Analysis Engine. 
Input: ${reportCount} lab reports (Last 30 Days).
Inventory: ${JSON.stringify(inventory)}

**OUTPUT SCHEMA:**
{
  "healthScore": 75,
  "summaryHeadline": "Analysis shows...",
  "lifestyle": [ { "icon": "hydration", "title": "...", "desc": "..." } ],
  "dietPlan": { 
    "include": ["..."], "avoid": ["..."], 
    "plan": [ { "day": "Day 1", "breakfast": "...", "lunch": "...", "dinner": "..." } ] 
  },
  "recommendations": [ { "type": "test", "id": 12, "reason": "..." } ]
}
          `
        },
        { role: "user", content: `Data Hash: ${currentDataHash}\nMedical Data:${combinedContext}` }
      ]
    });

    const aiResult = JSON.parse(completion.choices[0].message.content || "{}");

    // 7. Enrich Recommendations
    const enrichedRecs = (aiResult.recommendations || []).map((rec: any) => {
      if (!rec || (!rec.id && !rec.name)) return null;
      const targetId = Number(rec.id); 
      const targetType = (rec.type || '').toLowerCase(); 

      let dbItem = inventory.find(i => i.id === targetId && i.type.toLowerCase() === targetType);
      
      if (!dbItem && rec.name) {
         dbItem = inventory.find(i => i.name.toLowerCase().includes(rec.name.toLowerCase()));
      }
      
      return dbItem ? { ...rec, ...dbItem } : null;
    }).filter(Boolean);

    // 8. Define Final Data
    const finalData = {
      ...aiResult,
      recommendations: enrichedRecs,
      reportCount,
      analyzedCount,
      dataHash: currentDataHash, // Save the new fingerprint
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