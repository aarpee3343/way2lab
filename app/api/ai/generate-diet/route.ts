import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { getAuthUser } from '@/lib/auth';
import { parseHealthProfile } from '@/lib/ai/healthProfile';
import { downloadEncryptedFile } from '@/lib/gcs';
import { decryptBuffer } from '@/lib/crypto';
import { extractTextFromPdf } from '@/lib/pdfText';
import { generateReportSummaryFromPdf } from '@/lib/aiReportSummary';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PROMPT_VERSION = '2026-02-05-v1';
const TIME_WINDOW_DAYS = 30;
type CompactSignal = { name: string; value?: unknown; unit?: string; status?: string };

const extractCompactSignals = (input: any): CompactSignal[] => {
  if (!input || typeof input !== 'object') return [];

  if (Array.isArray(input.labSignals)) {
    return input.labSignals
      .map((r: any) => ({
        name: r?.name || r?.testName || r?.parameter || r?.component || r?.title,
        value: r?.value ?? r?.result ?? r?.reading ?? r?.observed,
        unit: r?.unit,
        status: r?.status || r?.flag
      }))
      .filter((r: CompactSignal) => Boolean(r.name))
      .slice(0, 12);
  }

  const results = Array.isArray(input.results) ? input.results : [];
  return results
    .map((r: any) => ({
      name: r?.testName || r?.name || r?.parameter || r?.component || r?.title,
      value: r?.value ?? r?.result ?? r?.reading ?? r?.observed,
      unit: r?.unit,
      status: r?.status || r?.flag
    }))
    .filter((r: CompactSignal) => Boolean(r.name))
    .slice(0, 12);
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const orderId = Number(body?.orderId);
    const forceRefresh = Boolean(body?.forceRefresh);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: 'Invalid orderId' }, { status: 400 });
    }

    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Get Current Order
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!currentOrder) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (currentOrder.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch History (Strict 30 Days Limit)
    const timeLimit = new Date();
    timeLimit.setDate(timeLimit.getDate() - TIME_WINDOW_DAYS);

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
    const sourceOrderIds: number[] = [];
    const signalsByOrder = new Map<number, CompactSignal[]>();

    sortedHistory.forEach(order => {
      sourceOrderIds.push(order.id);
      const date = order.createdAt.toISOString().split('T')[0];
      if (!order.reportSummary?.content) return;

      try {
        const json = JSON.parse(order.reportSummary.content);
        const compactResults = extractCompactSignals(json);

        if (compactResults.length > 0) {
          analyzedCount++;
          signalsByOrder.set(order.id, compactResults);
          combinedContext += `|${date}:${JSON.stringify(compactResults)}`;
          return;
        }

        if (json.summary) {
          analyzedCount++;
          combinedContext += `|${date}:summary=${String(json.summary).slice(0, 500)}`;
        }
      } catch (e) {}
    });

    // Vercel-safe fallback: if no persisted summary signals exist, parse latest report PDF on-demand.
    if (analyzedCount === 0) {
      const latestReport = await prisma.orderReport.findFirst({
        where: {
          orderId: currentOrder.id,
          storagePath: { not: null }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (latestReport?.storagePath && latestReport.iv && latestReport.authTag) {
        try {
          const encrypted = await downloadEncryptedFile(latestReport.storagePath);
          const decrypted = decryptBuffer(encrypted, latestReport.iv, latestReport.authTag);
          const text = await extractTextFromPdf(decrypted);

          if (text && text.length >= 50) {
            const summaryJsonString = await generateReportSummaryFromPdf(text);
            const parsedSummary = JSON.parse(summaryJsonString);
            const fallbackSignals = extractCompactSignals(parsedSummary);

            if (fallbackSignals.length > 0) {
              const date = new Date().toISOString().split('T')[0];
              analyzedCount = 1;
              combinedContext += `|${date}:${JSON.stringify(fallbackSignals)}`;
              signalsByOrder.set(currentOrder.id, fallbackSignals);
            }
          }
        } catch (fallbackErr) {
          console.error('On-demand PDF analysis fallback failed:', fallbackErr);
        }
      }
    }

    // 4. THE SMART LOCK (Hashing)
    const hashPayload = `${orderId}|${combinedContext || 'no-signal'}|reports:${reportCount}|analyzed:${analyzedCount}`;
    const currentDataHash = crypto.createHash('md5').update(hashPayload).digest('hex');

    const existingSummaryRaw = await prisma.orderReportSummary.findUnique({
      where: { orderId: currentOrder.id }
    });

    // If Data Hasn't Changed, Return Cache
    if (existingSummaryRaw && !forceRefresh) {
       try {
         const existingJson = parseHealthProfile(JSON.parse(existingSummaryRaw.content));
         if (existingJson.dataHash === currentDataHash) {
           return NextResponse.json({ ...existingJson, cached: true });
         }
       } catch(e) {}
    }

    const nowIso = new Date().toISOString();

    if (analyzedCount === 0) {
      const fallback = parseHealthProfile({
        healthScore: 0,
        summaryHeadline: 'Report data not available yet.',
        lifestyle: [],
        dietPlan: { include: [], avoid: [], plan: [] },
        recommendations: [],
        reportCount,
        analyzedCount,
        dataHash: currentDataHash,
        lastUpdated: nowIso,
        generatedAt: nowIso,
        model: 'n/a',
        promptVersion: PROMPT_VERSION,
        sourceOrderId: currentOrder.id,
        sourceOrderIds,
        timeWindowDays: TIME_WINDOW_DAYS,
        warnings: ['No report summaries available for analysis yet.']
      });

      await prisma.orderReportSummary.upsert({
        where: { orderId: currentOrder.id },
        update: { content: JSON.stringify(fallback) },
        create: { orderId: currentOrder.id, content: JSON.stringify(fallback) }
      });

      return NextResponse.json({ ...fallback, cached: false });
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
Input: ${reportCount} lab reports (${analyzedCount} with usable summary data).
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
Rules:
- Never provide medication advice or diagnoses.
- If data is limited, keep recommendations conservative and general.
- For recommendations, try to pick exact names from Inventory. If not found, suggest a generic test name.
          `
        },
        { role: "user", content: `Data Hash: ${currentDataHash}\nMedical Data:${combinedContext || 'No abnormal results noted.'}` }
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
    const normalized = parseHealthProfile(aiResult);
    const warnings = [
      ...(normalized.warnings || []),
      ...(combinedContext ? [] : ['Limited lab signals; recommendations are general wellness only.'])
    ];

    const finalData = parseHealthProfile({
      ...normalized,
      recommendations: enrichedRecs,
      reportCount,
      analyzedCount,
      dataHash: currentDataHash,
      lastUpdated: nowIso,
      generatedAt: nowIso,
      model: completion.model || 'gpt-4o-mini',
      promptVersion: PROMPT_VERSION,
      sourceOrderId: currentOrder.id,
      sourceOrderIds,
      timeWindowDays: TIME_WINDOW_DAYS,
      labSignals: signalsByOrder.get(currentOrder.id) || [],
      warnings
    });

    // 9. Save
    await prisma.orderReportSummary.upsert({
      where: { orderId: currentOrder.id },
      update: { content: JSON.stringify(finalData) },
      create: { orderId: currentOrder.id, content: JSON.stringify(finalData) }
    });

    return NextResponse.json({ ...finalData, cached: false });

  } catch (error) {
    console.error("Aggregation Error:", error);
    return NextResponse.json({ error: "Failed to generate profile" }, { status: 500 });
  }
}
