let selectedBoot = null;
let dragging = false;
let hasMoved = false;  // ➡️ Nieuw: om te checken of we echt bewogen hebben
let offsetX, offsetY;
const database = firebase.database();

// 🚀 Laad boten vanuit Firebase
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

// 🎨 Teken een boot
function drawBoot(svg, boot, id) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'bootgroep');
  group.setAttribute('data-id', id);
  group.setAttribute('data-ligplaats', boot.ligplaats);

  const boat = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  boat.setAttribute('x', boot.x);
  boat.setAttribute('y', boot.y);
  boat.setAttribute('width', (boot.lengte || 12) * 5);
  boat.setAttribute('height', (boot.breedte || 4) * 5);
  boat.setAttribute('class', 'boot');
  boat.addEventListener('mousedown', startDrag);
  group.appendChild(boat);

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', boot.x + 5);
  label.setAttribute('y', boot.y + 20);
  label.setAttribute('class', 'label');
  label.textContent = boot.naam || 'Boot';
  group.appendChild(label);

  svg.appendChild(group);
}

// ➡️ Klik op ligplaats om nieuwe boot te maken
document.querySelectorAll('.ligplaats').forEach(ligplaats => {
  ligplaats.addEventListener('click', async (e) => {
    e.stopPropagation();

    const svg = document.getElementById('haven');
    const ligplaatsId = ligplaats.getAttribute('id');

    // Check of ligplaats al bezet is
    const existingBoot = document.querySelector(`[data-ligplaats="${ligplaatsId}"]`);
    if (existingBoot) {
      alert('Deze ligplaats is al bezet!');
      return;
    }

    // 🎯 Pop-up om naam, lengte, breedte te vragen
    const naam = prompt("Naam van de boot:", "Nieuwe boot") || "Nieuwe boot";
    const lengteInput = prompt("Lengte van de boot (m):", "12");
    const breedteInput = prompt("Breedte van de boot (m):", "4");

    let lengte = parseFloat(lengteInput);
    let breedte = parseFloat(breedteInput);

    if (isNaN(lengte) || lengte <= 0) lengte = 12;
    if (isNaN(breedte) || breedte <= 0) breedte = 4;

    const id = database.ref().child('boten').push().key;

    const newBoot = {
      naam: naam,
      lengte: lengte,
      breedte: breedte,
      eigenaar: "",
      status: "aanwezig",
      x: parseFloat(ligplaats.getAttribute('x')) + 10,
      y: parseFloat(ligplaats.getAttribute('y')) + 5,
      ligplaats: ligplaatsId
    };

    database.ref('boten/' + id).set(newBoot);

    drawBoot(svg, newBoot, id);
  });
});

// 🚚 Start slepen
function startDrag(e) {
  // Deselecteer alle boten
  document.querySelectorAll('.boot').forEach(boot => {
    boot.classList.remove('selected');
  });

  // Selecteer de aangeklikte boot
  const clickedBoot = e.target;
  clickedBoot.classList.add('selected');

  selectedBoot = {
    group: e.target.parentNode,
    id: e.target.parentNode.getAttribute('data-id')
  };

  dragging = true;
  hasMoved = false; // ➡️ Nieuw: reset bewegen

  offsetX = e.offsetX;
  offsetY = e.offsetY;

  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
}

// 🚚 Sleepbeweging
function drag(e) {
  if (!dragging) return;

  hasMoved = true; // ➡
