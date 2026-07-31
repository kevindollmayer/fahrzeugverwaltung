const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  ladeFahrzeuge: () => ipcRenderer.invoke("fahrzeuge-laden"),

  speichereFahrzeug: (fahrzeug) =>
    ipcRenderer.invoke("fahrzeug-speichern", fahrzeug),

  fotoAuswaehlen: () =>
    ipcRenderer.invoke("foto-auswaehlen"),

  backupDatenbank: () =>
    ipcRenderer.invoke("backup-datenbank"),

  wiederherstellenDatenbank: () =>
    ipcRenderer.invoke("wiederherstellen-datenbank"),
});