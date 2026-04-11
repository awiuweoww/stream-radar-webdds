/**
 * Created Date       : 11-04-2026
 * Description        : BINARY Radar API (Smart Reconnect Version).
 *                      Memperbaiki bug "tabrakan" koneksi saat auto-reconnect.
 */
import { RadarTrack } from '../../types/radar';
import { radarLogger } from '../logger/radarLogger';

export type RadarUpdateCallback = (data: RadarTrack[], latency: number) => void;

class RadarSubscriber {
  private socket: WebSocket | null = null;
  private url: string = '';
  private onDataCallback: RadarUpdateCallback | null = null;
  private isReconnecting: boolean = false;
  private currentTargetCount: number = 100;

  constructor() {
    try {
      this.url = (process.env.VITE_WEBDDS_URL) || 'ws://localhost:8080/webdds';
    } catch (e) {
      this.url = 'ws://localhost:8080/webdds';
    }
  }

  public connect(targetCount: number, callback: RadarUpdateCallback) {
    this.onDataCallback = callback;
    this.currentTargetCount = targetCount;

    // JANGAN nyambung lagi jika statusnya masih CONNECTING (Mencegah Tabrakan)
    if (this.socket?.readyState === WebSocket.CONNECTING) return;
    if (this.socket?.readyState === WebSocket.OPEN) return;

    try {
      this.socket = new WebSocket(this.url);
      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = () => {
        this.isReconnecting = false;
        radarLogger.logConnection('CONNECTED', this.url);
        const cmd = JSON.stringify({ action: 'START', value: this.currentTargetCount });
        this.socket?.send(cmd);
      };

      this.socket.onmessage = (event) => {
        if (!(event.data instanceof ArrayBuffer)) return;

        const tracks: RadarTrack[] = [];
        const view = new DataView(event.data);
        const bytesPerTrack = 41; 
        const count = Math.floor(event.data.byteLength / bytesPerTrack);

        for (let i = 0; i < count; i++) {
          const offset = i * bytesPerTrack;
          try {
            tracks.push({
              trackId: `TRK-${view.getInt32(offset, true)}`,
              lat: view.getFloat64(offset + 4, true),
              lon: view.getFloat64(offset + 12, true),
              altitude: view.getFloat32(offset + 20, true),
              speed: view.getFloat32(offset + 24, true),
              heading: view.getFloat32(offset + 28, true),
              timestamp: Number(view.getBigInt64(offset + 32, true)),
              classification: view.getUint8(offset + 40) === 1 ? 'HOSTILE' : 'FRIEND'
            });
          } catch(e) {}
        }

        const latency = radarLogger.logIncomingPackets(event.data, tracks);
        if (this.onDataCallback) this.onDataCallback(tracks, latency);
      };

      this.socket.onclose = () => {
        if (!this.isReconnecting) {
          this.isReconnecting = true;
          radarLogger.logConnection('DISCONNECTED', this.url);
          // Coba menyambung kembali setiap 3 detik dengan aman
          setTimeout(() => {
            this.isReconnecting = false;
            this.connect(this.currentTargetCount, callback);
          }, 3000);
        }
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch (err) { 
        console.error('Connection Failed', err); 
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.onclose = null; // Matikan auto-reconnect saat manual disconnect
      this.socket.close();
      this.socket = null;
    }
  }
}

export const radarApi = new RadarSubscriber();
