/* FlowerVision Main Script */

(function () {
  'use strict';

  // Screen elements
  const flower3dScreen = document.getElementById('flower3d-screen');
  const intro = document.getElementById('intro');
  const landing = document.getElementById('landing');
  const mainApp = document.getElementById('main-app');

  const FADE_DURATION = 700;
  const INTRO_DURATION = 2200;

  const urlParams = new URLSearchParams(window.location.search);
  const skipIntroParam = urlParams.get('skip') === 'true';

  if (skipIntroParam) {
    if (flower3dScreen) flower3dScreen.style.display = 'none';
    if (intro) intro.style.display = 'none';
    showLanding();
  }

  flower3dScreen.addEventListener('flower3d:done', (e) => {
    if (skipIntroParam) {
      e.stopImmediatePropagation();
      return;
    }
    flower3dScreen.style.transition = 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1)';
    flower3dScreen.style.opacity = '0';
    flower3dScreen.style.pointerEvents = 'none';

    setTimeout(() => {
      flower3dScreen.style.display = 'none';
      showIntro();
    }, 900);
  });

  // Fallback if 3D fails to load
  setTimeout(() => {
    if (!skipIntroParam && flower3dScreen.style.display !== 'none') {
      flower3dScreen.dispatchEvent(new CustomEvent('flower3d:done'));
    }
  }, 6000);


  // Intro screen
  function showIntro() {
    intro.style.display = 'flex';
    void intro.offsetWidth;
    intro.classList.add('visible');

    setTimeout(() => {
      intro.classList.add('fade-out');
      setTimeout(() => {
        intro.style.display = 'none';
        showLanding();
      }, FADE_DURATION);
    }, INTRO_DURATION);
  }


  // Landing screen
  function showLanding() {
    landing.style.display = 'flex';
    void landing.offsetWidth;
    landing.classList.add('visible');
  }

  document.getElementById('get-started-btn').addEventListener('click', () => {
    landing.classList.add('fade-out');

    setTimeout(() => {
      landing.style.display = 'none';
      mainApp.style.display = 'flex';
      void mainApp.offsetWidth;
      mainApp.classList.add('visible');
      const homeBtn = document.getElementById('home-btn');
      if (homeBtn) homeBtn.style.display = 'inline-flex';
    }, FADE_DURATION);
  });

  document.getElementById('home-btn').addEventListener('click', () => {
    mainApp.classList.remove('visible');
    document.getElementById('home-btn').style.display = 'none';

    setTimeout(() => {
      mainApp.style.display = 'none';
      landing.style.display = 'flex';
      landing.classList.remove('fade-out');
      landing.scrollTop = 0;
      void landing.offsetWidth;
      landing.classList.add('visible');
    }, FADE_DURATION);
  });


  // Upload & file handling
  let selectedFile = null;

  const uploadCard = document.getElementById('upload-card');
  const fileInput = document.getElementById('file-input');
  const previewImg = document.getElementById('preview-img');
  const predictBtn = document.getElementById('predict-btn');
  const uploadHint = document.getElementById('upload-hint');
  const uploadIcon = document.getElementById('upload-icon');
  const chooseBtn = document.getElementById('choose-btn');

  uploadCard.addEventListener('click', (e) => {
    if (e.target !== chooseBtn && !chooseBtn.contains(e.target)) {
      fileInput.click();
    }
  });

  chooseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      handleFile(fileInput.files[0]);
    }
  });

  uploadCard.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadCard.classList.add('dragover');
  });

  ['dragleave', 'dragend'].forEach(ev => {
    uploadCard.addEventListener(ev, () => uploadCard.classList.remove('dragover'));
  });

  uploadCard.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadCard.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  });

  function handleFile(file) {
    selectedFile = file;
    previewImg.src = URL.createObjectURL(file);
    previewImg.style.display = 'block';
    uploadIcon.style.display = 'none';
    uploadHint.textContent = file.name;
    predictBtn.style.display = 'inline-flex';
    document.getElementById('results-section').classList.remove('show');
    document.getElementById('error-msg').classList.remove('show');
  }

  // Prediction API
  predictBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    predictBtn.disabled = true;
    predictBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';

    const analyzing = document.getElementById('analyzing-overlay');
    const resultsSection = document.getElementById('results-section');
    const errorMsg = document.getElementById('error-msg');

    resultsSection.classList.remove('show');
    errorMsg.classList.remove('show');
    analyzing.classList.add('show');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/predict', { method: 'POST', body: formData });

      // Guard against empty responses (e.g. server timeout / worker crash)
      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Server returned an empty response. The model may have run out of memory or timed out. Please try again with a smaller image.');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!response.ok || data.error) throw new Error(data.error || 'Server connection failed');

      renderResults(data);
      resultsSection.classList.add('show');
      setTimeout(() => resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    } catch (err) {
      errorMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${err.message}`;
      errorMsg.classList.add('show');
    } finally {
      analyzing.classList.remove('show');
      predictBtn.disabled = false;
      predictBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Identify Flower';
    }
  });

  // Render results
  function renderResults(data) {
    const { predictions, flower_info, freshness } = data;
    const top = predictions[0];

    document.getElementById('top-name').textContent = top.name;
    document.getElementById('top-confidence-text').textContent = `${top.confidence}% Match`;
    setTimeout(() => { document.getElementById('top-conf-fill').style.width = top.confidence + '%'; }, 100);

    setChip('chip-scientific', flower_info.scientific_name);
    setChip('chip-uses', flower_info.uses);
    setChip('chip-care', flower_info.care);
    setChip('chip-symbolism', flower_info.symbolism);
    setChip('chip-characteristics', flower_info.characteristics);
    setChip('chip-description', flower_info.description);

    const wikiBtn = document.getElementById('wiki-btn');
    if (flower_info.wikipedia_url) {
      wikiBtn.href = flower_info.wikipedia_url;
      wikiBtn.style.display = 'inline-flex';
    } else {
      wikiBtn.style.display = 'none';
    }

    document.getElementById('freshness-condition').textContent = freshness.condition;
    document.getElementById('freshness-days').textContent = `Estimated ${freshness.estimated_days} days since peak bloom`;
    document.getElementById('freshness-pct').textContent = `${freshness.freshness}%`;
    document.getElementById('freshness-metrics').textContent =
      `Saturation: ${freshness.saturation}% | Brightness: ${freshness.brightness}% | Sharpness: ${freshness.sharpness}%`;
    setTimeout(() => { document.getElementById('freshness-fill').style.width = freshness.freshness + '%'; }, 100);

    const matchesContainer = document.getElementById('other-matches');
    matchesContainer.innerHTML = '';
    predictions.slice(1).forEach(p => {
      matchesContainer.insertAdjacentHTML('beforeend', `
        <div class="match-row">
          <div class="match-name">${p.name}</div>
          <div class="match-bar-track">
            <div class="match-bar-fill" style="width: ${p.confidence}%"></div>
          </div>
          <div class="match-pct">${p.confidence}%</div>
        </div>
      `);
    });
  }

  function setChip(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const chipNode = el.closest('.info-chip');
    if (!value || value.trim() === '') {
      if (chipNode) chipNode.style.display = 'none';
    } else {
      if (chipNode) chipNode.style.display = 'flex';
      el.textContent = value;
    }
  }

})();


/* Model comparison */

(function () {
  'use strict';

  let accChart = null;
  let lossChart = null;

  const loadBtn = document.getElementById('comparison-load-btn');
  const statusEl = document.getElementById('comparison-status');
  const chartsEl = document.getElementById('comparison-charts');
  const tableWrapEl = document.getElementById('comparison-table-wrap');
  const tableTBody = document.getElementById('comparison-table-body');

  if (!loadBtn) return;

  loadBtn.addEventListener('click', loadComparison);

  async function loadComparison() {
    loadBtn.disabled = true;
    loadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

    try {
      const res = await fetch('/compare-models');
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      renderComparison(data);
    } catch (err) {
      showStatus('error', `<i class="fa-solid fa-triangle-exclamation"></i> ${err.message}`);
    } finally {
      loadBtn.disabled = false;
      loadBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Refresh Data';
    }
  }

  function renderComparison(data) {
    const models = ['EfficientNet', 'VGG16', 'MobileNetV2'];
    const trained = data.trained === true;

    if (!trained) {
      showStatus('warning',
        '<i class="fa-solid fa-circle-info"></i> ' +
        'Models not trained yet — showing placeholder. ' +
        'Run: <code>python train_models_compare.py</code>'
      );
    } else {
      showStatus('success',
        '<i class="fa-solid fa-circle-check"></i> Results loaded from latest training run.'
      );
    }

    const accValues = models.map(m => Math.round((data[m]?.accuracy || 0) * 10000) / 100);
    const valValues = models.map(m => Math.round((data[m]?.val_accuracy || 0) * 10000) / 100);
    const lossValues = models.map(m => Math.round((data[m]?.loss || 0) * 10000) / 10000);

    // Accuracy chart
    if (accChart) accChart.destroy();
    accChart = new Chart(
      document.getElementById('comparison-chart-accuracy'),
      {
        type: 'bar',
        data: {
          labels: models,
          datasets: [
            {
              label: 'Test Accuracy (%)',
              data: accValues,
              backgroundColor: [
                'rgba(52, 211, 153, 0.85)',
                'rgba(59, 130, 246, 0.85)',
                'rgba(167, 139, 250, 0.85)',
              ],
              borderColor: [
                'rgba(16, 185, 129, 1)',
                'rgba(37, 99, 235, 1)',
                'rgba(124, 58, 237, 1)',
              ],
              borderWidth: 1,
              borderRadius: 8,
            },
            {
              label: 'Val Accuracy (%)',
              data: valValues,
              backgroundColor: [
                'rgba(52, 211, 153, 0.35)',
                'rgba(59, 130, 246, 0.35)',
                'rgba(167, 139, 250, 0.35)',
              ],
              borderColor: [
                'rgba(16, 185, 129, 0.8)',
                'rgba(37, 99, 235, 0.8)',
                'rgba(124, 58, 237, 0.8)',
              ],
              borderWidth: 2,
              borderRadius: 8,
              borderDash: [4, 4],
            },
          ],
        },
        options: chartOptions('Accuracy (%)', 100),
      }
    );

    // Loss chart
    if (lossChart) lossChart.destroy();
    lossChart = new Chart(
      document.getElementById('comparison-chart-loss'),
      {
        type: 'bar',
        data: {
          labels: models,
          datasets: [
            {
              label: 'Test Loss',
              data: lossValues,
              backgroundColor: [
                'rgba(251, 113, 133, 0.85)',
                'rgba(251, 191, 36,  0.85)',
                'rgba(251, 146,  60, 0.85)',
              ],
              borderColor: [
                'rgba(244, 63, 94, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(234, 88,  12, 1)',
              ],
              borderWidth: 2,
              borderRadius: 8,
            },
          ],
        },
        options: chartOptions('Loss', null),
      }
    );

    // Metrics table
    tableTBody.innerHTML = '';
    models.forEach(m => {
      const d = data[m] || {};
      const accPct = accValues[models.indexOf(m)];
      const valPct = valValues[models.indexOf(m)];
      const loss = (d.loss || 0).toFixed(4);
      const maxAcc = Math.max(...accValues);
      const isWinner = trained && (accValues[models.indexOf(m)] === maxAcc);
      tableTBody.insertAdjacentHTML('beforeend', `
        <tr class="${isWinner ? 'winner-row' : ''}">
          <td class="model-name-cell">${isWinner ? '🏆 ' : ''}${m}</td>
          <td>${accPct}%</td>
          <td>${valPct}%</td>
          <td>${loss}</td>
        </tr>
      `);
    });

    chartsEl.style.display = 'grid';
    tableWrapEl.style.display = 'block';
  }

  function chartOptions(yLabel, suggestedMax) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e2e8f0',
            font: { family: 'DM Sans, sans-serif', size: 13 },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1,
          padding: 10,
        },
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { family: 'DM Sans', size: 13 } },
          grid: { color: 'rgba(148,163,184,0.1)' },
        },
        y: {
          beginAtZero: true,
          ...(suggestedMax ? { suggestedMax } : {}),
          title: {
            display: true,
            text: yLabel,
            color: '#94a3b8',
            font: { family: 'DM Sans', size: 12 },
          },
          ticks: { color: '#94a3b8', font: { family: 'DM Sans', size: 12 } },
          grid: { color: 'rgba(148,163,184,0.1)' },
        },
      },
      animation: {
        duration: 900,
        easing: 'easeOutQuart',
      },
    };
  }

  function showStatus(type, html) {
    statusEl.innerHTML = html;
    statusEl.className = `comparison-status comparison-status--${type}`;
    statusEl.style.display = 'block';
  }

})();

/* App tabs */
(function () {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
      });

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.getAttribute('data-target'));
      if (targetPane) {
        targetPane.style.display = 'flex';
        setTimeout(() => targetPane.classList.add('active'), 10);
      }
    });
  });
})();
