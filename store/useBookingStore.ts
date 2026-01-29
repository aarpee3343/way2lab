import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BookingState {
  // Patient Logic (matches Booking.php)
  patientType: 'self' | 'family_member' | 'other' | null;
  selectedFamilyMemberId: number | null;
  otherPatientDetails: { name: string; phone: string; gender: string; dob: string } | null;
  
  // Address Logic
  selectedAddressId: number | null;
  
  // Schedule Logic
  collectionType: 'home_collection' | 'center_visit';
  scheduleDate: string | null;
  scheduleTime: string | null;
  instructions: string;
  
  // Actions
  setPatient: (type: 'self' | 'family_member' | 'other', id?: number | null, details?: any) => void;
  setAddress: (id: number) => void;
  setSchedule: (date: string, time: string, type: 'home_collection' | 'center_visit', instr: string) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      patientType: 'self',
      selectedFamilyMemberId: null,
      otherPatientDetails: null,
      selectedAddressId: null,
      collectionType: 'home_collection',
      scheduleDate: null,
      scheduleTime: null,
      instructions: '',

      setPatient: (type, id = null, details = null) => set({ 
        patientType: type, 
        selectedFamilyMemberId: id, 
        otherPatientDetails: details 
      }),
      
      setAddress: (id: number | null) => set({ selectedAddressId: id }),
      
      setSchedule: (date, time, type, instr) => set({ 
        scheduleDate: date, 
        scheduleTime: time, 
        collectionType: type, 
        instructions: instr 
      }),

      resetBooking: () => set({
        patientType: 'self',
        selectedAddressId: null,
        scheduleDate: null
      })
    }),
    { name: 'booking-storage' }
  )
);