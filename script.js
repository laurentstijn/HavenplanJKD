
let geselecteerdeLigplaats = null;
let selectedBoot = null;
let editBootId = null;
let dragging = false;
let startX, startY;
const database = firebase.database();
const schaalFactor = 3;

// Boten laden

function loadBoten() {
  tekenBasisHaven(); // Eerst haven tekenen

  const lijst = document.getElementById('botenLijst');
  lijst.innerHTML = '';

  setTimeout(() => {
    
setTimeout(() => {
  database.ref('boten').once('value').then(snapshot => {

      const data = snapshot.val();
      if (data) {
        Object.keys(data).forEach(id => {
          drawBoot(document.getElementById('haven'), data[id], id);
          addBootToMenu(data[id], id);
        
  });
}, 100);

      }
    });
  }, 50); // Kleine vertraging zodat SVG eerst klaar is
}

  const svg = document.getElementById('haven');
  const lijst = document.getElementById('botenLijst');
  lijst.innerHTML = '';
  
  // SVG resetten met steigers, ligplaatsen en wachtzone
  svg.innerHTML = `
    <rect class="steiger" x="50" y="100" width="500" height="30" />
    <rect class="steiger" x="160" y="130" width="30" height="300" />
    <rect class="steiger" x="400" y="130" width="30" height="300" />
    
    <rect class="ligplaats" id="ligplaats1" x="20" y="140" width="140" height="30" />
    <rect class="ligplaats" id="ligplaats2" x="20" y="190" width="140" height="30" />
    <rect class="ligplaats" id="ligplaats3" x="20" y="240" width="140" height="30" />
    <rect class="ligplaats" id="ligplaats4" x="430" y="140" width="140" height="30" />
    <rect class="ligplaats" id="ligplaats5" x="430" y="190" width="140" height="30" />
    <rect class="ligplaats" id="ligplaats6" x="430" y="240" width="140" height="30" />
    
    <rect id="wachtzone" class="wachtzone" x="700" y="50" width="150" height="500" />
  `;
  
  
setTimeout(() => {
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


function loadBoten() {
  tekenBasisHaven(); // Eerst haven tekenen

  const lijst = document.getElementById('botenLijst');
  lijst.innerHTML = '';

  setTimeout(() => {
    
setTimeout(() => {
  database.ref('boten').once('value').then(snapshot => {

      const data = snapshot.val();
      if (data) {
        Object.keys(data).forEach(id => {
          drawBoot(document.getElementById('haven'), data[id], id);
          addBootToMenu(data[id], id);
        });
      }
    });
  }, 50); // Kleine vertraging zodat SVG eerst klaar is
}

  const svg = document.getElementById('haven');
  const lijst = document.getElementById('botenLijst');
  lijst.innerHTML = '';
  
while (svg.firstChild) {
  svg.removeChild(svg.firstChild);
}

  
setTimeout(() => {
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
  const boot = e.target.closest('.boot');
  if (boot) {
    boot.classList.add('selected');
  }

  selectedBoot = {
    group: e.target.closest('g'),
    id: e.target.closest('g').getAttribute('data-id')
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
  label.setAttribute('x', cursorpt.x - 20);
  label.setAttribute('y', cursorpt.y);
}

// Slepen stoppen

function endDrag(e) {
  dragging = false;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', endDrag);

  if (!selectedBoot) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 5) {
    // Klik: popup openen
    const id = selectedBoot.id;
    editBoot(id);
    return;
  }

  dragging = false;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', endDrag);

  if (!selectedBoot) return;

  const bootRect = selectedBoot.group.querySelector('.boot');
  const label = selectedBoot.group.querySelector('text');
  const bootX = parseFloat(bootRect.getAttribute('x'));
  const bootY = parseFloat(bootRect.getAttribute('y'));

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

  if (!binnenLigplaats &&
      !(bootX >= wx && bootX <= wx + ww && bootY >= wy && bootY <= wy + wh)) {

    let count = 0;
    document.querySelectorAll('.boot').forEach(b => {
      const bx = parseFloat(b.getAttribute('x'));
      const by = parseFloat(b.getAttribute('y'));
      if (bx >= wx && bx <= wx + ww && by >= wy && by <= wy + wh) {
        count++;
      }
    });

    const spacing = 40; // afstand tussen boten
    const newX = wx + 10;
    const newY = wy + 10 + count * spacing;

    bootRect.setAttribute('x', newX);
    bootRect.setAttribute('y', newY);
    label.setAttribute('x', newX + 5);
    label.setAttribute('y', newY + 20);
  }

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

    database.ref('boten/' + id).set(updatedBoot, () => {
      document.getElementById('popup').style.display = 'none';
      loadBoten();
    });
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
    database.ref('boten/' + id).remove(() => {
      loadBoten();
    });
  }
}

// Popup bevestigen
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

      database.ref('boten/' + editBootId).set(boot, () => {
        document.getElementById('popup').style.display = 'none';
        loadBoten();
      });
    });
  }
}

// Popup annuleren
function annuleerBoot() {
  document.getElementById('popup').style.display = 'none';
}

// Start
loadBoten();
