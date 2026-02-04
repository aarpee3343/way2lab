'use server';

import { requireAdmin } from '@/lib/admin-auth';

import { revalidatePath } from 'next/cache';
import { getAppSettingValue, setAppSettingValue } from '@/lib/app-settings';
import { DEFAULT_SMS_TEMPLATES, SmsTemplate as SmsTemplateType, DefaultSMSType } from '@/lib/sms';

export type PaymentModesSetting = {
  modes: string[];
  defaultMode: string;
};

export type DefaultsSetting = {
  collectionType: 'center_visit' | 'home_collection';
  homeCharge: number;
};

export type SmsTemplate = SmsTemplateType;

export type SmsTemplatesSetting = {
  templates: SmsTemplate[];
};

export type AdminSettingsData = {
  paymentModes: PaymentModesSetting;
  defaults: DefaultsSetting;
  smsTemplates: SmsTemplatesSetting;
  smsTemplateTypes: DefaultSMSType[];
};

const DEFAULT_PAYMENT_MODES = ['Pay Upon Service', 'Online', 'Corporate Credit'];

export async function getAdminSettings(): Promise<AdminSettingsData> {
  const paymentModesRaw = await getAppSettingValue<PaymentModesSetting>('payment_modes', {
    modes: DEFAULT_PAYMENT_MODES,
    defaultMode: DEFAULT_PAYMENT_MODES[0]
  });

  const cleanedModes = Array.from(new Set((paymentModesRaw.modes || []).map(m => m.trim()).filter(Boolean)));
  const modes = cleanedModes.length ? cleanedModes : DEFAULT_PAYMENT_MODES;
  const defaultMode = modes.includes(paymentModesRaw.defaultMode) ? paymentModesRaw.defaultMode : modes[0];

  const defaultsRaw = await getAppSettingValue<DefaultsSetting>('defaults', {
    collectionType: 'center_visit',
    homeCharge: 0
  });

  const defaults: DefaultsSetting = {
    collectionType: defaultsRaw.collectionType === 'home_collection' ? 'home_collection' : 'center_visit',
    homeCharge: Number(defaultsRaw.homeCharge || 0)
  };

  const smsTemplatesRaw = await getAppSettingValue<SmsTemplatesSetting>('sms_templates', {
    templates: DEFAULT_SMS_TEMPLATES
  });

  const sanitized = (smsTemplatesRaw.templates || [])
    .map((t) => ({
      type: String(t.type || '').trim(),
      id: String(t.id || '').trim(),
      message: String(t.message || '').trim()
    }))
    .filter((t) => t.type && t.id && t.message);

  const byType = new Map<string, SmsTemplate>(sanitized.map(t => [t.type, t]));
  const defaultTypes = new Set<string>(DEFAULT_SMS_TEMPLATES.map(t => t.type));
  const defaultTemplates = DEFAULT_SMS_TEMPLATES.map(def => byType.get(def.type) || def);
  const customs = Array.from(byType.values()).filter(t => !defaultTypes.has(t.type));

  const smsTemplates: SmsTemplatesSetting = {
    templates: [...defaultTemplates, ...customs]
  };

  return {
    paymentModes: { modes, defaultMode },
    defaults,
    smsTemplates,
    smsTemplateTypes: DEFAULT_SMS_TEMPLATES.map(t => t.type)
  };
}

export async function updatePaymentModesAction(data: PaymentModesSetting) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const cleaned = Array.from(new Set((data.modes || [])
      .map(m => m.trim())
      .filter(Boolean)));

    const fallbackModes = cleaned.length ? cleaned : DEFAULT_PAYMENT_MODES;
    const defaultMode = fallbackModes.includes(data.defaultMode)
      ? data.defaultMode
      : fallbackModes[0];

    await setAppSettingValue('payment_modes', {
      modes: fallbackModes,
      defaultMode
    });

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update payment modes' };
  }
}

export async function updateDefaultsAction(data: DefaultsSetting) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const homeCharge = Number.isFinite(Number(data.homeCharge)) ? Number(data.homeCharge) : 0;
    const collectionType = data.collectionType === 'home_collection'
      ? 'home_collection'
      : 'center_visit';

    await setAppSettingValue('defaults', { collectionType, homeCharge });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update defaults' };
  }
}

export async function updateSmsTemplatesAction(templates: SmsTemplate[]) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const byType = new Map<string, SmsTemplate>();

    for (const t of templates || []) {
      const type = String(t.type || '').trim();
      const id = String(t.id || '').trim();
      const message = String(t.message || '').trim();
      if (!type || !id || !message) continue;
      byType.set(type, { type, id, message });
    }

    for (const def of DEFAULT_SMS_TEMPLATES) {
      if (!byType.has(def.type)) {
        byType.set(def.type, def);
      }
    }

    await setAppSettingValue('sms_templates', { templates: Array.from(byType.values()) });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update SMS templates' };
  }
}
