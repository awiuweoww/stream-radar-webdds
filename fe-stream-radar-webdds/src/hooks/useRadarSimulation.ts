/**
 * Created Date       : 11-04-2026
 * Description        : Engine Radar Real-time berbasis WebDDS.
 *                      Menerima streaming data biner dari Gateway dan menayangkannya ke OpenLayers 
 *                      secara efisien menggunakan pola sinkronisasi Feature Map.
 *
 * Arsitektur:
 *   radarApi (WS) ──► useRadarSimulation (Hook) ──► Point Features (OL)
 */
import { useEffect, useRef } from 'react';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import OLMap from 'ol/Map';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, RegularShape } from 'ol/style';
import { RadarTrack } from '../types/radar';
import { useSimulationStore } from '../store/useSimulationStore';
import { CENTER_COORD } from './useMapInstance';
import { radarApi, RadarUpdateCallback } from '../utils/api/radarApi';

/**
 * Hook utama untuk mengelola siklus hidup data radar pada peta.
 * 
 * @param mapInstanceRef - Referensi ke instance peta OpenLayers.
 * @param selectedTrackId - ID dari track yang saat ini dipilih oleh pengguna.
 * @param popupInstanceRef - Referensi ke instance Overlay popup peta.
 * @returns Ref ke VectorSource yang berisi data radar.
 */
export function useRadarSimulation(
  mapInstanceRef: React.MutableRefObject<OLMap | null>,
  selectedTrackId: React.MutableRefObject<string | null>,
  popupInstanceRef: React.MutableRefObject<Overlay | null>
) {
  const isActive = useSimulationStore(state => state.isActive);
  const targetCount = useSimulationStore(state => state.targetCount);
  const setStats = useSimulationStore(state => state.setStats);
  const setPopupData = useSimulationStore(state => state.setSelectedTrack);
  
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const animationRef = useRef<number>();
  const lastStateUpdateTime = useRef<number>(0);
  const livePoolRef = useRef<RadarTrack[]>([]);
  const featureMap = useRef<Map<string, Feature<Point>>>(new Map<string, Feature<Point>>());

  // 1. Layer Initialization
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const pointsLayer = new VectorLayer({
      source: vectorSourceRef.current,
      style: (feature) => {
        const type = feature.get('classification') as string;
        // Gunakan warna standar CSS agar pasti muncul
        let color = '#22d3ee'; // Cyan
        if (type === 'FRIEND') color = '#22c55e'; // Green
        else if (type === 'HOSTILE') color = '#ef4444'; // Red

        return new Style({
          image: new RegularShape({
            fill: new Fill({ color }),
            stroke: new Stroke({ color: '#ffffff', width: 2 }),
            points: 4, 
            radius: 8,
            angle: Math.PI / 4,
          }),
        });
      },
      zIndex: 999, // Pastikan berada paling depan
    });
    map.addLayer(pointsLayer);

    return () => {
      if (map) map.removeLayer(pointsLayer);
    };
  }, [mapInstanceRef.current]);

  // 2. Data Connector (Real-time Link)
  useEffect(() => {
    if (isActive) {
      /**
       * Menerima pembaruan lintasan kapal/pesawat secara real-time dari Gateway.
       * @param data - Kumpulan data mentah radar dari web socket.
       */
      const dataHandler: RadarUpdateCallback = (data) => {
        livePoolRef.current = data;
      };
      radarApi.connect(targetCount, dataHandler);
    } else {
      radarApi.disconnect();
      livePoolRef.current = [];
      vectorSourceRef.current.clear();
      featureMap.current.clear();
    }
    return () => {
      radarApi.disconnect();
    };
  }, [isActive]);

  // 3. Listener Perubahan Parameter (Tanpa Restart Koneksi Utama)
  useEffect(() => {
    if (isActive) {
      radarApi.updateTargetCount(targetCount);
    }
  }, [targetCount, isActive]);

  /**
   * Fungsi animasi utama (Loop).
   * Melakukan sinkronisasi posisi fitur berdasarkan data koordinat terbaru.
   */
  useEffect(() => {
    if (!isActive) {
       setStats(0, 0);
       selectedTrackId.current = null;
       setPopupData(null);
       if (popupInstanceRef.current) popupInstanceRef.current.setPosition(undefined);
       return; 
    }

    // Always ensure Center Ship exists
    if (!featureMap.current.has('KAPAL KITA')) {
        const centerFeature = new Feature({ geometry: new Point(CENTER_COORD) });
        centerFeature.set('classification', 'CENTER');
        centerFeature.set('trackData', { 
             trackId: 'KAPAL KITA', classification: 'CENTER', lat: -5.5000, lon: 110.5000, speed: 15.4, heading: 0
        } as unknown as RadarTrack);
        vectorSourceRef.current.addFeature(centerFeature);
        featureMap.current.set('KAPAL KITA', centerFeature);
    }

    let lastTime = performance.now();

    /**
     * Loop rendering 60 FPS untuk sinkronisasi posisi fitur di OpenLayers.
     * @param time - Waktu resolusi tinggi dari requestAnimationFrame.
     */
    const animate = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      if (isActive) {
        const liveData = livePoolRef.current;
            
        // Sinkronisasi data biner ke Feature OpenLayers
        liveData.forEach(t => {
            let feature = featureMap.current.get(t.trackId);
            if (!feature) {
                feature = new Feature({ geometry: new Point(fromLonLat([t.lon, t.lat])) });
                feature.set('classification', t.classification);
                featureMap.current.set(t.trackId, feature);
                vectorSourceRef.current.addFeature(feature);
            }
            feature.set('trackData', t);
            feature.getGeometry()?.setCoordinates(fromLonLat([t.lon, t.lat]));
        });

        // Hapus feature yang sudah tidak ada di stream data (LOD/Cleanup)
        if (liveData.length < featureMap.current.size - 1) {
            featureMap.current.forEach((f, id) => {
                if (id !== 'KAPAL KITA' && !liveData.find(ld => ld.trackId === id)) {
                    vectorSourceRef.current.removeFeature(f);
                    featureMap.current.delete(id);
                }
            });
        }

        // Monitoring Stats
        if (time - lastStateUpdateTime.current > 250) {
            const currentFps = 1000 / dt;
            setStats(currentFps > 0 && currentFps < 200 ? currentFps : 60.1, liveData.length);
            
            if (selectedTrackId.current) {
                const updatedTrack = liveData.find(t => t.trackId === selectedTrackId.current);
                if (updatedTrack) setPopupData(updatedTrack);
            }
            lastStateUpdateTime.current = time;
        }
      }
      
      // Update Tooltip Position
      if (selectedTrackId.current && popupInstanceRef.current) {
          const target = livePoolRef.current.find(t => t.trackId === selectedTrackId.current);
          if (target) {
              popupInstanceRef.current.setPosition(fromLonLat([target.lon, target.lat]));
          }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  return vectorSourceRef;
}
