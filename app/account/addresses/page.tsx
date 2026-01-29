'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Trash2, MapPin, Plus } from 'lucide-react';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newAddr, setNewAddr] = useState({ 
    address_line1: '', address_line2: '', city: '', state: '', pincode: '', type: 'Home' 
  });

  const fetchAddresses = async () => {
    const token = Cookies.get('token');
    const res = await axios.get('http://localhost:5050/api/user/addresses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setAddresses(res.data);
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get('token');
    await axios.post('http://localhost:5050/api/user/addresses', newAddr, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setShowModal(false);
    fetchAddresses(); // Refresh list
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Delete address?")) return;
    const token = Cookies.get('token');
    await axios.delete(`http://localhost:5050/api/user/addresses/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchAddresses();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Addresses</h1>
        <button onClick={() => setShowModal(true)} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Add New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr: any) => (
          <div key={addr.id} className="border p-4 rounded-xl shadow-sm bg-white relative group">
            <span className="bg-gray-100 text-xs font-bold px-2 py-1 rounded uppercase">{addr.type}</span>
            <p className="font-bold mt-2 text-gray-800">{addr.addressLine1}</p>
            {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
            <p className="text-sm text-gray-500 mt-1">{addr.city}, {addr.state} - {addr.pincode}</p>
            
            <button onClick={() => handleDelete(addr.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Simple Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Add Address</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <input placeholder="Address Line 1" className="w-full border p-2 rounded" required 
                onChange={e => setNewAddr({...newAddr, address_line1: e.target.value})} />
              <input placeholder="Line 2 (Optional)" className="w-full border p-2 rounded" 
                onChange={e => setNewAddr({...newAddr, address_line2: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="City" className="w-full border p-2 rounded" required 
                  onChange={e => setNewAddr({...newAddr, city: e.target.value})} />
                <input placeholder="Pincode" className="w-full border p-2 rounded" required 
                  onChange={e => setNewAddr({...newAddr, pincode: e.target.value})} />
              </div>
              <input placeholder="State" className="w-full border p-2 rounded" required 
                onChange={e => setNewAddr({...newAddr, state: e.target.value})} />
              
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