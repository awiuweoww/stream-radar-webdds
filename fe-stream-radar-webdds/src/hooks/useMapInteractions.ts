/**
 * Created Date       : 11-04-2026
 * Description        : Hook Interaction Layer (Event Middleware).
 *                      Mengabstraksi logika 'Hit Detection' OpenLayers untuk deteksi fitur (kapal).
 *                      Mengelola state transien Tooltip/Popup, sinkronisasi posisi overlay terhadap
 *                      koordinat dinamis, serta manajemen state kursor untuk UX yang responsif.
 */
import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { RadarTrack } from '../types/radar';

import { useSimulationStore } from '../store/useSimulationStore';

export function useMapInteractions(
  mapInstanceRef: React.MutableRefObject<Map | null>, 
  overlayElement: React.RefObject<HTMLDivElement>
) {
  const popupData = useSimulationStore(state => state.selectedTrack);
  const setPopupData = useSimulationStore(state => state.setSelectedTrack);
  const selectedTrackId = useRef<string | null>(null);
  const popupInstanceRef = useRef<Overlay | null>(null);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !overlayElement.current) return;

    const popup = new Overlay({
      element: overlayElement.current,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -15],
    });
    map.addOverlay(popup);
    popupInstanceRef.current = popup;

    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature && feature.get('trackData')) {
        const data = feature.get('trackData') as RadarTrack;
        selectedTrackId.current = data.trackId;
        setPopupData(data);
        popup.setPosition(fromLonLat([data.lon, data.lat]));
      } else {
        selectedTrackId.current = null;
        setPopupData(null);
        popup.setPosition(undefined);
      }
    });

    return () => {
      map.removeOverlay(popup);
      popupInstanceRef.current = null;
    };
  }, [mapInstanceRef.current]);

  return {
    popupData,
    setPopupData,
    selectedTrackId,
    popupInstanceRef
  };
}
