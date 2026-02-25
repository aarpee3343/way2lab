'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { 
  Building2, FilePlus, FlaskConical, HandCoins, Mail, MapPin, Search, Settings, ShoppingCart, Ticket, User, UserRound 
} from 'lucide-react';

type SearchResult = {
  id: string;
  group: string;
  label: string;
  description?: string;
  href: string;
  status?: string;
};

const quickActions = [
  { id: 'qa-orders-create', label: 'Create New Order', href: '/admin/orders/create', icon: FilePlus, keywords: 'create order booking' },
  { id: 'qa-orders', label: 'Orders', href: '/admin/orders', icon: ShoppingCart, keywords: 'orders bookings status' },
  { id: 'qa-customers', label: 'Customers', href: '/admin/customers', icon: UserRound, keywords: 'customer users account' },
  { id: 'qa-corporates', label: 'Corporates', href: '/admin/corporates', icon: Building2, keywords: 'corporate company b2b' },
  { id: 'qa-tests', label: 'Tests Inventory', href: '/admin/tests', icon: FlaskConical, keywords: 'tests pathology inventory' },
  { id: 'qa-coupons', label: 'Coupons', href: '/admin/coupons', icon: Ticket, keywords: 'coupon offers discounts' },
  { id: 'qa-technicians', label: 'Technicians', href: '/admin/technicians', icon: User, keywords: 'technicians phlebotomist staff' },
  { id: 'qa-map', label: 'Live Map', href: '/admin/map', icon: MapPin, keywords: 'map tracking live' },
  { id: 'qa-finance', label: 'Finance', href: '/admin/finance', icon: HandCoins, keywords: 'finance payments refunds' },
  { id: 'qa-email', label: 'Email Marketing', href: '/admin/email-marketing', icon: Mail, keywords: 'email campaign newsletter' },
  { id: 'qa-support', label: 'Support Inbox', href: '/admin/support', icon: Mail, keywords: 'support tickets contact' },
  { id: 'qa-settings', label: 'Settings', href: '/admin/settings', icon: Settings, keywords: 'settings configuration' },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Reset search state when closed
  useEffect(() => {
    if (!open) {
      setSearch('');
      setResults([]);
      setLoading(false);
    }
  }, [open]);

  // Async Search Logic (live search across admin modules)
  useEffect(() => {
    if (!open) return;

    const q = search.trim();
    if (q.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!res.ok) {
          setResults([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setResults(Array.isArray(data?.results) ? data.results : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, search]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const q = search.trim().toLowerCase();
  const filteredQuickActions = q
    ? quickActions.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.keywords.toLowerCase().includes(q) ||
          item.href.toLowerCase().includes(q)
      )
    : quickActions;

  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm animate-in fade-in">
      <Command shouldFilter={false} className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        
        <div className="flex items-center border-b px-4" cmdk-input-wrapper="">
          <Search className="mr-2 h-5 w-5 shrink-0 opacity-50" />
          <Command.Input 
            value={search}
            onValueChange={setSearch}
            placeholder="Search orders, customers, corporates, labs, tests, packages..."
            className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-slate-500">
            {loading ? 'Searching...' : 'No results found.'}
          </Command.Empty>

          <Command.Group heading="Navigation">
            {filteredQuickActions.map((item) => (
              <Command.Item
                key={item.id}
                onSelect={() => runCommand(() => router.push(item.href))}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg aria-selected:bg-slate-100 cursor-pointer"
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Command.Item>
            ))}
          </Command.Group>

          {Object.entries(groupedResults).map(([group, items]) => (
            <Command.Group key={group} heading={group}>
              {items.map((item) => (
                <Command.Item
                  key={item.id}
                  onSelect={() => runCommand(() => router.push(item.href))}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg aria-selected:bg-blue-50 aria-selected:text-blue-700 cursor-pointer"
                >
                  <span className="flex-1 truncate">
                    <span className="font-semibold">{item.label}</span>
                    {item.description ? (
                      <span className="block text-[11px] text-slate-500 truncate">{item.description}</span>
                    ) : null}
                  </span>
                  {item.status ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.status}
                    </span>
                  ) : null}
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
        
        <div className="border-t bg-slate-50 px-4 py-2 text-xs text-slate-400 flex justify-between">
           <span><strong>Cmd+K</strong> to open</span>
           <span>Use arrows to navigate, enter to select</span>
        </div>
      </Command>
    </div>
  );
}
