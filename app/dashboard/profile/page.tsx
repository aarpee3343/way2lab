'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Phone, Calendar, 
  Save, Loader2, AlertCircle, 
  Shield, Key, Camera
} from 'lucide-react';
import { toast } from '@/lib/safe-toast';
import { useDashboard } from '@/hooks/useDashboard';
import type { Customer } from '@/lib/types/dashboard';

export default function ProfilePage() {
  const router = useRouter();
  const { user: dashboardUser, refresh } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [user, setUser] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: undefined
  });

  useEffect(() => {
    if (dashboardUser) {
      setUser({
        name: dashboardUser.name || '',
        email: dashboardUser.email || '',
        phone: dashboardUser.phone || '',
        gender: dashboardUser.gender || '',
        dateOfBirth: dashboardUser.dateOfBirth
      });
    }
  }, [dashboardUser]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!user.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!user.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (user.phone && !/^[0-9]{10}$/.test(user.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(user)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Profile updated successfully');
        refresh();
        setErrors({});
      } else {
        toast.error(data.message || 'Failed to update profile');
        if (data.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      console.error('Profile update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Customer, value: string) => {
    setUser(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
          <p className="text-slate-500 mt-1">Manage your personal information and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-sm font-medium transition-colors"
          >
            <Shield size={16} />
            Security Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN - PROFILE CARD */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
            {/* AVATAR */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-blue-600 text-2xl font-bold">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                  <Camera size={16} className="text-slate-600" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{user.name || 'User'}</h2>
              <p className="text-sm text-slate-500">{user.email || 'user@example.com'}</p>
            </div>

            {/* STATS */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Member Since</p>
                <p className="font-medium text-slate-800">
                  {dashboardUser?.createdAt 
                    ? new Date(dashboardUser.createdAt).toLocaleDateString('en-IN', {
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'Recently'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Account Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="font-medium text-emerald-700">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - FORM */}
        <div className="lg:col-span-2 space-y-6">
          {/* PERSONAL INFORMATION CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="text-blue-600" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* NAME FIELD */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  value={user.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.name ? 'border-red-300' : 'border-slate-200'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* EMAIL & PHONE GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* EMAIL */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Mail size={16} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-4 py-3 bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-300' : 'border-slate-200'
                    }`}
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* PHONE */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Phone size={16} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={user.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.phone ? 'border-red-300' : 'border-slate-200'
                    }`}
                    placeholder="+91 98765 43210"
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* GENDER & DOB GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GENDER */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <User size={16} />
                    Gender
                  </label>
                  <select
                    value={user.gender || ''}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* DATE OF BIRTH */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Calendar size={16} />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="flex justify-end pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ACCOUNT SECURITY CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Key className="text-amber-600" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Account Security</h3>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => router.push('/dashboard/settings?tab=security')}
                className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Key size={18} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-800">Change Password</p>
                    <p className="text-sm text-slate-500">Update your password regularly for security</p>
                  </div>
                </div>
                <div className="text-blue-600 font-medium">Change</div>
              </button>

              <button
                onClick={() => router.push('/dashboard/settings?tab=security')}
                className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Shield size={18} className="text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-800">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Not enabled</span>
                  <div className="text-blue-600 font-medium">Enable</div>
                </div>
              </button>
            </div>
          </div>

          {/* DATA PRIVACY CARD */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="text-blue-400" size={20} />
              <h3 className="text-lg font-bold">Your Data Privacy</h3>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              We take your privacy seriously. Your health data is encrypted and only accessible 
              to you and authorized medical professionals when necessary for your care.
            </p>
            <button
              onClick={() => router.push('/dashboard/settings?tab=privacy')}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              Learn more about our privacy policy →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}