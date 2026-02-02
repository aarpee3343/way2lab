import { Truck, Users, MapPin } from 'lucide-react';

export default function LiveTracking({ progress, technicianName }: any) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center animate-pulse">
            <Truck size={24}/>
          </div>
          <div>
            <h4 className="font-black text-slate-800 tracking-tight">On-site Collection Active</h4>
            <p className="text-xs text-slate-400 font-bold">{technicianName} is at Main Office</p>
          </div>
        </div>
        <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">Live</span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-500">
          <span>Sample Collection Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1 uppercase">
          <Users size={12}/> 32 / 50 Employees Collected
        </p>
      </div>
    </div>
  );
}