const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

let mainWindow = null;
let serialPort = null;
let logStream = null;

// HARD main-process crash visibility
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

function createWindow() {
  console.log("[main] createWindow()");

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // show after load
    backgroundColor: "#0b1020",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    console.log("[main] ready-to-show");
    mainWindow.show();
    mainWindow.webContents.openDevTools({ mode: "detach" });
  });

  mainWindow.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.error("[did-fail-load]", { code, desc, url });
  });

  const DEV_URL = "http://localhost:5173";
console.log("Loading:", DEV_URL);
mainWindow.loadURL(DEV_URL);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log("[main] app ready");
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/** ---------------- Serial IPC ---------------- */
ipcMain.handle("serial:list", async () => {
  const ports = await SerialPort.list();
  return ports
    .map((p) => {
      const pth = p.path || "";
      const cuPath = pth.startsWith("/dev/tty.") ? pth.replace("/dev/tty.", "/dev/cu.") : pth;
      return { path: cuPath, raw: pth };
    })
    .filter((p) => p.path.includes("usb") || p.path.includes("Bluetooth") === false);
});

ipcMain.handle("serial:connect", async (_event, { path: pth, baudRate }) => {
  if (serialPort && serialPort.isOpen) serialPort.close();

  serialPort = new SerialPort({ path: pth, baudRate, autoOpen: true });

  const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));
  parser.on("data", (line) => {
    const clean = String(line).trim();
    if (!clean) return;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("telemetryLine", clean);
    }
    if (logStream) logStream.write(clean + "\n");
  });

  serialPort.on("error", (e) => console.error("[serial error]", e));

  return { ok: true };
});

ipcMain.handle("serial:disconnect", async () => {
  if (serialPort && serialPort.isOpen) serialPort.close();
  serialPort = null;
  return { ok: true };
});

/** ---------------- Logging IPC ---------------- */
ipcMain.handle("logStart", async () => {
  const logsDir = path.join(app.getPath("userData"), "logs");
  fs.mkdirSync(logsDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `telemetry-${stamp}.ndjson`;
  const fullpath = path.join(logsDir, filename);

  logStream = fs.createWriteStream(fullpath, { flags: "a" });
  return { ok: true, path: fullpath };
});

ipcMain.handle("logStop", async () => {
  if (logStream) {
    logStream.end();
    logStream = null;
  }
  return { ok: true };
});