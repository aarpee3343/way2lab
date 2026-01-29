'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { User, Plus, Trash2 } from 'lucide-react';

export default function FamilyPage() {
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({ 
    name: '', relationship: 'Parent', gender: 'Male', date_of_birth: '' 
  });

  const fetchFamily = async () => {
    const token = Cookies.get('token');
    const res = await axios.get('http://localhost:5050/api/user/family', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMembers(res.data);
  };

  useEffect(() => { fetchFamily(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get('token');
    await axios.post('http://localhost:5050/api/user/family', newMember, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setShowModal(false);
    fetchFamily();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Family Members</h1>
        <button onClick={() => setShowModal(true)} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {members.map((m: any) => (
          <div key={m.id} className="border p-4 rounded-xl shadow-sm bg-white flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
              {m.name[0]}
            </div>
            <div>
              <p className="font-bold text-gray-800">{m.name}</p>
              <p className="text-xs text-gray-500">{m.relationship} • {m.gender}</p>
              <p className="text-xs text-gray-400 mt-0.5">UHID: {m.uhid}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Add Family Member</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <input placeholder="Full Name" className="w-full border p-2 rounded" required 
                onChange={e => setNewMember({...newMember, name: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-3">
                <select className="w-full border p-2 rounded" onChange={e => setNewMember({...newMember, relationship: e.target.value})}>
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                </select>
                <select className="w-full border p-2 rounded" onChange={e => setNewMember({...newMember, gender: e.target.value})}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <label className="block text-xs text-gray-500">Date of Birth</label>
              <input type="date" className="w-full border p-2 rounded" required 
                onChange={e => setNewMember({...newMember, date_of_birth: e.target.value})} />
              
              <div className="flex gap-2 mt-4">
                <button type="submit" className="flex-1 bg-sky-600 text-white py-2 rounded">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}