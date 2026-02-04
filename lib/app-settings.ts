import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function getAppSettingValue<T>(key: string, fallback: T): Promise<T> {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key } });
    if (!setting) return fallback;
    return setting.value as T;
  } catch (error) {
    console.warn(`Failed to load app setting: ${key}`, error);
    return fallback;
  }
}

export async function setAppSettingValue<T>(key: string, value: T) {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value: value as Prisma.InputJsonValue },
    update: { value: value as Prisma.InputJsonValue }
  });
}
