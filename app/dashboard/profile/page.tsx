'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function ProfilePage() {
  const [user, setUser] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('token');
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.user);
    };
    fetchUser();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = Cookies.get('token');
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, user, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profile Updated');
    } catch (err) { alert('Error updating profile'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h1>
      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
            <input value={user.name || ''} onChange={e => setUser({...user, name: e.target.value})} className="w-full border p-3 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input value={user.email || ''} onChange={e => setUser({...user, email: e.target.value})} className="w-full border p-3 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
              <input value={user.phone || ''} onChange={e => setUser({...user, phone: e.target.value})} className="w-full border p-3 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Gender</label>
              <select value={user.gender || ''} onChange={e => setUser({...user, gender: e.target.value})} className="w-full border p-3 rounded-lg">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth</label>
              <input type="date" value={user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''} onChange={e => setUser({...user, dateOfBirth: e.target.value})} className="w-full border p-3 rounded-lg" />
            </div>
          </div>
          <button disabled={loading} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg mt-4">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}