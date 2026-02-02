'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Plus, Trash2, Home, Briefcase, Map } from 'lucide-react';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    address_line1: '', address_line2: '', city: '', state: '', pincode: '', type: 'Home'
  });

  const fetchAddresses = async () => {
    // ✅ No token, no header
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/addresses`);
    setAddresses(res.data);
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleDelete = async (id: number) => {
    if(!confirm("Delete this address?")) return;
    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/user/addresses/${id}`);
    fetchAddresses();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/user/addresses`, formData);
      setShowModal(false);
      setFormData({ address_line1: '', address_line2: '', city: '', state: '', pincode: '', type: 'Home' });
      fetchAddresses();
    } catch (err) { alert('Failed to add address'); }
    finally { setLoading(false); }
  };

  const getIcon = (type: string) => {
    if (type === 'Home') return <Home size={18} />;
    if (type === 'Office') return <Briefcase size={18} />;
    return <MapPin size={18} />;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Saved Addresses</h1>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700">
          <Plus size={18} /> Add New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr: any) => (
          <div key={addr.id} className="bg-white p-5 rounded-xl border shadow-sm flex justify-between items-start group">
            <div className="flex gap-4">
              <div className="bg-gray-100 p-2.5 rounded-full text-gray-600 h-fit">
                {getIcon(addr.type)}
              </div>
              <div>
                <span className="text-xs font-bold uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{addr.type}</span>
                <p className="font-bold text-gray-800 mt-1">{addr.addressLine1}</p>
                {addr.addressLine2 && <p className="text-sm text-gray-500">{addr.addressLine2}</p>}
                <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(addr.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {addresses.length === 0 && (
        <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed">
          <Map size={40} className="mx-auto mb-2 opacity-20" />
          No addresses saved yet.
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">Add Address</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input placeholder="Address Line 1" className="w-full border p-2.5 rounded-lg" required onChange={e => setFormData({...formData, address_line1: e.target.value})} />
              <input placeholder="Line 2 (Optional)" className="w-full border p-2.5 rounded-lg" onChange={e => setFormData({...formData, address_line2: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="City" className="w-full border p-2.5 rounded-lg" required onChange={e => setFormData({...formData, city: e.target.value})} />
                <input placeholder="State" className="w-full border p-2.5 rounded-lg" required onChange={e => setFormData({...formData, state: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Pincode" className="w-full border p-2.5 rounded-lg" required onChange={e => setFormData({...formData, pincode: e.target.value})} />
                <select className="w-full border p-2.5 rounded-lg" onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option>Home</option><option>Office</option><option>Other</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-lg font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}