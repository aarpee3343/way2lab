import LegalLayout from '@/components/layout/LegalLayout';

export default function TermsPage() {
  return (
    <LegalLayout 
      title="Healthcare Terms of Service" 
      subtitle="Medical service terms designed for patient safety and transparency."
      updatedAt="January 28, 2026"
      icon="logo"
    >
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-2xl border border-teal-100 mb-8">
          <h4 className="font-bold text-teal-800 mb-2">🏥 Healthcare Service Terms</h4>
          <p className="text-slate-700">
            WayToLab provides diagnostic aggregation services connecting patients with certified laboratories. Please review these healthcare-specific terms carefully.
          </p>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">1. Healthcare Service Agreement</h3>
        <p>
          By using WayToLab, you acknowledge and agree to these healthcare service terms. If you disagree with any provision, you may not access our diagnostic services.
        </p>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mt-4">
          <p className="text-slate-700 italic">
            <strong>Note:</strong> These terms govern the use of healthcare services, not medical treatment. Always consult with licensed healthcare professionals for medical advice.
          </p>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">2. Our Healthcare Role</h3>
        <p>
          WayToLab operates as a <strong>diagnostic service aggregator and facilitator</strong> in the healthcare ecosystem:
        </p>
        
        <div className="space-y-4 mt-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-teal-600 font-bold">⚕️</span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Service Aggregator</h4>
              <p className="text-slate-600">We connect patients with NABL/CAP certified diagnostic laboratories</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-teal-600 font-bold">📋</span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Quality Assurance</h4>
              <p className="text-slate-600">We ensure partner labs maintain certification and quality standards</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-teal-600 font-bold">⚠️</span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Important Limitations</h4>
              <ul className="text-slate-600 space-y-1 mt-1">
                <li>• We do not own or operate diagnostic testing equipment</li>
                <li>• Laboratory accuracy liability rests with the certified lab</li>
                <li>• We provide trained phlebotomists for sample collection</li>
              </ul>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">3. Appointment & Cancellation Terms</h3>
        <div className="bg-gradient-to-r from-blue-50 to-slate-50 p-6 rounded-xl border border-blue-100">
          <h4 className="font-bold text-slate-800 mb-3">Healthcare Appointment Guidelines</h4>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-slate-700">Appointments are subject to phlebotomist availability in your area</p>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-slate-700">While we strive for punctuality, healthcare delays may occur due to:</p>
            </div>
            
            <div className="ml-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                <span className="text-slate-600 text-sm">Traffic or weather conditions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                <span className="text-slate-600 text-sm">Medical emergencies or priority cases</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                <span className="text-slate-600 text-sm">Technical issues with sample collection kits</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-slate-700">Significant delays (over 60 minutes) will be communicated proactively</p>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">4. Patient Responsibilities</h3>
        <p>
          To ensure accurate diagnostic results, patients must adhere to these healthcare guidelines:
        </p>
        
        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-emerald-600 font-bold">✅</span>
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Accurate Information</h4>
            <p className="text-slate-600 text-sm">Provide complete and truthful medical history and current symptoms</p>
          </div>
          
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-amber-600 font-bold">⏰</span>
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Preparation Compliance</h4>
            <p className="text-slate-600 text-sm">Follow fasting and medication guidelines as instructed for tests</p>
          </div>
          
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-blue-600 font-bold">💊</span>
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Medication Disclosure</h4>
            <p className="text-slate-600 text-sm">Disclose all current medications and supplements</p>
          </div>
          
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-rose-600 font-bold">⚠️</span>
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Service Disclaimer</h4>
            <p className="text-slate-600 text-sm">WayToLab is not responsible for results affected by preparation non-compliance</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-rose-50 to-orange-50 p-5 rounded-xl border border-rose-100 mt-6">
          <p className="text-rose-800 font-medium">
            <strong>Important:</strong> Diagnostic test results should always be interpreted by qualified healthcare professionals. WayToLab does not provide medical diagnosis.
          </p>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">5. Healthcare Payment Terms</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-teal-600 font-bold">₹</span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Dynamic Pricing</h4>
              <p className="text-slate-600">Diagnostic test prices may vary based on lab partnerships and service areas</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-teal-600 font-bold">📱</span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Payment Confirmation</h4>
              <p className="text-slate-600">The price displayed at booking confirmation is the final charged amount</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-teal-600 font-bold">🧾</span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Healthcare GST</h4>
              <p className="text-slate-600">All prices include applicable GST as per Indian healthcare service regulations</p>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mt-10 mb-4">6. Healthcare Liability Limitations</h3>
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
          <p className="text-slate-700 mb-4">
            As a healthcare service facilitator, our liability is limited to:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-slate-600 font-bold">⚖️</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Service Facilitation</h4>
                <p className="text-slate-600">Limited to the coordination and delivery of diagnostic services</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-slate-600 font-bold">🚫</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Excluded Liabilities</h4>
                <p className="text-slate-600">We are not liable for indirect, incidental, or consequential damages arising from diagnostic services</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-slate-600 font-bold">🏛️</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Legal Jurisdiction</h4>
                <p className="text-slate-600">These terms are governed by Indian law and healthcare regulations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-2xl border border-teal-100 mt-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">📄</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Healthcare Compliance</h4>
              <p className="text-slate-600 mt-1">These terms comply with Indian healthcare regulations and patient safety guidelines</p>
            </div>
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}