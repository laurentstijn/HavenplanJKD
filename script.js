let geselecteerdeLigplaats = null;
let selectedBoot = null;
let editBootId = null;
let dragging = false;
let startX, startY;
const database = firebase.database();

// Boten laden
function loadBoten() {
  const svg = document.getElementById('haven');
  const lijst = document.getElementById('botenLijst');
  lijst.innerHTML = '';
  database.ref('boten').once('value').then(snapshot => {
    const data = snapshot.val();
    if (data) {
      Object.keys(data).forEach(id => {
        drawBoot(svg, data[id], id);
        addBootToMenu(data[id], id);
      });
    }
  });
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
  rect.setAttribute('width', (boot.lengte || 12) * 5);
  rect.setAttribute('height', (boot.breedte || 4) * 5);
  rect.setAttribute('fill', '#d0d0d0');
  rect.setAttribute('stroke', '#555');
  rect.setAttribute('stroke-width', 2);
  rect.classList.add('boot');
  group.appendChild(rect);

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', boot.x + 5);
  label.setAttribute('y', boot.y + 20);
  label.setAttribute('class', 'label');
  label.textContent = boot.naam || "Boot";
  group.appendChild(label);

  svg.appendChild(group);
}

// Boot in lijst tonen
function addBootToMenu(boot, id) {
  const lijst = document.getElementById('botenLijst');
  const div = document.createElement('div');
  div.className = 'boot-item';
  div.innerHTML = `<strong>${boot.naam}</strong> (${boot.eigenaar || "Geen eigenaar"})
    <button onclick="editBoot('${id}')">✏️</button>
    <button onclick="deleteBoot('${id}')">🗑️</button>`;
  lijst.appendChild(div);
}

// Slepen starten
function startDrag(e) {
  // Voorkom dat meerdere boten geselecteerd worden
  document.querySelectorAll('.boot').forEach(b => b.classList.remove('selected'));
  e.target.classList.add('selected');
  selectedBoot = {
    group: e.target.parentNode,
    id: e.target.parentNode.getAttribute('data-id')
  };

  // Houd de offset tussen de muis en de boot bij
  const rect = selectedBoot.group.querySelector('.boot');
  const offsetX = e.clientX - rect.getBoundingClientRect().left;
  const offsetY = e.clientY - rect.getBoundingClientRect().top;

  startX = e.clientX;
  startY = e.clientY;
  dragging = true;

  // Sla de offsets op in selectedBoot zodat we deze later kunnen gebruiken
  selectedBoot.offsetX = offsetX;
  selectedBoot.offsetY = offsetY;

  // Start de slepen-beweging
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
}

// Tijdens slepen
function drag(e) {
  if (!selectedBoot) return;
  
  const svg = document.getElementById('haven');
  
  // Bereken de nieuwe positie op basis van de muispositie
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());

  // Pas de positie van de boot en het label aan zodat deze de muis volgt
  const boot = selectedBoot.group.querySelector('.boot');
  const label = selectedBoot.group.querySelector('text');
  
  const newX = cursorpt.x - selectedBoot.offsetX;
  const newY = cursorpt.y - selectedBoot.offsetY;

  boot.setAttribute('x', newX);
  boot.setAttribute('y', newY);
  label.setAttribute('x', newX + 5);
  label.setAttribute('y', newY + 20);
}

// Slepen stoppen
function endDrag(e) {
  dragging = false;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', endDrag);

  if (!selectedBoot) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 5) {
    // Klik zonder veel bewegen ➔ popup openen
    database.ref('boten/' + selectedBoot.id).once('value').then(snapshot => {
      const boot = snapshot.val();
      if (!boot) return;

      geselecteerdeLigplaats = null;
      editBootId = selectedBoot.id;
      document.getElementById('popupTitel').textContent = "Boot aanpassen";
      document.getElementById('bootNaam').value = boot.naam;
      document.getElementById('bootLengte').value = boot.lengte;
      document.getElementById('bootBreedte').value = boot.breedte;
      document.getElementById('bootEigenaar').value = boot.eigenaar;
      document.getElementById('popup').style.display = 'block';
    });
  } else {
    // Controleer de nieuwe positie van de boot in relatie tot ligplaatsen of wachtzone
    const bootRect = selectedBoot.group.querySelector('.boot');
    const label = selectedBoot.group.querySelector('text');
    const bootX = parseFloat(bootRect.getAttribute('x'));
    const bootY = parseFloat(bootRect.getAttribute('y'));

    let binnenLigplaats = false;
    document.querySelectorAll('.ligplaats').forEach(ligplaats => {
      const lx = parseFloat(ligplaats.getAttribute('x'));
      const ly = parseFloat(ligplaats.getAttribute('y'));
      const lw = parseFloat(ligplaats.getAttribute('width'));
      const lh = parseFloat(ligplaats.getAttribute('height'));
      if (bootX >= lx && bootX <= lx + lw && bootY >= ly && bootY <= ly + lh) {
        binnenLigplaats = true;
      }
    });

    const wachtzone = document.getElementById('wachtzone');
    const wx = parseFloat(wachtzone.getAttribute('x'));
    const wy = parseFloat(wachtzone.getAttribute('y'));
    const ww = parseFloat(wachtzone.getAttribute('width'));
    const wh = parseFloat(wachtzone.getAttribute('height'));

    if (!binnenLigplaats &&
        !(bootX >= wx && bootX <= wx + ww && bootY >= wy && bootY <= wy + wh)) {

      // Tel hoeveel boten al in de wachtzone zitten
      let count = 0;
      document.querySelectorAll('.boot').forEach(b => {
        const bx = parseFloat(b.getAttribute('x'));
        const by = parseFloat(b.getAttribute('y'));
        if (bx >= wx && bx <= wx + ww && by >= wy && by <= wy + wh) {
          count++;
        }
      });

      // Zet de boot onder elkaar in de wachtzone
      const spacing = 30; // afstand tussen boten
      const newX = wx + 10;
      const newY = wy + 10 + count * spacing;

      bootRect.setAttribute('x', newX);
      bootRect.setAttribute('y', newY);
      label.setAttribute('x', newX + 5);
      label.setAttribute('y', newY + 20);
    }

    saveBoot();
  }
}



