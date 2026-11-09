let selectedRow = null;

// Charger tous les patients au démarrage ou lors du clic sur "Afficher tout"
function chargerPatients() {
  fetch("/api/patients")
    .then((res) => res.json())
    .then((data) => {
      let table = document.getElementById("patient_liste").getElementsByTagName("tbody")[0];
      table.innerHTML = ""; // Vider le tableau avant de recharger
      data.forEach((p) => insertNewRecordFromDB(p));
    })
    .catch((err) => console.error("Erreur chargement patients:", err));
}

// Charger les statistiques (Moyenne / Total)
function chargerStats() {
  fetch("/api/patients/stats")
    .then((res) => res.json())
    .then((data) => {
      alert(
        `STATISTIQUES DU CHU ANDRAINJATO :\n\n` +
        `- Total des patients : ${data.total_patients}\n` +
        `- Âge moyen : ${Math.round(data.moyenne_age || 0)} ans\n` +
        `- Patient le plus âgé : ${data.age_max || 0} ans\n` +
        `- Patient le plus jeune : ${data.age_min || 0} ans`
      );
    })
    .catch((err) => console.error("Erreur stats:", err));
}

// FILTRAGE DYNAMIQUE (Âge / Séjour avec opérateur supérieur / inférieur)
function appliquerFiltreDynamique() {
  let critere = document.getElementById("critereFiltre").value;
  let operateur = document.getElementById("operateurFiltre").value;
  let valeur = document.getElementById("valeurFiltre").value;

  if (valeur === "") {
    alert("Veuillez saisir une valeur pour effectuer le filtre !");
    return;
  }

  let url = `/api/patients/filtrer-avance?critere=${critere}&operateur=${operateur}&valeur=${valeur}`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      let table = document.getElementById("patient_liste").getElementsByTagName("tbody")[0];
      table.innerHTML = "";
      if (data.length === 0) {
        alert("Aucun patient ne correspond à ce critère.");
        chargerPatients();
        return;
      }
      data.forEach((p) => insertNewRecordFromDB(p));
    })
    .catch((err) => console.error("Erreur filtre dynamique:", err));
}

