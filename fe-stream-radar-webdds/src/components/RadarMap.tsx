/**
 * Created Date       : 11-04-2026
 * Description        : Prototipe awal Integrasi OpenLayers.
 *                      Fokus utama: Demo pertama integrasi Map dan VectorSource.
 *                      (Peringatan: Telah dipindahkan seutuhnya ke susunan src/components/map).
 *
 * Arsitektur:
 *   [LEGACY/DEPRECATED] RadarMap.tsx
 *
 * Changelog:
 *   - 0.1.0 (11-04-2026): Implementasi proof of concept dari OpenLayers Stream.
 */
import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import { RadarTrack, generateMockTrack } from '../types/radar';

export const RadarMap = () => {
  const mapElement = useRef<HTMLDivElement>(null);
  const [tracks, setTracks] = useState<RadarTrack[]>([]);
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());

  // Setup Map on Mount
  useEffect(() => {
    if (!mapElement.current) return;

    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      style: new Style({
        image: new Circle({
          radius: 6,
          fill: new Fill({ color: '#00e680' }), // Tailwind Primary 500
          stroke: new Stroke({ color: '#131c23', width: 2 }), // Tailwind Surface
        }),
      }),
    });

    const initialMap = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([106.8456, -6.2088]), // Jakarta
        zoom: 10,
      }),
    });

    return () => {
      initialMap.setTarget(undefined);
    };
  }, []);

  // Simulate WebDDS Stream Data
  useEffect(() => {
    // Generate initial dummy track
    let currentTrack = generateMockTrack('TGT-01', -6.2088, 106.8456);

    const interval = setInterval(() => {
      // Stream update (move coordinates slightly)
      currentTrack = {
        ...currentTrack,
        lat: currentTrack.lat + (Math.random() - 0.5) * 0.01,
        lon: currentTrack.lon + (Math.random() - 0.5) * 0.01,
        timestamp: Date.now(),
      };

      setTracks([currentTrack]);

      // Update OpenLayers Feature
      const newFeature = new Feature({
        geometry: new Point(fromLonLat([currentTrack.lon, currentTrack.lat])),
      });

      vectorSourceRef.current.clear();
      vectorSourceRef.current.addFeature(newFeature);

    }, 1000); // Receive update every 1 second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-2xl border-2 border-surface-700">
      <div ref={mapElement} className="absolute inset-0" />
      
      {/* Overlay Information */}
      <div className="absolute top-4 right-4 bg-surface-900/80 backdrop-blur p-4 rounded-lg border border-surface-600 text-white font-mono shadow-lg">
        <h3 className="text-primary font-bold mb-2 uppercase">Live Stream Stats</h3>
        {tracks.map((t) => (
          <div key={t.trackId} className="text-sm">
            <p>ID: <span className="text-accent">{t.trackId}</span></p>
            <p>LAT: {t.lat.toFixed(4)}</p>
            <p>LON: {t.lon.toFixed(4)}</p>
            <p>SPD: {t.speed.toFixed(0)} Kts</p>
          </div>
        ))}
      </div>
    </div>
  );
};
