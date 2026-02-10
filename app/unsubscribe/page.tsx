import Link from 'next/link';
import { unsubscribeNewsletterAction } from '@/app/actions/newsletterActions';

export const dynamic = 'force-dynamic';

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const params = await searchParams;
  const token = String(params?.token || '').trim();
  const email = String(params?.email || '').trim();

  const result = token || email
    ? await unsubscribeNewsletterAction({ token, email })
    : { success: false, error: 'Invalid unsubscribe link.' };

  return (
    <main className="min-h-[70vh] bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Email Preferences</h1>
        <p className="mt-3 text-sm text-slate-600">
          {result.success ? result.message : result.error}
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Home
          </Link>
          <Link
            href="/contact"
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}
