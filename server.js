const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());
app.use(express.static('.'));

const db = new sqlite3.Database('./hopital.db', (err) => {
    if (err) console.error("Erreur de connexion", err.message);
    else console.log("Connecté à la base SQLite (hopital.db) avec succès ! 🚀");
});

db.run(`CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT,
    prenom TEXT,
    age INTEGER,
    maladie TEXT,
    addresse TEXT,
    phone TEXT,
    sex TEXT
)`);

app.get('/api/patients', (req, res) => {
    db.all("SELECT * FROM patients", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/patients', (req, res) => {
    const { nom, prenom, age, maladie, addresse, phone, sex } = req.body;
    const query = `INSERT INTO patients (nom, prenom, age, maladie, addresse, phone, sex) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [nom, prenom, age, maladie, addresse, phone, sex], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Patient ajouté avec succès !" });
    });
});

app.put('/api/patients/:id', (req, res) => {
    const { nom, prenom, age, maladie, addresse, phone, sex } = req.body;
    const query = `UPDATE patients
        SET nom = ?, prenom = ?, age = ?, maladie = ?, addresse = ?, phone = ?, sex = ?
        WHERE id = ?`;
    db.run(query, [nom, prenom, age, maladie, addresse, phone, sex, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Patient introuvable." });
        res.json({ message: "Patient modifié avec succès !" });
    });
});

app.delete('/api/patients/:id', (req, res) => {
    db.run(`DELETE FROM patients WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Patient supprimé !" });
    });
});

app.get('/api/patients/filtre', (req, res) => {
    const query = `SELECT * FROM patients WHERE age > 25 AND addresse = 'Antananarivo' AND phone LIKE '034%';`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/patients/stats', (req, res) => {
    const query = `SELECT AVG(age) AS moyenne_age, MIN(age) AS age_min, COUNT(*) AS total_patients FROM patients;`;
    db.get(query, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

app.listen(3000, () => {
    console.log("Serveur démarré sur http://localhost:3000");
});