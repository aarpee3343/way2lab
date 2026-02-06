'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  HeartPulse,
  Home,
  MapPin,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  Users,
  Wallet
} from 'lucide-react';

const quickCards = [
  {
    icon: Building2,
    title: 'Corporate Registration',
    desc: 'Join with your corporate email or employee ID and verify your account in minutes.'
  },
  {
    icon: Wallet,
    title: 'Benefits Visibility',
    desc: 'See your covered packages, usage limits, and self vs family eligibility in one place.'
  },
  {
    icon: ClipboardList,
    title: 'Booking Flow',
    desc: 'Select beneficiary, set pincode, choose lab, schedule pickup, and confirm in 3 steps.'
  },
  {
    icon: Users,
    title: 'Family Coverage',
    desc: 'Add dependents, check family eligibility, and book for parents, spouse, or kids.'
  }
];

const registerSteps = [
  {
    step: '01',
    title: 'Start Registration',
    desc: 'Click Register and enter your corporate email or employee ID as provided by your HR.'
  },
  {
    step: '02',
    title: 'Verify OTP',
    desc: 'Confirm your phone or email via OTP to secure your corporate account.'
  },
  {
    step: '03',
    title: 'Complete Profile',
    desc: 'Add your name, DOB, gender, and primary phone so labs can process your tests.'
  },
  {
    step: '04',
    title: 'Corporate Activation',
    desc: 'Your corporate admin activates your benefits. You will see them on the Benefits page.'
  }
];

const benefitsSteps = [
  {
    step: '01',
    title: 'Open Corporate Benefits',
    desc: 'After login, go to Dashboard and open Corporate Benefits.'
  },
  {
    step: '02',
    title: 'Set Service Pincode',
    desc: 'Enter your 6-digit pincode to view labs that accept your corporate benefits.'
  },
  {
    step: '03',
    title: 'Check Coverage',
    desc: 'See if each benefit is Corporate Pays or Self Pay for Self and Family.'
  },
  {
    step: '04',
    title: 'Select Lab & Book',
    desc: 'Choose a lab and continue to checkout with your corporate discount applied.'
  }
];

const selfFlow = [
  'Use your corporate account to sign in.',
  'Open Corporate Benefits and choose a covered package.',
  'Proceed to checkout and select "Myself" as the patient.',
  'Pick address, slot, and confirm. Corporate-paid packages show payable INR 0.'
];

const familyFlow = [
  'Add family members in Dashboard > Family Members or during checkout.',
  'Confirm family eligibility and remaining usage in Corporate Benefits.',
  'Select a family member at checkout and complete address + slot.',
  'Pay only if the benefit is marked Self Pay for Family.'
];

const bookingSteps = [
  {
    icon: BadgeCheck,
    title: 'Choose Benefit',
    desc: 'Select a corporate package from Benefits or add a test from search.'
  },
  {
    icon: Users,
    title: 'Select Patient',
    desc: 'Pick "Myself" or a family member and confirm details.'
  },
  {
    icon: MapPin,
    title: 'Add Address',
    desc: 'Use an address with the same pincode as the chosen lab.'
  },
  {
    icon: Home,
    title: 'Choose Collection',
    desc: 'Select Home Collection or Lab Visit based on test type.'
  },
  {
    icon: HeartPulse,
    title: 'Pick Slot',
    desc: 'Choose date and time for sample pickup or lab visit.'
  },
  {
    icon: CreditCard,
    title: 'Review & Confirm',
    desc: 'Corporate-pay benefits show INR 0 payable. Submit the booking.'
  }
];

const faqs = [
  {
    title: 'I registered but can not see my corporate benefits.',
    desc: 'Your corporate admin must activate your profile. Also verify that you used the official corporate email or ID provided by HR.'
  },
  {
    title: 'My benefit says Self Pay. What does that mean?',
    desc: 'Your organization has assigned the package but payment is self-paid. Corporate benefits may still waive home collection charges.'
  },
  {
    title: 'Family member is not eligible.',
    desc: 'Eligibility and usage limits are defined by your corporate policy. Check the "Family Remaining" count on the Benefits page.'
  },
  {
    title: 'Lab not available for my pincode.',
    desc: 'Try a different pincode or choose another lab. Benefits only show labs that cover your service area.'
  }
];

