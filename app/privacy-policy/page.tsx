import LegalLayout from '@/components/layout/LegalLayout';

export default function PrivacyPolicy() {
  return (
    <LegalLayout 
      title="Healthcare Privacy Policy" 
      subtitle="We protect your medical data with industry-leading security and compliance."
      updatedAt="January 28, 2026"
      icon="privacy"
    >
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-2xl border border-teal-100 mb-8">
          <h4 className="font-bold text-teal-800 mb-2">🛡️ Healthcare Data Protection</h4>
          <p className="text-slate-700">
            WayToLab is HIPAA compliant and follows Indian medical data protection guidelines. Your health information is encrypted and accessible only to authorized personnel.
          </p>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">1. Healthcare Data Collection</h3>
        <p>
          As a diagnostic healthcare platform, we collect specific medical information to provide you with accurate services:
        </p>
        <ul className="space-y-2 mt-4">
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
            <span><strong>Medical Identity Data:</strong> Full name, age, gender, date of birth, blood group</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
            <span><strong>Healthcare Contact Data:</strong> Billing address, delivery address, email address, emergency contact</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
            <span><strong>Sensitive Health Data:</strong> Medical history, prescriptions, diagnostic test results, symptoms</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
            <span><strong>Technical Data:</strong> IP address, device information, browser type for security monitoring</span>
          </li>
        </ul>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">2. Medical Data Usage</h3>
        <p>
          Your health data is used exclusively for providing diagnostic services and is shared only with authorized medical professionals:
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-teal-600 font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Lab Processing</h4>
              <p className="text-sm text-slate-600">Shared with NABL/CAP certified laboratories for sample analysis</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-teal-600 font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Medical Consultation</h4>
              <p className="text-sm text-slate-600">Shared with doctors for report interpretation and consultation</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-teal-600 font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Healthcare Services</h4>
              <p className="text-sm text-slate-600">Used for appointment scheduling and result delivery</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100 mt-6">
          <p className="text-emerald-800 font-semibold">
            🔒 <strong>Medical Data Protection:</strong> We never sell your personal health information to advertisers or third-party marketers.
          </p>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">3. Healthcare Data Security</h3>
        <p>
          We implement military-grade security measures to protect your medical information:
        </p>
        <ul className="space-y-3 mt-4">
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>256-bit end-to-end encryption for all health reports</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>HIPAA and GDPR compliant data storage infrastructure</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Regular security audits and penetration testing</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Multi-factor authentication for medical staff access</span>
          </li>
        </ul>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">4. Patient Rights</h3>
        <p>
          As a patient, you have complete control over your medical data:
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl">
            <h4 className="font-bold text-slate-800 mb-2">Access Rights</h4>
            <p className="text-sm text-slate-600">Download all your medical reports and health data anytime</p>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-xl">
            <h4 className="font-bold text-slate-800 mb-2">Correction Rights</h4>
            <p className="text-sm text-slate-600">Request corrections to inaccurate medical information</p>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-xl">
            <h4 className="font-bold text-slate-800 mb-2">Deletion Rights</h4>
            <p className="text-sm text-slate-600">Request deletion of non-essential medical data (subject to legal retention requirements)</p>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-xl">
            <h4 className="font-bold text-slate-800 mb-2">Consent Rights</h4>
            <p className="text-sm text-slate-600">Control sharing preferences for your health information</p>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">5. Healthcare Contact</h3>
        <div className="bg-gradient-to-r from-teal-50 to-white p-6 rounded-2xl border border-teal-100">
          <p className="text-slate-700 mb-4">
            For any questions about our healthcare privacy practices or to exercise your patient rights, please contact:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <span className="text-teal-600 font-bold">📧</span>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Data Protection Officer</p>
                <a href="mailto:privacy@waytolab.com" className="text-teal-600 hover:text-teal-700 transition-colors">
                  privacy@waytolab.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">📞</span>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Healthcare Privacy Helpline</p>
                <a href="tel:+919311213388" className="text-blue-600 hover:text-blue-700 transition-colors">
                  +91 93112 13388
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}