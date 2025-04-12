let selectedBoot = null;
let dragging = false;
let startX = 0;
let startY = 0;
let wachtzoneBootTeller = 0;
const database = firebase.database();

function loadBoten() {
  const svg = document.getElementById('haven');
  database.ref('boten').once('value').then(snapshot => {
    const data = snapshot.val();
    if (data) {
      Object.keys(data).forEach(id => {
        drawBoot(svg, data[id], id);
      });
    }
  });
}

function drawBoot(svg, boot, id) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'bootgroep');
  group.setAttribute('data-id', id);
  group.setAttribute('data-ligplaats', boot.ligplaats);
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', boot.x);
  rect.setAttribute('y', boot.y);
  rect.setAttribute('width', (boot.lengte || 12) * 5);
  rect.setAttribute('height', (boot.breedte || 4) * 5);
  rect.setAttribute('class', 'boot');
  rect.addEventListener('mousedown', startDrag);
  group.appendChild(rect);
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', boot.x + 5);
  label.setAttribute('y', boot.y + 20);
  label.setAttribute('class', 'label');
  label.textContent = boot.naam || "Boot";
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
    const naam = prompt("Naam van de boot:", "Nieuwe boot");
    if (naam === null || naam.trim() === "") return;
    const lengteInput = prompt("Lengte van de boot (meter):", "12");
    if (lengteInput === null) return;
    const breedteInput = prompt("Breedte van de boot (meter):", "4");
    if (breedteInput === null) return;
    let lengte = parseFloat(lengteInput);
    let breedte = parseFloat(breedteInput);
    if (isNaN(lengte) || lengte <= 0) lengte = 12;
    if (isNaN(breedte) || breedte <= 0) breedte = 4;
    const id = database.ref().child('boten').push().key;
    const newBoot = {
      naam: naam.trim(),
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
  document.querySelectorAll('.boot').forEach(boot => boot.classList.remove('selected'));
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
  const rect = selectedBoot.group.querySelector('.boot');
  const label = selectedBoot.group.querySelector('text');
  rect.setAttribute('x', cursorpt.x - 30);
  rect.setAttribute('y', cursorpt.y - 10);
  label.setAttribute('x', cursorpt.x - 25);
  label.setAttribute('y', cursorpt.y + 5);
}

function endDrag(e) {
  dragging = false;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > 5) {
    const boot = selectedBoot.group.querySelector('.boot');
    const label = selectedBoot.group.querySelector('text');
    const bootX = parseFloat(boot.getAttribute('x'));
    const bootY = parseFloat(boot.getAttribute('y'));
    const wachtzone = document.getElementById('wachtzone');
    const wx = parseFloat(wachtzone.getAttribute('x'));
    const wy = parseFloat(wachtzone.getAttribute('y'));
    const ww = parseFloat(wachtzone.getAttribute('width'));
    const wh = parseFloat(wachtzone.getAttribute('height'));
    let binnenLigplaats = false;
    let binnenWachtzone = (bootX >= wx && bootX <= wx + ww && bootY >= wy && bootY <= wy + wh);
    document.querySelectorAll('.ligplaats').forEach(ligplaats => {
      const lx = parseFloat(ligplaats.getAttribute('x'));
      const ly = parseFloat(ligplaats.getAttribute('y'));
      const lw = parseFloat(ligplaats.getAttribute('width'));
      const lh = parseFloat(ligplaats.getAttribute('height'));
      if (bootX >= lx && bootX <= lx + lw && bootY >= ly && bootY <= ly + lh) {
        binnenLigplaats = true;
      }
    });
    if (!binnenLigplaats && !binnenWachtzone) {
      const nieuweX = wx + 10;
      const nieuweY = wy + 10 + (wachtzoneBootTeller * 50);
      boot.setAttribute('x', nieuweX);
      boot.setAttribute('y', nieuweY);
      label.setAttribute('x', nieuweX + 5);
      label.setAttribute('y', nieuweY + 20);
      wachtzoneBootTeller += 1;
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
  const updatedBoot = {
    naam: bootLabel.textContent || "Boot",
    lengte: parseFloat(bootRect.getAttribute('width')) / 5,
    breedte: parseFloat(bootRect.getAttribute('height')) / 5,
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
