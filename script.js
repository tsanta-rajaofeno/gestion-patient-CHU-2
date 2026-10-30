let selectedRow = null;
let currentPatientId = null; 

window.onload = function() {
    chargerPatients();
};

function chargerPatients() {
    fetch('/api/patients')
        .then(res => res.json())
        .then(data => {
            let table = document.getElementById("patient_liste").getElementsByTagName("tbody")[0];
            table.innerHTML = "";
            data.forEach(p => insertNewRecordFromDB(p));
        })
        .catch(err => console.error("Erreur:", err));
}

function onFormsubmit() {
    let formData = readFromData();
    
    let url = '/api/patients';
    let method = 'POST';

    if (currentPatientId !== null) {
        url = `/api/patients/${currentPatientId}`;
        method = 'PUT';
    }

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(response => {
        resetForm();
        currentPatientId = null;
        chargerPatients();
    })
    .catch(err => console.error("Erreur:", err));
}

function readFromData() {
  let formData = {};
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

function insertNewRecordFromDB(data) {
  let table = document
    .getElementById("patient_liste")
    .getElementsByTagName("tbody")[0];
  let newRow = table.insertRow(table.length);
  newRow.dataset.id = data.id; 
  
  let cell1 = newRow.insertCell(0);
  cell1.textContent = data.nom;
  let cell2 = newRow.insertCell(1);
  cell2.textContent = data.prenom;
  let cell3 = newRow.insertCell(2);
  cell3.textContent = data.age;
  let cell4 = newRow.insertCell(3);
  cell4.textContent = data.addresse;
  let cell5 = newRow.insertCell(4);
  cell5.textContent = data.maladie;
  let cell6 = newRow.insertCell(5);
  cell6.textContent = data.phone;
  let cell7 = newRow.insertCell(6);
  cell7.textContent = data.date_entree;
  let cell8 = newRow.insertCell(7);
  cell8.textContent = data.sejours;
  let cell9 = newRow.insertCell(8);
  cell9.textContent = data.sex;
  let cell10 = newRow.insertCell(9);
  cell10.innerHTML = `<a class="edit" onclick="editRecord(this)">Edit</a>
                      <a class="delete" onclick="deleteRecord(this)">Delete</a>`;
}

function resetForm() {
  document.getElementById("nom").value = "";
  document.getElementById("prenom").value = "";
  document.getElementById("age").value = "";
  document.getElementById("addresse").value = "";
  document.getElementById("maladie").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("date_entree").value = "";
  document.getElementById("sejours").value = "";
  document.getElementById("sex").value = "";
  selectedRow = null;
  currentPatientId = null;
}

function editRecord(td) {
  selectedRow = td.parentElement.parentElement;
  currentPatientId = selectedRow.dataset.id; 
  
  // Utilisation de textContent pour récupérer uniquement le texte brut sans balises HTML
  document.getElementById("nom").value = selectedRow.cells[0].textContent;
  document.getElementById("prenom").value = selectedRow.cells[1].textContent;
  document.getElementById("age").value = selectedRow.cells[2].textContent;
  document.getElementById("addresse").value = selectedRow.cells[3].textContent;
  document.getElementById("maladie").value = selectedRow.cells[4].textContent;
  document.getElementById("phone").value = selectedRow.cells[5].textContent;
  document.getElementById("date_entree").value = selectedRow.cells[6].textContent;
  document.getElementById("sejours").value = selectedRow.cells[7].textContent;
  document.getElementById("sex").value = selectedRow.cells[8].textContent;
}

function updateRecord(formData) {
  
}

function deleteRecord(td) {
  if (confirm("Are you sure to delete this record ?")) {
    let row = td.parentElement.parentElement;
    let id = row.dataset.id;

    fetch(`/api/patients/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
            chargerPatients();
            resetForm();
        })
        .catch(err => console.error("Erreur:", err));
  }
}

function searchTable() {
  let input = document.getElementById("searchInput");
  let filter = input.value.toUpperCase();
  let table = document.getElementById("patient_liste");
  let tr = table.getElementsByTagName("tr");
  for (let i = 0; i < tr.length; i++) {
    let td = tr[i].getElementsByTagName("td");
    for (let j = 0; j < td.length; j++) {
      if (td[j].textContent.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
        break;
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

function chargerFiltre3Conditions() {
    fetch('/api/patients/filtre')
        .then(res => res.json())
        .then(data => {
            let table = document.getElementById("patient_liste").getElementsByTagName("tbody")[0];
            table.innerHTML = "";
            data.forEach(p => insertNewRecordFromDB(p));
        })
        .catch(err => console.error("Erreur filtre:", err));
}

function chargerStats() {
    fetch('/api/patients/stats')
        .then(res => res.json())
        .then(stat => {
            alert(`Statistiques de l'hôpital :\n- Âge moyen : ${Math.round(stat.moyenne_age || 0)} ans\n- Âge minimum : ${stat.age_min || 0} ans\n- Total patients : ${stat.total_patients}`);
        })
        .catch(err => console.error("Erreur stats:", err));
}