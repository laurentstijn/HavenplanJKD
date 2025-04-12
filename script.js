let selectedBoot = null;
let dragging = false;
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

// 🚀 Alleen klik op ligplaats om nieuwe boot te maken
document.querySelectorAll('.ligplaats').forEach(ligplaats => {
  ligplaats.addEventListener('click', (e) => {
    e.stopPropagation(); // Stop klik doorsturen

    const svg = document.getElementById('haven');
    const ligplaatsId = ligplaats.getAttribute('id');

    // Check of ligplaats al bezet is
    const existingBoot = document.querySelector(`[data-ligplaats="${ligplaatsId}"]`);
    if (existingBoot) {
      alert('Deze ligplaats is al bezet!');
      return;
    }

    const id = database.ref().child('boten').push().key;

    const newBoot = {
      naam: "Nieuwe boot",
      lengte: 12,
      breedte: 4,
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

// 🚚 Sleepstart: als je een boot aanklikt
function startDrag(e) {
  selectedBoot = {
    group: e.target.parentNode,
    id: e.target.parentNode.getAttribute('data-id')
  };

  dragging = true;
  offsetX = e.offsetX;
  offsetY = e.offsetY;

  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
}

// 🚚 Sleepbeweging
function drag(e) {
  if (!dragging) return;

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

// 🚚
