'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  labName: string;
  latitude: number | null;
  longitude: number | null;
  city?: string | null;
  state?: string | null;
  primaryPincode?: string | null;
  coveragePincodes: string[];
};

const indiaCenter: [number, number] = [22.9734, 78.6569];

function buildApproxCoveragePoints(
  lat: number,
  lng: number,
  pincodes: string[]
): Array<{ pincode: string; lat: number; lng: number }> {
  const unique = Array.from(new Set(pincodes)).slice(0, 120);
  if (unique.length === 0) return [];

  return unique.map((pincode, index) => {
    // Deterministic ring spread around lab location for visual coverage clusters.
    const ring = Math.floor(index / 12) + 1;
    const step = (index % 12) * (Math.PI / 6);
    const radius = 0.02 * ring; // ~2-8km depending on latitude
    const dLat = radius * Math.cos(step);
    const dLng = (radius * Math.sin(step)) / Math.max(0.4, Math.cos((lat * Math.PI) / 180));
    return { pincode, lat: lat + dLat, lng: lng + dLng };
  });
}

export default function LabCoverageMap({
  labName,
  latitude,
  longitude,
  city,
  state,
  primaryPincode,
  coveragePincodes
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [showCoverage, setShowCoverage] = useState(false);
  const [loadingPins, setLoadingPins] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [exactPins, setExactPins] = useState<Array<{ pincode: string; lat: number; lng: number }>>([]);
  const canPlotCoverage = latitude != null && longitude != null;
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  const coveragePoints = useMemo(() => {
    if (!canPlotCoverage) return [];
    if (exactPins.length > 0) return exactPins;
    return buildApproxCoveragePoints(latitude, longitude, coveragePincodes);
  }, [canPlotCoverage, latitude, longitude, coveragePincodes, exactPins]);

  useEffect(() => {
    if (!showCoverage) return;
    if (!canPlotCoverage) return;
    if (!googleMapsKey) {
      setPinError('Google Maps API key is missing in NEXT_PUBLIC_GOOGLE_MAPS_KEY.');
      return;
    }

    let cancelled = false;

    const fetchPinCoordinates = async () => {
      const uniquePincodes = Array.from(new Set(coveragePincodes)).slice(0, 80);
      if (uniquePincodes.length === 0) {
        setExactPins([]);
        setPinError(null);
        return;
      }

      setLoadingPins(true);
      setPinError(null);

      const runWithConcurrency = async <T,>(items: string[], worker: (value: string) => Promise<T | null>, limit = 5) => {
        const results: T[] = [];
        let index = 0;

        const runners = Array.from({ length: Math.min(limit, items.length) }).map(async () => {
          while (index < items.length) {
            const i = index++;
            const item = items[i];
            const result = await worker(item);
            if (result) results.push(result);
          }
        });

        await Promise.all(runners);
        return results;
      };

      const pins = await runWithConcurrency(
        uniquePincodes,
        async (pincode) => {
          try {
            const address = encodeURIComponent(`${pincode}, ${city || ''}, ${state || ''}, India`);
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${googleMapsKey}`;
            const res = await fetch(url, { method: 'GET' });
            if (!res.ok) return null;
            const data = await res.json();
            if (data.status !== 'OK' || !data.results?.length) return null;
            const location = data.results[0]?.geometry?.location;
            if (!location) return null;
            return { pincode, lat: Number(location.lat), lng: Number(location.lng) };
          } catch {
            return null;
          }
        },
        5
      );

      if (cancelled) return;
      setExactPins(pins);
      if (pins.length === 0) {
        setPinError('Unable to geocode coverage pincodes right now. Showing approximate map points.');
      }
      setLoadingPins(false);
    };

    fetchPinCoordinates();
    return () => {
      cancelled = true;
    };
  }, [showCoverage, canPlotCoverage, coveragePincodes, city, state, googleMapsKey]);

  const mapCenter = useMemo<[number, number]>(
    () => (canPlotCoverage ? [latitude, longitude] : indiaCenter),
    [canPlotCoverage, latitude, longitude]
  );
  const mapZoom = canPlotCoverage ? 9 : 4;

  useEffect(() => {
    if (!showCoverage) return;
    if (!mapRef.current) return;
    if (!googleMapsKey) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const loadGoogleMaps = async () => {
      if ((window as any).google?.maps) return;

      await new Promise<void>((resolve, reject) => {
        const existing = document.getElementById('google-maps-script');
        if (existing) {
          const checkReady = () => {
            if ((window as any).google?.maps) resolve();
            else setTimeout(checkReady, 100);
          };
          checkReady();
          return;
        }

        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps script'));
        document.head.appendChild(script);
      });
    };

    const renderMap = async () => {
      try {
        await loadGoogleMaps();
      } catch {
        if (!cancelled) setPinError('Google Maps failed to load.');
        return;
      }

      if (cancelled || !mapRef.current || !(window as any).google?.maps) return;
      const g = (window as any).google as typeof google;

      const map = new g.maps.Map(mapRef.current, {
        center: { lat: mapCenter[0], lng: mapCenter[1] },
        zoom: mapZoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });

      const bounds = new g.maps.LatLngBounds();
      const icon: google.maps.Icon = {
        url: '/logo.png',
        scaledSize: new g.maps.Size(32, 32)
      };

      if (canPlotCoverage) {
        const labPos = { lat: latitude, lng: longitude };
        const labMarker = new g.maps.Marker({
          position: labPos,
          map,
          title: labName,
          icon
        });
        bounds.extend(labPos);
        const labInfo = new g.maps.InfoWindow({
          content: `
            <div style="font-family:Arial,sans-serif;font-size:12px;line-height:1.4;">
              <strong>${labName}</strong><br/>
              ${[city, state].filter(Boolean).join(', ')}${primaryPincode ? ` - ${primaryPincode}` : ''}
            </div>
          `
        });
        labMarker.addListener('click', () => labInfo.open({ anchor: labMarker, map }));
      }

      coveragePoints.forEach((point) => {
        const pos = { lat: point.lat, lng: point.lng };
        const marker = new g.maps.Marker({
          position: pos,
          map,
          title: `Coverage ${point.pincode}`,
          icon
        });
        bounds.extend(pos);
        const info = new g.maps.InfoWindow({
          content: `
            <div style="font-family:Arial,sans-serif;font-size:12px;line-height:1.4;">
              <strong>Coverage Pincode</strong><br/>
              ${point.pincode}
            </div>
          `
        });
        marker.addListener('click', () => info.open({ anchor: marker, map }));
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
      }
    };

    renderMap();
    return () => {
      cancelled = true;
    };
  }, [
    showCoverage,
    mapCenter,
    mapZoom,
    canPlotCoverage,
    latitude,
    longitude,
    coveragePoints,
    googleMapsKey,
    labName,
    city,
    state,
    primaryPincode
  ]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setShowCoverage((prev) => !prev)}
        className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2.5 font-bold hover:shadow-lg"
      >
        {showCoverage ? 'Hide Lab Coverage' : 'Show Lab Coverage'}
      </button>

      {showCoverage && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="h-[420px] w-full">
            <div ref={mapRef} className="h-full w-full" />
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Coverage pincodes:</span> {coveragePincodes.length || 0}
            </p>
            {loadingPins && (
              <p className="mt-2 text-xs text-slate-600">
                Mapping pincode coordinates from Google Maps...
              </p>
            )}
            {pinError && (
              <p className="mt-2 text-xs text-amber-700">{pinError}</p>
            )}
            {!loadingPins && !pinError && exactPins.length > 0 && (
              <p className="mt-2 text-xs text-emerald-700">
                Exact pincode mapping active for {exactPins.length} service pincodes.
              </p>
            )}
            {coveragePincodes.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {coveragePincodes.slice(0, 40).map((pin) => (
                  <span
                    key={pin}
                    className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700"
                  >
                    {pin}
                  </span>
                ))}
                {coveragePincodes.length > 40 && (
                  <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                    +{coveragePincodes.length - 40} more
                  </span>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                No specific coverage pincodes configured for this lab yet.
              </p>
            )}
            {!canPlotCoverage && (
              <p className="mt-2 text-xs text-amber-700">
                Lab latitude/longitude is missing. Add coordinates in admin to show map pins.
              </p>
            )}
            {!!googleMapsKey || (
              <p className="mt-2 text-xs text-amber-700">
                Google Maps key not configured. Add `NEXT_PUBLIC_GOOGLE_MAPS_KEY` for exact pincode mapping.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