// Soumission du formulaire (Ajout ou Modification)
function onFormsubmit() {
  if (validate()) {
    let formData = readFormData();
    
    if (selectedRow === null) {
      // INSERTION (POST)
      fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement");
          return data;
        })
        .then((data) => {
          insertNewRecordFromDB({ id: data.id, ...formData });
          resetForm();
          alert(data.message);
        })
        .catch((err) => alert("Erreur : " + err.message));
    } else {
      // MODIFICATION (PUT)
      let id = selectedRow.dataset.id;
      fetch(`/api/patients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Erreur lors de la modification");
          return data;
        })
        .then((data) => {
          updateRecord(formData);
          resetForm();
          alert(data.message);
        })
        .catch((err) => alert("Erreur : " + err.message));
    }
  }
}

// Lire les données du formulaire
function readFormData() {
  let formData = {};
  formData["bloc"] = document.getElementById("bloc").value;
  formData["nom"] = document.getElementById("nom").value;
  formData["prenom"] = document.getElementById("prenom").value;
  formData["age"] = document.getElementById("age").value;
  formData["addresse"] = document.getElementById("addresse").value;
  formData["maladie"] = document.getElementById("maladie").value;
  formData["phone"] = document.getElementById("phone").value;
  formData["date_entree"] = document.getElementById("date_entree").value;
  formData["sejours"] = document.getElementById("sejours").value;
  formData["sex"] = document.getElementById("sex").value;
  return formData;
}

// Insérer un enregistrement venant de la BDD dans le tableau HTML (avec clic direct sur la ligne)
function insertNewRecordFromDB(data) {
  let table = document.getElementById("patient_liste").getElementsByTagName("tbody")[0];
  let newRow = table.insertRow(table.length);
  newRow.dataset.id = data.id;

  // CLIC DIRECT SUR LA LIGNE : Sélectionne et pré-remplit le formulaire (sauf si on clique sur un bouton)
  newRow.onclick = function (e) {
    if (e.target.tagName === 'BUTTON') return;
    selectRow(this);
    remplirFormulaireDepuisLigne(this);
  };

  newRow.insertCell(0).innerHTML = data.bloc;
  newRow.insertCell(1).innerHTML = data.nom;
  newRow.insertCell(2).innerHTML = data.prenom;
  newRow.insertCell(3).innerHTML = data.age;
  newRow.insertCell(4).innerHTML = data.addresse;
  newRow.insertCell(5).innerHTML = data.maladie;
  newRow.insertCell(6).innerHTML = data.phone;
  newRow.insertCell(7).innerHTML = data.date_entree;
  newRow.insertCell(8).innerHTML = data.sejours;
  newRow.insertCell(9).innerHTML = data.sex;
  
  let cellAction = newRow.insertCell(10);
  cellAction.innerHTML = `<button class="btn-edit" onclick="onEdit(this)">Modifier</button> 
                          <button class="btn-delete" onclick="onDelete(this)">Supprimer</button>`;
}

// Fonction dédiée pour injecter les cellules de la ligne cliquée dans le formulaire
function remplirFormulaireDepuisLigne(row) {
  selectedRow = row;
  document.getElementById("bloc").value = row.cells[0].innerHTML;
  document.getElementById("nom").value = row.cells[1].innerHTML;
  document.getElementById("prenom").value = row.cells[2].innerHTML;
  document.getElementById("age").value = row.cells[3].innerHTML;
  document.getElementById("addresse").value = row.cells[4].innerHTML;
  document.getElementById("maladie").value = row.cells[5].innerHTML;
  document.getElementById("phone").value = row.cells[6].innerHTML;
  document.getElementById("date_entree").value = row.cells[7].innerHTML;
  document.getElementById("sejours").value = row.cells[8].innerHTML;
  document.getElementById("sex").value = row.cells[9].innerHTML;
}

// Sélection visuelle d'une ligne
function selectRow(row) {
  let rows = document.getElementById("patient_liste").getElementsByTagName("tr");
  for (let i = 0; i < rows.length; i++) {
    rows[i].classList.remove("selected-row");
  }
  row.classList.add("selected-row");
  selectedRow = row;
}

// Pré-remplir le formulaire via le bouton "Modifier"
function onEdit(td) {
  let row = td.parentElement.parentElement;
  remplirFormulaireDepuisLigne(row);
}

// Mettre à jour la ligne dans le tableau HTML après modification
function updateRecord(formData) {
  selectedRow.cells[0].innerHTML = formData.bloc;
  selectedRow.cells[1].innerHTML = formData.nom;
  selectedRow.cells[2].innerHTML = formData.prenom;
  selectedRow.cells[3].innerHTML = formData.age;
  selectedRow.cells[4].innerHTML = formData.addresse;
  selectedRow.cells[5].innerHTML = formData.maladie;
  selectedRow.cells[6].innerHTML = formData.phone;
  selectedRow.cells[7].innerHTML = formData.date_entree;
  selectedRow.cells[8].innerHTML = formData.sejours;
  selectedRow.cells[9].innerHTML = formData.sex;
}

// Supprimer un patient
function onDelete(td) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce patient ?")) {
    let row = td.parentElement.parentElement;
    let id = row.dataset.id;

    fetch(`/api/patients/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("patient_liste").deleteRow(row.rowIndex);
        resetForm();
        alert(data.message);
      })
      .catch((err) => console.error("Erreur suppression:", err));
  }
}

// Réinitialiser le formulaire
function resetForm() {
  document.getElementById("patientForm").reset();
  selectedRow = null;
}

// Validation basique des champs
function validate() {
  let isValid = true;
  if (document.getElementById("nom").value === "") {
    isValid = false;
    alert("Le nom est obligatoire !");
  }
  return isValid;
}

// Recherche instantanée dans le tableau
function searchTable() {
  let input = document.getElementById("searchInput");
  let filter = input.value.toLowerCase();
  let table = document.getElementById("patient_liste");
  let tr = table.getElementsByTagName("tr");

  for (let i = 1; i < tr.length; i++) {
    let td = tr[i].getElementsByTagName("td");
    let match = false;
    for (let j = 0; j < td.length - 1; j++) {
      if (td[j]) {
        if (td[j].innerHTML.toLowerCase().indexOf(filter) > -1) {
          match = true;
          break;
        }
      }
    }
    tr[i].style.display = match ? "" : "none";
  }
}

// Charger les patients automatiquement au chargement de la page
window.onload = function() {
  chargerPatients();
};