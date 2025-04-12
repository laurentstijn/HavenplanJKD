
fetch('boten.json')
  .then(response => response.json())
  .then(data => {
    const svg = document.getElementById('haven');

    data.boten.forEach((boot, index) => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      const ligplaats = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      ligplaats.setAttribute('x', boot.x);
      ligplaats.setAttribute('y', boot.y);
      ligplaats.setAttribute('width', 120);
      ligplaats.setAttribute('height', 30);
      ligplaats.setAttribute('class', 'ligplaats');
      group.appendChild(ligplaats);

      const bootRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bootRect.setAttribute('x', boot.x + 10);
      bootRect.setAttribute('y', boot.y + 5);
      bootRect.setAttribute('width', boot.lengte * 5);
      bootRect.setAttribute('height', boot.breedte * 5);
      bootRect.setAttribute('class', 'boot');
      bootRect.setAttribute('data-id', index);
      makeDraggable(bootRect);
      group.appendChild(bootRect);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', boot.x + 15);
      label.setAttribute('y', boot.y + 25);
      label.setAttribute('class', 'label');
      label.textContent = boot.naam;
      group.appendChild(label);

      svg.appendChild(group);
    });
  });

function makeDraggable(element) {
  let offsetX, offsetY, selected = null;

  element.addEventListener('mousedown', (e) => {
    selected = element;

    const svg = document.getElementById('haven');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());

    offsetX = cursorpt.x - parseFloat(element.getAttribute('x'));
    offsetY = cursorpt.y - parseFloat(element.getAttribute('y'));

    selected.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (selected) {
      const svg = document.getElementById('haven');
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());

      selected.setAttribute('x', cursorpt.x - offsetX);
      selected.setAttribute('y', cursorpt.y - offsetY);
    }
  });

  window.addEventListener('mouseup', () => {
    if (selected) {
      selected.style.cursor = 'grab';
      selected = null;
    }
  });
}

