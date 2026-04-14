/**
 * Created Date       : 11-04-2026
 * Description        : BINARY Radar API (Smart Reconnect Version).
 *                      Memperbaiki bug "tabrakan" koneksi saat auto-reconnect.
 * 
 * QOS -list, penggunaan dan penerapannya = 2
 * waktu penerimaan data 1 - ... = 5
 * open dds > tcp = 1
 * caari dan implementasikan gateway yang sudah ada = 4
 * gateway lain = 3
 * dokumentasi = 6
 * 

 * 
 */
import { RadarTrack } from '../../types/radar';
import { radarLogger } from '../logger/radarLogger';

/**
 * @callback RadarUpdateCallback
 * @param {RadarTrack[]} data - Array of radar track objects.
 * @param {number} latency - Calculated latency in milliseconds.
 */
export type RadarUpdateCallback = (data: RadarTrack[], latency: number) => void;

/**
 * @class RadarSubscriber
 * @description Kelas untuk menangani langganan data radar biner dari Gateway via WebSocket.
 * Mendukung fitur auto-reconnect dan pengiriman perintah on-the-fly.
 */
class RadarSubscriber {
  /** @private {WebSocket | null} socket - Instance WebSocket aktif */
  private socket: WebSocket | null = null;
  /** @private {string} url - Alamat URL Gateway WebDDS */
  private url: string = '';
  /** @private {RadarUpdateCallback | null} onDataCallback - Callback saat data baru masuk */
  private onDataCallback: RadarUpdateCallback | null = null;
  /** @private {boolean} isReconnecting - Flag status percobaan koneksi ulang */
  private isReconnecting: boolean = false;
  /** @private {number} currentTargetCount - Jumlah target simulasi saat ini */
  private currentTargetCount: number = 100;

  /**
   * Menginisialisasi alamat URL Gateway dari Environment Variable.
   */
  constructor() {
    try {
      this.url = (import.meta as any).env.VITE_WEBDDS_URL || 'ws://localhost:8080/webdds';
    } catch (e) {
      this.url = 'ws://localhost:8080/webdds';
    }
  }

  /**
   * Membuat koneksi ke Gateway WebDDS.
   * 
   * @param {number} targetCount - Jumlah target simulasi awal.
   * @param {RadarUpdateCallback} callback - Fungsi yang dipanggil saat data radar diterima.
   */
  public connect(targetCount: number, callback: RadarUpdateCallback) {
    this.onDataCallback = callback;
    this.currentTargetCount = targetCount;

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

      /**
       * Handler pesan masuk jalur Binary Pipeline.
       * Membedah ArrayBuffer menjadi objek RadarTrack.
       */
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

  /**
   * Memutuskan hubungan soket secara manual dan mematikan rutinitas rekoneksi.
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Mengirim perubahan parameter jumlah target armada secara On-The-Fly.
   * Implementasi: CommandTopic (Upstream).
   * 
   * @param {number} count - Angka desimal jumlah target yang diharapkan dari Gateway.
   */
  public updateTargetCount(count: number): void {
    this.currentTargetCount = count;
    if (this.socket?.readyState === WebSocket.OPEN) {
      const cmd = JSON.stringify({ action: 'START', value: this.currentTargetCount });
      this.socket.send(cmd);
    }
  }
}

/** @const {RadarSubscriber} radarApi - Singleton instance untuk akses API Radar */
export const radarApi = new RadarSubscriber();
