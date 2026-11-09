let selectedRow = null;

// Load all patients on start or when clicking "Afficher tout"
function chargerPatients() {
  fetch("/api/patients")
    .then((res) => res.json())
    .then((data) => {
      let table = document.getElementById("patient_liste").getElementsByTagName("tbody")[0];
      table.innerHTML = "";
      data.forEach((p) => insertNewRecordFromDB(p));
    })
    .catch((err) => console.error("Error loading patients:", err));
}

// Load statistics
function chargerStats() {
  fetch("/api/patients/stats")
    .then((res) => res.json())
    .then((data) => {
      alert(
        `CHU ANDRAINJATO STATISTICS:\n\n` +
        `- Total Patients: ${data.total_patients}\n` +
        `- Average Age: ${Math.round(data.moyenne_age || 0)} years\n` +
        `- Oldest Patient: ${data.age_max || 0} years\n` +
        `- Youngest Patient: ${data.age_min || 0} years`
      );
    })
    .catch((err) => console.error("Error loading stats:", err));
}

// DYNAMIC FILTERING (Age / Stay with greater / less than operators)
function appliquerFiltreDynamique() {
  let critere = document.getElementById("critereFiltre").value;
  let operateur = document.getElementById("operateurFiltre").value;
  let valeur = document.getElementById("valeurFiltre").value;

  if (valeur === "") {
    alert("Please enter a value to filter!");
    return;
  }

  let url = `/api/patients/filtrer-avance?critere=${critere}&operateur=${operateur}&valeur=${valeur}`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      let table = document.getElementById("patient_liste").getElementsByTagName("tbody")[0];
      table.innerHTML = "";
      if (data.length === 0) {
        alert("No patients match this filter.");
        chargerPatients();
        return;
      }
      data.forEach((p) => insertNewRecordFromDB(p));
    })
    .catch((err) => console.error("Error with dynamic filter:", err));
}

// Form Submission (Insert or Update)
function onFormsubmit() {
  if (validate()) {
    let formData = readFormData();
    
    if (selectedRow === null) {
      // INSERT (POST)
      fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Error during registration");
          return data;
        })
        .then((data) => {
          insertNewRecordFromDB({ id: data.id, ...formData });
          resetForm();
          alert(data.message);
        })
        .catch((err) => alert("Error: " + err.message));
    } else {
      // UPDATE (PUT)
      let id = selectedRow.dataset.id;
      fetch(`/api/patients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Error during update");
          return data;
        })
        .then((data) => {
          updateRecord(formData);
          resetForm();
          alert(data.message);
        })
        .catch((err) => alert("Error: " + err.message));
    }
  }
}

// Read form data
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

// Insert record into HTML table (with direct row click support)
function insertNewRecordFromDB(data) {
  let table = document.getElementById("patient_liste").getElementsByTagName("tbody")[0];
  let newRow = table.insertRow(table.length);
  newRow.dataset.id = data.id;

  // DIRECT ROW CLICK: Selects and pre-fills the form (unless clicking a button)
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
  cellAction.innerHTML = `<button class="btn-edit" onclick="onEdit(this)">Edit</button> 
                          <button class="btn-delete" onclick="onDelete(this)">Delete</button>`;
}

// Dedicated function to fill the form from the clicked row
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

// Row selection visual
function selectRow(row) {
  let rows = document.getElementById("patient_liste").getElementsByTagName("tr");
  for (let i = 0; i < rows.length; i++) {
    rows[i].classList.remove("selected-row");
  }
  row.classList.add("selected-row");
  selectedRow = row;
}

// Edit row via "Edit" button
function onEdit(td) {
  let row = td.parentElement.parentElement;
  remplirFormulaireDepuisLigne(row);
}

// Update table record
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

// Delete record
function onDelete(td) {
  if (confirm("Are you sure you want to delete this patient?")) {
    let row = td.parentElement.parentElement;
    let id = row.dataset.id;

    fetch(`/api/patients/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("patient_liste").deleteRow(row.rowIndex);
        resetForm();
        alert(data.message);
      })
      .catch((err) => console.error("Error deleting:", err));
  }
}

// Reset form
function resetForm() {
  document.getElementById("patientForm").reset();
  selectedRow = null;
}

// Validate form
function validate() {
  let isValid = true;
  if (document.getElementById("nom").value === "") {
    isValid = false;
    alert("Last name is required!");
  }
  return isValid;
}

// Search table instantly
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

// Load patients on window load
window.onload = function() {
  chargerPatients();
};