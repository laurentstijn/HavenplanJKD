let editBootId = null;  // weten of we nieuwe boot maken of bestaande bewerken
let geselecteerdeLigplaats = null;
let selectedBoot = null;
let dragging = false;
const database = firebase.database();

// Boten laden
function loadBoten() {
  const svg = document.getElementById('haven');
  const lijst = document.getElementById('botenLijst');
  lijst.innerHTML = '';
  database.ref('boten').once('value').then(snapshot => {
    const data = snapshot.val();
    if (data) {
      Object.keys(data).forEach(id => {
        drawBoot(svg, data[id], id);
        addBootToMenu(data[id], id);
      });
    }
  });
}

// Boot tekenen
function drawBoot(svg, boot, id) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'bootgroep');
  group.setAttribute('data-id', id);
  group.addEventListener('mousedown', startDrag);

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', boot.x);
  rect.setAttribute('y', boot.y);
  rect.setAttribute('width', (boot.lengte || 12) * 5);
  rect.setAttribute('height', (boot.breedte || 4) * 5);
  rect.setAttribute('fill', '#d0d0d0');
  rect.setAttribute('stroke', '#555');
  rect.setAttribute('stroke-width', 2);
  rect.classList.add('boot');
  group.appendChild(rect);

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', boot.x + 5);
  label.setAttribute('y', boot.y + 20);
  label.setAttribute('class', 'label');
  label.textContent = boot.naam || "Boot";
  group.appendChild(label);

  svg.appendChild(group);
}

// Boot in lijst tonen
function addBootToMenu(boot, id) {
  const lijst = document.getElementById('botenLijst');
  const div = document.createElement('div');
  div.className = 'boot-item';
  div.innerHTML = `<strong>${boot.naam}</strong> (${boot.eigenaar || "Geen eigenaar"})
    <button onclick="editBoot('${id}')">✏️</button>
    <button onclick="deleteBoot('${id}')">🗑️</button>`;
  lijst.appendChild(div);
}

// Slepen starten
function startDrag(e) {
  document.querySelectorAll('.boot').forEach(b => b.classList.remove('selected'));
  e.target.classList.add('selected');
  selectedBoot = {
    group: e.target.parentNode,
    id: e.target.parentNode.getAttribute('data-id')
  };

  if (!dragging) { // klik zonder slepen = popup openen
    database.ref('boten/' + selectedBoot.id).once('value').then(snapshot => {
      const boot = snapshot.val();
      if (!boot) return;

      geselecteerdeLigplaats = null; // omdat we een bestaande bewerken
      editBootId = selectedBoot.id;  // bestaande boot
      document.getElementById('popupTitel').textContent = "Boot aanpassen";
      document.getElementById('bootNaam').value = boot.naam;
      document.getElementById('bootLengte').value = boot.lengte;
      document.getElementById('bootBreedte').value = boot.breedte;
      document.getElementById('bootEigenaar').value = boot.eigenaar;
      document.getElementById('popup').style.display = 'block';
    });
  }

  dragging = true;
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
}


// Tijdens slepen
function drag(e) {
  if (!selectedBoot) return;
  const svg = document.getElementById('haven');
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
  const boot = selectedBoot.group.querySelector('.boot');
  const label = selectedBoot.group.querySelector('text');
  boot.setAttribute('x', cursorpt.x - 30);
  boot.setAttribute('y', cursorpt.y - 10);
  label.setAttribute('x', cursorpt.x - 25);
  label.setAttribute('y', cursorpt.y + 5);
}

// Slepen stoppen
function endDrag(e) {
  dragging = false;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', endDrag);

  if (!selectedBoot) return;

  const bootRect = selectedBoot.group.querySelector('.boot');
  const label = selectedBoot.group.querySelector('text');
  const bootX = parseFloat(bootRect.getAttribute('x'));
  const bootY = parseFloat(bootRect.getAttribute('y'));

  // Check of de boot BINNEN een ligplaats zit
  let binnenLigplaats = false;
  document.querySelectorAll('.ligplaats').forEach(ligplaats => {
    const lx = parseFloat(ligplaats.getAttribute('x'));
    const ly = parseFloat(ligplaats.getAttribute('y'));
    const lw = parseFloat(ligplaats.getAttribute('width'));
    const lh = parseFloat(ligplaats.getAttribute('height'));
    if (bootX >= lx && bootX <= lx + lw && bootY >= ly && bootY <= ly + lh) {
      binnenLigplaats = true;
    }
  });

  // Wachtzone parameters
  const wachtzone = document.getElementById('wachtzone');
  const wx = parseFloat(wachtzone.getAttribute('x'));
  const wy = parseFloat(wachtzone.getAttribute('y'));
  const ww = parseFloat(wachtzone.getAttribute('width'));
  const wh = parseFloat(wachtzone.getAttribute('height'));

  // Als niet binnen een ligplaats en niet binnen wachtzone, dan naar wachtzone zetten
  if (!binnenLigplaats &&
      !(bootX >= wx && bootX <= wx + ww && bootY >= wy && bootY <= wy + wh)) {
    bootRect.setAttribute('x', wx + 10);
    bootRect.setAttribute('y', wy + 10);
    label.setAttribute('x', wx + 15);
    label.setAttribute('y', wy + 30);
  }

  saveBoot();
}

