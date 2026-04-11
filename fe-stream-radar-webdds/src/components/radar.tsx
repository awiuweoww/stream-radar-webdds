/**
 * Created Date       : 11-04-2026
 * Description        : Komponen Legacy Track Info Radar.
 *                      Fokus utama: Prototipe awal simulasi interval radar (Telah digantikan dengan Engine baru).
 *
 * Arsitektur:
 *   [LEGACY/DEPRECATED] ──► Menampilkan info live feed tracking di panel kiri.
 *
 * Changelog:
 *   - 0.1.0 (11-04-2026): Kerangka awal dari mockup dashboard UI.
 */
import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for cleaner conditional tailwind classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const TrackInfo = () => {
  const [data, setData] = useState({
    lat: -6.2088,
    lng: 106.8456,
    speed: 450,
    heading: 135,
    altitude: 12000,
  });

  // Simulate active radar streaming updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.001,
        lng: prev.lng + (Math.random() - 0.5) * 0.001,
        speed: Math.max(300, Math.min(600, prev.speed + (Math.random() - 0.5) * 10)),
        heading: (prev.heading + (Math.random() - 0.5) * 5) % 360,
        altitude: Math.max(10000, Math.min(15000, prev.altitude + (Math.random() - 0.5) * 100)),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6 font-montserrat text-white bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-800 to-surface-950">
      
      {/* Radar Card Container */}
      <div className="relative overflow-hidden w-full max-w-md rounded-2xl bg-surface-900/40 p-6 backdrop-blur-md border border-surface-700 shadow-2xl">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header Section */}
        <div className="flex items-center justify-between mb-8 border-b border-surface-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-surface-800 border border-primary/20 shadow-[0_0_15px_rgba(0,230,128,0.15)]">
              {/* Radar Sweeper Icon Placeholder */}
              <div className="w-4 h-4 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,230,128,0.8)]" />
              <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100 tracking-wide uppercase">Track <span className="text-primary font-light">Info</span></h2>
              <p className="text-xs text-primary-400 opacity-80 uppercase tracking-widest mt-0.5">Live Live Feed</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-primary-900/50 border border-primary-500/30">
             <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(0,230,128,0.8)]" />
             <span className="text-xs font-semibold text-primary-300 uppercase tracking-wider">Active</span>
          </div>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Coordinate Box */}
          <div className="col-span-2 bg-surface-800/50 rounded-xl p-4 border border-surface-600/30 transition-all hover:bg-surface-700/50 hover:border-primary/40 group">
            <p className="text-xs text-surface-400 mb-1 uppercase tracking-wider font-semibold">Coordinates</p>
            <div className="flex items-end gap-3 justify-between">
              <div className="font-mono text-lg text-gray-100 group-hover:text-primary transition-colors">
                {data.lat.toFixed(5)}&#176; <span className="text-surface-400">N</span>
              </div>
              <div className="font-mono text-lg text-gray-100 group-hover:text-primary transition-colors">
                {data.lng.toFixed(5)}&#176; <span className="text-surface-400">E</span>
              </div>
            </div>
          </div>

          <DataBox label="Speed (Kts)" value={data.speed} decimals={1} highlight />
          <DataBox label="Heading" value={data.heading} decimals={1} format={(v) => `${v}&#176;`} />
          <DataBox label="Altitude (Ft)" value={data.altitude} decimals={0} />
          
          <div className="bg-surface-800/50 rounded-xl p-4 border border-surface-600/30">
             <p className="text-xs text-surface-400 mb-1 uppercase tracking-wider font-semibold">TGT ID</p>
             <p className="font-mono text-xl text-accent font-bold">UKN-920</p>
          </div>

        </div>

      </div>
    </div>
  );
};

// Subcomponent for small data fields
interface DataBoxProps {
  label: string;
  value: number;
  decimals?: number;
  highlight?: boolean;
  format?: (val: string) => string;
}

const DataBox = ({ label, value, decimals = 0, highlight, format }: DataBoxProps) => {
  const displayValue = value.toFixed(decimals);
  const formatted = format ? format(displayValue) : displayValue;

  return (
    <div className={cn(
      "bg-surface-800/50 rounded-xl p-4 border border-surface-600/30 transition-colors",
      highlight ? "border-l-2 border-l-primary" : ""
    )}>
      <p className="text-xs text-surface-400 mb-1 uppercase tracking-wider font-semibold">{label}</p>
      <p className="font-mono text-xl text-gray-100" dangerouslySetInnerHTML={{ __html: formatted }} />
    </div>
  );
};

export default TrackInfo;
