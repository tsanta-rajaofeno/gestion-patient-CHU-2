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

  // 1. Vérification anti-doublons
  const checkDupQuery = `SELECT * FROM patients WHERE LOWER(nom) = LOWER(?) AND LOWER(prenom) = LOWER(?) AND phone = ?`;
  db.get(checkDupQuery, [nom, prenom, phone], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      return res.status(400).json({ error: "Ce patient est déjà enregistré dans le système !" });
    }

    // 2. Détermination de la capacité maximale
    let maxCapacity = 20; // Cabinets
    if (bloc.startsWith("A")) {
      maxCapacity = 6; // Salles publiques (max 6 patients)
    } else if (bloc.startsWith("B")) {
      maxCapacity = 1; // Chambres privées (1 patient)
    }

    // 3. Vérification de la capacité actuelle du bloc
    const checkCapQuery = `SELECT COUNT(*) as count FROM patients WHERE bloc = ?`;
    db.get(checkCapQuery, [bloc], (err, capRow) => {
      if (err) return res.status(500).json({ error: err.message });

      if (capRow.count >= maxCapacity) {
        let errorMsg = `Le bloc ${bloc} a atteint sa capacité maximale !`;
        if (bloc.startsWith("A")) {
          errorMsg = `La salle publique ${bloc} est complète (Maximum 6 patients).`;
        } else if (bloc.startsWith("B")) {
          errorMsg = `La chambre privée ${bloc} est déjà occupée par un patient.`;
        }
        return res.status(400).json({ error: errorMsg });
      }

      // 4. Insertion
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
  });
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
  const patientId = req.params.id;

  // 1. Vérification anti-doublons (en excluant le patient actuel)
  const checkDupQuery = `SELECT * FROM patients WHERE LOWER(nom) = LOWER(?) AND LOWER(prenom) = LOWER(?) AND phone = ? AND id != ?`;
  db.get(checkDupQuery, [nom, prenom, phone, patientId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      return res.status(400).json({ error: "Un autre patient possède déjà ces informations !" });
    }

    // 2. Capacité max
    let maxCapacity = 20;
    if (bloc.startsWith("A")) {
      maxCapacity = 6;
    } else if (bloc.startsWith("B")) {
      maxCapacity = 1;
    }

    // 3. Vérification capacité (en excluant le patient en cours de modif)
    const checkCapQuery = `SELECT COUNT(*) as count FROM patients WHERE bloc = ? AND id != ?`;
    db.get(checkCapQuery, [bloc, patientId], (err, capRow) => {
      if (err) return res.status(500).json({ error: err.message });

      if (capRow.count >= maxCapacity) {
        let errorMsg = `Le bloc ${bloc} a atteint sa capacité maximale !`;
        if (bloc.startsWith("A")) {
          errorMsg = `La salle publique ${bloc} est complète (Maximum 6 patients).`;
        } else if (bloc.startsWith("B")) {
          errorMsg = `La chambre privée ${bloc} est déjà occupée par un patient.`;
        }
        return res.status(400).json({ error: errorMsg });
      }

      // 4. Mise à jour
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
          patientId,
        ],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "Patient mis à jour avec succès !" });
        },
      );
    });
  });
});

app.delete("/api/patients/:id", (req, res) => {
  db.run(`DELETE FROM patients WHERE id = ?`, req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Patient supprimé avec succès !" });
  });
});

// ROUTE DE FILTRAGE AVANCÉ (Âge / Séjour, Supérieur / Inférieur)
app.get("/api/patients/filtrer-avance", (req, res) => {
    let { critere, operateur, valeur } = req.query;

    if (!critere || !operateur || !valeur) {
        return res.status(400).json({ error: "Paramètres de filtrage incomplets." });
    }

    let col = critere === "sejours" ? "sejours" : "age";
    let comp = operateur === "superieur" ? ">" : "<";

    let query = `SELECT * FROM patients WHERE ${col} ${comp} ?`;
    
    db.all(query, [valeur], (err, rows) => {
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