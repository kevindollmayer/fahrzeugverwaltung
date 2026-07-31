import { app, BrowserWindow, ipcMain, dialog } from "electron";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import db from "./database.js";
import { fileURLToPath } from "url";
const dbDatei = path.join(app.getPath("userData"), "fahrzeugverwaltung.db");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bilderOrdner = path.join(app.getPath("userData"), "fahrzeugbilder");
const backupOrdner = path.join(app.getPath("userData"), "Backups");

if (!fs.existsSync(bilderOrdner)) {
  fs.mkdirSync(bilderOrdner, { recursive: true });
  if (!fs.existsSync(backupOrdner)) {
  fs.mkdirSync(backupOrdner, { recursive: true });
}
}
function automatischesBackup() {
  const jetzt = new Date();

  const zeitstempel =
    jetzt.getFullYear() +
    "-" +
    String(jetzt.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(jetzt.getDate()).padStart(2, "0") +
    "_" +
    String(jetzt.getHours()).padStart(2, "0") +
    "-" +
    String(jetzt.getMinutes()).padStart(2, "0") +
    "-" +
    String(jetzt.getSeconds()).padStart(2, "0");

  const ziel = path.join(
    backupOrdner,
    `fahrzeugverwaltung_${zeitstempel}.db`
  );

  try {
  if (fs.existsSync(dbDatei)) {
    fs.copyFileSync(dbDatei, ziel);
    console.log("Backup erstellt:", ziel);
  } else {
    console.log("Datenbank nicht gefunden:", dbDatei);
  }
} catch (err) {
  console.error("Backup-Fehler:", err);
}
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
console.log(app.getPath("userData"));
app.whenReady().then(() => {
  automatischesBackup();
  createWindow();
});
ipcMain.handle("fahrzeuge-laden", () => {
  return db.prepare("SELECT * FROM fahrzeuge").all();
});

ipcMain.handle("fahrzeug-speichern", (_, fahrzeug) => {
  db.prepare(`
    INSERT OR REPLACE INTO fahrzeuge
(id, kennzeichen, vin, marke, eingangsdatum, zugelassen, hu_au, bereifung, foto)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
  fahrzeug.id,
  fahrzeug.kennzeichen,
  fahrzeug.vin,
  fahrzeug.marke,
  fahrzeug.eingangsdatum,
  fahrzeug.zugelassen,
  fahrzeug.hu_au,
  fahrzeug.bereifung,
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
ipcMain.handle("backup-datenbank", async () => {
  const result = await dialog.showSaveDialog({
    title: "Datenbank sichern",
    defaultPath: `fahrzeugverwaltung_${new Date()
      .toISOString()
      .slice(0, 10)}.db`,
    filters: [
      {
        name: "SQLite-Datenbank",
        extensions: ["db"],
      },
    ],
  });

  if (result.canceled) {
    return { success: false };
  }

  fs.copyFileSync(dbDatei, result.filePath);

  return {
    success: true,
    message: "Backup erfolgreich erstellt.",
  };
});

ipcMain.handle("wiederherstellen-datenbank", async () => {
  const result = await dialog.showOpenDialog({
    title: "Datenbank wiederherstellen",
    properties: ["openFile"],
    filters: [
      {
        name: "SQLite-Datenbank",
        extensions: ["db"],
      },
    ],
  });

  if (result.canceled) {
    return { success: false };
  }

  fs.copyFileSync(result.filePaths[0], dbDatei);

  return {
    success: true,
    message: "Datenbank wurde wiederhergestellt. Bitte die App neu starten.",
  };
});