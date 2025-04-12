let geselecteerdeLigplaats = null;
let selectedBoot = null;
let editBootId = null;
let dragging = false;
let startX, startY;
const database = firebase.database();
const schaalFactor = 3;

// Haven tekenen
function tekenBasisHaven() {
  const svg = document.getElementById('haven');

  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  svg.setAttribute('viewBox', '0 0 1000 600');

  // Steigers
  const steigers = [
    { x: 50, y: 100, width: 500, height: 30 },
    { x: 160, y: 130, width: 30, height: 400 },
    { x: 400, y: 130, width: 30, height: 400 }
  ];
  steigers.forEach(s => {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'steiger');
    Object.entries(s).forEach(([k, v]) => rect.setAttribute(k, v));
    svg.appendChild(rect);
  });

  // Ligplaatsen
  for (let i = 0; i < 30; i++) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'ligplaats');
    rect.setAttribute('id', `ligplaats${i + 1}`);
    rect.setAttribute('width', 140);
    rect.setAttribute('height', 30);
    rect.setAttribute('x', i < 15 ? 20 : 430);
    rect.setAttribute('y', 140 + (i % 15) * 35);
    svg.appendChild(rect);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', parseFloat(rect.getAttribute('x')) + 10);
    label.setAttribute('y', parseFloat(rect.getAttribute('y')) + 20);
    label.setAttribute('class', 'label');
    label.setAttribute('text-anchor', 'start');
    label.textContent = `L${i + 1}`;
    svg.appendChild(label);
  }

  // Wachtzone
  const wachtzone = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  wachtzone.setAttribute('class', 'wachtzone');
  wachtzone.setAttribute('id', 'wachtzone');
  wachtzone.setAttribute('x', 700);
  wachtzone.setAttribute('y', 50);
  wachtzone.setAttribute('width', 150);
  wachtzone.setAttribute('height', 500);
  svg.appendChild(wachtzone);

  document.querySelectorAll('.ligplaats').forEach(ligplaats => {
    ligplaats.addEventListener('click', (e) => {
      e.stopPropagation();
      geselecteerdeLigplaats = ligplaats;
      editBootId = null;
      document.getElementById('popupTitel').textContent = "Nieuwe boot toevoegen";
      document.getElementById('bootNaam').value = "";
      document.getElementById('bootLengte').value = 12;
      document.getElementById('bootBreedte').value = 4;
      document.getElementById('bootEigenaar').value = "";
      document.getElementById('popup').style.display = 'block';
    });
  });
}

// Boten laden
function loadBoten() {
  tekenBasisHaven();

  const lijst = document.getElementById('botenLijst');
  lijst.innerHTML = '';

  setTimeout(() => {
    database.ref('boten').once('value').then(snapshot => {
      const data = snapshot.val();
      const bezetteLigplaatsen = new Set();

      if (data) {
        Object.keys(data).forEach(id => {
          const boot = data[id];
          drawBoot(document.getElementById('haven'), boot, id);
          addBootToMenu(boot, id);

          if (boot.ligplaats) {
            bezetteLigplaatsen.add(boot.ligplaats);
          }
        });
      }

      // Bezetting verbergen
      bezetteLigplaatsen.forEach(ligplaatsId => {
        const ligplaats = document.getElementById(ligplaatsId);
        if (ligplaats) {
          ligplaats.style.display = 'none';
        }
      });
    });
  }, 100);
}

// Boot tekenen
function drawBoot(svg, boot, id) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'bootgroep');
  group.setAttribute('data-id', id);

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', boot.x);
  rect.setAttribute('y', boot.y);
  rect.setAttribute('width', (boot.lengte || 12) * schaalFactor);
  rect.setAttribute('height', (boot.breedte || 4) * schaalFactor);
  rect.setAttribute('fill', '#d0d0d0');
  rect.setAttribute('stroke', '#555');
  rect.setAttribute('stroke-width', 2);
  rect.classList.add('boot');
  group.appendChild(rect);

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', boot.x + 5);
  label.setAttribute('y', boot.y + 15);
  label.setAttribute('class', 'label');
  label.textContent = boot.naam || "Boot";
  group.appendChild(label);

  group.addEventListener('mousedown', startDrag);
  svg.appendChild(group);
}

// Boot toevoegen aan menu
function addBootToMenu(boot, id) {
  const lijst = document.getElementById('botenLijst');
  const div = document.createElement('div');
  div.className = 'boot-item';
  div.innerHTML = `<strong>${boot.naam}</strong> (${boot.eigenaar || "Geen eigenaar"})
    <button onclick="editBoot('${id}')">✏️</button>
    <button onclick="deleteBoot('${id}')">🗑️</button>`;
  lijst.appendChild(div);
}

// Sleep starten
function startDrag(e) {
  document.querySelectorAll('.boot').forEach(b => b.classList.remove('selected'));
  e.target.classList.add('selected');

  selectedBoot = {
    group: e.target.parentNode,
    id: e.target.parentNode.getAttribute('data-id')
  };

  startX = e.clientX;
  startY = e.clientY;
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

// Sleep stoppen
function endDrag(e) {
  dragging = false;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', endDrag);

  if (!selectedBoot) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 5) {
    editBoot(selectedBoot.id);
    return;
  }

  // ➔ Ligplaats vrijmaken als boot verhuist
  database.ref('boten/' + selectedBoot.id).once('value').then(snapshot => {
    const oudeBoot = snapshot.val();
    if (oudeBoot && oudeBoot.ligplaats) {
      const oudeLigplaats = document.getElementById(oudeBoot.ligplaats);
      if (oudeLigplaats) {
        oudeLigplaats.style.display = 'block';
      }
    }
  });

  saveBoot();
}

// Boot opslaan
function saveBoot() {
  if (!selectedBoot) return;

  const { id, group } = selectedBoot;
  const bootRect = group.querySelector('.boot');
  const bootLabel = group.querySelector('text');

  database.ref('boten/' + id).once('value').then(snapshot => {
    const oudeBoot = snapshot.val() || {};

    const updatedBoot = {
      naam: bootLabel.textContent || "Boot",
      lengte: parseFloat(bootRect.getAttribute('width')) / schaalFactor,
      breedte: parseFloat(bootRect.getAttribute('height')) / schaalFactor,
      eigenaar: oudeBoot.eigenaar || "",
      status: "aanwezig",
      x: parseFloat(bootRect.getAttribute('x')),
      y: parseFloat(bootRect.getAttribute('y')),
      ligplaats: oudeBoot.ligplaats || ""
    };

    database.ref('boten/' + id).set(updatedBoot);
  });
}

// Boot aanpassen
function editBoot(id) {
  database.ref('boten/' + id).once('value').then(snapshot => {
    const boot = snapshot.val();
    if (!boot) return;

    geselecteerdeLigplaats = null;
    editBootId = id;
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

  if (!naam) {
    alert("Vul alle velden correct in.");
    return;
  }

  if (editBootId) {
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

// Popup annuleren
function annuleerBoot() {
  document.getElementById('popup').style.display = 'none';
}

// Start
loadBoten();
