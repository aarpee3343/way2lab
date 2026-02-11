'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { toast } from '@/lib/safe-toast';
import type {
  AdminSettingsData,
  SmsTemplate,
  CompanyProfileSetting
} from '@/app/actions/adminSettingsActions';
import {
  updateCompanyProfileAction,
  updateDefaultsAction,
  updatePaymentModesAction,
  updateSmsTemplatesAction
} from '@/app/actions/adminSettingsActions';
import {
  Building2,
  ChevronDown,
  CreditCard,
  MessageSquareText,
  Plus,
  Save,
  Settings2,
  Trash2
} from 'lucide-react';

type SectionId = 'company' | 'payment' | 'defaults' | 'sms';

export default function AdminSettingsClient({ initialSettings }: { initialSettings: AdminSettingsData }) {
  const [activeSection, setActiveSection] = useState<SectionId>('company');
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileSetting>(initialSettings.companyProfile);

  const [paymentModes, setPaymentModes] = useState<string[]>(initialSettings.paymentModes.modes || []);
  const [defaultPaymentMode, setDefaultPaymentMode] = useState(initialSettings.paymentModes.defaultMode);

  const [collectionType, setCollectionType] = useState(initialSettings.defaults.collectionType);
  const [homeCharge, setHomeCharge] = useState(String(initialSettings.defaults.homeCharge ?? 0));

  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>(initialSettings.smsTemplates.templates || []);
  const systemSmsTypes = new Set<string>(initialSettings.smsTemplateTypes || []);

  const [pending, startTransition] = useTransition();

  const setCompanyField = (key: keyof CompanyProfileSetting, value: string) => {
    setCompanyProfile((prev) => ({ ...prev, [key]: value }));
  };

  const setCompanyAccountField = (key: keyof CompanyProfileSetting['accounts'], value: string) => {
    setCompanyProfile((prev) => ({
      ...prev,
      accounts: { ...prev.accounts, [key]: value }
    }));
  };

  const setCompanyInvoicingField = (key: keyof CompanyProfileSetting['invoicing'], value: string | number) => {
    setCompanyProfile((prev) => ({
      ...prev,
      invoicing: { ...prev.invoicing, [key]: value }
    }));
  };

  const saveCompanyProfile = () => {
    startTransition(async () => {
      const res = await updateCompanyProfileAction(companyProfile);
      if (res.success) {
        toast.success('Company profile updated');
      } else {
        toast.error(res.error || 'Failed to update company profile');
      }
    });
  };

  const addPaymentMode = () => {
    setPaymentModes((prev) => [...prev, '']);
  };

  const updatePaymentMode = (index: number, value: string) => {
    setPaymentModes((prev) => prev.map((m, i) => (i === index ? value : m)));
  };

  const removePaymentMode = (index: number) => {
    setPaymentModes((prev) => prev.filter((_, i) => i !== index));
  };

  const savePaymentModes = () => {
    startTransition(async () => {
      const cleaned = paymentModes.map((m) => m.trim()).filter(Boolean);
      const unique = Array.from(new Set(cleaned));
      const fallback = unique.length ? unique : ['Pay Upon Service'];
      const nextDefault = fallback.includes(defaultPaymentMode) ? defaultPaymentMode : fallback[0];

      const res = await updatePaymentModesAction({ modes: fallback, defaultMode: nextDefault });
      if (res.success) {
        setPaymentModes(fallback);
        setDefaultPaymentMode(nextDefault);
        toast.success('Payment modes updated');
      } else {
        toast.error(res.error || 'Failed to update payment modes');
      }
    });
  };

  const saveDefaults = () => {
    startTransition(async () => {
      const res = await updateDefaultsAction({
        collectionType,
        homeCharge: Number(homeCharge || 0)
      });
      if (res.success) {
        toast.success('Defaults updated');
      } else {
        toast.error(res.error || 'Failed to update defaults');
      }
    });
  };

  const updateSmsTemplate = (index: number, patch: Partial<SmsTemplate>) => {
    setSmsTemplates((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const addSmsTemplate = () => {
    setSmsTemplates((prev) => [...prev, { type: '', id: '', message: '' }]);
  };

  const removeSmsTemplate = (index: number) => {
    setSmsTemplates((prev) => prev.filter((_, i) => i !== index));
  };

  const saveSmsTemplates = () => {
    startTransition(async () => {
      const res = await updateSmsTemplatesAction(smsTemplates);
      if (res.success) {
        toast.success('SMS templates updated');
      } else {
        toast.error(res.error || 'Failed to update SMS templates');
      }
    });
  };

  return (
    <div className="admin-space-y">
      <div>
        <h1 className="admin-page-title">Settings</h1>
        <p className="admin-page-subtitle">Enterprise controls, defaults, communication templates and finance identity.</p>
      </div>

      <SectionShell
        id="company"
        title="Company Profile & Billing Identity"
        subtitle="Brand, legal, tax, contact and bank details used in enterprise workflows."
        icon={<Building2 size={16} />}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="admin-form-label">Brand Name</label>
            <input className="admin-form-input" value={companyProfile.brandName} onChange={(e) => setCompanyField('brandName', e.target.value)} />
          </div>
          <div>
            <label className="admin-form-label">Legal Name</label>
            <input className="admin-form-input" value={companyProfile.legalName} onChange={(e) => setCompanyField('legalName', e.target.value)} />
          </div>
          <div>
            <label className="admin-form-label">PAN</label>
            <input className="admin-form-input uppercase" value={companyProfile.pan} onChange={(e) => setCompanyField('pan', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="admin-form-label">GSTIN</label>
            <input className="admin-form-input uppercase" value={companyProfile.gstin} onChange={(e) => setCompanyField('gstin', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="admin-form-label">CIN</label>
            <input className="admin-form-input uppercase" value={companyProfile.cin} onChange={(e) => setCompanyField('cin', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="admin-form-label">Website</label>
            <input className="admin-form-input" value={companyProfile.website} onChange={(e) => setCompanyField('website', e.target.value)} />
          </div>
          <div>
            <label className="admin-form-label">Customer Care Number</label>
            <input className="admin-form-input" value={companyProfile.customerCareNumber} onChange={(e) => setCompanyField('customerCareNumber', e.target.value)} />
          </div>
          <div>
            <label className="admin-form-label">Alternate Contact Number</label>
            <input className="admin-form-input" value={companyProfile.alternateContactNumber} onChange={(e) => setCompanyField('alternateContactNumber', e.target.value)} />
          </div>
          <div>
            <label className="admin-form-label">Support Email</label>
            <input className="admin-form-input" value={companyProfile.supportEmail} onChange={(e) => setCompanyField('supportEmail', e.target.value)} />
          </div>
          <div>
            <label className="admin-form-label">Billing Email</label>
            <input className="admin-form-input" value={companyProfile.billingEmail} onChange={(e) => setCompanyField('billingEmail', e.target.value)} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="lg:col-span-2">
            <label className="admin-form-label">Address Line 1</label>
            <input className="admin-form-input" value={companyProfile.addressLine1} onChange={(e) => setCompanyField('addressLine1', e.target.value)} />
          </div>
          <div className="lg:col-span-2">
            <label className="admin-form-label">Address Line 2</label>
            <input className="admin-form-input" value={companyProfile.addressLine2} onChange={(e) => setCompanyField('addressLine2', e.target.value)} />
          </div>
          <div>
            <label className="admin-form-label">City</label>
            <input className="admin-form-input" value={companyProfile.city} onChange={(e) => setCompanyField('city', e.target.value)} />
          </div>
          <div>
            <label className="admin-form-label">State</label>
            <input className="admin-form-input" value={companyProfile.state} onChange={(e) => setCompanyField('state', e.target.value)} />
          </div>
          <div>
            <label className="admin-form-label">Pincode</label>
            <input className="admin-form-input" value={companyProfile.pincode} onChange={(e) => setCompanyField('pincode', e.target.value)} />
          </div>
          <div>
            <label className="admin-form-label">Country</label>
            <input className="admin-form-input" value={companyProfile.country} onChange={(e) => setCompanyField('country', e.target.value)} />
          </div>
        </div>

        <div className="mt-5 border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-800">Bank & Account Details</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="admin-form-label">Beneficiary Name</label>
              <input className="admin-form-input" value={companyProfile.accounts.beneficiaryName} onChange={(e) => setCompanyAccountField('beneficiaryName', e.target.value)} />
            </div>
            <div>
              <label className="admin-form-label">Bank Name</label>
              <input className="admin-form-input" value={companyProfile.accounts.bankName} onChange={(e) => setCompanyAccountField('bankName', e.target.value)} />
            </div>
            <div>
              <label className="admin-form-label">Branch Name</label>
              <input className="admin-form-input" value={companyProfile.accounts.branchName} onChange={(e) => setCompanyAccountField('branchName', e.target.value)} />
            </div>
            <div>
              <label className="admin-form-label">Account Type</label>
              <select
                className="admin-form-input"
                value={companyProfile.accounts.accountType}
                onChange={(e) => setCompanyAccountField('accountType', e.target.value as '' | 'CURRENT' | 'SAVINGS')}
              >
                <option value="">Select Type</option>
                <option value="CURRENT">Current</option>
                <option value="SAVINGS">Savings</option>
              </select>
            </div>
            <div>
              <label className="admin-form-label">Account Number</label>
              <input className="admin-form-input" value={companyProfile.accounts.accountNumber} onChange={(e) => setCompanyAccountField('accountNumber', e.target.value)} />
            </div>
            <div>
              <label className="admin-form-label">IFSC Code</label>
              <input className="admin-form-input uppercase" value={companyProfile.accounts.ifscCode} onChange={(e) => setCompanyAccountField('ifscCode', e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="admin-form-label">SWIFT Code</label>
              <input className="admin-form-input uppercase" value={companyProfile.accounts.swiftCode} onChange={(e) => setCompanyAccountField('swiftCode', e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="admin-form-label">MICR Code</label>
              <input className="admin-form-input" value={companyProfile.accounts.micrCode} onChange={(e) => setCompanyAccountField('micrCode', e.target.value)} />
            </div>
            <div>
              <label className="admin-form-label">UPI ID</label>
              <input className="admin-form-input" value={companyProfile.accounts.upiId} onChange={(e) => setCompanyAccountField('upiId', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-5 border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-800">Invoice Governance</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="admin-form-label">Invoice Prefix</label>
              <input className="admin-form-input" value={companyProfile.invoicing.invoicePrefix} onChange={(e) => setCompanyInvoicingField('invoicePrefix', e.target.value)} />
            </div>
            <div>
              <label className="admin-form-label">Billing Cycle</label>
              <input className="admin-form-input" value={companyProfile.invoicing.billingCycle} onChange={(e) => setCompanyInvoicingField('billingCycle', e.target.value)} />
            </div>
            <div>
              <label className="admin-form-label">Payment Terms (Days)</label>
              <input
                type="number"
                className="admin-form-input"
                value={companyProfile.invoicing.paymentTermsDays}
                onChange={(e) => setCompanyInvoicingField('paymentTermsDays', Number(e.target.value || 0))}
              />
            </div>
            <div>
              <label className="admin-form-label">Place of Supply</label>
              <input className="admin-form-input" value={companyProfile.invoicing.placeOfSupply} onChange={(e) => setCompanyInvoicingField('placeOfSupply', e.target.value)} />
            </div>
            <div>
              <label className="admin-form-label">Authorized Signatory</label>
              <input className="admin-form-input" value={companyProfile.invoicing.authorizedSignatory} onChange={(e) => setCompanyInvoicingField('authorizedSignatory', e.target.value)} />
            </div>
            <div>
              <label className="admin-form-label">Designation</label>
              <input className="admin-form-input" value={companyProfile.invoicing.signatoryDesignation} onChange={(e) => setCompanyInvoicingField('signatoryDesignation', e.target.value)} />
            </div>
            <div className="lg:col-span-3">
              <label className="admin-form-label">Invoice Declaration</label>
              <textarea
                rows={3}
                className="admin-form-textarea"
                value={companyProfile.invoicing.declaration}
                onChange={(e) => setCompanyInvoicingField('declaration', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button onClick={saveCompanyProfile} disabled={pending} className="admin-btn-primary flex items-center gap-2">
            <Save size={16} /> {pending ? 'Saving...' : 'Save Company Details'}
          </button>
        </div>
      </SectionShell>

      <SectionShell
        id="payment"
        title="Payment Modes"
        subtitle="Control modes available in admin order creation."
        icon={<CreditCard size={16} />}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">Available payment options</div>
          <button onClick={addPaymentMode} className="admin-btn-secondary flex items-center gap-2">
            <Plus size={16} /> Add Mode
          </button>
        </div>

        <div className="space-y-3 mt-3">
          {paymentModes.map((mode, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <input
                value={mode}
                onChange={(e) => updatePaymentMode(index, e.target.value)}
                className="flex-1 admin-form-input"
                placeholder="e.g. Pay Upon Service"
              />
              <button onClick={() => removePaymentMode(index)} className="admin-btn-secondary text-slate-500" type="button">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mt-4">
          <label className="text-sm font-medium text-slate-700">Default Payment Mode</label>
          <select value={defaultPaymentMode} onChange={(e) => setDefaultPaymentMode(e.target.value)} className="admin-form-input md:w-64">
            {paymentModes.filter(Boolean).map((mode, idx) => (
              <option key={`${mode}-${idx}`} value={mode}>
                {mode}
              </option>
            ))}
          </select>
          <button onClick={savePaymentModes} disabled={pending} className="admin-btn-primary flex items-center gap-2">
            <Save size={16} /> {pending ? 'Saving...' : 'Save Payment Modes'}
          </button>
        </div>
      </SectionShell>

      <SectionShell
        id="defaults"
        title="Order Defaults"
        subtitle="Applies to new orders created in admin."
        icon={<Settings2 size={16} />}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="admin-form-label">Default Collection Type</label>
            <select
              value={collectionType}
              onChange={(e) => setCollectionType(e.target.value as 'center_visit' | 'home_collection')}
              className="admin-form-input"
            >
              <option value="center_visit">Center Visit</option>
              <option value="home_collection">Home Collection</option>
            </select>
          </div>
          <div>
            <label className="admin-form-label">Default Home Charge</label>
            <input type="number" className="admin-form-input" value={homeCharge} onChange={(e) => setHomeCharge(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={saveDefaults} disabled={pending} className="admin-btn-primary flex items-center gap-2">
              <Save size={16} /> {pending ? 'Saving...' : 'Save Defaults'}
            </button>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        id="sms"
        title="SMS Templates"
        subtitle="Default and custom DLT templates for outbound communication."
        icon={<MessageSquareText size={16} />}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">Default templates cannot be removed.</div>
          <button onClick={addSmsTemplate} className="admin-btn-secondary flex items-center gap-2">
            <Plus size={16} /> Add Template
          </button>
        </div>

        <div className="space-y-4 mt-4">
          {smsTemplates.map((template, index) => (
            <div key={`${template.type || 'custom'}-${index}`} className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-700">Template Type</p>
                  <p className="text-xs text-slate-400">Use unique flow key (example: FOLLOW_UP)</p>
                </div>
                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <input
                    className="admin-form-input md:w-64"
                    value={template.type}
                    onChange={(e) => updateSmsTemplate(index, { type: e.target.value })}
                    disabled={systemSmsTypes.has(template.type)}
                    placeholder="Template Type"
                  />
                  {!systemSmsTypes.has(template.type) && (
                    <button type="button" onClick={() => removeSmsTemplate(index)} className="admin-btn-secondary text-slate-500">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <p className="text-xs text-slate-400">DLT Template ID</p>
                <input className="admin-form-input md:w-64" value={template.id} onChange={(e) => updateSmsTemplate(index, { id: e.target.value })} />
              </div>
              <textarea className="admin-form-textarea" rows={3} value={template.message} onChange={(e) => updateSmsTemplate(index, { message: e.target.value })} />
            </div>
          ))}
        </div>

        <button onClick={saveSmsTemplates} disabled={pending} className="admin-btn-primary flex items-center gap-2 mt-3">
          <Save size={16} /> {pending ? 'Saving...' : 'Save SMS Templates'}
        </button>
      </SectionShell>
    </div>
  );
}

function SectionShell({
  id,
  title,
  subtitle,
  icon,
  activeSection,
  setActiveSection,
  children
}: {
  id: SectionId;
  title: string;
  subtitle: string;
  icon: ReactNode;
  activeSection: SectionId;
  setActiveSection: (id: SectionId) => void;
  children: ReactNode;
}) {
  const isOpen = activeSection === id;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        onClick={() => setActiveSection(isOpen ? activeSection : id)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-slate-700">{icon}</div>
          <div>
            <h2 className="text-base font-bold text-slate-800">{title}</h2>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && <div className="px-6 pb-6 border-t border-slate-200 pt-4">{children}</div>}
    </div>
  );
}
