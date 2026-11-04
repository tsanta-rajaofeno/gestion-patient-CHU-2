const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("."));

const db = new sqlite3.Database("Hopital.db", (err) => {
  if (err) console.error("Erreur de connexion", err.message);
  else console.log("Connecté à la base SQLite avec succès !");
});

db.run(`CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bloc TEXT,
    nom TEXT,
    prenom TEXT,
    age INTEGER,
    addresse TEXT,
    maladie TEXT,
    phone TEXT,
    date_entree TEXT,
    sejours INTEGER,
    sex TEXT
)`);

app.get("/api/patients", (req, res) => {
  db.all("SELECT * FROM patients", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/patients", (req, res) => {
  const {
    bloc,
    nom,
    prenom,
    age,
    addresse,
    maladie,
    phone,
    date_entree,
    sejours,
    sex,
  } = req.body;
  const query = `INSERT INTO patients (bloc, nom, prenom, age, addresse, maladie, phone, date_entree, sejours, sex) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(
    query,
    [
      bloc,
      nom,
      prenom,
      age,
      addresse,
      maladie,
      phone,
      date_entree,
      sejours,
      sex,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: "Patient ajouté avec succès !" });
    },
  );
});

app.put("/api/patients/:id", (req, res) => {
  const {
    bloc,
    nom,
    prenom,
    age,
    addresse,
    maladie,
    phone,
    date_entree,
    sejours,
    sex,
  } = req.body;
  const query = `UPDATE patients SET bloc = ?, nom = ?, prenom = ?, age = ?, addresse = ?, maladie = ?, phone = ?, date_entree = ?, sejours = ?, sex = ? WHERE id = ?`;
  db.run(
    query,
    [
      bloc,
      nom,
      prenom,
      age,
      addresse,
      maladie,
      phone,
      date_entree,
      sejours,
      sex,
      req.params.id,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Patient mis à jour avec succès !" });
    },
  );
});

app.delete("/api/patients/:id", (req, res) => {
  db.run(`DELETE FROM patients WHERE id = ?`, req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Patient supprimé avec succès !" });
  });
});

// Filtre : Patients de plus de 25 ans
app.get("/api/patients/filtre/plus-25", (req, res) => {
  const query = `SELECT * FROM patients WHERE age > 25;`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Filtre : Patients de moins de 25 ans
app.get("/api/patients/filtre/moins-25", (req, res) => {
  const query = `SELECT * FROM patients WHERE age < 25;`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Filtre : Séjours de moins de 5 jours
app.get("/api/patients/filtre/sejours-moins-5", (req, res) => {
  const query = `SELECT * FROM patients WHERE sejours < 5;`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/patients/stats", (req, res) => {
  const query = `SELECT AVG(age) AS moyenne_age, MAX(age) AS age_max, MIN(age) AS age_min, COUNT(*) AS total_patients FROM patients;`;
  db.get(query, [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
