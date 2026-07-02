use std::{
    io::Read,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::Duration,
};

use tauri::{AppHandle, Emitter, State};

/// Active serial connection: a cloned writer handle plus a stop flag for the
/// reader thread. The reader emits `serial-line` events to the webview — the
/// exact same line-oriented contract the WebSerial transport uses.
struct SerialConn {
    writer: Box<dyn serialport::SerialPort>,
    stop: Arc<AtomicBool>,
}

#[derive(Default)]
struct SerialState(Mutex<Option<SerialConn>>);

#[tauri::command]
fn serial_list() -> Vec<String> {
    serialport::available_ports()
        .map(|ports| {
            ports
                .into_iter()
                .map(|p| p.port_name)
                .filter(|n| !n.contains("Bluetooth"))
                .collect()
        })
        .unwrap_or_default()
}

#[tauri::command]
fn serial_open(
    app: AppHandle,
    state: State<'_, SerialState>,
    path: String,
    baud: u32,
) -> Result<(), String> {
    close_current(&state);

    let port = serialport::new(&path, baud)
        .timeout(Duration::from_millis(200))
        .open()
        .map_err(|e| e.to_string())?;
    let writer = port.try_clone().map_err(|e| e.to_string())?;
    let stop = Arc::new(AtomicBool::new(false));

    {
        let stop = stop.clone();
        let mut reader = port;
        std::thread::spawn(move || {
            let mut acc = String::new();
            let mut buf = [0u8; 1024];
            loop {
                if stop.load(Ordering::Relaxed) {
                    break;
                }
                match reader.read(&mut buf) {
                    Ok(0) => {}
                    Ok(n) => {
                        acc.push_str(&String::from_utf8_lossy(&buf[..n]));
                        while let Some(idx) = acc.find('\n') {
                            let line: String = acc.drain(..=idx).collect();
                            let line = line.trim();
                            if !line.is_empty() {
                                let _ = app.emit("serial-line", line.to_string());
                            }
                        }
                        // Guard against a runaway stream with no newlines.
                        if acc.len() > 65_536 {
                            acc.clear();
                        }
                    }
                    Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {}
                    Err(e) => {
                        let _ = app.emit("serial-error", e.to_string());
                        break;
                    }
                }
            }
        });
    }

    *state.0.lock().unwrap() = Some(SerialConn { writer, stop });
    Ok(())
}

#[tauri::command]
fn serial_write(state: State<'_, SerialState>, line: String) -> Result<(), String> {
    use std::io::Write;
    let mut guard = state.0.lock().unwrap();
    match guard.as_mut() {
        Some(conn) => conn
            .writer
            .write_all(format!("{line}\n").as_bytes())
            .map_err(|e| e.to_string()),
        None => Err("serial port not open".into()),
    }
}

#[tauri::command]
fn serial_close(state: State<'_, SerialState>) {
    close_current(&state);
}

fn close_current(state: &State<'_, SerialState>) {
    if let Some(conn) = state.0.lock().unwrap().take() {
        conn.stop.store(true, Ordering::Relaxed);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(SerialState::default())
        .invoke_handler(tauri::generate_handler![
            serial_list,
            serial_open,
            serial_write,
            serial_close
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
