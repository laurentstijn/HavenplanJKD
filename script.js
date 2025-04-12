// Laden van bestaande boten uit JSON
fetch('boten.json')
  .then(response => response.json())
  .then(data => {
    data.boten.forEach(boot => {
      voegBootToeAanSVG(boot);
      voegBootToeAanLijst(boot);
    });
  })
  .catch(error => console.error('Fout bij laden boten.json:', error));

// Functie: Boot toevoegen aan SVG
function voegBootToeAanSVG(boot) {
  const svg = document.getElementById('haven');

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('class', 'boot');
  rect.setAttribute('x', boot.x);
  rect.setAttribute('y', boot.y);
  rect.setAttribute('width', boot.breedte * 10);  // Schaalfactor 10
  rect.setAttribute('height', boot.lengte * 10);
  rect.setAttribute('data-naam', boot.naam);

  // Sleepfunctionaliteit
  rect.addEventListener('mousedown', startDrag);
  svg.appendChild(rect);

  // Boot naam label
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('class', 'label');
  label.setAttribute('x', boot.x);
  label.setAttribute('y', boot.y - 5);
  label.textContent = boot.naam;
  svg.appendChild(label);
}

// Functie: Boot toevoegen aan lijst
function voegBootToeAanLijst(boot) {
  const lijst = document.getElementById('botenLijst');

  const div = document.createElement('div');
  div.className = 'boot-item';
  div.innerHTML = `
    <strong>${boot.naam}</strong> (${boot.lengte}m x ${boot.breedte}m) - ${boot.eigenaar}
    <button onclick="toonPopup('${boot.naam}')">Bewerk</button>
  `;
  lijst.appendChild(div);
}

// Drag en Drop functionaliteit
let geselecteerdeBoot = null;
let offsetX, offsetY;

function startDrag(evt) {
  geselecteerdeBoot = evt.target;
  offsetX = evt.clientX - parseFloat(geselecteerdeBoot.getAttribute('x'));
  offsetY = evt.clientY - parseFloat(geselecteerdeBoot.getAttribute('y'));

  document.addEventListener('mousemove', dragBoot);
  document.addEventListener('mouseup', stopDrag);
}

function dragBoot(evt) {
  if (!geselecteerdeBoot) return;
  geselecteerdeBoot.setAttribute('x', evt.clientX - offsetX);
  geselecteerdeBoot.setAttribute('y', evt.clientY - offsetY);
}

function stopDrag() {
  document.removeEventListener('mousemove', dragBoot);
  document.removeEventListener('mouseup', stopDrag);
  geselecteerdeBoot = null;
}

// Popup openen
function toonPopup(bootNaam) {
  document.getElementById('popup').style.display = 'block';
  document.getElementById('popupTitel').textContent = `Bewerk boot: ${bootNaam}`;
  // Hier kan je laden van boot details toevoegen indien gewenst
}

// Popup annuleren
function annuleerBoot() {
  document.getElementById('popup').style.display = 'none';
}

// Nieuwe boot bevestigen
function bevestigBoot() {
  const naam = document.getElementById('bootNaam').value.trim();
  const lengte = parseFloat(document.getElementById('bootLengte').value);
  const breedte = parseFloat(document.getElementById('bootBreedte').value);
  const eigenaar = document.getElementById('bootEigenaar').value.trim();

  if (!naam || isNaN(lengte) || isNaN(breedte) || !eigenaar) {
    alert('Vul alle velden correct in.');
    return;
  }

  const nieuweBoot = {
    naam,
    lengte,
    breedte,
    eigenaar,
    status: 'aanwezig',
    x: 300,
    y: 300
  };

  voegBootToeAanSVG(nieuweBoot);
  voegBootToeAanLijst(nieuweBoot);

  // Opslaan naar Firebase
  const db = firebase.database();
  db.ref('boten/' + naam).set(nieuweBoot);

  document.getElementById('popup').style.display = 'none';
}
