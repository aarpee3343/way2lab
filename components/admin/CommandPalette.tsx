'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { 
  Calculator, Calendar, CreditCard, Settings, User, 
  MapPin, FlaskConical, Search, FilePlus 
} from 'lucide-react';
import { getAdminOrders } from '@/app/actions/adminOrderManagement'; // Reusing your action

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Async Search Logic
  useEffect(() => {
    if (search.length < 2) return;
    const timer = setTimeout(async () => {
      // Reuse existing server action for searching orders
      const { orders } = await getAdminOrders({ search, page: 1 });
      setResults(orders);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm animate-in fade-in">
      <Command className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        
        <div className="flex items-center border-b px-4" cmdk-input-wrapper="">
          <Search className="mr-2 h-5 w-5 shrink-0 opacity-50" />
          <Command.Input 
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command or search orders..."
            className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-slate-500">
            No results found.
          </Command.Empty>

          {/* Dynamic Search Results */}
          {results.length > 0 && (
            <Command.Group heading="Orders">
              {results.map((order) => (
                <Command.Item
                  key={order.id}
                  onSelect={() => runCommand(() => router.push(`/admin/orders/${order.id}`))}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg aria-selected:bg-blue-50 aria-selected:text-blue-700 cursor-pointer"
                >
                  <span className="font-mono font-bold">#{order.orderNumber}</span>
                  <span className="flex-1 truncate">{order.patientName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {order.status}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group heading="Navigation">
            <Command.Item onSelect={() => runCommand(() => router.push('/admin/orders/create'))} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg aria-selected:bg-slate-100 cursor-pointer">
              <FilePlus size={16} /> Create New Order
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/admin/labs'))} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg aria-selected:bg-slate-100 cursor-pointer">
              <FlaskConical size={16} /> Manage Labs
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/admin/technicians'))} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg aria-selected:bg-slate-100 cursor-pointer">
              <User size={16} /> Technicians
            </Command.Item>
             <Command.Item onSelect={() => runCommand(() => router.push('/admin/map'))} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg aria-selected:bg-slate-100 cursor-pointer">
              <MapPin size={16} /> Live Map
            </Command.Item>
          </Command.Group>

        </Command.List>
        
        <div className="border-t bg-slate-50 px-4 py-2 text-xs text-slate-400 flex justify-between">
           <span><strong>Cmd+K</strong> to open</span>
           <span>Use arrows to navigate, enter to select</span>
        </div>
      </Command>
    </div>
  );
}