export default function CorporateBenefitsGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/30">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-700 via-teal-600 to-sky-600 text-white">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
              backgroundSize: '90px 90px'
            }}
          />
        </div>
        <div className="absolute -top-24 -right-12 h-72 w-72 rounded-full bg-sky-400/30 blur-[120px]" />
        <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-emerald-400/20 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest"
          >
            <ShieldCheck size={14} /> Corporate User Guide
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-4xl md:text-6xl font-black tracking-tight"
          >
            Corporate Benefits,{' '}
            <span className="text-teal-200">Simplified</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-teal-100"
          >
            A complete, step-by-step guide for corporate users to register, activate benefits,
            book tests for self or family, and complete the entire booking flow without help.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              href="/corp-login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-teal-700 shadow-lg shadow-teal-900/20 hover:shadow-xl hover:shadow-teal-900/30 transition-all"
            >
              Corporate Login
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition-all"
            >
              Create Account
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="-mt-10 relative z-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-teal-100 shadow-xl shadow-teal-200/20 p-6">
            <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-widest text-teal-700">
              <a href="#register" className="rounded-full bg-teal-50 px-4 py-2 hover:bg-teal-100 transition-colors">Registration</a>
              <a href="#benefits" className="rounded-full bg-teal-50 px-4 py-2 hover:bg-teal-100 transition-colors">Benefits</a>
              <a href="#self-family" className="rounded-full bg-teal-50 px-4 py-2 hover:bg-teal-100 transition-colors">Self & Family</a>
              <a href="#booking" className="rounded-full bg-teal-50 px-4 py-2 hover:bg-teal-100 transition-colors">Booking Flow</a>
              <a href="#faq" className="rounded-full bg-teal-50 px-4 py-2 hover:bg-teal-100 transition-colors">Help</a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Cards */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                <card.icon size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Registration Section */}
      <section id="register" className="py-16">
        <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-teal-700">
              <UserPlus size={14} /> Registration
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl font-black text-slate-900">
              Register Your Corporate Account
            </h2>
            <p className="mt-3 text-slate-600 text-lg">
              Corporate users can register using a company email or employee ID. Once verified, your
              HR team activates benefits assigned to you.
            </p>

            <div className="mt-8 space-y-4">
              {registerSteps.map((step) => (
                <div key={step.step} className="flex gap-4 rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
                  <div className="text-xs font-black text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full h-fit">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{step.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-teal-50/40 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Building2 size={20} className="text-teal-600" />
                <h3 className="text-lg font-bold text-slate-900">Who Can Register</h3>
              </div>
              <p className="text-sm text-slate-600">
                Corporate benefits are available to employees whose organizations have partnered with WayToLab.
                Use the exact email or ID shared by your HR.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Valid corporate email or employee ID
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Active employment status
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Mobile number for OTP verification
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <FileText size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Keep These Ready</h3>
              </div>
              <div className="grid gap-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Employee ID or corporate email
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Date of birth for accurate reports
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Correct mobile number for OTP
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 bg-gradient-to-b from-white to-teal-50/40">
        <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-700">
              <Wallet size={14} /> Benefits & Eligibility
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              View Your Corporate Benefits
            </h2>
            <p className="text-lg text-slate-600">
              Benefits are tied to your corporate profile. Once activated, you can view coverage,
              limits, and eligible family members directly in your dashboard.
            </p>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Stethoscope size={20} className="text-teal-600" />
                <h3 className="text-lg font-bold text-slate-900">What You Will See</h3>
              </div>
              <div className="grid gap-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Corporate Pays or Self Pay tag for each package
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Usage limits for Self and Family
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Validity period for each benefit
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {benefitsSteps.map((step) => (
              <div key={step.step} className="flex gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                <div className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full h-fit">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Self & Family Section */}
      <section id="self-family" className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
              <Users size={14} /> Self & Family Details
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl font-black text-slate-900">
              One Account, Multiple Beneficiaries
            </h2>
            <p className="mt-3 text-slate-600 text-lg">
              Corporate benefits can cover both you and eligible family members. Check your coverage
              type before booking.
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <BadgeCheck size={20} className="text-teal-600" />
                <h3 className="text-xl font-bold text-slate-900">Booking for Self</h3>
              </div>
              <div className="grid gap-3 text-sm text-slate-600">
                {selfFlow.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Users size={20} className="text-emerald-600" />
                <h3 className="text-xl font-bold text-slate-900">Booking for Family</h3>
              </div>
              <div className="grid gap-3 text-sm text-slate-600">
                {familyFlow.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Flow Section */}
      <section id="booking" className="py-16 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-700">
              <ClipboardList size={14} /> Booking Flow
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl font-black text-slate-900">
              Complete the Booking in 3 Simple Stages
            </h2>
            <p className="mt-3 text-slate-600 text-lg">
              The checkout process collects patient details, schedule, and confirmation. Corporate
              discounts are applied automatically when eligible.
            </p>
          </div>

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookingSteps.map((step) => (
              <div key={step.title} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <step.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-6">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck size={20} className="text-amber-600" />
                <h3 className="text-lg font-bold text-slate-900">Important Notes</h3>
              </div>
              <div className="grid gap-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Corporate pays benefits show payable amount as INR 0.
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Home collection charges are waived for corporate packages.
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Some tests may require lab visit instead of home collection.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <Stethoscope size={20} className="text-teal-600" />
                <h3 className="text-lg font-bold text-slate-900">After Booking</h3>
              </div>
              <div className="grid gap-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Track your order from Dashboard {'>'} Orders.
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Reports are shared digitally once the lab completes testing.
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                  Corporate admins may receive reports only if company policy allows sharing.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-teal-700">
              <ShieldCheck size={14} /> Help & FAQs
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl font-black text-slate-900">
              Need Help? Start Here
            </h2>
            <p className="mt-3 text-slate-600 text-lg">
              Most issues are solved by verifying your corporate credentials or checking your
              benefits status. If you still need help, contact our support team.
            </p>
          </div>

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div key={faq.title} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
                <h3 className="text-lg font-bold text-slate-900">{faq.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{faq.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-3xl bg-slate-900 text-white p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold">Still need assistance?</h3>
              <p className="text-slate-300 mt-2 text-sm">
                Our corporate support team can help with activation, eligibility, or booking issues.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900"
              >
                Contact Support
              </Link>
              <a
                href="tel:+919311213388"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white"
              >
                Call 93112 13388
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
