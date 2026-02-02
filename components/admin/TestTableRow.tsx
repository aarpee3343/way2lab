'use client';

import Link from 'next/link';
import { Edit } from 'lucide-react';
import DeleteRowButton from './DeleteRowButton';

export default function TestTableRow({
  t,
  deleteAction,
}: {
  t: any;
  deleteAction: (id: number) => Promise<{ success: boolean; error?: string }>;
}) {
  return (
    <tr className="group hover:bg-blue-50/30 transition-colors">
      <td>
        <div className="admin-table-row-primary">{t.testName}</div>
        <div className="admin-table-row-secondary">{t.slug || '-'}</div>
      </td>

      <td>
        <span className="admin-badge-default">{t.category || 'General'}</span>
      </td>

      <td>
        <div className="flex flex-col">
          <span className="admin-table-row-primary">₹{t.price.toFixed(2)}</span>
          {t.discount > 0 && (
            <span className="admin-badge-success text-[10px] px-1.5 w-fit">
              {t.discount}% OFF
            </span>
          )}
        </div>
      </td>

      <td>
        <div
          className={`admin-status-indicator ${
            t.isActive ? 'admin-badge-success' : 'admin-badge-default'
          }`}
        >
          <div
            className={`admin-status-dot ${
              t.isActive ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
          {t.isActive ? 'Active' : 'Inactive'}
        </div>
      </td>

      <td className="text-right">
        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/admin/tests/${t.id}`}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit size={18} />
          </Link>
          <DeleteRowButton id={t.id} deleteAction={deleteAction} />
        </div>
      </td>
    </tr>
  );
}
