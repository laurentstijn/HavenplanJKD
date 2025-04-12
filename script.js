let selectedBoot = null;

fetch('boten.json')
.then(response => response.json())
.then(data => {
  const svg = document.getElementById('haven');
  data.boten.forEach((boot, index) => {
    drawBoot(svg, boot, index);
  });
});

function drawBoot(svg, boot, id) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'ligplaats');
  group.setAttribute('data-id', id);

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', boot.x);
  rect.setAttribute('y', boot.y);
  rect.setAttribute('width', 120);
  rect.setAttribute('height', 30);
  rect.setAttribute('fill', '#88c0d0');

  const boat = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  boat.setAttribute('x', boot.x + 10);
  boat.setAttribute('y', boot.y + 5);
  boat.setAttribute('width', boot.lengte * 5);
  boat.setAttribute('height', boot.breedte * 5);
  boat.setAttribute('class', 'boot');
  boat.addEventListener('click', () => selectBoot(boot, group, id));

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', boot.x + 15);
  label.setAttribute('y', boot.y + 20);
  label.setAttribute('class', 'label');
  label.textContent = boot.naam || 'Boot';

  group.appendChild(rect);
  group.appendChild(boat);
  group.appendChild(label);
  svg.appendChild(group);
}


function selectBoot(boot, group, id) {
  selectedBoot = {boot, group, id};
  document.getElementById('naam').value = boot.naam || '';
  document.getElementById('lengte').value = boot.lengte || '';
  document.getElementById('breedte').value = boot.breedte || '';
  document.getElementById('eigenaar').value = boot.eigenaar || '';
  document.getElementById('status').value = boot.status || 'aanwezig';
}

function saveBoot() {
  if (!selectedBoot) return;
  const { group } = selectedBoot;
  const bootRect = group.querySelector('.boot');
  const bootLabel = group.querySelector('text');

  const naam = document.getElementById('naam').value;
  const lengte = parseFloat(document.getElementById('lengte').value);
  const breedte = parseFloat(document.getElementById('breedte').value);
  const eigenaar = document.getElementById('eigenaar').value;
  const status = document.getElementById('status').value;

  bootRect.setAttribute('width', lengte * 5);
  bootRect.setAttribute('height', breedte * 5);

  if (bootLabel) {
    bootLabel.textContent = naam;
  }
}


function deleteBoot() {
  if (!selectedBoot) return;
  const { group } = selectedBoot;
  group.parentNode.removeChild(group);
  selectedBoot = null;
}
