/**
 * Created Date       : 11-04-2026
 * Description        : Utilitas Logging & Monitoring Performa Radar.
 *                      Digunakan untuk membandingkan metrik antara WebDDS dan gRPC ke depannya.
 */

import { RadarTrack } from '../../types/radar';

class RadarLogger {
  private stats = {
    packetCount: 0,
    totalBytes: 0,
    lastLogTime: performance.now(),
  };

  /**
   * Mencatat data paket yang masuk dan menghitung statistik performa.
   * 
   * @param data - Data mentah yang diterima dari WebSocket (untuk hitung size)
   * @param tracks - Data yang sudah diparsing menjadi array RadarTrack
   * @returns Rata-rata latency dari paket tersebut (ms)
   */
  public logIncomingPackets(data: unknown, tracks: RadarTrack[]): number {
    const arrivalTime = Date.now();
    this.stats.packetCount++;
    
    const byteSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
    this.stats.totalBytes += byteSize;

    let avgLatency = 0;
    if (tracks.length > 0 && tracks[0].timestamp) {
      const sumLatency = tracks.reduce((acc, t) => acc + (arrivalTime - t.timestamp), 0);
      avgLatency = sumLatency / tracks.length;
    }

    if (this.stats.packetCount % 5 === 0) { 
        console.debug(`[Radar Stream] Incoming: ${tracks.length} objects`);
    }

    const now = performance.now();
    if (now - this.stats.lastLogTime > 5000) {
      this.printPerformanceSummary(avgLatency, now, tracks.length);
      this.resetStats(now);
    }
    
    return avgLatency;
  }

  /**
   * Mencatat eror dengan format visual yang menonjol.
   * @param context - Lokasi atau Fungsi tempat terjadi eror
   * @param error - Detail eror yang ditangkap
   */
  public logError(context: string, error: unknown): void {
    console.error(`%c[Radar Error] @ ${context}:`, 'color: #ef4444; font-weight: bold', error);
  }

  /**
   * Mencatat lifecycle koneksi radar.
   * @param status - Status saat ini (CONNECTED, etc)
   * @param url - URL endpoint yang dituju
   */
  public logConnection(status: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING', url: string): void {
    const color = status === 'CONNECTED' ? '#22c55e' : '#eab308';
    console.log(`%c[Radar Connection] ${status}: ${url}`, `color: ${color}; font-weight: bold`);
  }

  /**
   * Mencetak ringkasan statistik ke konsol.
   * @param avgLatency - Rata-rata latency dari paket yang diterima\
   * @param now - Timestamp saat ini untuk hitung durasi
   * @param lastTrackCount - Jumlah lintasan kapal pada paket terakhir
   */
  private printPerformanceSummary(avgLatency: number, now: number, lastTrackCount: number): void {
    const durationSec = (now - this.stats.lastLogTime) / 1000;
    const throughputKB = (this.stats.totalBytes / 1024) / durationSec;
    
    console.groupCollapsed(`%c📊 Radar Performance Report (${new Date().toLocaleTimeString()})`, 'color: #3b82f6; font-weight: bold');
    console.log(`Packets Received : ${this.stats.packetCount}`);
    console.log(`Avg Latency     : ${avgLatency.toFixed(2)}ms`);
    console.log(`Throughput      : ${throughputKB.toFixed(2)} KB/s`);
    console.log(`Data Density    : ${(this.stats.totalBytes / 1024).toFixed(2)} KB total`);
    console.log(`Total Objects   : ${lastTrackCount}`);
    console.groupEnd();
  }


  /**
   * Resets the performance statistics.
   * This function should be called when printing the performance summary.
   * @param now - The current timestamp.
   */
  private resetStats(now: number): void {
    this.stats.packetCount = 0;
    this.stats.totalBytes = 0;
    this.stats.lastLogTime = now;
  }
}

export const radarLogger = new RadarLogger();
