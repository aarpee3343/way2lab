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

export type CompanyProfileSetting = {
  brandName: string;
  legalName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  pan: string;
  gstin: string;
  cin: string;
  website: string;
  supportEmail: string;
  billingEmail: string;
  customerCareNumber: string;
  alternateContactNumber: string;
  accounts: {
    beneficiaryName: string;
    bankName: string;
    branchName: string;
    accountType: '' | 'CURRENT' | 'SAVINGS';
    accountNumber: string;
    ifscCode: string;
    swiftCode: string;
    micrCode: string;
    upiId: string;
  };
  invoicing: {
    invoicePrefix: string;
    placeOfSupply: string;
    paymentTermsDays: number;
    billingCycle: string;
    authorizedSignatory: string;
    signatoryDesignation: string;
    declaration: string;
  };
};

export type AdminSettingsData = {
  companyProfile: CompanyProfileSetting;
  paymentModes: PaymentModesSetting;
  defaults: DefaultsSetting;
  smsTemplates: SmsTemplatesSetting;
  smsTemplateTypes: DefaultSMSType[];
};

const DEFAULT_PAYMENT_MODES = ['Pay Upon Service', 'Online', 'Corporate Credit'];
const DEFAULT_COMPANY_PROFILE: CompanyProfileSetting = {
  brandName: 'WayToLab',
  legalName: 'WayToLab Healthcare Private Limited',
  addressLine1: '',
  addressLine2: '',
  city: 'Gurugram',
  state: 'Haryana',
  pincode: '',
  country: 'India',
  pan: '',
  gstin: '',
  cin: '',
  website: 'https://way2lab.com',
  supportEmail: '',
  billingEmail: '',
  customerCareNumber: '',
  alternateContactNumber: '',
  accounts: {
    beneficiaryName: '',
    bankName: '',
    branchName: '',
    accountType: '',
    accountNumber: '',
    ifscCode: '',
    swiftCode: '',
    micrCode: '',
    upiId: ''
  },
  invoicing: {
    invoicePrefix: 'WTL-INV',
    placeOfSupply: 'Haryana',
    paymentTermsDays: 15,
    billingCycle: 'Monthly',
    authorizedSignatory: '',
    signatoryDesignation: '',
    declaration: 'This is a system generated invoice and does not require physical signature.'
  }
};

function sanitizeString(value: unknown, fallback = '') {
  return String(value ?? fallback).trim();
}

