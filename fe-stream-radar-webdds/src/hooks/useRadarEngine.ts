/**
 * Created Date       : 11-04-2026
 * Description        : Master Orchestrator Hook (Facade Design Pattern).
 *                      Berfungsi sebagai gerbang tunggal (Gateway) yang menyatukan sub-hook infrastruktur, 
 *                      simulasi, dan interaksi. Pola ini memastikan pemisahan tanggung jawab (Separation of Concerns) 
 *                      tetap terjaga sementara memberikan API yang sederhana bagi komponen UI RadarMap.
 *
 * Arsitektur:
 *   useRadarEngine (Facade) --+-- useMapInstance (Infrastructure Layer: Map & Layers)
 *                             |
 *                             +-- useMapInteractions (Interaction Layer: Click & Popups)
 *                             |
 *                             +-- useRadarSimulation (Business/Engine Layer: Animation & Math)
 *
 * Changelog:
 *   - 0.2.0 (11-04-2026): Refaktor modularitas total menggunakan pola sub-system hooks.
 */
import { useMapInstance } from './useMapInstance';
import { useMapInteractions } from './useMapInteractions';
import { useRadarSimulation } from './useRadarSimulation';

export function useRadarEngine() {
  // 1. Inisialisasi Instance Map & Controls
  const mapControl = useMapInstance();

  // 2. Inisialisasi Interaksi (Click/Hover/Tooltip)
  const mapInteraction = useMapInteractions(
    mapControl.mapInstanceRef, 
    mapControl.overlayElement
  );

  // 3. Inisialisasi Simulasi Pergerakan Objek
  useRadarSimulation(
    mapControl.mapInstanceRef,
    mapInteraction.selectedTrackId,
    mapInteraction.popupInstanceRef
  );

  return {
    ...mapControl,
    popupData: mapInteraction.popupData,
  };
}
