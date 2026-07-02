import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { Connection, ConnectOptions, ConnectionStatus } from "./types";

/** True when running inside the Tauri desktop shell. */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function listNativePorts(): Promise<string[]> {
  return invoke<string[]>("serial_list");
}

/**
 * Native serial transport for the desktop app. The Rust side owns the port
 * (serialport crate), splits the byte stream into lines, and emits them as
 * `serial-line` events — the same line contract as WebSerialConnection, so
 * everything above the transport layer is untouched.
 */
export class TauriSerialConnection implements Connection {
  status: ConnectionStatus = "disconnected";

  private lineListeners = new Set<(line: string) => void>();
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private unlisteners: UnlistenFn[] = [];

  onLine(cb: (line: string) => void): () => void {
    this.lineListeners.add(cb);
    return () => this.lineListeners.delete(cb);
  }

  onStatusChange(cb: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach((cb) => cb(status));
  }

  async connect(opts: ConnectOptions): Promise<void> {
    if (!opts.path) throw new Error("Select a serial port first (use Refresh to scan).");
    this.setStatus("connecting");
    try {
      this.unlisteners.push(
        await listen<string>("serial-line", (e) => this.lineListeners.forEach((cb) => cb(e.payload)))
      );
      this.unlisteners.push(
        await listen<string>("serial-error", () => {
          void this.disconnect();
        })
      );
      await invoke("serial_open", { path: opts.path, baud: opts.baudRate });
      this.setStatus("connected");
    } catch (err) {
      await this.cleanup();
      this.setStatus("disconnected");
      throw err;
    }
  }

  async write(line: string): Promise<void> {
    await invoke("serial_write", { line });
  }

  private async cleanup() {
    for (const u of this.unlisteners) {
      try { u(); } catch { /* ok */ }
    }
    this.unlisteners = [];
  }

  async disconnect(): Promise<void> {
    try { await invoke("serial_close"); } catch { /* ok */ }
    await this.cleanup();
    this.setStatus("disconnected");
  }
}
