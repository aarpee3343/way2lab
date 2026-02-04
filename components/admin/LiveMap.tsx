'use client';

import { useEffect, useState } from 'react';
import { getAdminOrders } from '@/app/actions/adminOrderManagement';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Icon - Now safe because this file is only loaded on Client
const icon = L.icon({ 
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png", 
  iconSize: [25, 41], 
  iconAnchor: [12, 41] 
});
const center: [number, number] = [28.4595, 77.0266];

export default function LiveMap() {
  const [locations, setLocations] = useState<any[]>([]);
  const MapContainerAny = MapContainer as any;
  const MarkerAny = Marker as any;

  useEffect(() => {
    async function load() {
      // Fetch Pending Home Collections
      const { orders } = await getAdminOrders({ status: 'Pending', page: 1 });
      
      // MOCK GEOCODING
      const mapped = orders
        .filter((o: any) => o.collectionType === 'home_collection')
        .map((o: any) => ({
          ...o,
          lat: 28.4595 + (Math.random() * 0.05 - 0.025),
          lng: 77.0266 + (Math.random() * 0.05 - 0.025)
        }));
      setLocations(mapped);
    }
    load();
  }, []);

  return (
    <div className="h-[calc(100vh-100px)] rounded-2xl overflow-hidden border border-slate-200 shadow-xl relative">
      <div className="absolute top-4 right-4 z-[999] bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-bold text-slate-800">Live Collections</h3>
        <p className="text-sm text-slate-500">{locations.length} pending pickups</p>
      </div>

      <MapContainerAny center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {locations.map((loc) => (
          <MarkerAny key={loc.id} position={[loc.lat, loc.lng]} icon={icon as any}>
            <Popup>
              <div className="p-1">
                <strong className="block text-sm">Order #{loc.orderNumber}</strong>
                <span className="text-xs text-slate-500">{loc.patientName}</span><br/>
                <span className="text-xs font-bold text-blue-600">{loc.preferredTimeSlot}</span>
              </div>
            </Popup>
          </MarkerAny>
        ))}
      </MapContainerAny>
    </div>
  );
}
