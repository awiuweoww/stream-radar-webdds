

import { create } from 'zustand';
import { RadarTrack } from '../types/radar';

interface SimulationState {
  isActive: boolean;
  fps: number;
  totalObjects: number;
  targetCount: number;
  selectedTrack: RadarTrack | null;
  setTargetCount: (count: number) => void;
  startSimulation: () => void;
  endSimulation: () => void;
  setStats: (fps: number, totalObjects: number) => void;
  setSelectedTrack: (track: RadarTrack | null) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  isActive: false,
  fps: 60.1,
  totalObjects: 0,
  targetCount: 3000,
  selectedTrack: null,
  setTargetCount: (count) => set({ targetCount: count }),
  startSimulation: () => set({ isActive: true }),
  endSimulation: () => set({ isActive: false }),
  setStats: (fps, totalObjects) => set({ fps, totalObjects }),
  setSelectedTrack: (track) => set({ selectedTrack: track }),
}));
