// Streckgubben Cloud och hans moln: delas av startsidans hero-gubbe (src/hero-stickman.js) och undersidornas
// gubbe (src/cloud-buddy.js). Stil och grundställningar: src/stickman.css.
export var NS = 'http://www.w3.org/2000/svg';

// Gubben: viewBox 40×60, höft i (20,34), axlar i (20,18), fötter i y≈58
function limb(x, y, cls, len, child) {
  var g = document.createElementNS(NS, 'g');
  g.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
  var r = document.createElementNS(NS, 'g');
  r.setAttribute('class', 'hs-limb ' + cls);
  var l = document.createElementNS(NS, 'line');
  l.setAttribute('x1', 0); l.setAttribute('y1', 0); l.setAttribute('x2', 0); l.setAttribute('y2', len);
  r.appendChild(l);
  if (child) r.appendChild(child);
  g.appendChild(r);
  return g;
}
export function makeFigure(h) {
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 40 60');
  svg.setAttribute('width', h * 40 / 60);
  svg.setAttribute('height', h);
  svg.setAttribute('class', 'hs-fig');
  var body = document.createElementNS(NS, 'g');
  body.setAttribute('class', 'hs-body');
  body.innerHTML = '<line x1="20" y1="15" x2="20" y2="34"/><circle class="hs-head" cx="21" cy="8.5" r="6"/>';
  // bakre arm/ben först (ritas bakom kroppen)
  body.insertBefore(limb(20, 18, 'hs-arm-l', 14), body.firstChild);
  body.insertBefore(limb(20, 34, 'hs-thigh-l', 12, limb(0, 12, 'hs-shin-l', 12)), body.firstChild);
  body.appendChild(limb(20, 34, 'hs-thigh-r', 12, limb(0, 12, 'hs-shin-r', 12)));
  body.appendChild(limb(20, 18, 'hs-arm-r', 14));
  svg.appendChild(body);
  return svg;
}
export function makeCloud(w) {
  var c = document.createElement('div');
  c.className = 'hs-cloud';
  c.style.width = w + 'px';
  c.innerHTML = '<div class="hs-bob"><div class="hs-puff"><svg viewBox="0 0 200 100"><path d="M42 92C19 92 5 78 9 61C12 47 25 39 38 42C39 23 57 10 77 14C88 2 113 0 126 15C141 6 163 13 167 32C184 32 197 47 193 65C190 81 177 92 160 92Z"/></svg></div></div>';
  return c;
}