// Boot opslaan
function saveBoot() {
  if (!selectedBoot) return;
  const { id, group } = selectedBoot;
  const bootRect = group.querySelector('.boot');
  const bootLabel = group.querySelector('text');
  const updatedBoot = {
    naam: bootLabel.textContent || "Boot",
    lengte: parseFloat(bootRect.getAttribute('width')) / 5,
    breedte: parseFloat(bootRect.getAttribute('height')) / 5,
    eigenaar: "",
    status: "aanwezig",
    x: parseFloat(bootRect.getAttribute('x')),
    y: parseFloat(bootRect.getAttribute('y')),
    ligplaats: ""
  };
  database.ref('boten/' + id).set(updatedBoot);
}

// Boot aanpassen
function editBoot(id) {
  database.ref('boten/' + id).once('value').then(snapshot => {
    const boot = snapshot.val();
    if (!boot) return;

    geselecteerdeLigplaats = null; // Geen nieuwe ligplaats
    editBootId = id; // Bestaande boot aanpassen
    document.getElementById('popupTitel').textContent = "Boot aanpassen";
    document.getElementById('bootNaam').value = boot.naam;
    document.getElementById('bootLengte').value = boot.lengte;
    document.getElementById('bootBreedte').value = boot.breedte;
    document.getElementById('bootEigenaar').value = boot.eigenaar || "";
    document.getElementById('popup').style.display = 'block';
  });
}


// Boot verwijderen
function deleteBoot(id) {
  if (confirm("Weet je zeker dat je deze boot wilt verwijderen?")) {
    database.ref('boten/' + id).remove(() => location.reload());
  }
}

// Popup opslaan
function bevestigBoot() {
  const naam = document.getElementById('bootNaam').value.trim();
  const lengte = parseFloat(document.getElementById('bootLengte').value) || 12;
  const breedte = parseFloat(document.getElementById('bootBreedte').value) || 4;
  const eigenaar = document.getElementById('bootEigenaar').value.trim();
  
  if (!naam || !geselecteerdeLigplaats) {
    alert("Vul alle velden correct in.");
    return;
  }

  const id = database.ref().child('boten').push().key;

  const newBoot = {
    naam: naam,
    lengte: lengte,
    breedte: breedte,
    eigenaar: eigenaar,
    status: "aanwezig",
    x: parseFloat(geselecteerdeLigplaats.getAttribute('x')) + 10,
    y: parseFloat(geselecteerdeLigplaats.getAttribute('y')) + 5,
    ligplaats: geselecteerdeLigplaats.id
  };

  database.ref('boten/' + id).set(newBoot, () => location.reload());
}

// Popup annuleren
function annuleerBoot() {
  document.getElementById('popup').style.display = 'none';
}

// Ligplaatsen klikbaar maken
document.querySelectorAll('.ligplaats').forEach(ligplaats => {
  ligplaats.addEventListener('click', (e) => {
    e.stopPropagation();
    geselecteerdeLigplaats = ligplaats;
    editBootId = null; // NIEUWE boot
    document.getElementById('popupTitel').textContent = "Nieuwe boot toevoegen";
    document.getElementById('bootNaam').value = "";
    document.getElementById('bootLengte').value = 12;
    document.getElementById('bootBreedte').value = 4;
    document.getElementById('bootEigenaar').value = "";
    document.getElementById('popup').style.display = 'block';
  });
});

function bevestigBoot() {
  const naam = document.getElementById('bootNaam').value.trim();
  const lengte = parseFloat(document.getElementById('bootLengte').value) || 12;
  const breedte = parseFloat(document.getElementById('bootBreedte').value) || 4;
  const eigenaar = document.getElementById('bootEigenaar').value.trim();

  if (!naam) {
    alert("Vul alle velden correct in.");
    return;
  }

  if (editBootId) {
    // Bestaande boot bijwerken
    database.ref('boten/' + editBootId).once('value').then(snapshot => {
      const boot = snapshot.val();
      if (!boot) return;
      boot.naam = naam;
      boot.lengte = lengte;
      boot.breedte = breedte;
      boot.eigenaar = eigenaar;

      database.ref('boten/' + editBootId).set(boot, () => location.reload());
    });
  } else {
    // Nieuwe boot maken
    const id = database.ref().child('boten').push().key;
    const newBoot = {
      naam: naam,
      lengte: lengte,
      breedte: breedte,
      eigenaar: eigenaar,
      status: "aanwezig",
      x: parseFloat(geselecteerdeLigplaats.getAttribute('x')) + 10,
      y: parseFloat(geselecteerdeLigplaats.getAttribute('y')) + 5,
      ligplaats: geselecteerdeLigplaats.id
    };
    database.ref('boten/' + id).set(newBoot, () => location.reload());
  }
}



// Start
loadBoten();
