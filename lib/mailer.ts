import axios from 'axios';
import path from 'path';
import { readFile } from 'fs/promises';

const EMAIL_API = process.env.EMAIL_API?.trim();
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY?.trim();
const DEFAULT_FROM = process.env.EMAIL_FROM || 'WayToLab <no-reply@waytolab.com>';
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

const TEMPLATE_DIR = path.join(process.cwd(), 'emails', 'templates');

export type EmailAddress = string;

export type SendEmailOptions = {
  to: EmailAddress | EmailAddress[];
  subject: string;
  template?: string; // template filename without extension, or with .html
  vars?: Record<string, string | number | null | undefined>;
  html?: string;
  text?: string;
  layout?: string | false; // default: main_layout.html
  from?: string;
  replyTo?: string;
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
};

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isLikelySendGridApiKey(value: string) {
  return /^SG\.[A-Za-z0-9._-]+$/.test(value);
}

function parseFromAddress(from: string) {
  const trimmed = from.trim();
  const match = trimmed.match(/^(.*)<([^>]+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, '');
    const email = match[2].trim();
    return name ? { email, name } : { email };
  }
  return { email: trimmed };
}

function renderTemplate(content: string, vars: Record<string, string | number | null | undefined>) {
  const withNamed = content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = vars[key];
    return value === null || typeof value === 'undefined' ? '' : String(value);
  });
  const fallbackValue =
    vars.otp ??
    vars.code ??
    Object.values(vars).find((v) => v !== null && typeof v !== 'undefined');
  return withNamed.replace(/\{#\s*var\s*#\}/gi, fallbackValue ? String(fallbackValue) : '');
}

async function loadTemplate(templateName: string) {
  const fileName = templateName.endsWith('.html') ? templateName : `${templateName}.html`;
  const htmlPath = path.join(TEMPLATE_DIR, fileName);
  const html = await readFile(htmlPath, 'utf8');

  let text: string | undefined;
  const textPath = htmlPath.replace(/\.html$/i, '.txt');
  try {
    text = await readFile(textPath, 'utf8');
  } catch {
    text = undefined;
  }

  return { html, text };
}

function stripOuterContentWrapper(html: string) {
  const trimmed = html.trim();
  if (trimmed.startsWith('<div class="content">') && trimmed.endsWith('</div>')) {
    return trimmed.replace(/^<div class="content">/i, '').replace(/<\/div>\s*$/i, '');
  }
  return html;
}

/**
 * Universal email sender using the EMAIL_API endpoint.
 * Templates live in /emails/templates and support {{variable}} placeholders.
 */
export async function sendEmail(options: SendEmailOptions) {
  const emailApiOrKey = SENDGRID_API_KEY || EMAIL_API;
  if (!emailApiOrKey) {
    console.error('EMAIL_API or SENDGRID_API_KEY is not configured in environment.');
    return { success: false, error: 'Email provider not configured' };
  }

  const to = Array.isArray(options.to) ? options.to : [options.to];
  if (!to.length) {
    return { success: false, error: 'No recipients provided' };
  }

  let html = options.html || '';
  let text = options.text;

  if (!html && options.template) {
    const { html: tplHtml, text: tplText } = await loadTemplate(options.template);
    html = tplHtml;
    text = tplText;
  }

  if (!options.html && options.template) {
    const layoutName = options.layout === false ? null : (options.layout || 'main_layout');
    if (layoutName && layoutName !== options.template) {
      const { html: layoutHtml } = await loadTemplate(layoutName);
      const inner = stripOuterContentWrapper(html);
      html = layoutHtml.replace('<!-- EMAIL CONTENT GOES HERE -->', inner);
    }
  }

  if (!html) {
    return { success: false, error: 'No HTML content or template provided' };
  }

  if (options.vars) {
    html = renderTemplate(html, options.vars);
    if (text) text = renderTemplate(text, options.vars);
  }

  try {
    const payload = {
      to,
      subject: options.subject,
      html,
      text,
      from: options.from || DEFAULT_FROM,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc
    };

    const provider = isLikelySendGridApiKey(emailApiOrKey) ? 'sendgrid_key' : 'url_api';
    const request =
      provider === 'sendgrid_key'
        ? axios.post(
            SENDGRID_API_URL,
            {
              personalizations: [
                {
                  to: to.map((email) => ({ email })),
                  ...(options.cc?.length ? { cc: options.cc.map((email) => ({ email })) } : {}),
                  ...(options.bcc?.length ? { bcc: options.bcc.map((email) => ({ email })) } : {})
                }
              ],
              from: parseFromAddress(options.from || DEFAULT_FROM),
              subject: options.subject,
              content: [
                ...(text ? [{ type: 'text/plain', value: text }] : []),
                { type: 'text/html', value: html }
              ],
              ...(options.replyTo ? { reply_to: { email: options.replyTo } } : {})
            },
            {
              headers: {
                Authorization: `Bearer ${emailApiOrKey}`,
                'Content-Type': 'application/json'
              }
            }
          )
        : isHttpUrl(emailApiOrKey)
          ? axios.post(emailApiOrKey, payload, {
              headers: { 'Content-Type': 'application/json' }
            })
          : Promise.reject(new Error('EMAIL_API must be a valid URL or a SendGrid API key'));

    const res = await request;

    const ok = res.status >= 200 && res.status < 300;
    return ok ? { success: true } : { success: false, error: 'Email API failed' };
  } catch (error: any) {
    console.error('Email send failed:', {
      status: error?.response?.status,
      message: error?.message,
      response: error?.response?.data
    });
    return { success: false, error: 'Email send failed' };
  }
}
