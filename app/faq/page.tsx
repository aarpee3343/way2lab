import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo';
import { buildBreadcrumbSchema, buildFaqSchema } from '@/lib/schema';
import FaqAccordion from '@/components/faq/FaqAccordion';

export const metadata: Metadata = {
  title: 'FAQ | Diagnostic Tests, Labs, Booking & Reports | WayToLab',
  description:
    'Answers to common questions about booking tests, lab selection, reports, pricing, home collection, rescheduling, payments, and data privacy on WayToLab.',
  alternates: { canonical: absoluteUrl('/faq') },
  openGraph: {
    title: 'WayToLab FAQ',
    description:
      'Get answers to frequently asked questions for diagnostic test booking, labs, reports and payments.',
    url: absoluteUrl('/faq'),
    type: 'website'
  }
};

const faqs = [
  {
    q: 'What is a diagnostic aggregator?',
    a: 'A diagnostic aggregator compares multiple labs on one platform, helping users discover tests, compare prices, choose a lab, and complete booking.'
  },
  {
    q: 'How does WayToLab choose partner labs?',
    a: 'Labs are onboarded with quality checks such as active operations, serviceability, and compliance indicators. Availability shown to users is based on pincode and active catalog mappings.'
  },
  {
    q: 'How can I book a diagnostic test on WayToLab?',
    a: 'Search for a test or package, select a lab, choose patient and schedule details, then confirm booking from checkout.'
  },
  {
    q: 'Do I need to register before booking?',
    a: 'You can start browsing without registration, but account verification/login is required to complete booking and access order/report history.'
  },
  {
    q: 'How can I find a specific test quickly?',
    a: 'Use search by test name, package name, condition keywords, or city-specific pages. Filters help narrow by lab availability and pricing.'
  },
  {
    q: 'Are test prices final or can they vary?',
    a: 'Displayed prices are based on selected lab and location coverage. Final payable amount may include discounts/coupons and home collection charges where applicable.'
  },
  {
    q: 'How do I know which lab will process my test?',
    a: 'The selected lab is shown during checkout and in order details. The final order is tied to that lab for sample collection and report processing.'
  },
  {
    q: 'Why is one lab allowed per order?',
    a: 'A single order is mapped to one lab to keep sample logistics, schedule management, and report processing accurate and operationally consistent.'
  },
  {
    q: 'Do all tests support home collection?',
    a: 'Not always. Some tests or imaging-related items require center visit due to equipment dependency. The booking flow enforces this automatically.'
  },
  {
    q: 'How are time slots generated?',
    a: 'Slots are generated from lab operating timings, with one-hour windows. Availability depends on policy rules such as minimum lead time and day restrictions.'
  },
  {
    q: 'Why are fewer slots visible on Sunday?',
    a: 'Sunday operations can be limited based on operational policy. If configured, only morning slots are offered while afternoon/evening remain unavailable.'
  },
  {
    q: 'Can I reschedule my booking?',
    a: 'Yes, subject to policy windows and slot availability. Ineligible cases are blocked by the system to prevent operational conflicts.'
  },
  {
    q: 'How are reports delivered?',
    a: 'Reports are uploaded digitally and made available in your account. Where applicable, downloadable PDFs and summaries are provided.'
  },
  {
    q: 'Are imaging or graph-based reports downloadable from dashboard?',
    a: 'For center-dependent diagnostics (for example imaging/graph outputs), reports are available at the respective diagnostic center/lab as per process instead of dashboard download.'
  },
  {
    q: 'Who can access my reports?',
    a: 'Report access is controlled by account authorization rules. Corporate visibility, when applicable, follows package or policy-level sharing rules.'
  },
  {
    q: 'Are my personal and medical details secure?',
    a: 'Yes. Access control, server-side validations, and secure storage patterns are used to protect personal and diagnostic data.'
  },
  {
    q: 'What if a test in my package is not available at my location?',
    a: 'Availability is lab and pincode dependent. The platform shows best matching labs and indicates partial/full match before booking.'
  },
  {
    q: 'Can coupons be used with corporate benefits?',
    a: 'Coupon applicability depends on campaign rules and corporate payment type. Validation is enforced during checkout.'
  },
  {
    q: 'How do corporate billing bookings work?',
    a: 'For eligible corporate-covered services, the order may be marked as corporate billing and user payable can become zero per assigned policy.'
  },
  {
    q: 'How can I contact support for urgent booking issues?',
    a: 'Use support channels from your account or contact page. Include order number for faster resolution.'
  }
];

export default function FaqPage() {
  const faqJsonLd = buildFaqSchema(faqs.map((item) => ({ question: item.q, answer: item.a })));
  const breadcrumbJsonLd = buildBreadcrumbSchema([
    { name: 'Home', item: absoluteUrl('/') },
    { name: 'FAQ', item: absoluteUrl('/faq') }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/20 via-white to-slate-50 py-12">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-r from-teal-600 to-teal-700 text-white p-8 shadow-xl">
          <h1 className="text-3xl md:text-4xl font-black">Frequently Asked Questions</h1>
          <p className="mt-3 text-teal-100">
            Standard FAQs for diagnostic test booking, lab operations, reports, and payment workflows.
          </p>
        </div>

        <div className="mt-8">
          <FaqAccordion faqs={faqs} />
        </div>
      </div>
    </div>
  );
}
