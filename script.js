let geselecteerdeLigplaats = null;
let selectedBoot = null;
let editBootId = null;
let dragging = false;
let startX, startY;
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
  group.addEventListener('touchstart', startDrag);  // Voeg touchstart toe

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
  e.preventDefault(); // Voorkom ongewenste gedrag (bijv. tekst selecteren)

  // Voor touch gebruiken we touchstart om de startpositie op te halen
  if (e.type === "touchstart") {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  } else { // Voor muis gebruiken we de gewone `clientX` en `clientY`
    startX = e.clientX;
    startY = e.clientY;
  }

  document.querySelectorAll('.boot').forEach(b => b.classList.remove('selected'));
  e.target.classList.add('selected');
  selectedBoot = {
    group: e.target.parentNode,
    id: e.target.parentNode.getAttribute('data-id')
  };

  dragging = true;

  // Voeg event listeners toe voor bewegen en stoppen van het slepen
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchmove', drag);  // Voeg touchmove voor mobiel toe
  document.addEventListener('touchend', endDrag); // Voeg touchend voor mobiel toe
}

// Tijdens slepen
function drag(e) {
  if (!selectedBoot) return;

  let clientX, clientY;
  // Gebruik de juiste clientX/clientY afhankelijk van het event type (touch of mouse)
  if (e.type === "touchmove") {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const svg = document.getElementById('haven');
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
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
  document.removeEventListener('touchmove', drag);  // Verwijder touchmove event
  document.removeEventListener('touchend', endDrag); // Verwijder touchend event

  if (!selectedBoot) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 5) {
    // Klik zonder veel bewegen ➔ popup openen
    database.ref('boten/' + selectedBoot.id).once('value').then(snapshot => {
      const boot = snapshot.val();
      if (!boot) return;

      geselecteerdeLigplaats = null;
      editBootId = selectedBoot.id;
      document.getElementById('popupTitel').textContent = "Boot aanpassen";
      document.getElementById('bootNaam').value = boot.naam;
      document.getElementById('bootLengte').value = boot.lengte;
      document.getElementById('bootBreedte').value = boot.breedte;
      document.getElementById('bootEigenaar').value = boot.eigenaar;
      document.getElementById('popup').style.display = 'block';
    });
  } else {
    // Verplaats de boot naar de nieuwe locatie
    saveBoot();
  }
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
      lengte: parseFloat(bootRect.getAttribute('width')) / 5,
      breedte: parseFloat(bootRect.getAttribute('height')) / 5,
      eigenaar: oudeBoot.eigenaar || "",     // <<<< eigenaar behouden
      status: "aanwezig",
      x: parseFloat(bootRect.getAttribute('x')),
      y: parseFloat(bootRect.getAttribute('y')),
      ligplaats: oudeBoot.ligplaats || ""
    };

    database.ref('boten/' + id).set(updatedBoot);
  });
}

// Boot aanpassen vanuit menu
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

// Popup bevestigen
function bevestigBoot() {
  const naam = document.getElementById('bootNaam').value.trim();
  const lengte = document.getElementById('bootLengte').value.trim();
  const breedte = document.getElementById('bootBreedte').value.trim();
  const eigenaar = document.getElementById('bootEigenaar').value.trim();

  if (!naam) {
    alert("Vul alle velden correct in.");
    return;
  }

  if (editBootId) {
    // Bestaande boot aanpassen
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
    // Nieuwe boot toevoegen
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

// Ligplaatsen klikbaar maken
document.querySelectorAll('.ligplaats').forEach(ligplaats => {
  ligplaats.addEventListener('click', (e) => {
    e.stopPropagation();
    geselecteerdeLigplaats = ligplaats;
    editBootId = null;
    document.getElementById('popupTitel').textContent = "Nieuwe boot toevoegen";
    document.getElementById('bootNaam').value = "";
    document.getElementById('bootLengte').value = "";
    document.getElementById('bootBreedte').value = "";
    document.getElementById('bootEigenaar').value = "";
    document.getElementById('popup').style.display = 'block';
  });
});

// Ligplaats naam labels tekenen (linkerbovenhoek)
function tekenLigplaatsNamen() {
  const svg = document.getElementById('haven');
  document.querySelectorAll('.ligplaats').forEach(ligplaats => {
    const lx = parseFloat(ligplaats.getAttribute('x'));
    const ly = parseFloat(ligplaats.getAttribute('y'));

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', lx + 5);           // Iets rechts van de linkerrand
    label.setAttribute('y', ly + 12);           // Iets onder de bovenrand
    label.setAttribute('text-anchor', 'start'); // Tekst links uitlijnen
    label.setAttribute('class', 'label');
    label.textContent = ligplaats.id;           // Bijvoorbeeld: ligplaats1

    svg.appendChild(label);
  });
}

// Start
loadBoten();
