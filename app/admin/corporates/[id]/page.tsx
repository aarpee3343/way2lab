'use client';
import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import {
  getCorporateDetails,
  mapDomainAction,
  assignCorporateService,
  assignEmployeesToPackageAction,
  clearPackageAssignmentsAction,
  getAdminInventory,
  updateCorporateEmployeeStatus,
  updateCorporateAction,
  setCorporateActiveStatus,
} from '@/app/actions/adminCorporateActions';
import BulkEmployeeUpload from '@/components/admin/BulkEmployeeUpload';
import { toast } from '@/lib/safe-toast';
import {
  Users,
  Package,
  Plus,
  Link as LinkIcon,
  Calendar,
  RefreshCcw,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import Button from '@/components/admin/corporate/Button';
import Card from '@/components/admin/corporate/Card';
import Badge from '@/components/admin/corporate/Badge';
import Input from '@/components/admin/corporate/Input';
import Select from '@/components/admin/corporate/Select';
import Textarea from '@/components/admin/corporate/Textarea';
import LoadingSpinner from '@/components/admin/corporate/LoadingSpinner';

export default function CorporateDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const corpId = parseInt(id);

  const [corp, setCorp] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('employees');
  const serviceTypes = ['PACKAGE', 'COUPON'] as const;

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Service Form State
  const [serviceForm, setServiceForm] = useState<{
    type: 'PACKAGE' | 'COUPON';
    itemId: string;
    validFrom: string;
    validTill: string;
    selfPaymentType: 'USER_PAYS' | 'CORPORATE_PAYS';
    familyPaymentType: 'USER_PAYS' | 'CORPORATE_PAYS';
    selfLimit: number;
    familyLimit: number;
    reportVisibilityOverride?: '' | 'USER_ONLY' | 'CORPORATE_ONLY' | 'BOTH';
  }>({
    type: 'PACKAGE',
    itemId: '',
    validFrom: '',
    validTill: '',
    selfPaymentType: 'CORPORATE_PAYS',
    familyPaymentType: 'USER_PAYS',
    selfLimit: 1,
    familyLimit: 0,
    reportVisibilityOverride: '',
  });

  const [domainInput, setDomainInput] = useState('');
  const [employeeAssignForm, setEmployeeAssignForm] = useState({
    packageId: '',
    identifiers: '',
  });
  const [assigningEmployees, setAssigningEmployees] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [logoSaving, setLogoSaving] = useState(false);

  const refresh = useCallback(() => {
    return getCorporateDetails(corpId).then((data) => {
      setCorp(data);
      if (data) {
        setEditForm({
          companyName: data.companyName,
          contactPerson: data.contactPerson,
          phone: data.phone,
          email: data.email,
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          employeeCount: data.employeeCount,
          panNumber: data.panNumber || '',
          gstin: data.gstin || '',
        });
        setLogoUrlInput(data.logoUrl || '');
      }
    });
  }, [corpId]);

  useEffect(() => {
    refresh();
    getAdminInventory().then(setInventory);
  }, [refresh]);

  // --- ACTIONS ---
  const handleUpdateCorporate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateCorporateAction(corpId, editForm);
    if (res.success) {
      toast.success('Corporate Updated!');
      setIsEditModalOpen(false);
      refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleArchiveCorporate = async () => {
    if (
      !confirm(
        'Archive this corporate? Employees will become regular users and corporate logins will be disabled.'
      )
    )
      return;
    const res = await setCorporateActiveStatus(corpId, false);
    if (res.success) {
      toast.success('Corporate Archived');
      refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleRestoreCorporate = async () => {
    const res = await setCorporateActiveStatus(corpId, true);
    if (res.success) {
      toast.success('Corporate Restored');
      refresh();
    } else {
      toast.error(res.error);
    }
  };

  const toggleEmployeeStatus = async (customerId: number, newStatus: boolean) => {
    const res = await updateCorporateEmployeeStatus(customerId, newStatus, corpId);
    if (res.success) {
      toast.success('Status Updated');
      refresh();
    } else {
      toast.error('Failed');
    }
  };

  const handleDomainMap = async () => {
    if (!domainInput) return;
    const res = await mapDomainAction(corpId, domainInput);
    if (res.success) {
      toast.success(`Mapped!`);
      setDomainInput('');
      refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleAssignService = async () => {
    if (!serviceForm.itemId) return toast.error('Select item');
    const itemId = Number(serviceForm.itemId);
    if (Number.isNaN(itemId)) return toast.error('Invalid item');
    if (!serviceForm.validFrom || !serviceForm.validTill) {
      return toast.error('Select valid dates');
    }

    const res = await assignCorporateService({
      corporateId: corpId,
      type: serviceForm.type,
      itemId,
      validFrom: serviceForm.validFrom,
      validTill: serviceForm.validTill,
      selfPaymentType: serviceForm.selfPaymentType,
      familyPaymentType: serviceForm.familyPaymentType,
      selfLimit: serviceForm.selfLimit,
      familyLimit: serviceForm.familyLimit,
      reportVisibilityOverride:
        serviceForm.type === 'PACKAGE'
          ? serviceForm.reportVisibilityOverride || undefined
          : undefined,
    });
    if (res.success) {
      toast.success('Assigned!');
      refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleAssignEmployees = async () => {
    if (!employeeAssignForm.packageId) {
      toast.error('Select a package service');
      return;
    }

    const identifiers = employeeAssignForm.identifiers
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (identifiers.length === 0) {
      toast.error('Enter employee emails / IDs / phones');
      return;
    }

    setAssigningEmployees(true);
    const res = await assignEmployeesToPackageAction({
      corporateId: corpId,
      packageId: Number(employeeAssignForm.packageId),
      identifiers,
    });
    setAssigningEmployees(false);

    if (res.success) {
      toast.success(`Assigned to ${res.assigned} employees`);
      setEmployeeAssignForm({ packageId: employeeAssignForm.packageId, identifiers: '' });
      refresh();
    } else {
      toast.error(res.error || 'Assignment failed');
    }
  };

  const handleClearAssignments = async () => {
    if (!employeeAssignForm.packageId) {
      toast.error('Select a package service');
      return;
    }
    if (!confirm('Clear all employee assignments for this package?')) return;

    const res = await clearPackageAssignmentsAction({
      corporateId: corpId,
      packageId: Number(employeeAssignForm.packageId),
    });
    if (res.success) {
      toast.success(`Cleared ${res.removed} assignments`);
      refresh();
    } else {
      toast.error(res.error || 'Failed to clear assignments');
    }
  };

  const handleLogoSave = async () => {
    if (isArchived) {
      toast.error('Corporate is archived');
      return;
    }
    setLogoSaving(true);
    try {
      const payload = {
        companyName: corp.companyName,
        contactPerson: corp.contactPerson,
        phone: corp.phone,
        email: corp.email,
        address: corp.address || '',
        city: corp.city || '',
        state: corp.state || '',
        pincode: corp.pincode || '',
        employeeCount: corp.employeeCount,
        panNumber: corp.panNumber || '',
        gstin: corp.gstin || '',
        logoUrl: logoUrlInput || '',
      };
      const res = await updateCorporateAction(corpId, payload);
      if (res.success) {
        toast.success('Logo updated');
        refresh();
      } else {
        toast.error(res.error || 'Logo update failed');
      }
    } catch (error) {
      toast.error('Logo update failed');
    } finally {
      setLogoSaving(false);
    }
  };

  if (!corp)
    return (
      <div className="p-10 text-center flex items-center justify-center gap-2">
        <RefreshCcw className="animate-spin" size={20} /> Loading...
      </div>
    );

  const isArchived = !corp.isActive;

  return (
    <div className="admin-space-y relative">
      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Corporate</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2"
              >
                <X size={20} />
              </Button>
            </div>
            <form onSubmit={handleUpdateCorporate} className="grid grid-cols-2 gap-4">
              <Input
                label="Name"
                required
                value={editForm.companyName}
                onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
              />
              <Input
                label="Contact Person"
                required
                value={editForm.contactPerson}
                onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
              />
              <Input
                label="Phone"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              <Input
                label="Email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />

              <div className="col-span-2 border-t pt-4 mt-2 font-bold text-sm text-muted">
                Address Details
              </div>
              <Input
                placeholder="Address"
                className="col-span-2"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
              <Input
                placeholder="City"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              />
              <Input
                placeholder="State"
                value={editForm.state}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
              />

              <div className="col-span-2 flex gap-3 pt-4">
                <Button type="submit" variant="primary" className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>

            {/* Danger Zone */}
            <div className="mt-8 pt-6 border-t border-destructive-light">
              <h3 className="text-xs font-bold text-destructive uppercase mb-2">Archive</h3>
              <Button variant="destructive" size="sm" onClick={handleArchiveCorporate}>
                <Trash2 size={14} /> Archive Corporate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Stats */}
      <div className="admin-page-header flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="admin-page-title">{corp.companyName}</h1>
            <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(true)}>
              <Pencil size={20} />
            </Button>
            <Badge variant={isArchived ? 'default' : 'success'}>
              {isArchived ? 'Archived' : 'Active'}
            </Badge>
          </div>
          <p className="admin-page-subtitle">
            {corp.city || 'No City'}, {corp.state || 'No State'} • {corp.contactPerson}
          </p>
          <div className="flex gap-2 mt-3">
            {(corp.domains || []).map((d: string) => (
              <span key={d} className="admin-badge admin-badge-default bg-blue-50 text-blue-700 border border-blue-100">
                {d}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black text-blue-600">{corp._count?.employees || 0}</div>
          <div className="text-xs font-bold text-muted uppercase">Total Employees</div>
          <div className="flex gap-2 mt-3 justify-end">
            {/* <Button href={`/admin/corporates/${corpId}/management`} variant="secondary" size="sm">
              Manage Corporate
            </Button>
            <Button href={`/admin/corporates/${corpId}/finance`} variant="secondary" size="sm">
              Open Finance
            </Button> */}
            {isArchived && (
              <Button variant="primary" size="sm" onClick={handleRestoreCorporate}>
                Restore Corporate
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Branding */}
      <Card className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="w-40 h-20 bg-surface border border-border rounded-2xl flex items-center justify-center overflow-hidden">
          {logoUrlInput || corp.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrlInput || corp.logoUrl}
              alt={`${corp.companyName} Logo`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-xs text-muted font-semibold">No Logo</span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-primary">Corporate Logo</h3>
          <p className="text-xs text-muted mb-3">Shown on the corporate portal header.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Input
              type="url"
              placeholder="https://example.com/logo.png"
              className="flex-1"
              value={logoUrlInput}
              onChange={(e) => setLogoUrlInput(e.target.value)}
              disabled={isArchived || logoSaving}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleLogoSave}
              disabled={isArchived || logoSaving}
            >
              {logoSaving ? 'Saving...' : 'Save Logo'}
            </Button>
          </div>
          <p className="text-[11px] text-muted mt-2">
            Paste a public image URL. Uploads are disabled on Vercel.
          </p>
        </div>
      </Card>

      {/* Tabs */}
      <div className="rounded-2xl border border-border bg-white p-2 inline-flex flex-wrap gap-2">
        <Button
          variant={activeTab === 'employees' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('employees')}
        >
          Employees
        </Button>
        <Button
          variant={activeTab === 'services' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('services')}
        >
          Services
        </Button>
        <Button
          variant={activeTab === 'financial' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('financial')}
        >
          Financial
        </Button>
      </div>

      {/* --- EMPLOYEES TAB --- */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side */}
          <div className="space-y-6">
            <Card header={<><LinkIcon size={18} /> Domain Mapping</>}>
              <div className="flex gap-2">
                <Input
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="e.g. acme.com"
                  className="flex-1"
                  disabled={isArchived}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDomainMap}
                  disabled={isArchived}
                >
                  Map
                </Button>
              </div>
            </Card>

            <Card header={<><Users size={18} /> Bulk Upload</>}>
              {isArchived ? (
                <div className="text-xs text-muted">
                  Corporate is archived. Bulk uploads are disabled.
                </div>
              ) : (
                <BulkEmployeeUpload corporateId={corpId} onSuccess={refresh} />
              )}
            </Card>
          </div>

          {/* Right Side - Employee List */}
          <div className="lg:col-span-2">
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {corp.employees?.map((e: any) => (
                    <tr key={e.id} className={!e.isActive ? 'opacity-50 grayscale' : ''}>
                      <td className="admin-table-row-primary">{e.name}</td>
                      <td className="text-muted">
                        <div>{e.phone}</div>
                        <div className="text-xs">{e.email}</div>
                      </td>
                      <td className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => toggleEmployeeStatus(e.id, !e.isActive)}
                        >
                          {e.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SERVICES TAB --- */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Service Form */}
          <div className="space-y-6">
            <Card header={<><Plus size={18} /> Assign Service</>}>
              <div className="space-y-4">
                <div>
                  <label className="admin-form-label">Service Type</label>
                  <div className="flex gap-2 mt-1">
                    {serviceTypes.map((t) => (
                      <Button
                        key={t}
                        variant={serviceForm.type === t ? 'primary' : 'secondary'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setServiceForm({ ...serviceForm, type: t })}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="admin-form-label">Select Item</label>
                  <Select
                    value={serviceForm.itemId}
                    onChange={(e) => setServiceForm({ ...serviceForm, itemId: e.target.value })}
                    className="w-full mt-1"
                  >
                    <option value="">Select...</option>
                    {serviceForm.type === 'PACKAGE'
                      ? inventory?.packages.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.packageName} (₹{p.price})
                          </option>
                        ))
                      : inventory?.coupons.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.code}
                          </option>
                        ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    label="Valid From"
                    value={serviceForm.validFrom}
                    onChange={(e) => setServiceForm({ ...serviceForm, validFrom: e.target.value })}
                  />
                  <Input
                    type="date"
                    label="Valid Till"
                    value={serviceForm.validTill}
                    onChange={(e) => setServiceForm({ ...serviceForm, validTill: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="admin-form-label">Self Payment</label>
                    <Select
                      value={serviceForm.selfPaymentType}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          selfPaymentType: e.target.value as any,
                        })
                      }
                      className="w-full mt-1"
                    >
                      <option value="CORPORATE_PAYS">Corporate Pays</option>
                      <option value="USER_PAYS">Self Pay</option>
                    </Select>
                  </div>
                  <div>
                    <label className="admin-form-label">Family Payment</label>
                    <Select
                      value={serviceForm.familyPaymentType}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          familyPaymentType: e.target.value as any,
                        })
                      }
                      className="w-full mt-1"
                    >
                      <option value="CORPORATE_PAYS">Corporate Pays</option>
                      <option value="USER_PAYS">Self Pay</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    min="0"
                    label="Limits (Self)"
                    value={serviceForm.selfLimit}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        selfLimit: e.target.value === '' ? 0 : parseInt(e.target.value),
                      })
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    label="Limits (Family)"
                    value={serviceForm.familyLimit}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        familyLimit: e.target.value === '' ? 0 : parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                {serviceForm.type === 'PACKAGE' && (
                  <div>
                    <label className="admin-form-label">Report Visibility (Override)</label>
                    <Select
                      value={serviceForm.reportVisibilityOverride}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          reportVisibilityOverride: e.target.value as any,
                        })
                      }
                      className="w-full mt-1"
                    >
                      <option value="">Use package default</option>
                      <option value="USER_ONLY">User Only</option>
                      <option value="CORPORATE_ONLY">Corporate Only</option>
                      <option value="BOTH">Both User & Corporate</option>
                    </Select>
                    <p className="text-[10px] text-muted mt-1">
                      If left blank, package report visibility applies (pre-employment always
                      corporate only).
                    </p>
                  </div>
                )}

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleAssignService}
                  disabled={isArchived}
                >
                  Assign to Corporate
                </Button>
              </div>
            </Card>

            <Card header={<><Users size={18} /> Limit Package to Employees</>}>
              <div className="space-y-4">
                <div>
                  <label className="admin-form-label">Select Package Service</label>
                  <Select
                    value={employeeAssignForm.packageId}
                    onChange={(e) =>
                      setEmployeeAssignForm({ ...employeeAssignForm, packageId: e.target.value })
                    }
                    className="w-full mt-1"
                  >
                    <option value="">Select...</option>
                    {(corp?.services || [])
                      .filter((s: any) => s.package)
                      .map((s: any) => (
                        <option key={s.id} value={s.package.id}>
                          {s.package.packageName}
                        </option>
                      ))}
                  </Select>
                </div>
                <div>
                  <label className="admin-form-label">
                    Employee Emails / IDs / Phones
                  </label>
                  <Textarea
                    value={employeeAssignForm.identifiers}
                    onChange={(e) =>
                      setEmployeeAssignForm({ ...employeeAssignForm, identifiers: e.target.value })
                    }
                    placeholder="Paste emails, employee IDs, or phone numbers (comma or new line separated)"
                    className="w-full mt-1 min-h-[120px]"
                  />
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleAssignEmployees}
                  disabled={isArchived || assigningEmployees}
                >
                  {assigningEmployees ? 'Assigning...' : 'Assign to Selected Employees'}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleClearAssignments}
                  disabled={isArchived}
                >
                  Clear Package Assignments (Make Available to All)
                </Button>
              </div>
            </Card>
          </div>

          {/* Active Services List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-primary">Active Services</h3>
            {corp.services.length === 0 && (
              <div className="text-muted text-sm italic">No active services assigned.</div>
            )}

            {corp.services.map((s: any) => (
              <div
                key={s.id}
                className="bg-white p-4 rounded-xl border border-border flex justify-between items-center group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    {s.package ? <Package size={20} /> : <span className="font-bold">%</span>}
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">
                      {s.package?.packageName || `Coupon: ${s.coupon?.code}`}
                    </h4>
                    <p className="text-xs text-muted flex items-center gap-1">
                      <Calendar size={12} /> {new Date(s.validFrom).toLocaleDateString()} -{' '}
                      {new Date(s.validTill).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="success">Active</Badge>
                    <span className="text-[10px] text-muted">
                      Limits: {s.selfUsageLimit} (Self) / {s.familyUsageLimit} (Fam)
                    </span>
                  </div>

                  <Button
                    href={`/admin/corporates/${corpId}/services/${s.id}`}
                    variant="secondary"
                    size="sm"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- FINANCIAL TAB --- */}
      {activeTab === 'financial' && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-primary">Corporate Financials</h3>
          <p className="text-sm text-muted mt-1">
            Open detailed billing, collections, refunds, statements, and invoice exports.
          </p>
          <div className="mt-4">
            <Button href={`/admin/corporates/${corpId}/finance`} variant="primary">
              Open Financial Dashboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

