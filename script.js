
let geselecteerdeLigplaats = null;
let selectedBoot = null;
let editBootId = null;
let dragging = false;
let startX, startY;
const database = firebase.database();
const schaalFactor = 3; // Kleinere schaalfactor

// Haven tekenen
function tekenBasisHaven() {
  const svg = document.getElementById('haven');
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  svg.setAttribute('viewBox', '0 0 1000 600');

  const steigers = [
    { x: 50, y: 100, width: 500, height: 30 },
    { x: 160, y: 130, width: 30, height: 400 },
    { x: 400, y: 130, width: 30, height: 400 }
  ];
  steigers.forEach(s => {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'steiger');
    Object.entries(s).forEach(([k, v]) => rect.setAttribute(k, v));
    svg.appendChild(rect);
  });

  for (let i = 0; i < 30; i++) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'ligplaats');
    rect.setAttribute('id', `ligplaats${i + 1}`);
    rect.setAttribute('width', 120);  // Kleinere ligplaatsen
    rect.setAttribute('height', 25);  // Kleinere ligplaatsen
    rect.setAttribute('x', i < 15 ? 20 : 430);
    rect.setAttribute('y', 140 + (i % 15) * 30);
    svg.appendChild(rect);
  }
}
