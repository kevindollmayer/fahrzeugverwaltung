import { app, BrowserWindow, ipcMain, dialog } from "electron";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import db from "./database.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bilderOrdner = path.join(app.getPath("userData"), "fahrzeugbilder");

if (!fs.existsSync(bilderOrdner)) {
  fs.mkdirSync(bilderOrdner, { recursive: true });
}
function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

 if (app.isPackaged) {
  win.loadFile(path.join(__dirname, "dist", "index.html"));
} else {
  win.loadURL("http://localhost:5173");
} 
}

app.whenReady().then(createWindow);
ipcMain.handle("fahrzeuge-laden", () => {
  return db.prepare("SELECT * FROM fahrzeuge").all();
});

ipcMain.handle("fahrzeug-speichern", (_, fahrzeug) => {
  db.prepare(`
    INSERT OR REPLACE INTO fahrzeuge
(id, kennzeichen, vin, marke, eingangsdatum, zulassung, foto)
VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    fahrzeug.id,
    fahrzeug.kennzeichen,
    fahrzeug.vin,
    fahrzeug.marke,
    fahrzeug.eingangsdatum,
    fahrzeug.zulassung,
    fahrzeug.foto
  );

  return true;
});
ipcMain.handle("foto-auswaehlen", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "Bilder",
        extensions: ["jpg", "jpeg", "png", "webp"],
      },
    ],
  });

  if (result.canceled) {
    return null;
  }

  const originalPfad = result.filePaths[0];
  const endung = path.extname(originalPfad);

  const neuerDateiname = `${randomUUID()}${endung}`;
  const neuerPfad = path.join(bilderOrdner, neuerDateiname);

  fs.copyFileSync(originalPfad, neuerPfad);

  return neuerPfad;
});