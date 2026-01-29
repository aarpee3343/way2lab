import LegalLayout from '@/components/layout/LegalLayout';

export default function RefundPolicy() {
  return (
    <LegalLayout 
      title="Healthcare Refund Policy" 
      subtitle="Transparent cancellation and refund rules designed for patient convenience."
      updatedAt="January 28, 2026"
      icon="refund"
    >
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100 mb-8">
          <h4 className="font-bold text-amber-800 mb-2">⚕️ Patient-First Refund Assurance</h4>
          <p className="text-slate-700">
            Your satisfaction with our diagnostic services is our priority. We offer flexible refund options while maintaining healthcare service standards.
          </p>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">1. Diagnostic Test Cancellation Policy</h3>
        <p>
          We understand that healthcare needs can change. Here's our patient-friendly cancellation schedule:
        </p>
        
        <div className="space-y-4 mt-6">
          <div className="border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-50/50">
            <h4 className="font-bold text-slate-800">More than 2 hours before appointment</h4>
            <p className="text-slate-600 mt-1"><strong>100% Refund</strong> - Full amount returned, no questions asked</p>
          </div>
          
          <div className="border-l-4 border-amber-500 pl-4 py-2 bg-amber-50/50">
            <h4 className="font-bold text-slate-800">Less than 2 hours before appointment</h4>
            <p className="text-slate-600 mt-1"><strong>Refund after deduction</strong> - ₹100 convenience fee for phlebotomist scheduling</p>
          </div>
          
          <div className="border-l-4 border-rose-500 pl-4 py-2 bg-rose-50/50">
            <h4 className="font-bold text-slate-800">After phlebotomist arrival</h4>
            <p className="text-slate-600 mt-1"><strong>No Refund</strong> - Healthcare professional has already been dispatched</p>
          </div>
          
          <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50">
            <h4 className="font-bold text-slate-800">Phlebotomist no-show</h4>
            <p className="text-slate-600 mt-1"><strong>200% Refund</strong> - Double your money back as compensation</p>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">2. Refund Processing Timeline</h3>
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-xl border border-teal-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <span className="text-teal-600 font-bold">⏱️</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Standard Processing: 5-7 business days</h4>
              <p className="text-sm text-slate-600">Approved refunds are processed within this timeframe</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <span>Refunds are credited to your original payment method</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <span>Credit Card/Debit Card: 3-5 business days</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <span>UPI/Wallets: 1-2 business days</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <span>Net Banking: 3-7 business days</span>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">3. Laboratory Service Issues</h3>
        <p>
          In rare cases where our partner laboratories face service disruptions:
        </p>
        
        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-600 font-bold">🔄</span>
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Free Re-collection</h4>
            <p className="text-slate-600 text-sm">Priority appointment with waived charges for sample recollection</p>
          </div>
          
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-emerald-600 font-bold">💰</span>
            </div>
            <h4 className="font-bold text-slate-800 mb-2">100% Instant Refund</h4>
            <p className="text-slate-600 text-sm">Full refund processed within 24 hours for service failures</p>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">4. Diagnostic Report Issues</h3>
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
          <p className="text-slate-700 mb-4">
            If you suspect an error in your diagnostic report, please contact us immediately:
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-rose-600 font-bold text-sm">!</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Report Dispute Timeline</h4>
                <p className="text-sm text-slate-600">Contact within <strong>24 hours</strong> of report generation for priority investigation</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-bold text-sm">🔬</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Technical Investigation</h4>
                <p className="text-sm text-slate-600">We coordinate with the certified laboratory for re-testing or validation</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-teal-600 font-bold text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Refund Eligibility</h4>
                <p className="text-sm text-slate-600">Subject to technical validation by the NABL accredited laboratory</p>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">5. Healthcare Support</h3>
        <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-6 rounded-2xl border border-teal-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">⛑️</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Need Assistance?</h4>
              <p className="text-slate-600 mt-1">Our healthcare support team is available 24/7 to help with refunds and cancellations</p>
              <div className="flex flex-wrap gap-4 mt-3">
                <a href="tel:+919311213388" className="inline-flex items-center gap-2 text-teal-700 font-semibold hover:text-teal-800 transition-colors">
                  <span>📞 +91 93112 13388</span>
                </a>
                <a href="mailto:support@waytolab.com" className="inline-flex items-center gap-2 text-teal-700 font-semibold hover:text-teal-800 transition-colors">
                  <span>📧 support@waytolab.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}