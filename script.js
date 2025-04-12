let selectedBoot = null;
const database = firebase.database(); // Firebase database gebruiken

// Boten ophalen uit Firebase
function loadBoten() {
  const svg = document.getElementById('haven');

  database.ref('boten').once('value').then((snapshot) => {
    const data = snapshot.val();
    if (data) {
      Object.keys(data).forEach(id => {
        const boot = data[id];
        drawBoot(svg, boot, id);
      });
    }
  });
}

// Boot tekenen
function drawBoot(svg, boot, id) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'ligplaats');
  group.setAttribute('data-id', id);

  const boat = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  boat.setAttribute('x', boot.x);
  boat.setAttribute('y', boot.y);
  boat.setAttribute('width', (boot.lengte || 12) * 5);
  boat.setAttribute('height', (boot.breedte || 4) * 5);
  boat.setAttribute('class', 'boot');
  boat.addEventListener('click', (event) => {
    event.stopPropagation();
    selectBoot(boot, group, id);
  });
  group.appendChild(boat);

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', boot.x + 5);
  label.setAttribute('y', boot.y + 20);
  label.setAttribute('class', 'label');
  label.textContent = boot.naam || 'Boot';
  group.appendChild(label);

  svg.appendChild(group);
}

// Boot selecteren
function selectBoot(boot, group, id) {
  selectedBoot = { boot, group, id };

  document.querySelectorAll('.boot').forEach(boot => {
    boot.classList.remove('selected');
  });

  const bootRect = group.querySelector('.boot');
  if (bootRect) {
    bootRect.classList.add('selected');
  }

  document.getElementById('naam').value = boot.naam || '';
  document.getElementById('lengte').value = boot.lengte || '';
  document.getElementById('breedte').value = boot.breedte || '';
  document.getElementById('eigenaar').value = boot.eigenaar || '';
  document.getElementById('status').value = boot.status || 'aanwezig';
}

// Boot opslaan naar Firebase
function saveBoot() {
  if (!selectedBoot) return;

  const { id, group } = selectedBoot;
  const bootRect = group.querySelector('.boot'); // ✅ hier bootRect
  const bootLabel = group.querySelector('text');

  if (!bootRect) {
    console.error('Geen boot gevonden in de geselecteerde groep!');
    return;
  }

  const naam = document.getElementById('naam').value;
  const lengte = parseFloat(document.getElementById('lengte').value);
  const breedte = parseFloat(document.getElementById('breedte').value);
  const eigenaar = document.getElementById('eigenaar').value;
  const status = document.getElementById('status').value;

  bootRect.setAttribute('width', lengte * 5);
  bootRect.setAttribute('height', breedte * 5);

  if (bootLabel) {
    bootLabel.textContent = naam;
  }

  const updatedBoot = {
    naam,
    lengte,
    breedte,
    eigenaar,
    status,
    x: parseFloat(bootRect.getAttribute('x')),
    y: parseFloat(bootRect.getAttribute('y'))
  };

  firebase.database().ref('boten/' + id).set(updatedBoot);
}

// Boot verwijderen uit Firebase
function deleteBoot() {
  if (!selectedBoot) return;
  const { id, group } = selectedBoot;

  database.ref('boten/' + id).remove(); // <-- Verwijderen uit database
  group.parentNode.removeChild(group);
  selectedBoot = null;
}

// Nieuwe boot maken en opslaan
function createNewBoot(x, y) {
  const svg = document.getElementById('haven');
  const id = database.ref().child('boten').push().key; // <-- Nieuw uniek ID van Firebase

  const newBoot = {
    naam: "Nieuwe boot",
    lengte: 12,
    breedte: 4,
    eigenaar: "",
    status: "aanwezig",
    x: x - 30,
    y: y - 10
  };

  database.ref('boten/' + id).set(newBoot); // <-- Nieuwe boot opslaan in database

  drawBoot(svg, newBoot, id);
}

// Klik op vrije ruimte ➔ nieuwe boot maken
const svg = document.getElementById('haven');
svg.addEventListener('click', (e) => {
  if (e.target.tagName === 'rect' && (e.target.classList.contains('boot') || e.target.classList.contains('steiger'))) {
    return; // Klikte op een boot of steiger, niet op lege ruimte
  }

  const svgRect = svg.getBoundingClientRect();
  const x = e.clientX - svgRect.left;
  const y = e.clientY - svgRect.top;

  const svgX = (x / svgRect.width) * 800;
  const svgY = (y / svgRect.height) * 600;

  createNewBoot(svgX, svgY);
});

// 🚀 Start: laad boten bij begin
loadBoten();