// Boot opslaan
function saveBoot() {
  if (!selectedBoot) return;
  const { id, group } = selectedBoot;
  const bootRect = group.querySelector('.boot');
  const bootLabel = group.querySelector('text');

  database.ref('boten/' + id).once('value').then(snapshot => {
    const oudeBoot = snapshot.val() || {};

    const updatedBoot = {
      naam: bootLabel.textContent || "Boot",
      lengte: parseFloat(bootRect.getAttribute('width')) / 5,
      breedte: parseFloat(bootRect.getAttribute('height')) / 5,
      eigenaar: oudeBoot.eigenaar || "",     // <<<< eigenaar behouden
      status: "aanwezig",
      x: parseFloat(bootRect.getAttribute('x')),
      y: parseFloat(bootRect.getAttribute('y')),
      ligplaats: oudeBoot.ligplaats || ""
    };

    database.ref('boten/' + id).set(updatedBoot);
  });
}

// Boot aanpassen vanuit menu
function editBoot(id) {
  database.ref('boten/' + id).once('value').then(snapshot => {
    const boot = snapshot.val();
    if (!boot) return;

    geselecteerdeLigplaats = null;
    editBootId = id;
    document.getElementById('popupTitel').textContent = "Boot aanpassen";
    document.getElementById('bootNaam').value = boot.naam;
    document.getElementById('bootLengte').value = boot.lengte;
    document.getElementById('bootBreedte').value = boot.breedte;
    document.getElementById('bootEigenaar').value = boot.eigenaar || "";
    document.getElementById('popup').style.display = 'block';
  });
}

// Boot verwijderen
function deleteBoot(id) {
  if (confirm("Weet je zeker dat je deze boot wilt verwijderen?")) {
    database.ref('boten/' + id).remove(() => location.reload());
  }
}

// Popup bevestigen
function bevestigBoot() {
  const naam = document.getElementById('bootNaam').value.trim();
  const lengte = document.getElementById('bootLengte').value.trim();
  const breedte = document.getElementById('bootBreedte').value.trim();
  const eigenaar = document.getElementById('bootEigenaar').value.trim();

  if (!naam) {
    alert("Vul alle velden correct in.");
    return;
  }

  if (editBootId) {
    // Bestaande boot aanpassen
    database.ref('boten/' + editBootId).once('value').then(snapshot => {
      const boot = snapshot.val();
      if (!boot) return;

      boot.naam = naam;
      boot.lengte = lengte;
      boot.breedte = breedte;
      boot.eigenaar = eigenaar;

      database.ref('boten/' + editBootId).set(boot, () => location.reload());
    });
  } else {
    // Nieuwe boot toevoegen
    const id = database.ref().child('boten').push().key;
    const newBoot = {
      naam: naam,
      lengte: lengte,
      breedte: breedte,
      eigenaar: eigenaar,
      status: "aanwezig",
      x: parseFloat(geselecteerdeLigplaats.getAttribute('x')) + 10,
      y: parseFloat(geselecteerdeLigplaats.getAttribute('y')) + 5,
      ligplaats: geselecteerdeLigplaats.id
    };
    database.ref('boten/' + id).set(newBoot, () => location.reload());
  }
}

// Popup annuleren
function annuleerBoot() {
  document.getElementById('popup').style.display = 'none';
}

// Ligplaatsen klikbaar maken
document.querySelectorAll('.ligplaats').forEach(ligplaats => {
  ligplaats.addEventListener('click', (e) => {
    e.stopPropagation();
    geselecteerdeLigplaats = ligplaats;
    editBootId = null;
    document.getElementById('popupTitel').textContent = "Nieuwe boot toevoegen";
    document.getElementById('bootNaam').value = "";
    document.getElementById('bootLengte').value = "";
    document.getElementById('bootBreedte').value = "";
    document.getElementById('bootEigenaar').value = "";
    document.getElementById('popup').style.display = 'block';
  });
});

// Ligplaats naam labels tekenen (linkerbovenhoek)
function tekenLigplaatsNamen() {
  const svg = document.getElementById('haven');
  document.querySelectorAll('.ligplaats').forEach(ligplaats => {
    const lx = parseFloat(ligplaats.getAttribute('x'));
    const ly = parseFloat(ligplaats.getAttribute('y'));

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', lx + 5);           // Iets rechts van de linkerrand
    label.setAttribute('y', ly + 12);           // Iets onder de bovenrand
    label.setAttribute('text-anchor', 'start'); // Tekst links uitlijnen
    label.setAttribute('class', 'label');
    label.textContent = ligplaats.id;           // Bijvoorbeeld: ligplaats1

    svg.appendChild(label);
  });
}

// Start
loadBoten();
