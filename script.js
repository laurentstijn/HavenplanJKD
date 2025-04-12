let selectedBoot = null;
let dragging = false;
let offsetX, offsetY;
const database = firebase.database();

// 🚀 Laad boten uit Firebase
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

// ➡️ Alleen klik op ligplaats om nieuwe boot te maken
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

    // ➡️ Vraag info via pop-up
    const naam = prompt("Naam van de boot:", "Nieuwe boot") || "Nieuwe boot";
    const lengteInput = prompt("Lengte van de boot (m):
