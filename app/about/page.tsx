'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Users, MapPin, Star, Target, Heart, Award, Stethoscope, Activity, Microscope } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/10 via-white to-slate-50">
      
      {/* Healthcare Hero */}
      <section className="bg-gradient-to-r from-teal-600 via-teal-500 to-teal-600 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20L50 80M20 50L80 50' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }} />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black mb-6 tracking-tight"
          >
            Revolutionizing <span className="text-teal-200">Diagnostic Healthcare</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="text-teal-100 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
          >
            WayToLab is India's trusted diagnostic healthcare platform, connecting patients with 
            certified laboratories for accurate, accessible, and affordable medical testing.
          </motion.p>
        </div>
      </section>

      {/* Healthcare Stats */}
      <section className="py-12 -mt-16 px-4 relative z-20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Partner Labs', value: '3,500+', icon: ShieldCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Diagnostic Tests', value: '10M+', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Cities Covered', value: '200+', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Patient Rating', value: '4.8/5', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 + (i * 0.1) }}
              className={`${stat.bg} p-6 rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 text-center hover:-translate-y-2 transition-transform duration-300`}
            >
              <stat.icon className={`mx-auto mb-3 h-10 w-10 ${stat.color}`} />
              <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Healthcare Mission */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            
            {/* Medical Vision */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
              className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl z-10" />
              <div className="relative z-20 text-center p-8">
                <Target size={80} className="mx-auto text-teal-600 mb-6" />
                <h3 className="text-2xl font-bold text-slate-800">Our Healthcare Vision</h3>
                <p className="text-slate-600 mt-2">To become India's most trusted diagnostic healthcare partner</p>
              </div>
            </motion.div>

            {/* Healthcare Content */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
            >
              <span className="inline-block bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-6">
                <Stethoscope size={16} className="inline mr-2" /> Our Mission
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                Making <span className="text-teal-600">Healthcare Accessible</span> & Transparent
              </h2>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                We believe that quality diagnostic healthcare should be accessible to everyone. 
                Our platform eliminates the complexity of finding reliable labs by providing 
                transparent pricing, certified quality, and seamless service delivery.
              </p>

              <div className="space-y-6">
                {[
                  { 
                    title: "Quality Assurance", 
                    desc: "Partnered exclusively with NABL & CAP certified diagnostic laboratories.", 
                    icon: ShieldCheck,
                    color: "bg-teal-100 text-teal-600"
                  },
                  { 
                    title: "Transparent Pricing", 
                    desc: "Compare prices across labs and save up to 70% on diagnostic tests.", 
                    icon: Award,
                    color: "bg-blue-100 text-blue-600"
                  },
                  { 
                    title: "Healthcare Convenience", 
                    desc: "Free home collection, digital reports, and expert consultations.", 
                    icon: Heart,
                    color: "bg-rose-100 text-rose-600"
                  }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${feature.color}`}>
                      <feature.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{feature.title}</h4>
                      <p className="text-slate-600 text-sm">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Healthcare Values */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-teal-50/20">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-block bg-gradient-to-r from-teal-50 to-blue-50 text-teal-700 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-6">
            Healthcare Values
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">Our Commitment to Your Health</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Users size={32} className="text-teal-600 mx-auto" />,
                title: "Patient-Centric Care",
                desc: "Every decision is made with your health and convenience in mind."
              },
              { 
                icon: <Microscope size={32} className="text-blue-600 mx-auto" />,
                title: "Scientific Accuracy",
                desc: "Rigorous quality control ensures precise and reliable test results."
              },
              { 
                icon: <Heart size={32} className="text-rose-600 mx-auto" />,
                title: "Compassionate Service",
                desc: "Understanding and addressing your healthcare needs with empathy."
              }
            ].map((value, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-3xl shadow-lg border border-teal-100 hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                <p className="text-slate-600">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}