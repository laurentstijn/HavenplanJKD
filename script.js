let geselecteerdeLigplaats = null;
let selectedBoot = null;
let editBootId = null;
let dragging = false;
let startX, startY;
const database = firebase.database();
const schaalFactor = 3;

// Haven tekenen: steigers, ligplaatsen, wachtzone
function tekenBasisHaven() {
  const svg = document.getElementById('haven');

  // SVG leegmaken (géén innerHTML)
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  svg.setAttribute('viewBox', '0 0 1000 600');

  // Steigers
  const steiger1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  steiger1.setAttribute('class', 'steiger');
  steiger1.setAttribute('x', 50);
  steiger1.setAttribute('y', 100);
  steiger1.setAttribute('width', 500);
  steiger1.setAttribute('height', 30);
  svg.appendChild(steiger1);

  const steiger2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  steiger2.setAttribute('class', 'steiger');
  steiger2.setAttribute('x', 160);
  steiger2.setAttribute('y', 130);
  steiger2.setAttribute('width', 30);
  steiger2.setAttribute('height', 400);
  svg.appendChild(steiger2);

  const steiger3 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  steiger3.setAttribute('class', 'steiger');
  steiger3.setAttribute('x', 400);
  steiger3.setAttribute('y', 130);
  steiger3.setAttribute('width', 30);
  steiger3.setAttribute('height', 400);
  svg.appendChild(steiger3);

  // 30 Ligplaatsen
  for (let i = 0; i < 30; i++) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'ligplaats');
    rect.setAttribute('id', `ligplaats${i + 1}`);
    rect.setAttribute('width', 140);
    rect.setAttribute('height', 30);

    if (i < 15) {
      rect.setAttribute('x', 20);
      rect.setAttribute('y', 140 + i * 35);
    } else {
      rect.setAttribute('x', 430);
      rect.setAttribute('y', 140 + (i - 15) * 35);
    }
    svg.appendChild(rect);
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

  // Ligplaatsen klikbaar maken
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

// Boten laden na vertraging
function loadBoten() {
  tekenBasisHaven(); // eerst haven tekenen

  const lijst = document.getElementById('botenLijst');
  lijst.innerHTML = '';

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
  }, 100); // <-- hier correct afsluiten
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

// Start
loadBoten();
