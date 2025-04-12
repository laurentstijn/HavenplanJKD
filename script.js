let selectedBoot = null;

// Boten inladen vanuit boten.json
fetch('boten.json')
.then(response => response.json())
.then(data => {
  const svg = document.getElementById('haven');

  data.boten.forEach((boot, index) => {
    drawBoot(svg, boot, index);
  });

  // Klik op vrije ruimte om nieuwe boot toe te voegen
  svg.addEventListener('click', (e) => {
    if (
      e.target.tagName === 'rect' && 
      (e.target.classList.contains('boot') || e.target.classList.contains('steiger'))
    ) {
      return; // Klikte op een boot of steiger -> geen nieuwe boot maken
    }

    const svgRect = svg.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;

    const svgX = (x / svgRect.width) * 800;
    const svgY = (y / svgRect.height) * 600;

    createNewBoot(svgX, svgY);
  });
});

// Functie om bestaande boten te tekenen
function drawBoot(svg, boot, id) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'ligplaats');
  group.setAttribute('data-id', id);

  const boat = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  boat.setAttribute('x', boot.x);
  boat.setAttribute('y', boot.y);
  boat.setAttribute('width', (boot.lengte || 12) * 5);
  boat.setAttribute('height', (boot.breedte || 4) * 5);
  boat.setAttribute('class', 'boot');
  boat.addEventListener('click', (event) => {
    event.stopPropagation();
    selectBoot(boot, group, id);
  });
  group.appendChild(boat);

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', boot.x + 5);
  label.setAttribute('y', boot.y + 20);
  label.setAttribute('class', 'label');
  label.textContent = boot.naam || 'Boot';
  group.appendChild(label);

  svg.appendChild(group);
}

// Functie om geselecteerde boot te highlighten en formulier te vullen
function selectBoot(boot, group, id) {
  selectedBoot = { boot, group, id };

  // Verwijder oude selectie
  document.querySelectorAll('.boot').forEach(boot => {
    boot.classList.remove('selected');
  });

  // Highlight de nieuwe geselecteerde boot
  const bootRect = group.querySelector('.boot');
  if (bootRect) {
    bootRect.classList.add('selected');
  }

  // Formulier invullen
  document.getElementById('naam').value = boot.naam || '';
  document.getElementById('lengte').value = boot.lengte || '';
  document.getElementById('breedte').value = boot.breedte || '';
  document.getElementById('eigenaar').value = boot.eigenaar || '';
  document.getElementById('status').value = boot.status || 'aanwezig';
}

// Functie om geselecteerde boot op te slaan
function saveBoot() {
  if (!selectedBoot) return;
  const { group } = selectedBoot;
  const boatRect = group.querySelector('.boot');
  const bootLabel = group.querySelector('text');

  const naam = document.getElementById('naam').value;
  const lengte = parseFloat(document.getElementById('lengte').value);
  const breedte = parseFloat(document.getElementById('breedte').value);

  boatRect.setAttribute('width', lengte * 5);
  boatRect.setAttribute('height', breedte * 5);

  if (bootLabel) {
    bootLabel.textContent = naam;
  }
}

// Functie om geselecteerde boot te verwijderen
function deleteBoot() {
  if (!selectedBoot) return;
  const { group } = selectedBoot;
  group.parentNode.removeChild(group);
  selectedBoot = null;
}

// Functie om nieuwe boot te maken bij klik
function createNewBoot(x, y) {
  const svg = document.getElementById('haven');
  const id = Date.now();

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'ligplaats');
  group.setAttribute('data-id', id);

  const boat = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  boat.setAttribute('x', x - 30);
  boat.setAttribute('y', y - 10);
  boat.setAttribute('width', 60);
  boat.setAttribute('height', 20);
  boat.setAttribute('class', 'boot');
  boat.addEventListener('click', (event) => {
    event.stopPropagation();
    selectBoot({}, group, id);
  });
  group.appendChild(boat);

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', x - 25);
  label.setAttribute('y', y + 5);
  label.setAttribute('class', 'label');
  label.textContent = "Nieuwe boot";
  group.appendChild(label);

  svg.appendChild(group);

  // Direct selecteren
  selectBoot({}, group, id);
}
