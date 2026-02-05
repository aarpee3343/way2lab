import axios from 'axios';
import path from 'path';
import { readFile } from 'fs/promises';

const EMAIL_API = process.env.EMAIL_API;
const DEFAULT_FROM = process.env.EMAIL_FROM || 'WayToLab <no-reply@waytolab.com>';

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
  if (!EMAIL_API) {
    console.error('EMAIL_API is not configured in environment.');
    return { success: false, error: 'EMAIL_API not configured' };
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

    const res = await axios.post(EMAIL_API, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    const ok = res.status >= 200 && res.status < 300;
    return ok ? { success: true } : { success: false, error: 'Email API failed' };
  } catch (error: any) {
    console.error('Email send failed:', error?.response?.data || error);
    return { success: false, error: 'Email send failed' };
  }
}
