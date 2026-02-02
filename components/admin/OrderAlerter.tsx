'use client';

import { useEffect, useRef } from 'react';
import { toast } from '@/lib/safe-toast';

// Helper to check count (Server Action)
import { getAdminDashboardStats } from '@/app/actions/adminDashboard';

export default function OrderAlerter() {
  const lastCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Audio
    audioRef.current = new Audio('/ding.mp3'); 

    const checkOrders = async () => {
      try {
        const stats = await getAdminDashboardStats();
        const currentCount = stats.totalOrders;

        // If count increased, play sound
        if (lastCountRef.current > 0 && currentCount > lastCountRef.current) {
          audioRef.current?.play().catch(e => console.log("Audio play failed", e));
          toast.success("🔔 New Order Received!", { duration: 5000 });
        }

        lastCountRef.current = currentCount;
      } catch (e) {
        console.error("Polling error", e);
      }
    };

    // Initial check
    checkOrders();

    // Poll every 10 seconds
    const interval = setInterval(checkOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  return null; // Invisible component
}