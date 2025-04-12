
let selectedBoot = null;
let dragging = false;
let startX = 0;
let startY = 0;
const database = firebase.database();

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

document.querySelectorAll('.ligplaats').forEach(ligplaats => {
  ligplaats.addEventListener('click', async (e) => {
    e.stopPropagation();

    const svg = document.getElementById('haven');
    const ligplaatsId = ligplaats.getAttribute('id');

    const existingBoot = document.querySelector(`[data-ligplaats="${ligplaatsId}"]`);
    if (existingBoot) {
      alert('Deze ligplaats is al bezet!');
      return;
    }

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

function startDrag(e) {
  document.querySelectorAll('.boot').forEach(boot => {
    boot.classList.remove('selected');
  });

  const clickedBoot = e.target;
  clickedBoot.classList.add('selected');

  selectedBoot = {
    group: e.target.parentNode,
    id: e.target.parentNode.getAttribute('data-id')
  };

  dragging = true;
  startX = e.clientX;
  startY = e.clientY;

  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
}

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

function endDrag(e) {
  dragging = false;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const svg = document.getElementById('haven');
  const wachtzone = document.getElementById('wachtzone');

  if (distance > 5) {
    const boot = selectedBoot.group.querySelector('.boot');
    const label = selectedBoot.group.querySelector('text');

    const bootX = parseFloat(boot.getAttribute('x'));
    const bootY = parseFloat(boot.getAttribute('y'));

    let binnenLigplaats = false;
    let binnenWachtzone = false;

    // Controleer alle ligplaatsen
    document.querySelectorAll('.ligplaats').forEach(ligplaats => {
      const lx = parseFloat(ligplaats.getAttribute('x'));
      const ly = parseFloat(ligplaats.getAttribute('y'));
      const lw = parseFloat(ligplaats.getAttribute('width'));
      const lh = parseFloat(ligplaats.getAttribute('height'));

      if (bootX >= lx && bootX <= lx + lw && bootY >= ly && bootY <= ly + lh) {
        binnenLigplaats = true;
      }
    });

    // Controleer wachtzone
    const wx = parseFloat(wachtzone.getAttribute('x'));
    const wy = parseFloat(wachtzone.getAttribute('y'));
    const ww = parseFloat(wachtzone.getAttribute('width'));
    const wh = parseFloat(wachtzone.getAttribute('height'));

    if (bootX >= wx && bootX <= wx + ww && bootY >= wy && bootY <= wy + wh) {
      binnenWachtzone = true;
    }

    // Als niet binnen ligplaats EN niet binnen wachtzone ➔ verplaatsen naar wachtzone
    if (!binnenLigplaats && !binnenWachtzone) {
      boot.setAttribute('x', wx + 10);
      boot.setAttribute('y', wy + 10);
      label.setAttribute('x', wx + 15);
      label.setAttribute('y', wy + 30);
    }

    saveBoot();
  }

  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', endDrag);
}

    if (!binnenLigplaats) {
      boot.setAttribute('x', parseFloat(wachtzone.getAttribute('x')) + 10);
      boot.setAttribute('y', parseFloat(wachtzone.getAttribute('y')) + 10);
      label.setAttribute('x', parseFloat(wachtzone.getAttribute('x')) + 15);
      label.setAttribute('y', parseFloat(wachtzone.getAttribute('y')) + 30);
    }

    saveBoot();
  }

  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', endDrag);
}

function saveBoot() {
  if (!selectedBoot) return;

  const { id, group } = selectedBoot;
  const bootRect = group.querySelector('.boot');
  const bootLabel = group.querySelector('text');

  if (!bootRect) return;

  let lengte = parseFloat(bootRect.getAttribute('width')) / 5;
  let breedte = parseFloat(bootRect.getAttribute('height')) / 5;

  if (isNaN(lengte) || lengte <= 0) lengte = 12;
  if (isNaN(breedte) || breedte <= 0) breedte = 4;

  const updatedBoot = {
    naam: bootLabel.textContent || "Boot",
    lengte: lengte,
    breedte: breedte,
    eigenaar: "",
    status: "aanwezig",
    x: parseFloat(bootRect.getAttribute('x')),
    y: parseFloat(bootRect.getAttribute('y')),
    ligplaats: group.getAttribute('data-ligplaats')
  };

  database.ref('boten/' + id).set(updatedBoot);
}

function deleteBoot() {
  if (!selectedBoot) return;
  const { id, group } = selectedBoot;

  database.ref('boten/' + id).remove();
  group.parentNode.removeChild(group);
  selectedBoot = null;
}

loadBoten();

let wachtzoneBootTeller = 0; // ➔ Hou bij hoeveel boten in wachtzone staan

