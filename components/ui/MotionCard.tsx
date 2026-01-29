'use client';

import { motion } from 'framer-motion';

export const MotionCard = ({ children, className, onClick, delay = 0 }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay }}
      whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};