export async function getAdminSettings(): Promise<AdminSettingsData> {
  const companyProfileRaw = await getAppSettingValue<CompanyProfileSetting>('company_profile', DEFAULT_COMPANY_PROFILE);
  const companyProfile: CompanyProfileSetting = {
    brandName: sanitizeString(companyProfileRaw.brandName, DEFAULT_COMPANY_PROFILE.brandName),
    legalName: sanitizeString(companyProfileRaw.legalName, DEFAULT_COMPANY_PROFILE.legalName),
    addressLine1: sanitizeString(companyProfileRaw.addressLine1),
    addressLine2: sanitizeString(companyProfileRaw.addressLine2),
    city: sanitizeString(companyProfileRaw.city, DEFAULT_COMPANY_PROFILE.city),
    state: sanitizeString(companyProfileRaw.state, DEFAULT_COMPANY_PROFILE.state),
    pincode: sanitizeString(companyProfileRaw.pincode),
    country: sanitizeString(companyProfileRaw.country, DEFAULT_COMPANY_PROFILE.country),
    pan: sanitizeString(companyProfileRaw.pan).toUpperCase(),
    gstin: sanitizeString(companyProfileRaw.gstin).toUpperCase(),
    cin: sanitizeString(companyProfileRaw.cin).toUpperCase(),
    website: sanitizeString(companyProfileRaw.website, DEFAULT_COMPANY_PROFILE.website),
    supportEmail: sanitizeString(companyProfileRaw.supportEmail),
    billingEmail: sanitizeString(companyProfileRaw.billingEmail),
    customerCareNumber: sanitizeString(companyProfileRaw.customerCareNumber),
    alternateContactNumber: sanitizeString(companyProfileRaw.alternateContactNumber),
    accounts: {
      beneficiaryName: sanitizeString(companyProfileRaw.accounts?.beneficiaryName),
      bankName: sanitizeString(companyProfileRaw.accounts?.bankName),
      branchName: sanitizeString(companyProfileRaw.accounts?.branchName),
      accountType:
        companyProfileRaw.accounts?.accountType === 'CURRENT' || companyProfileRaw.accounts?.accountType === 'SAVINGS'
          ? companyProfileRaw.accounts.accountType
          : '',
      accountNumber: sanitizeString(companyProfileRaw.accounts?.accountNumber),
      ifscCode: sanitizeString(companyProfileRaw.accounts?.ifscCode).toUpperCase(),
      swiftCode: sanitizeString(companyProfileRaw.accounts?.swiftCode).toUpperCase(),
      micrCode: sanitizeString(companyProfileRaw.accounts?.micrCode),
      upiId: sanitizeString(companyProfileRaw.accounts?.upiId)
    },
    invoicing: {
      invoicePrefix: sanitizeString(companyProfileRaw.invoicing?.invoicePrefix, DEFAULT_COMPANY_PROFILE.invoicing.invoicePrefix),
      placeOfSupply: sanitizeString(companyProfileRaw.invoicing?.placeOfSupply, DEFAULT_COMPANY_PROFILE.invoicing.placeOfSupply),
      paymentTermsDays: Number.isFinite(Number(companyProfileRaw.invoicing?.paymentTermsDays))
        ? Math.max(0, Number(companyProfileRaw.invoicing?.paymentTermsDays))
        : DEFAULT_COMPANY_PROFILE.invoicing.paymentTermsDays,
      billingCycle: sanitizeString(companyProfileRaw.invoicing?.billingCycle, DEFAULT_COMPANY_PROFILE.invoicing.billingCycle),
      authorizedSignatory: sanitizeString(companyProfileRaw.invoicing?.authorizedSignatory),
      signatoryDesignation: sanitizeString(companyProfileRaw.invoicing?.signatoryDesignation),
      declaration: sanitizeString(companyProfileRaw.invoicing?.declaration, DEFAULT_COMPANY_PROFILE.invoicing.declaration)
    }
  };

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
    companyProfile,
    paymentModes: { modes, defaultMode },
    defaults,
    smsTemplates,
    smsTemplateTypes: DEFAULT_SMS_TEMPLATES.map(t => t.type)
  };
}

export async function updateCompanyProfileAction(data: CompanyProfileSetting) {
  await requireAdmin({ roles: ['SUPER_ADMIN'] });
  try {
    const next: CompanyProfileSetting = {
      ...DEFAULT_COMPANY_PROFILE,
      ...data,
      pan: sanitizeString(data.pan).toUpperCase(),
      gstin: sanitizeString(data.gstin).toUpperCase(),
      cin: sanitizeString(data.cin).toUpperCase(),
      accounts: {
        ...DEFAULT_COMPANY_PROFILE.accounts,
        ...(data.accounts || {}),
        ifscCode: sanitizeString(data.accounts?.ifscCode).toUpperCase(),
        swiftCode: sanitizeString(data.accounts?.swiftCode).toUpperCase()
      },
      invoicing: {
        ...DEFAULT_COMPANY_PROFILE.invoicing,
        ...(data.invoicing || {}),
        paymentTermsDays: Number.isFinite(Number(data.invoicing?.paymentTermsDays))
          ? Math.max(0, Number(data.invoicing?.paymentTermsDays))
          : DEFAULT_COMPANY_PROFILE.invoicing.paymentTermsDays
      }
    };

    if (next.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(next.pan)) {
      return { success: false, error: 'Invalid PAN format' };
    }
    if (next.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(next.gstin)) {
      return { success: false, error: 'Invalid GSTIN format' };
    }
    if (next.accounts.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(next.accounts.ifscCode)) {
      return { success: false, error: 'Invalid IFSC code format' };
    }

    await setAppSettingValue('company_profile', next);
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update company profile' };
  }
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
