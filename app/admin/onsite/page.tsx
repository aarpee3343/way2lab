'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  Calendar,
  ClipboardCheck,
  FileText,
  Plus,
  Save,
  Search,
  Users
} from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import { formatISTDateTime } from '@/lib/date-time';
import {
  getOnsiteCorporates,
  getOnsiteCorporatePackages,
  getOnsiteCamps,
  createOnsiteCamp,
  completeOnsiteCamp,
  searchOnsiteEmployees,
  createOnsiteEmployee,
  getActiveOnsiteTemplate,
  saveOnsiteTemplate,
  createOnsiteBooking,
  getOnsiteEntries,
  updateOnsiteEntryData
} from '@/app/actions/adminOnsiteActions';

type FieldDraft = {
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required?: boolean;
  options?: string;
};

export default function AdminOnsitePage() {
  const [corporates, setCorporates] = useState<any[]>([]);
  const [selectedCorporateId, setSelectedCorporateId] = useState<number | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [camps, setCamps] = useState<any[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<number | null>(null);
  const [entries, setEntries] = useState<any[]>([]);

  const [campTitle, setCampTitle] = useState('');
  const [expectedHeadcount, setExpectedHeadcount] = useState('');
  const [campLabName, setCampLabName] = useState('');

  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    phone: '',
    email: '',
    employeeId: '',
    dateOfBirth: '',
    gender: ''
  });

  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [labName, setLabName] = useState('');

  const [templatePackageId, setTemplatePackageId] = useState<number | null>(null);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateFields, setTemplateFields] = useState<FieldDraft[]>([
    { label: '', type: 'text', required: false, options: '' }
  ]);
  const [activeTemplate, setActiveTemplate] = useState<any>(null);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [captureTemplate, setCaptureTemplate] = useState(true);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [entryFormData, setEntryFormData] = useState<Record<string, string>>({});
  const [entryFormTemplate, setEntryFormTemplate] = useState<any>(null);
  const [pendingEntryId, setPendingEntryId] = useState<number | null>(null);

  useEffect(() => {
    getOnsiteCorporates().then((data) => setCorporates(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (!selectedCorporateId) return;
    getOnsiteCorporatePackages(selectedCorporateId).then((data) => {
      setPackages(Array.isArray(data) ? data : []);
    });
    getOnsiteCamps(selectedCorporateId).then((data) => {
      setCamps(Array.isArray(data) ? data : []);
      const active = (Array.isArray(data) ? data : []).find((c: any) => c.status === 'ACTIVE');
      setSelectedCampId(active?.id || null);
    });
    setEmployees([]);
    setSelectedEmployee(null);
    setEmployeeSearch('');
    setLabName('');
    setCampLabName('');
  }, [selectedCorporateId]);

  useEffect(() => {
    if (!selectedCorporateId) return;
    const timer = setTimeout(() => {
      searchOnsiteEmployees(selectedCorporateId, employeeSearch).then((data) => {
        setEmployees(Array.isArray(data) ? data : []);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCorporateId, employeeSearch]);

  useEffect(() => {
    if (!selectedCampId) {
      setEntries([]);
      return;
    }
    getOnsiteEntries(selectedCampId).then((data) => setEntries(Array.isArray(data) ? data : []));
  }, [selectedCampId]);

  useEffect(() => {
    if (!selectedPackageId) {
      setActiveTemplate(null);
      return;
    }
    getActiveOnsiteTemplate(selectedPackageId).then((template) => {
      setActiveTemplate(template);
    });
  }, [selectedPackageId]);

  const packageOptions = useMemo(() => {
    return packages
      .filter((s) => s.package)
      .map((s) => ({
        id: s.package.id,
        label: s.package.packageName
      }));
  }, [packages]);

  const selectedCamp = useMemo(
    () => camps.find((c) => c.id === selectedCampId) || null,
    [camps, selectedCampId]
  );

  useEffect(() => {
    if (!selectedCamp) {
      setLabName('');
      return;
    }
    if (selectedCamp.labName) {
      setLabName(selectedCamp.labName);
    } else {
      setLabName('');
    }
  }, [selectedCamp]);

  const handleStartCamp = async () => {
    if (!selectedCorporateId) return toast.error('Select a corporate first');
    const res = await createOnsiteCamp({
      corporateId: selectedCorporateId,
      title: campTitle,
      expectedHeadcount: expectedHeadcount ? Number(expectedHeadcount) : undefined,
      labName: campLabName
    });
    if (res.success && res.camp) {
      toast.success('Onsite camp started');
      setCampTitle('');
      setExpectedHeadcount('');
      setCampLabName('');
      const updated = await getOnsiteCamps(selectedCorporateId);
      setCamps(updated as any);
      setSelectedCampId(res.camp.id);
    } else {
      toast.error(res.error || 'Failed to start camp');
    }
  };

  const handleCompleteCamp = async (campId: number) => {
    const res = await completeOnsiteCamp(campId);
    if (res.success) {
      toast.success('Camp completed');
      const updated = await getOnsiteCamps(selectedCorporateId || undefined);
      setCamps(updated as any);
      setSelectedCampId(null);
    } else {
      toast.error(res.error || 'Failed to complete camp');
    }
  };

  const handleCreateEmployee = async () => {
    if (!selectedCorporateId) return;
    const res = await createOnsiteEmployee({
      corporateId: selectedCorporateId,
      ...newEmployee
    });
    if (res.success && res.customer) {
      toast.success('Employee created');
      setSelectedEmployee(res.customer);
      setEmployees((prev) => [res.customer, ...prev]);
      setNewEmployee({
        name: '',
        phone: '',
        email: '',
        employeeId: '',
        dateOfBirth: '',
        gender: ''
      });
    } else {
      toast.error(res.error || 'Failed to create employee');
    }
  };

  const handleSaveTemplate = async () => {
    if (!templatePackageId) return toast.error('Select a package');
    const fields = templateFields.map((f) => ({
      label: f.label,
      type: f.type,
      required: f.required,
      options: f.options?.split(',').map((o) => o.trim()).filter(Boolean)
    }));
    const res = await saveOnsiteTemplate({
      packageId: templatePackageId,
      title: templateTitle,
      fields
    });
    if (res.success) {
      toast.success('Template saved');
      setTemplateTitle('');
      setTemplateFields([{ label: '', type: 'text', required: false, options: '' }]);
    } else {
      toast.error(res.error || 'Failed to save template');
    }
  };

  const handleBook = async () => {
    if (!selectedCorporateId) return toast.error('Select a corporate');
    if (!selectedCampId) return toast.error('Start or select an onsite camp');
    if (!selectedPackageId) return toast.error('Select a package');
    if (!selectedEmployee?.id) return toast.error('Select an employee');
    const effectiveLabName = selectedCamp?.labName || labName;
    if (!effectiveLabName.trim()) return toast.error('Enter lab name');

    setBookingLoading(true);
    const res = await createOnsiteBooking({
      campId: selectedCampId,
      corporateId: selectedCorporateId,
      packageId: selectedPackageId,
      customerId: selectedEmployee.id,
      labName: effectiveLabName,
      templateId: activeTemplate?.id || null,
      templateData: null
    });
    setBookingLoading(false);

    if (res.success) {
      toast.success('Onsite order booked');
      if (!selectedCamp?.labName) {
        setLabName('');
      }
      const updatedEntries = await getOnsiteEntries(selectedCampId);
      setEntries(updatedEntries as any);
      if (!selectedCamp?.labName && effectiveLabName.trim()) {
        const updatedCamps = await getOnsiteCamps(selectedCorporateId);
        setCamps(updatedCamps as any);
      }

      if (captureTemplate && activeTemplate?.fields?.length) {
        setEntryFormTemplate(activeTemplate);
        setPendingEntryId(res.entryId || null);
        setEntryFormData({});
        setEntryFormOpen(true);
      }
    } else {
      toast.error(res.error || 'Booking failed');
    }
  };

  const handleSaveEntryData = async () => {
    if (!pendingEntryId || !entryFormTemplate) return;
    const res = await updateOnsiteEntryData(pendingEntryId, entryFormData);
    if (res.success) {
      toast.success('Onsite data saved');
      setEntryFormOpen(false);
      setPendingEntryId(null);
      const updatedEntries = await getOnsiteEntries(selectedCampId || 0);
      setEntries(updatedEntries as any);
    } else {
      toast.error(res.error || 'Failed to save onsite data');
    }
  };

  return (
    <div className="admin-space-y">
      <div>
        <h1 className="admin-page-title">Onsite Corp Programme</h1>
        <p className="admin-page-subtitle">Plan onsite camps, manage templates, and book corporate orders.</p>
      </div>

      <div className="admin-card">
        <div className="admin-card-body grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <label className="admin-form-label">Select Corporate</label>
            <select
              className="admin-form-input"
              value={selectedCorporateId ?? ''}
              onChange={(e) => setSelectedCorporateId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Select corporate...</option>
              {corporates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Building2 size={16} /> Assigned Packages
            </div>
            {packageOptions.length === 0 ? (
              <p className="text-xs text-slate-400 mt-2">No active corporate packages found.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {packageOptions.map((p) => (
                  <span key={p.id} className="text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg">
                    {p.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-800">Start Onsite Camp</h2>
          </div>
          <input
            className="admin-form-input"
            placeholder="Camp title"
            value={campTitle}
            onChange={(e) => setCampTitle(e.target.value)}
          />
          <input
            className="admin-form-input"
            placeholder="Expected headcount"
            type="number"
            value={expectedHeadcount}
            onChange={(e) => setExpectedHeadcount(e.target.value)}
          />
          <input
            className="admin-form-input"
            placeholder="Lab name for this camp"
            value={campLabName}
            onChange={(e) => setCampLabName(e.target.value)}
          />
          <button className="admin-btn-primary w-full" onClick={handleStartCamp}>
            Start Camp
          </button>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-emerald-600" />
            <h2 className="font-bold text-slate-800">Active Camps</h2>
          </div>
          {camps.length === 0 ? (
            <p className="text-sm text-slate-400">No camps found.</p>
          ) : (
            <div className="space-y-3">
              {camps.map((camp) => (
                <div key={camp.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{camp.title}</div>
                    <div className="text-xs text-slate-400">
                      {camp.status} - Started {formatISTDateTime(camp.startedAt)}
                    </div>
                    <div className="text-xs text-slate-400">
                      Expected {camp.expectedHeadcount ?? '-'} - Booked {camp._count?.entries ?? 0}
                    </div>
                    <div className="text-xs text-slate-400">
                      Lab {camp.labName || '-'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCampId(camp.id)}
                      className={`admin-btn-secondary text-xs ${selectedCampId === camp.id ? 'bg-slate-900 text-white' : ''}`}
                    >
                      Select
                    </button>
                    {camp.status === 'ACTIVE' && (
                      <button onClick={() => handleCompleteCamp(camp.id)} className="admin-btn-danger text-xs">
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-purple-600" />
            <h2 className="font-bold text-slate-800">Template Builder</h2>
          </div>
          <select
            className="admin-form-input"
            value={templatePackageId ?? ''}
            onChange={(e) => setTemplatePackageId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select package</option>
            {packageOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            className="admin-form-input"
            placeholder="Template title"
            value={templateTitle}
            onChange={(e) => setTemplateTitle(e.target.value)}
          />
          <div className="space-y-2">
            {templateFields.map((field, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-3 space-y-2">
                <input
                  className="admin-form-input"
                  placeholder="Field label"
                  value={field.label}
                  onChange={(e) => {
                    const next = [...templateFields];
                    next[idx].label = e.target.value;
                    setTemplateFields(next);
                  }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="admin-form-input"
                    value={field.type}
                    onChange={(e) => {
                      const next = [...templateFields];
                      next[idx].type = e.target.value as any;
                      setTemplateFields(next);
                    }}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Select</option>
                  </select>
                  <label className="text-xs text-slate-500 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.required || false}
                      onChange={(e) => {
                        const next = [...templateFields];
                        next[idx].required = e.target.checked;
                        setTemplateFields(next);
                      }}
                    />
                    Required
                  </label>
                </div>
                {field.type === 'select' && (
                  <input
                    className="admin-form-input"
                    placeholder="Options (comma separated)"
                    value={field.options || ''}
                    onChange={(e) => {
                      const next = [...templateFields];
                      next[idx].options = e.target.value;
                      setTemplateFields(next);
                    }}
                  />
                )}
              </div>
            ))}
            <button
              onClick={() =>
                setTemplateFields((prev) => [...prev, { label: '', type: 'text', required: false, options: '' }])
              }
              className="admin-btn-secondary text-xs flex items-center gap-2"
            >
              <Plus size={14} /> Add Field
            </button>
          </div>
          <button onClick={handleSaveTemplate} className="admin-btn-primary w-full flex items-center gap-2">
            <Save size={14} /> Save Template
          </button>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-800">Book Onsite Order</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="admin-form-label">Select Package</label>
              <select
                className="admin-form-input"
                value={selectedPackageId ?? ''}
                onChange={(e) => setSelectedPackageId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select package</option>
                {packageOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            {selectedCamp?.labName ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs font-bold text-slate-500 uppercase">Lab Name (Camp)</div>
                <div className="text-sm font-semibold text-slate-800 mt-1">
                  {selectedCamp.labName}
                </div>
              </div>
            ) : (
              <div>
                <label className="admin-form-label">Lab Name (Onsite)</label>
                <input
                  className="admin-form-input"
                  placeholder="Enter lab name"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Saved for this camp after the first booking.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <label className="admin-form-label">Search Employee</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  className="admin-form-input pl-9"
                  placeholder="Name, phone, email, ID"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                />
              </div>
              <div className="border border-slate-200 rounded-xl mt-2 max-h-48 overflow-y-auto">
                {employees.length === 0 ? (
                  <div className="text-xs text-slate-400 p-3">No employees found.</div>
                ) : (
                  employees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                        selectedEmployee?.id === emp.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      {emp.name} {emp.employeeId ? `(${emp.employeeId})` : ''}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase">Create New Employee</div>
              <input
                className="admin-form-input"
                placeholder="Name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              />
              <input
                className="admin-form-input"
                placeholder="Phone"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
              />
              <input
                className="admin-form-input"
                placeholder="Email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              />
              <input
                className="admin-form-input"
                placeholder="Employee ID"
                value={newEmployee.employeeId}
                onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
              />
              <input
                className="admin-form-input"
                type="date"
                value={newEmployee.dateOfBirth}
                onChange={(e) => setNewEmployee({ ...newEmployee, dateOfBirth: e.target.value })}
              />
              <select
                className="admin-form-input"
                value={newEmployee.gender}
                onChange={(e) => setNewEmployee({ ...newEmployee, gender: e.target.value })}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <button onClick={handleCreateEmployee} className="admin-btn-secondary text-xs w-full flex items-center gap-2">
                <Users size={14} /> Add Employee
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" checked={captureTemplate} onChange={(e) => setCaptureTemplate(e.target.checked)} />
            Capture custom template data after booking
          </label>

          <button onClick={handleBook} className="admin-btn-primary w-full" disabled={bookingLoading}>
            {bookingLoading ? 'Booking...' : 'Book Onsite Order'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={18} className="text-slate-700" />
          <h2 className="font-bold text-slate-800">Onsite Entries</h2>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">No onsite entries yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-800">
                    {entry.customer?.name} - {entry.package?.packageName}
                  </div>
                  <div className="text-xs text-slate-400">
                    {entry.order?.orderNumber ? `Order #${entry.order.orderNumber}` : 'No Order'}
                  </div>
                </div>
                {entry.data ? (
                  <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs overflow-auto">
                    {JSON.stringify(entry.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-slate-400">No custom data captured.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {entryFormOpen && entryFormTemplate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              {entryFormTemplate.title} - Custom Data
            </h3>
            <div className="space-y-3">
              {(entryFormTemplate.fields || []).map((field: any, idx: number) => (
                <div key={`${field.label}-${idx}`} className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      className="admin-form-input"
                      value={entryFormData[field.label] || ''}
                      onChange={(e) =>
                        setEntryFormData((prev) => ({ ...prev, [field.label]: e.target.value }))
                      }
                    >
                      <option value="">Select...</option>
                      {(field.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      className="admin-form-input"
                      value={entryFormData[field.label] || ''}
                      onChange={(e) =>
                        setEntryFormData((prev) => ({ ...prev, [field.label]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEntryFormOpen(false)} className="admin-btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleSaveEntryData} className="admin-btn-primary flex-1">
                Save Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
