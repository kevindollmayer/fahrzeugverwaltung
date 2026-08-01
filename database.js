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
    zugelassen TEXT,
    hu_au TEXT,
    bereifung TEXT,
schluessel INTEGER DEFAULT 0,
notizen TEXT
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
try {
  db.exec(`
    ALTER TABLE fahrzeuge
    ADD COLUMN zugelassen TEXT;
  `);
} catch {
  // Spalte existiert bereits
}

try {
  db.exec(`
    ALTER TABLE fahrzeuge
    ADD COLUMN hu_au TEXT;
  `);
} catch {
  // Spalte existiert bereits
}

try {
  db.exec(`
    ALTER TABLE fahrzeuge
    ADD COLUMN bereifung TEXT;
  `);
} catch {
  // Spalte existiert bereits
}
try {
  db.exec(`
    ALTER TABLE fahrzeuge
    ADD COLUMN schluessel INTEGER DEFAULT 0;
  `);
} catch {
  // Spalte existiert bereits
}

try {
  db.exec(`
    ALTER TABLE fahrzeuge
    ADD COLUMN notizen TEXT;
  `);
} catch {
  // Spalte existiert bereits
}
export default db;