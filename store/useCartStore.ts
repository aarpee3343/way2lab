import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ------------------ TYPES ------------------ */

export interface CartItem {
  id: number;
  name: string;
  type: 'test' | 'package';
  price: number;      // lab discounted price
  basePrice: number;  // lab MRP
  labId: number;
  labName: string;
}

export interface CartLab {
  labId: number;
  labName: string;
  servicePincode: string;
}

interface CartState {
  lab: CartLab | null;
  items: CartItem[];

  coupon: {
    code: string;
    discountAmount: number;
    type: 'fixed' | 'percentage';
  } | null;

  totals: {
    subtotal: number;        // sum of selling prices
    couponDiscount: number;
    finalAmount: number;
  };

  setLabCart: (lab: CartLab, items: CartItem[]) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;

  setCoupon: (coupon: CartState['coupon']) => void;
  removeCoupon: () => void;
}

/* ------------------ HELPERS ------------------ */

const calculateTotals = (
  items: CartItem[],
  coupon: CartState['coupon']
) => {
  const subtotal = items.reduce((sum, i) => sum + Number(i.price || 0), 0);
  const couponDiscount = coupon ? Number(coupon.discountAmount || 0) : 0;

  return {
    subtotal,
    couponDiscount,
    finalAmount: Math.max(0, subtotal - couponDiscount),
  };
};

/* ------------------ STORE ------------------ */

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lab: null,
      items: [],
      coupon: null,
      totals: { subtotal: 0, couponDiscount: 0, finalAmount: 0 },

      setLabCart: (lab, items) => {
        set({
          lab,
          items,
          coupon: null,
          totals: calculateTotals(items, null),
        });
      },

      removeItem: (index) => {
        const { items, coupon } = get();
        const updatedItems = items.filter((_, i) => i !== index);

        // If no items left → clear cart
        if (updatedItems.length === 0) {
          set({
            lab: null,
            items: [],
            coupon: null,
            totals: { subtotal: 0, couponDiscount: 0, finalAmount: 0 },
          });
          return;
        }

        set({
          items: updatedItems,
          totals: calculateTotals(updatedItems, coupon),
        });
      },

      clearCart: () =>
        set({
          lab: null,
          items: [],
          coupon: null,
          totals: { subtotal: 0, couponDiscount: 0, finalAmount: 0 },
        }),

      setCoupon: (couponData) => {
        const { items } = get();
        set({
          coupon: couponData,
          totals: calculateTotals(items, couponData),
        });
      },

      removeCoupon: () => {
        const { items } = get();
        set({
          coupon: null,
          totals: calculateTotals(items, null),
        });
      },
    }),
    { name: 'cart-storage' }
  )
);
