'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, Trash2 } from 'lucide-react';

export default function FamilyPage() {
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', relationship: 'Parent', gender: 'Male', date_of_birth: '', phone: ''
  });

  const fetchMembers = async () => {
    try {
      const res = await axios.get('/api/user/family', { withCredentials: true });
      setMembers(res.data);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        window.location.href = '/login';
        return;
      }
      alert('Failed to load family members');
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleDelete = async (id: number) => {
    if(!confirm("Delete this family member?")) return;
    try {
      await axios.delete(`/api/user/family/${id}`, { withCredentials: true });
      fetchMembers();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        window.location.href = '/login';
        return;
      }
      alert('Failed to delete family member');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/user/family', formData, { withCredentials: true });
      setShowModal(false);
      setFormData({ name: '', relationship: 'Parent', gender: 'Male', date_of_birth: '', phone: '' });
      fetchMembers();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        window.location.href = '/login';
        return;
      }
      alert('Failed to add member');
    }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Family Members</h1>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700">
          <Plus size={18} /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((mem: any) => (
          <div key={mem.id} className="bg-white p-5 rounded-xl border shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center font-bold text-lg">
                {mem.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{mem.name}</h4>
                <p className="text-xs text-gray-500">{mem.relationship} - {mem.gender}</p>
                <p className="text-xs text-gray-400 mt-0.5">DOB: {mem.dateOfBirth ? new Date(mem.dateOfBirth).toLocaleDateString() : '-'}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(mem.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed">
          <Users size={40} className="mx-auto mb-2 opacity-20" />
          No family members added.
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">Add Family Member</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input placeholder="Full Name" className="w-full border p-2.5 rounded-lg" required onChange={e => setFormData({...formData, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <select className="w-full border p-2.5 rounded-lg" onChange={e => setFormData({...formData, relationship: e.target.value})}>
                  <option>Parent</option><option>Spouse</option><option>Child</option><option>Sibling</option>
                </select>
                <select className="w-full border p-2.5 rounded-lg" onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option>Male</option><option>Female</option>
                </select>
              </div>
              <input type="date" className="w-full border p-2.5 rounded-lg" required onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
              <input placeholder="Phone (Optional)" className="w-full border p-2.5 rounded-lg" onChange={e => setFormData({...formData, phone: e.target.value})} />
              
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-lg font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
