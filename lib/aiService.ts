// frontend/lib/aiService.ts
import prisma from '@/lib/prisma'; // 👈 Ensure this path matches your prisma client instance
import { extractTextFromPdf } from './pdfText';
import { generateReportSummaryFromPdf } from './aiReportSummary';

export async function processAndSaveSummary(orderId: number, buffer: Buffer) {
  console.log(`[AI Background] Starting summary for Order #${orderId}`);

  try {
    // 1. Extract Text
    const text = await extractTextFromPdf(buffer);
    console.log(`[AI Background] Text extracted (${text.length} chars)`);

    // 2. Generate Summary
    const summary = await generateReportSummaryFromPdf(text);
    console.log(`[AI Background] Summary generated`);

    // 3. Save to Database (Upsert handles updates if one exists)
    await prisma.orderReportSummary.upsert({
      where: { orderId: orderId },
      update: { content: summary },
      create: {
        orderId: orderId,
        content: summary,
      },
    });

    console.log(`[AI Background] Saved to DB for Order #${orderId}`);

  } catch (error) {
    console.error(`[AI Background] FAILED for Order #${orderId}:`, error);
    // Optional: You could log an error to OrderActivity here if you want
  }
}