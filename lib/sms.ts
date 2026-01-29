import axios from 'axios';

const API_KEY = process.env.SMS_API_KEY;
const SENDER_ID = process.env.SMS_SENDER_ID;
const BASE_URL = process.env.SMS_BASE_URL;

// 1. Define Supported Template Types
export type SMSType = 
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

// 2. Define Template Configuration
// This maps the Type -> Approved Content & DLT Template ID
const TEMPLATES: Record<SMSType, { id: string; format: (...args: string[]) => string }> = {
  
  OTP: {
    id: "170717691709475710091",
    format: (otp) => `Your OTP is ${otp}. Use it to verify your mobile number on WayToLab. Valid for 10 minutes.`
  },

  ORDER_PLACED: {
    id: "170717691712675066486",
    format: (orderId) => `Your WayToLab order ${orderId} is placed successfully. Our team will contact you shortly.`
  },

  HOME_COLLECTION_SCHEDULED: {
    id: "170717691714604063074",
    format: (orderId, date) => `WayToLab home sample collection for order ${orderId} is scheduled on ${date}.`
  },

  CENTER_VISIT_CONFIRMED: {
    id: "170717691715352502481",
    format: (orderId) => `Your WayToLab center visit for order ${orderId} is confirmed. Please carry ID proof.`
  },

  SAMPLE_COLLECTED: {
    id: "170717691716682930987",
    format: (orderId) => `Sample for your WayToLab order ${orderId} has been collected. Reports will be shared soon.`
  },

  REPORT_UPLOADED: {
    id: "170717691717349371579",
    format: (orderId) => `Report for your WayToLab order ${orderId} is uploaded. Login to view and download.`
  },

  COLLECTION_FAILED: {
    id: "170717691718662817675",
    format: (orderId) => `WayToLab could not collect the sample for order ${orderId}. Please reschedule.`
  },

  REMINDER: {
    id: "170717691720138409886",
    format: (orderId) => `Reminder from WayToLab Sample collection today for order ${orderId}. Please be available.`
  },

  PAYMENT_PENDING: {
    id: "170717691720989288277",
    format: (orderId) => `Payment pending for your WayToLab order ${orderId}. Complete payment to proceed.`
  },

  REFUND_INITIATED: {
    id: "170717691721679798984",
    format: (orderId) => `Refund for your WayToLab order ${orderId} has been initiated. Amount will reflect soon.`
  }
};

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
    const template = TEMPLATES[type];
    if (!template) throw new Error(`Invalid SMS Template Type: ${type}`);

    // Generate the final message string using the variables
    const message = template.format(...vars);

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