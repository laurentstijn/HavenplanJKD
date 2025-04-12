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

  // Boot romp (mooie ovale vorm)
  const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  const centerX = boot.x + 30; // midden van de boot
  const centerY = boot.y + 15;
  ellipse.setAttribute('cx', centerX);
  ellipse.setAttribute('cy', centerY);
  ellipse.setAttribute('rx', (boot.lengte || 12) * 2);  // breedte
  ellipse.setAttribute('ry', (boot.breedte || 4) * 2);  // hoogte
  ellipse.setAttribute('fill', '#d0d0d0');              // lichtgrijze kleur
  ellipse.setAttribute('stroke', '#555');               // donkere rand
  ellipse.setAttribute('stroke-width', 2);
  ellipse.classList.add('boot');
  ellipse.addEventListener('mousedown', startDrag);
  group.appendChild(ellipse);

  // Boot naam
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', centerX - 20);
  label.setAttribute('y', centerY + 25);
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

// ➡️ Klik op ligplaats ➔ Boot toevoegen
document.querySelectorAll('.ligplaats').forEach(ligplaats => {
  ligplaats.addEventListener('click', async (e) => {
    e.stopPropagation();
    const naam = prompt("Naam van de boot:", "Nieuwe boot");
    if (naam === null || naam.trim() === "") return;

    const lengteInput = prompt("Lengte van de boot (meter):", "12");
    if (lengteInput === null) return;

    const breedteInput = prompt("Breedte van de boot (meter):", "4");
    if (breedteInput === null) return;

    const lengte = parseFloat(lengteInput) || 12;
    const breedte = parseFloat(breedteInput) || 4;
    const id = database.ref().child('boten').push().key;

    const newBoot = {
      naam: naam.trim(),
      lengte: lengte,
      breedte: breedte,
      eigenaar: "",
      status: "aanwezig",
      x: parseFloat(ligplaats.getAttribute('x')) + 10,
      y: parseFloat(ligplaats.getAttribute('y')) + 5,
      ligplaats: ligplaats.id
    };

    database.ref('boten/' + id).set(newBoot, () => location.reload());
  });
});

// 🚀 Start
loadBoten();

document.querySelectorAll('.ligplaats').forEach(ligplaats => {
  ligplaats.addEventListener('click', (e) => {
    console.log("Klik op ligplaats!");
  });
});

