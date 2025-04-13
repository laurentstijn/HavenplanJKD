let geselecteerdeLigplaats = null;
let selectedBoot = null;
let dragging = false;
let startX, startY;

// Firebase configuratie (gebruik je eigen configuratie)
const firebaseConfig = {
  apiKey: "AIzaSyD1KyhwzPqFHnXt2S1OCaWGVYXUde6mj-8",
  authDomain: "havenplan-jkd.firebaseapp.com",
  databaseURL: "https://havenplan-jkd-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "havenplan-jkd",
  storageBucket: "havenplan-jkd.firebasestorage.app",
  messagingSenderId: "126216147433",
  appId: "1:126216147433:web:f23132c7c4db395368bb78"
};
firebase.initializeApp(firebaseConfig);
// Verkrijg toegang tot de database
const database = firebase.database();


// Functie om de boten uit Firebase te laden
function loadBoten() {
  const svg = document.getElementById('haven');
  const lijst = document.getElementById('botenLijst');
  lijst.innerHTML = ''; // Maak de lijst leeg voordat nieuwe boten worden toegevoegd

  // Haal boten op uit Firebase
  database.ref('boten').once('value').then(snapshot => {
    const data = snapshot.val();
    
    // Controleer of er gegevens zijn en voeg boten toe aan de lijst en SVG
    if (data) {
      console.log("Boten geladen:", data); // Debug: Bekijk de geladen boten
      Object.keys(data).forEach(id => {
        drawBoot(svg, data[id], id); // Voeg de boot toe aan de SVG
        addBootToMenu(data[id], id);  // Voeg de boot toe aan de botenlijst
      });
    } else {
      console.log("Geen boten gevonden in de database");
    }
  }).catch(error => {
    console.error("Fout bij het laden van boten:", error);
  });
}


// Boot tekenen
function drawBoot(svg, boot, id) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'bootgroep');
  group.setAttribute('data-id', id);
  group.addEventListener('mousedown', startDrag);
  group.addEventListener('touchstart', startDrag);  // Voor touch-apparaten

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', boot.x);
  rect.setAttribute('y', boot.y);
  rect.setAttribute('width', (boot.lengte || 12) * 5);  // Verhoog de schaal als nodig
  rect.setAttribute('height', (boot.breedte || 4) * 5);  // Verhoog de schaal als nodig
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
  
  // Maak een nieuw item voor de botenlijst
  const div = document.createElement('div');
  div.className = 'boot-item';
  div.innerHTML = `
    <strong>${boot.naam}</strong> (${boot.eigenaar || "Geen eigenaar"})
    <button onclick="editBoot('${id}')">✏️</button>
    <button onclick="deleteBoot('${id}')">🗑️</button>
  `;
  
  lijst.appendChild(div);
}


// Slepen starten
function startDrag(e) {
  e.preventDefault();  // Voorkom andere acties zoals tekst selecteren

  // Detecteer touch of muis
  if (e.type === 'touchstart') {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  } else {
    startX = e.clientX;
    startY = e.clientY;
  }

  document.querySelectorAll('.boot').forEach(b => b.classList.remove('selected'));
  e.target.classList.add('selected');
  selectedBoot = {
    group: e.target.parentNode,
    id: e.target.parentNode.getAttribute('data-id')
  };

  dragging = true;

  // Voeg touch en mouse events toe
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchmove', drag);  // Voor mobiel
  document.addEventListener('touchend', endDrag); // Voor mobiel
}

// Tijdens slepen
function drag(e) {
  if (!selectedBoot) return;

  let clientX, clientY;
  // Controleer welk type event er is (touch of mouse)
  if (e.type === 'touchmove') {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const svg = document.getElementById('haven');
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
  const boot = selectedBoot.group.querySelector('.boot');
  const label = selectedBoot.group.querySelector('text');
  boot.setAttribute('x', cursorpt.x - 30);
  boot.setAttribute('y', cursorpt.y - 10);
  label.setAttribute('x', cursorpt.x - 25);
  label.setAttribute('y', cursorpt.y + 5);
}

// Slepen stoppen
function endDrag(e) {
  dragging = false;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchmove', drag);  // Verwijder touchmove
  document.removeEventListener('touchend', endDrag); // Verwijder touchend

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
    // Sleepbeweging ➔ controleer positie
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
      let count = 0;
      document.querySelectorAll('.boot').forEach(b => {
        const bx = parseFloat(b.getAttribute('x'));
        const by = parseFloat(b.getAttribute('y'));
        if (bx >= wx && bx <= wx + ww && by >= wy && by <= wy + wh) {
          count++;
        }
      });

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

// Controleer of de boot in een ligplaats valt
function checkLigplaats(bootX, bootY) {
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
  return binnenLigplaats;
}

// Boot opslaan
function saveBoot() {
  if (!selectedBoot) return;
  const { id, group } = selectedBoot;
  const bootRect = group.querySelector('.boot');
  const bootLabel = group.querySelector('text');

  // Haal de bestaande boot op uit Firebase
  database.ref('boten/' + id).once('value').then(snapshot => {
    const oudeBoot = snapshot.val() || {};

    // Update de boot met de nieuwe gegevens
    const updatedBoot = {
      naam: bootLabel.textContent || "Boot",
      lengte: parseFloat(bootRect.getAttribute('width')) / 5,
      breedte: parseFloat(bootRect.getAttribute('height')) / 5,
      eigenaar: oudeBoot.eigenaar || "",     // Bewaar de eigenaar
      status: "aanwezig",  // Je kunt de status ook aanpassen indien nodig
      x: parseFloat(bootRect.getAttribute('x')),
      y: parseFloat(bootRect.getAttribute('y')),
      ligplaats: oudeBoot.ligplaats || "" // Bewaar de ligplaats als deze bestaat
    };

    // Sla de gewijzigde boot op in de Firebase-database
    database.ref('boten/' + id).set(updatedBoot);
  });
}

// Start de botenladen bij pagina-laden
window.onload = loadBoten;
