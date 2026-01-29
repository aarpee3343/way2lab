import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateReportSummaryFromPdf(text: string): Promise<string> {
  // 1. Safety Check
  if (!text || text.length < 50) return JSON.stringify({ error: "Insufficient data" });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    // 🛑 CRITICAL: This forces the AI to reply in JSON format
    response_format: { type: "json_object" }, 
    messages: [
      {
        role: 'system',
        content: `
You are an advanced AI Medical Consultant. Analyze the lab report text and return a strict JSON object.

**YOUR GOALS:**
1. **Score:** Calculate a "Health Score" (0-100) based on the number of abnormal flags.
2. **Classify:** Identify "Critical", "Warning", and "Normal" results.
3. **Cross-Sell (USP):** Recommend *specific* follow-up packages based on findings.
   - If Fatigue/Anemia -> Recommend "Vitamin B12 & D3 Profile".
   - If Thyroid issues -> Recommend "Advanced Thyroid Panel".
   - If Normal -> Recommend "Annual Preventive Full Body Checkup".

**REQUIRED JSON STRUCTURE:**
{
  "healthScore": 85,
  "summaryHeadline": "Your liver function looks great, but watch your cholesterol.",
  "results": [
    { "category": "Liver Function", "status": "Normal", "value": "SGOT 24", "insight": "Optimal range." },
    { "category": "Hemoglobin", "status": "Warning", "value": "10.2 g/dL", "insight": "Slightly low." }
  ],
  "crossSell": {
    "package": "Vitamin Deficiency Profile",
    "reason": "Low hemoglobin can be caused by B12 deficiency. Rule it out today.",
    "price": "₹999"
  },
  "lifestyle": [
    { "icon": "water", "tip": "Hydration", "detail": "Drink 3L water daily." },
    { "icon": "sleep", "tip": "Rest", "detail": "Aim for 7-8 hours sleep." }
  ]
}
`
      },
      {
        role: 'user',
        content: `Analyze this raw text:\n\n${text}`
      }
    ]
  });

  return response.choices[0]?.message?.content || "{}";
}