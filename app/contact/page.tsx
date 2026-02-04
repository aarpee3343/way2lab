'use client';

import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Send, Loader2, HeartPulse, Users, ShieldCheck } from 'lucide-react';
import { toast } from '@/lib/safe-toast';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('/api/contact', formData);
      if (res.data.success) {
        toast.success("Message sent successfully! Our healthcare team will contact you soon.");
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (err) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { 
      icon: Phone, 
      title: "WayToLab Helpline", 
      value: "+91 93112 13388", 
      sub: "24/7 Support", 
      color: "bg-teal-50 text-teal-600 border-teal-100",
      gradient: "from-teal-50 to-teal-50"
    },
    { 
      icon: Mail, 
      title: "Email Support", 
      value: "care@waytolab.com", 
      sub: "Response within 24 hours", 
      color: "bg-blue-50 text-blue-600 border-blue-100",
      gradient: "from-blue-50 to-blue-50"
    },
    { 
      icon: MapPin, 
      title: "WayToLab Healthcare", 
      value: "Gurugram, India", 
      sub: "E-504, ROF Ananda, Sector 95", 
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      gradient: "from-emerald-50 to-emerald-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/10 via-white to-slate-50 py-20 px-4">
      
      {/* Healthcare Header */}
      <div className="max-w-2xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full mb-6">
          <HeartPulse size={16} />
          <span className="text-sm font-semibold">Healthcare Support</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
          Contact <span className="text-teal-700">WayToLab Healthcare</span>
        </h1>
        <p className="text-slate-600 text-lg">
          Have questions about diagnostic tests or health reports? Our medical team is here to assist you.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        
        {/* Contact Cards */}
        <div className="space-y-6">
          {contactInfo.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: i * 0.1 }}
              className={`bg-gradient-to-r ${item.gradient} p-6 rounded-2xl shadow-lg border ${item.color.split(' ')[2]} hover:shadow-xl transition-all cursor-pointer`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color.split(' ')[0]} ${item.color.split(' ')[1]} border ${item.color.split(' ')[2]}`}>
                  <item.icon size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-1">{item.title}</h3>
                  <p className="font-bold text-slate-800 text-lg">{item.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Healthcare Trust */}
          <div className="bg-gradient-to-r from-teal-50 to-white rounded-2xl p-6 border border-teal-100">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={24} className="text-teal-600" />
              <h3 className="font-bold text-slate-900">Healthcare Assurance</h3>
            </div>
            <p className="text-sm text-slate-600">
              Certified NABL labs • Trained phlebotomists • Doctor consultations • Privacy protected
            </p>
          </div>
        </div>

        {/* Healthcare Contact Form */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-xl shadow-teal-200/30 border border-teal-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <Users size={24} className="text-teal-600" />
              <h3 className="text-2xl font-bold text-slate-900">Send us a Healthcare Inquiry</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Your Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3.5 rounded-xl border border-teal-200 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all font-medium"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full px-4 py-3.5 rounded-xl border border-teal-200 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all font-medium"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subject</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-3.5 rounded-xl border border-teal-200 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all font-medium"
                  value={formData.subject} 
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  placeholder="e.g., Test inquiry, Report clarification"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Healthcare Message</label>
                <textarea 
                  required 
                  rows={5}
                  className="w-full px-4 py-3.5 rounded-xl border border-teal-200 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all font-medium resize-none"
                  value={formData.message} 
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  placeholder="Please describe your healthcare inquiry or concern..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white h-14 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-teal-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Sending Message...
                  </>
                ) : (
                  <>
                    Send Healthcare Inquiry
                    <Send size={20} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

      </div>
    </div>
  );
}