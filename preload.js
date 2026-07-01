const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vx", {
  serialList: () => ipcRenderer.invoke("serial:list"),
  serialConnect: (opts) => ipcRenderer.invoke("serial:connect", opts),
  serialDisconnect: () => ipcRenderer.invoke("serial:disconnect"),


  onTelemetryLine: (cb) => {
  const handler = (_event, line) => cb(line);
  ipcRenderer.on("telemetryLine", handler);
  return () => ipcRenderer.removeListener("telemetryLine", handler);
},
});