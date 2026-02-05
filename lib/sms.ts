import axios from 'axios';
import { getAppSettingValue } from '@/lib/app-settings';

const API_KEY = process.env.SMS_API_KEY;
const SENDER_ID = process.env.SMS_SENDER_ID;
const BASE_URL = process.env.SMS_BASE_URL;

// 1. Define Supported Template Types
export type DefaultSMSType = 
  | 'OTP'
  | 'ORDER_PLACED'
  | 'HOME_COLLECTION_SCHEDULED'
  | 'CENTER_VISIT_CONFIRMED'
  | 'SAMPLE_COLLECTED'
  | 'REPORT_UPLOADED'
  | 'COLLECTION_FAILED'
  | 'REMINDER'
  | 'PAYMENT_PENDING'
  | 'REFUND_INITIATED';

export type SMSType = DefaultSMSType | (string & {});

export type SmsTemplate = {
  type: string;
  id: string;
  message: string;
};

export const DEFAULT_SMS_TEMPLATES: Array<{ type: DefaultSMSType; id: string; message: string }> = [
  {
    type: 'OTP',
    id: "1707176917094757100",
    message: "Your OTP is {{1}}. Use it to verify your mobile number on WayToLab. Valid for 10 minutes."
  },
  {
    type: 'ORDER_PLACED',
    id: "1707176917126750664",
    message: "Your WayToLab order {{1}} is placed successfully. Our team will contact you shortly."
  },
  {
    type: 'HOME_COLLECTION_SCHEDULED',
    id: "1707176917146040630",
    message: "WayToLab home sample collection for order {{1}} is scheduled on {{2}}."
  },
  {
    type: 'CENTER_VISIT_CONFIRMED',
    id: "1707176917153525024",
    message: "Your WayToLab center visit for order {{1}} is confirmed. Please carry ID proof."
  },
  {
    type: 'SAMPLE_COLLECTED',
    id: "1707176917166829309",
    message: "Sample for your WayToLab order {{1}} has been collected. Reports will be shared soon."
  },
  {
    type: 'REPORT_UPLOADED',
    id: "1707176917173493715",
    message: "Report for your WayToLab order {{1}} is uploaded. Login to view and download."
  },
  {
    type: 'COLLECTION_FAILED',
    id: "1707176917186628176",
    message: "WayToLab could not collect the sample for order {{1}}. Please reschedule."
  },
  {
    type: 'REMINDER',
    id: "1707176917201384098",
    message: "Reminder from WayToLab: sample collection today for order {{1}}. Please be available."
  },
  {
    type: 'PAYMENT_PENDING',
    id: "1707176917209892882",
    message: "Payment pending for your WayToLab order {{1}}. Complete payment to proceed."
  },
  {
    type: 'REFUND_INITIATED',
    id: "1707176917216797989",
    message: "Refund for your WayToLab order {{1}} has been initiated. Amount will reflect soon."
  }
];

const DEFAULT_TEMPLATE_MAP = new Map(DEFAULT_SMS_TEMPLATES.map(t => [t.type, t]));

function renderTemplate(message: string, vars: string[]) {
  const withIndexes = message.replace(/\{\{(\d+)\}\}/g, (_, idx) => {
    const i = Number(idx) - 1;
    return typeof vars[i] !== 'undefined' ? String(vars[i]) : '';
  });

  let seq = 0;
  return withIndexes.replace(/\{#var#\}/gi, () => {
    const value = vars[seq];
    seq += 1;
    return typeof value !== 'undefined' ? String(value) : '';
  });
}

/**
 * Universal SMS Sender
 * @param mobile - 10 digit mobile number
 * @param type - The template type (e.g., 'OTP', 'ORDER_PLACED')
 * @param vars - Array of variables needed for the template (in order)
 */
export async function sendSMS(mobile: string, type: SMSType, vars: string[]) {
  if (!API_KEY || !SENDER_ID || !BASE_URL) {
    console.error("❌ SMS Config Missing in .env");
    return false;
  }

  try {
    let templates: SmsTemplate[] = DEFAULT_SMS_TEMPLATES;
    try {
      const settings = await getAppSettingValue<{ templates?: SmsTemplate[] } | null>(
        'sms_templates',
        null
      );
      if (settings?.templates?.length) {
        templates = settings.templates as SmsTemplate[];
      }
    } catch (error) {
      console.warn('Failed to load SMS template overrides. Using defaults.', error);
    }

    const override = templates.find(t => t.type === type);
    const template = override || DEFAULT_TEMPLATE_MAP.get(type as DefaultSMSType);
    if (!template) throw new Error(`Invalid SMS Template Type: ${type}`);

    // Generate the final message string using the variables
    const message = renderTemplate(template.message, vars);

    // Construct URL with DLT Template ID (Crucial for delivery in India)
    const url = `${BASE_URL}?method=sms&api_key=${API_KEY}&to=${mobile}&sender=${SENDER_ID}&message=${encodeURIComponent(message)}&template_id=${template.id}&format=json`;

    const res = await axios.post(url);
    
    // Check provider response (Success usually has status "OK" or "200")
    if (res.data?.status === 'OK' || res.status === 200) {
      console.log(`✅ SMS Sent [${type}] to ${mobile}`);
      return true;
    } else {
      console.error(`⚠️ SMS Provider Error:`, res.data);
      return false;
    }

  } catch (error) {
    console.error(`❌ SMS Failed [${type}]:`, error);
    return false;
  }
}
