let geselecteerdeLigplaats = null;
let selectedBoot = null;
let dragging = false;
let wachtzoneBootTeller = 0;
const database = firebase.database();

// 🚀 Boten laden
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

// ➡️ Boot tekenen
function drawBoot(svg, boot, id) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'bootgroep');
  group.setAttribute('data-id', id);
  group.addEventListener('mousedown', startDrag); // Sleep de hele groep!

  // Boot rechthoek (zoals in het begin)
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

  // Boot naam
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', boot.x + 5);
  label.setAttribute('y', boot.y + 20);
  label.setAttribute('class', 'label');
  label.textContent = boot.naam || "Boot";
  group.appendChild(label);

  svg.appendChild(group);
}

// ➡️ Boot toevoegen aan menu
function addBootToMenu(boot, id) {
  const lijst = document.getElementById('botenLijst');
  const div = document.createElement('div');
  div.className = 'boot-item';
  div.innerHTML = `
    <strong>${boot.naam}</strong>
    <button onclick="editBoot('${id}')">✏️</button>
    <button onclick="deleteBoot('${id}')">🗑️</button>
  `;
  lijst.appendChild(div);
}

// ➡️ Bewerken boot
function editBoot(id) {
  database.ref('boten/' + id).once('value').then(snapshot => {
    const boot = snapshot.val();
    if (!boot) return;

    const nieuweNaam = prompt("Nieuwe naam:", boot.naam);
    if (nieuweNaam === null) return;

    const nieuweLengte = prompt("Nieuwe lengte:", boot.lengte);
    if (nieuweLengte === null) return;

    const nieuweBreedte = prompt("Nieuwe breedte:", boot.breedte);
    if (nieuweBreedte === null) return;

    boot.naam = nieuweNaam.trim();
    boot.lengte = parseFloat(nieuweLengte) || 12;
    boot.breedte = parseFloat(nieuweBreedte) || 4;

    database.ref('boten/' + id).set(boot, () => location.reload());
  });
}

// ➡️ Verwijderen boot
function deleteBoot(id) {
  if (confirm("Weet je zeker dat je deze boot wilt verwijderen?")) {
    database.ref('boten/' + id).remove(() => location.reload());
  }
}

// ➡️ Sleep starten
function startDrag(e) {
  document.querySelectorAll('.boot').forEach(b => b.classList.remove('selected'));
  e.target.classList.add('selected');
  selectedBoot = {
    group: e.target.parentNode,
    id: e.target.parentNode.getAttribute('data-id'),
    startX: e.clientX,
    startY: e.clientY
  };
  dragging = true;
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
}

// ➡️ Tijdens slepen
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

// ➡️ Sleep stoppen
function endDrag(e) {
  dragging = false;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', endDrag);

  const dx = e.clientX - selectedBoot.startX;
  const dy = e.clientY - selectedBoot.startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 5) {
    // Kleine beweging ➔ behandelen als klik
    editBoot(selectedBoot.id);
  } else {
    // Groot genoeg ➔ behandelen als sleep
    const boot = selectedBoot.group.querySelector('.boot');
    const label = selectedBoot.group.querySelector('text');
    const bootX = parseFloat(boot.getAttribute('x'));
    const bootY = parseFloat(boot.getAttribute('y'));

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

    const wachtzone = document.getElementById('wachtzone');
    const wx = parseFloat(wachtzone.getAttribute('x'));
    const wy = parseFloat(wachtzone.getAttribute('y'));
    const ww = parseFloat(wachtzone.getAttribute('width'));
    const wh = parseFloat(wachtzone.getAttribute('height'));
    const binnenWachtzone = (bootX >= wx && bootX <= wx + ww && bootY >= wy && bootY <= wy + wh);

    if (!binnenLigplaats && !binnenWachtzone) {
      boot.setAttribute('x', wx + 10);
      boot.setAttribute('y', wy + 10 + (wachtzoneBootTeller * 50));
      label.setAttribute('x', wx + 15);
      label.setAttribute('y', wy + 30 + (wachtzoneBootTeller * 50));
      wachtzoneBootTeller += 1;
    }

    saveBoot();
  }
}

// ➡️ Opslaan bootpositie
function saveBoot() {
  if (!selectedBoot) return;
  const { id, group } = selectedBoot;
  const bootRect = group.querySelector('.boot'); // Dit is de ellipse nu
  const bootLabel = group.querySelector('text');

  const updatedBoot = {
    naam: bootLabel.textContent || "Boot",
    lengte: parseFloat(bootRect.getAttribute('rx')) / 2,   // <-- FIX
    breedte: parseFloat(bootRect.getAttribute('ry')) / 2,   // <-- FIX
    eigenaar: "",
    status: "aanwezig",
    x: parseFloat(bootRect.getAttribute('cx')) - 30,        // <-- center naar x omzetten
    y: parseFloat(bootRect.getAttribute('cy')) - 15,        // <-- center naar y omzetten
    ligplaats: ""
  };

  database.ref('boten/' + id).set(updatedBoot);
}

// ➡️ Klik op ligplaats ➔ Boot toevoegen
// Klik op ligplaats opent nu popup
document.querySelectorAll('.ligplaats').forEach(ligplaats => {
  ligplaats.addEventListener('click', (e) => {
    e.stopPropagation();
    geselecteerdeLigplaats = ligplaats;
    document.getElementById('popup').style.display = 'block';
  });
    database.ref('boten/' + id).set(newBoot, () => location.reload());
  });
});

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

function annuleerBoot() {
  document.getElementById('popup').style.display = 'none';
}

// 🚀 Start
loadBoten();



