'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { PenTool, Image as ImageIcon, Save, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { toast } from '@/lib/safe-toast';

export default function WriteBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Health Tips',
    authorName: '',
    coverImage: '',
    excerpt: '',
    content: '',
    seoTitle: '',
    seoDesc: '',
    secretKey: '' // <--- New State
  });

  const categories = ['Health Tips', 'Diagnostics', 'Wellness', 'Disease Awareness', 'Nutrition'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.secretKey) {
      toast.error("Authorization Token is required");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/blogs/create', formData);
      
      if (res.data.success) {
        setSubmitted(true);
        toast.success("Blog Published Successfully!");
        // Optional: Redirect to the new blog immediately
        // router.push(`/blogs/${res.data.slug}`);
      }
    } catch (err: any) {
      // Show specific error from backend (e.g. "Invalid Token")
      toast.error(err.response?.data?.message || "Failed to publish blog");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Published!</h2>
          <p className="text-slate-500 mb-6">
            Your blog is now live on the platform.
          </p>
          <button onClick={() => router.push('/blogs')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold w-full">
            View All Blogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <PenTool className="text-blue-600" /> Write a Story
          </h1>
          <p className="text-slate-500">Authorized Personnel Only.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Authorization Section */}
          <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex items-center gap-4">
            <div className="bg-rose-100 p-3 rounded-xl text-rose-600">
              <Lock size={24} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-rose-800 uppercase mb-1">Authorization Token</label>
              <input 
                required
                type="password" 
                className="w-full bg-white p-3 rounded-xl border border-rose-200 outline-none focus:ring-2 focus:ring-rose-200 font-mono text-sm"
                placeholder="Enter Admin Secret Key"
                value={formData.secretKey}
                onChange={e => setFormData({...formData, secretKey: e.target.value})}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Blog Title</label>
              <input 
                required
                type="text" 
                className="w-full text-3xl font-bold border-b border-slate-200 py-2 focus:border-blue-600 outline-none placeholder:text-slate-300"
                placeholder="Enter a catchy title..."
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
                <select 
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Author Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Your Name"
                  value={formData.authorName}
                  onChange={e => setFormData({...formData, authorName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cover Image URL</label>
              <div className="flex gap-2">
                <div className="bg-slate-100 p-3 rounded-xl"><ImageIcon size={20} className="text-slate-400"/></div>
                <input 
                  type="url" 
                  className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.coverImage}
                  onChange={e => setFormData({...formData, coverImage: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Short Excerpt</label>
              <textarea 
                required
                rows={2}
                className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                placeholder="A brief summary of your article..."
                value={formData.excerpt}
                onChange={e => setFormData({...formData, excerpt: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Content (HTML Supported)</label>
              <textarea 
                required
                rows={12}
                className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100 font-mono text-sm"
                placeholder="Write content here. Use <h2>, <p>, <ul>..."
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
              />
            </div>
          </div>

          {/* SEO Section */}
          <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 space-y-6">
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
              <span className="bg-blue-200 p-1 rounded text-xs">SEO</span> Optimization
            </h3>
            
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase mb-2">Meta Title</label>
              <input 
                type="text" 
                className="w-full p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Title shown in Google Search"
                value={formData.seoTitle}
                onChange={e => setFormData({...formData, seoTitle: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase mb-2">Meta Description</label>
              <input 
                type="text" 
                className="w-full p-3 rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Description shown in Google Search"
                value={formData.seoDesc}
                onChange={e => setFormData({...formData, seoDesc: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-xl disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin"/> : <Save size={20} />}
              Publish Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}