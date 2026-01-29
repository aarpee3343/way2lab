'use client';

import { motion } from 'framer-motion';

const logos = [
  'dr-lal-pathlabs.png',
  'thyrocare.png',
  'metropolis.png',
  'srl-diagnostics.png',
  'apollo-diagnostics.png',
  'max-healthcare.png',
  'advance-pathology-diagnostic-centre-farrukhabad.png',
  'the-health-county-labs.png',
];

export default function LabSlider() {
  return (
    <section className="relative py-28 bg-gradient-to-b from-white to-teal-50/20 overflow-hidden">
      {/* Medical pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d9488' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="container mx-auto px-4 text-center mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full mb-6">
          <span className="text-sm font-semibold">Certified Partners</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Our Trusted <span className="text-teal-700">Lab Network</span>
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
          Partnered with 3,300+ NABL certified diagnostic laboratories across India
        </p>
      </div>

      {/* Infinite scrolling container */}
      <div className="relative w-full overflow-hidden">
        <div className="flex animate-scroll-slow">
          {[...logos, ...logos, ...logos, ...logos].map((logo, i) => (
            <motion.div
              key={i}
              className="flex-shrink-0 w-[180px] md:w-[220px] px-6 flex items-center justify-center"
              whileHover={{ 
                scale: 1.05,
                y: -5,
                transition: { duration: 0.3 }
              }}
            >
              <div className="relative group">
                {/* Card container */}
                <div className="relative h-28 w-full bg-white rounded-2xl border border-teal-100 shadow-lg hover:shadow-xl transition-all duration-500 p-4">
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-100/20 via-blue-100/10 to-teal-100/20 blur-sm" />
                  </div>
                  
                  {/* Logo container */}
                  <div className="relative h-full flex items-center justify-center p-2">
                    <img 
                      src={`/assets/images/labs/${logo}`} 
                      alt="Lab Logo" 
                      className="h-12 w-auto object-contain grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', 
                          `<div class="h-12 w-full flex items-center justify-center text-teal-700 font-bold text-sm">${logo.replace('.png', '').replace(/-/g, ' ')}</div>`
                        );
                      }}
                    />
                  </div>
                  
                  {/* Active indicator */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats section */}
      <div className="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { value: '3,300+', label: 'Partner Labs' },
          { value: '200+', label: 'Cities Covered' },
          { value: '99.8%', label: 'Accuracy Rate' },
          { value: '24h', label: 'Avg. Turnaround' },
        ].map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-3xl font-bold text-teal-700 mb-2">{stat.value}</div>
            <div className="text-sm text-slate-600 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-slow {
          animation: scroll 60s linear infinite;
          display: flex;
          width: max-content;
        }
      `}</style>
    </section>
  );
}