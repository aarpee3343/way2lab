'use client';

import { useState, useTransition } from 'react';
import { toast } from '@/lib/safe-toast';
import type { AdminSettingsData, SmsTemplate } from '@/app/actions/adminSettingsActions';
import { updateDefaultsAction, updatePaymentModesAction, updateSmsTemplatesAction } from '@/app/actions/adminSettingsActions';
import { Plus, Trash2, Save } from 'lucide-react';

export default function AdminSettingsClient({ initialSettings }: { initialSettings: AdminSettingsData }) {
  const [paymentModes, setPaymentModes] = useState<string[]>(initialSettings.paymentModes.modes || []);
  const [defaultPaymentMode, setDefaultPaymentMode] = useState(initialSettings.paymentModes.defaultMode);

  const [collectionType, setCollectionType] = useState(initialSettings.defaults.collectionType);
  const [homeCharge, setHomeCharge] = useState(String(initialSettings.defaults.homeCharge ?? 0));

  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>(initialSettings.smsTemplates.templates || []);
  const systemSmsTypes = new Set<string>(initialSettings.smsTemplateTypes || []);

  const [pending, startTransition] = useTransition();

  const addPaymentMode = () => {
    setPaymentModes(prev => [...prev, '']);
  };

  const updatePaymentMode = (index: number, value: string) => {
    setPaymentModes(prev => prev.map((m, i) => (i === index ? value : m)));
  };

  const removePaymentMode = (index: number) => {
    setPaymentModes(prev => prev.filter((_, i) => i !== index));
  };

  const savePaymentModes = () => {
    startTransition(async () => {
      const cleaned = paymentModes.map(m => m.trim()).filter(Boolean);
      const unique = Array.from(new Set(cleaned));
      const fallback = unique.length ? unique : ['Pay Upon Service'];
      const defaultMode = fallback.includes(defaultPaymentMode) ? defaultPaymentMode : fallback[0];

      const res = await updatePaymentModesAction({ modes: fallback, defaultMode });
      if (res.success) {
        setPaymentModes(fallback);
        setDefaultPaymentMode(defaultMode);
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
    setSmsTemplates(prev => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const addSmsTemplate = () => {
    setSmsTemplates(prev => [...prev, { type: '', id: '', message: '' }]);
  };

  const removeSmsTemplate = (index: number) => {
    setSmsTemplates(prev => prev.filter((_, i) => i !== index));
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
        <p className="admin-page-subtitle">Manage global preferences and defaults</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Payment Modes</h2>
            <p className="text-sm text-slate-500">Control which payment modes are available in admin order creation.</p>
          </div>
          <button onClick={addPaymentMode} className="admin-btn-secondary flex items-center gap-2">
            <Plus size={16} /> Add Mode
          </button>
        </div>

        <div className="space-y-3">
          {paymentModes.map((mode, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <input
                value={mode}
                onChange={(e) => updatePaymentMode(index, e.target.value)}
                className="flex-1 admin-form-input"
                placeholder="e.g. Pay Upon Service"
              />
              <button
                onClick={() => removePaymentMode(index)}
                className="admin-btn-secondary text-slate-500"
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <label className="text-sm font-medium text-slate-700">Default Payment Mode</label>
          <select
            value={defaultPaymentMode}
            onChange={(e) => setDefaultPaymentMode(e.target.value)}
            className="admin-form-input md:w-64"
          >
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
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Defaults</h2>
          <p className="text-sm text-slate-500">Applies to new orders created in admin.</p>
        </div>
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
            <input
              type="number"
              className="admin-form-input"
              value={homeCharge}
              onChange={(e) => setHomeCharge(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button onClick={saveDefaults} disabled={pending} className="admin-btn-primary flex items-center gap-2">
              <Save size={16} /> {pending ? 'Saving...' : 'Save Defaults'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">SMS Templates</h2>
          <p className="text-sm text-slate-500">
            Use placeholders like {'{{1}}'} or {'{{2}}'} for variables (order ID, date, etc.).
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Add custom templates for new SMS flows. Default templates cannot be removed.
          </div>
          <button onClick={addSmsTemplate} className="admin-btn-secondary flex items-center gap-2">
            <Plus size={16} /> Add Template
          </button>
        </div>

        <div className="space-y-4">
          {smsTemplates.map((template, index) => (
            <div
              key={`${template.type || 'custom'}-${index}`}
              className="border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-700">Template Type</p>
                  <p className="text-xs text-slate-400">Use a unique key (e.g. FOLLOW_UP)</p>
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
                    <button
                      type="button"
                      onClick={() => removeSmsTemplate(index)}
                      className="admin-btn-secondary text-slate-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">DLT Template ID</p>
                </div>
                <input
                  className="admin-form-input md:w-64"
                  value={template.id}
                  onChange={(e) => updateSmsTemplate(index, { id: e.target.value })}
                />
              </div>
              <textarea
                className="admin-form-textarea"
                rows={3}
                value={template.message}
                onChange={(e) => updateSmsTemplate(index, { message: e.target.value })}
              />
            </div>
          ))}
        </div>

        <button onClick={saveSmsTemplates} disabled={pending} className="admin-btn-primary flex items-center gap-2">
          <Save size={16} /> {pending ? 'Saving...' : 'Save SMS Templates'}
        </button>
      </div>
    </div>
  );
}
