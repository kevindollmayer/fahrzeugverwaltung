import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";

const dbPath = path.join(app.getPath("userData"), "fahrzeugverwaltung.db");

const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS fahrzeuge (
    id INTEGER PRIMARY KEY,
    kennzeichen TEXT,
    vin TEXT,
    marke TEXT,
    eingangsdatum TEXT,
    zulassung TEXT
);
`);
try {
  db.exec(`
    ALTER TABLE fahrzeuge
    ADD COLUMN foto TEXT;
  `);
} catch {
  // Spalte existiert bereits
}

export default db;