import { z } from 'zod';

const toTrimmedString = z.preprocess((value) => {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : undefined;
}, z.string());

const toNumber = z.preprocess((value) => {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}, z.number());

const DietPlanDaySchema = z.object({
  day: toTrimmedString.optional().default(''),
  breakfast: toTrimmedString.optional().default(''),
  lunch: toTrimmedString.optional().default(''),
  dinner: toTrimmedString.optional().default(''),
}).passthrough();

const DietPlanSchema = z.object({
  include: z.array(toTrimmedString).optional().default([]),
  avoid: z.array(toTrimmedString).optional().default([]),
  plan: z.array(DietPlanDaySchema).optional().default([]),
}).passthrough();

const LifestyleSchema = z.object({
  icon: toTrimmedString.optional().default('general'),
  title: toTrimmedString.optional().default(''),
  desc: toTrimmedString.optional().default(''),
}).passthrough();

const RecommendationEvidenceSchema = z.object({
  label: toTrimmedString.optional().default(''),
  value: toTrimmedString.optional().default(''),
  status: toTrimmedString.optional().default(''),
}).passthrough();

const RecommendationSchema = z.object({
  type: toTrimmedString.optional().default('test'),
  name: toTrimmedString,
  reason: toTrimmedString.optional().default(''),
  price: toNumber.optional().default(0),
  id: toNumber.optional(),
  isBookable: z.boolean().optional().default(false),
  evidence: z.array(RecommendationEvidenceSchema).optional().default([]),
}).passthrough();

export const HealthProfileSchema = z.object({
  healthScore: toNumber.min(0).max(100).optional().default(0),
  summaryHeadline: toTrimmedString.optional().default(''),
  lifestyle: z.array(LifestyleSchema).optional().default([]),
  dietPlan: DietPlanSchema.optional().default({ include: [], avoid: [], plan: [] }),
  recommendations: z.array(RecommendationSchema).optional().default([]),
  reportCount: toNumber.optional().default(0),
  analyzedCount: toNumber.optional().default(0),
  dataHash: toTrimmedString.optional().default(''),
  lastUpdated: toTrimmedString.optional().default(''),
  generatedAt: toTrimmedString.optional().default(''),
  model: toTrimmedString.optional().default(''),
  promptVersion: toTrimmedString.optional().default(''),
  sourceOrderId: toNumber.optional(),
  sourceOrderIds: z.array(toNumber).optional().default([]),
  timeWindowDays: toNumber.optional().default(30),
  cached: z.boolean().optional(),
  warnings: z.array(toTrimmedString).optional().default([]),
}).passthrough();

export type HealthProfile = z.infer<typeof HealthProfileSchema>;

export const HEALTH_PROFILE_DISCLAIMER =
  'AI-generated guidance only. Not a medical diagnosis or prescription. Consult a clinician for medical decisions.';

export const parseHealthProfile = (input: unknown): HealthProfile => {
  const result = HealthProfileSchema.safeParse(input);
  if (result.success) return result.data;
  return HealthProfileSchema.parse({});
};

export const parseHealthProfileJson = (input?: string | null): HealthProfile | null => {
  if (!input) return null;
  try {
    return parseHealthProfile(JSON.parse(input));
  } catch {
    return null;
  }
};

export const formatHealthDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};
