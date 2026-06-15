const { node, chrome, electron } = window.zamanGezgini.surumler;
document.getElementById('surumler').textContent =
  `Electron ${electron} · Chromium ${chrome} · Node.js ${node}`;
