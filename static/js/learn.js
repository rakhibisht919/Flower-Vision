/* Learn & Grow */
(function () {

  const STORAGE_KEY = 'fv_growth_tracker';

  // DOM refs
  const searchInput  = document.getElementById('learn-search-input');
  const searchBtn    = document.getElementById('learn-search-btn');
  const notFoundEl   = document.getElementById('learn-not-found');
  const notFoundMsg  = document.getElementById('learn-not-found-msg');
  const resultCard   = document.getElementById('learn-result-card');
  const trackerCard  = document.getElementById('tracker-card');
  const startBtn     = document.getElementById('learn-start-btn');
  const resetBtn     = document.getElementById('tracker-reset-btn');

  if (!searchInput) return;

  // Growth status labels
  function growthStatus(pct) {
    if (pct <= 0)   return '🌱 Just planted';
    if (pct < 15)   return '🌱 Just sprouting';
    if (pct < 35)   return '🌿 Growing steadily';
    if (pct < 60)   return '🌾 Well established';
    if (pct < 80)   return '🌼 Budding soon!';
    if (pct < 100)  return '🌸 Almost there!';
    return '🌺 Fully grown!';
  }

  // Render tracker
  function renderTracker() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { trackerCard.style.display = 'none'; return; }

    const data = JSON.parse(raw);
    const startDate  = new Date(data.startDate);
    const today      = new Date();
    const daysPassed = Math.floor((today - startDate) / 86400000);
    const total      = data.growthDays;
    const pct        = Math.min(Math.round((daysPassed / total) * 100), 100);
    const remaining  = Math.max(total - daysPassed, 0);

    document.getElementById('tracker-name').textContent     = data.flowerName;
    document.getElementById('tracker-start').textContent    = startDate.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
    document.getElementById('tracker-day-badge').textContent = `Day ${daysPassed} of ${total}`;
    document.getElementById('tracker-total').textContent    = total + ' days';
    document.getElementById('tracker-remaining').textContent = remaining + ' days';
    document.getElementById('tracker-status').textContent   = growthStatus(pct);
    document.getElementById('tracker-pct').textContent      = pct + '%';

    // Animate fill
    const fill = document.getElementById('tracker-fill');
    fill.style.width = '0%';
    setTimeout(() => { fill.style.width = pct + '%'; }, 100);

    trackerCard.style.display = 'block';
    trackerCard.classList.remove('animate-fade-up');
    void trackerCard.offsetWidth; // trigger reflow
    trackerCard.classList.add('animate-fade-up');
  }

  // Render flower details
  function renderResult(data) {
    const imgEl = document.getElementById('learn-flower-img');
    const safeName = data.key ? data.key.toLowerCase().replace(/[^a-z0-9_\-\s]/g, '').replace(/\s+/g, '_') : 'placeholder';
    imgEl.src = `/static/images/flowers/${safeName}.jpg`;
    imgEl.onerror = () => { imgEl.src = '/static/images/placeholder.png'; };

    document.getElementById('learn-name').textContent        = data.name || '—';
    document.getElementById('learn-scientific').textContent  = data.scientific_name || '';
    document.getElementById('learn-desc').textContent        = data.description || '—';
    document.getElementById('learn-uses').textContent        = data.uses || '—';
    document.getElementById('learn-care').textContent        = data.care || '—';
    document.getElementById('learn-symbolism').textContent   = data.symbolism || '—';
    document.getElementById('learn-facts').textContent       = data.fun_facts || '—';
    document.getElementById('learn-species').textContent     = data.species || '—';
    document.getElementById('learn-days').textContent        = data.growth_days || '—';
    document.getElementById('learn-growth-badge').textContent = `⏱ ~${data.growth_days || '?'} days`;

    const growMethods = data.grow_methods || {};
    document.getElementById('learn-seed').textContent = growMethods.seed || '—';
    document.getElementById('learn-stem').textContent = growMethods.stem || '—';

    startBtn.dataset.flowerName = data.name;
    startBtn.dataset.flowerKey  = data.key;
    startBtn.dataset.growthDays = data.growth_days || 90;

    trackerCard.style.display = 'none';

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const t = JSON.parse(stored);
      if (t.flowerKey === data.key) {
        startBtn.disabled    = true;
        startBtn.textContent = '✅ Already Tracking';
        renderTracker(); // Reveal tracker since they are tracking this one
      } else {
        startBtn.disabled    = false;
        startBtn.innerHTML   = '<i class="fa-solid fa-seedling"></i> Start Growing';
      }
    } else {
      startBtn.disabled  = false;
      startBtn.innerHTML = '<i class="fa-solid fa-seedling"></i> Start Growing';
    }

    resultCard.style.display = 'block';
    resultCard.classList.remove('animate-fade-up');
    void resultCard.offsetWidth; // trigger reflow
    resultCard.classList.add('animate-fade-up');
  }

  // Search
  async function doSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    notFoundEl.style.display    = 'none';
    resultCard.style.display    = 'none';
    resultCard.classList.remove('active');
    searchBtn.textContent       = '…';
    searchBtn.disabled          = true;

    try {
      const res  = await fetch(`/flower-info?name=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        notFoundMsg.textContent  = data.error || `No data found for "${query}".`;
        notFoundEl.style.display = 'flex';
      } else {
        renderResult(data);
      }
    } catch (err) {
      console.error('[FlowerVision] Search error:', err);
      notFoundMsg.textContent  = 'Network error — please try again.';
      notFoundEl.style.display = 'flex';
    } finally {
      searchBtn.textContent = 'Search';
      searchBtn.disabled    = false;
    }
  }

  // Start Growing
  startBtn.addEventListener('click', () => {
    const tracker = {
      flowerName: startBtn.dataset.flowerName,
      flowerKey:  startBtn.dataset.flowerKey,
      startDate:  new Date().toISOString(),
      growthDays: parseInt(startBtn.dataset.growthDays, 10),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
    renderTracker();

    startBtn.disabled    = true;
    startBtn.textContent = '✅ Already Tracking';
  });

  // Reset tracker
  resetBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    trackerCard.style.display = 'none';
    if (resultCard.style.display !== 'none') {
      startBtn.disabled  = false;
      startBtn.innerHTML = '<i class="fa-solid fa-seedling"></i> Start Growing';
    }
  });

  // Search triggers
  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

})();


/* Plant Care Help */
(function () {
  'use strict';

  // Advice database
  const CARE_ADVICE_DB = {
    'not-growing': {
      icon: '🌱',
      problem: 'Plant Is Not Growing',
      cause: 'Insufficient light, poor soil nutrients, root-bound conditions, or natural seasonal dormancy (especially common in winter).',
      todo: [
        'Move to a brighter spot — most plants need 6+ hours of indirect sunlight daily',
        'Feed with a balanced NPK liquid fertilizer (e.g. 10-10-10) every 2 weeks during growing season',
        'Check if roots are escaping the drainage holes — repot into a pot 1–2 sizes larger',
        'Water consistently but allow the top 2–3 cm of soil to dry between waterings',
      ],
      avoid: [
        'Avoid over-fertilizing — burnt roots can stunt growth worse than none',
        'Don\'t change the plant\'s location too frequently — it needs time to adjust',
        'Avoid using heavy clay soils that compact and restrict root expansion',
      ],
      tips: 'Many plants naturally slow or stop growing in winter (dormancy). This is normal and not a cause for alarm. Resume regular care when spring arrives and you\'ll see new growth.',
    },
    'yellow-leaves': {
      icon: '🍂',
      problem: 'Leaves Turning Yellow',
      cause: 'Overwatering or poor drainage is the most common cause, leading to root suffocation. Nitrogen deficiency, low light, or natural leaf aging can also cause yellowing.',
      todo: [
        'Check soil moisture — let the top 3 cm dry before watering again',
        'Lift the pot to check drainage holes — ensure water can flow freely',
        'Apply a nitrogen-rich liquid fertilizer to restore leaf colour',
        'Remove severely yellowed leaves cleanly to redirect energy to healthy growth',
      ],
      avoid: [
        'Avoid watering on a fixed schedule regardless of soil condition',
        'Don\'t let the plant sit in waterlogged saucers — empty them after watering',
        'Avoid harsh direct midday sunlight which scorches leaves',
      ],
      tips: 'A few yellowing lower leaves is perfectly normal as plants shed old foliage. Only worry when yellowing spreads rapidly to new or upper leaves — that signals a care issue.',
    },
    'not-blooming': {
      icon: '🌸',
      problem: 'Flower Is Not Blooming',
      cause: 'Insufficient light is the leading cause. Excess nitrogen pushes leafy growth at the cost of flowers. Some plants also require a cooler rest period to trigger bloom.',
      todo: [
        'Relocate to the brightest spot available — most flowering plants need 6–8 hours of bright light',
        'Switch to a phosphorus-rich bloom fertilizer (e.g. NPK 10-30-20) to stimulate flowering',
        'Prune leggy stems back by 1/3 to encourage compact new growth with buds',
        'Allow a brief cooler, drier rest period — many plants bloom after mild stress',
      ],
      avoid: [
        'Avoid high-nitrogen fertilizers during flowering season — they promote leaves, not blooms',
        'Don\'t overwater — slightly dry conditions trigger bloom for many species',
        'Avoid pruning too late in the growing season — you may accidentally remove forming buds',
      ],
      tips: 'Roses, orchids, and chrysanthemums bloom in cycles. Be patient and maintain consistent care. If buds form but drop before opening, check for sudden temperature changes or drafts.',
    },
    'drying-leaves': {
      icon: '🍃',
      problem: 'Leaves Drying or Browning',
      cause: 'Low humidity, chronic underwatering, salt buildup in soil from fertilizers, or placement near heat/AC vents that strip moisture from the air.',
      todo: [
        'Mist leaves with water or place the pot on a pebble tray filled with water to raise humidity',
        'Move the plant away from heating vents, air conditioners, and radiators',
        'Water deeply and thoroughly until water drains from the bottom',
        'Flush the soil occasionally by pouring water through it multiple times to remove fertilizer salt buildup',
      ],
      avoid: [
        'Avoid positioning near heaters, fans, or air conditioning units',
        'Don\'t allow the soil to dry out completely for extended periods',
        'Avoid using heavily fluoridated tap water — switch to filtered or rainwater if possible',
      ],
      tips: 'Brown leaf tips nearly always signal low humidity. A simple trick: group plants together — they naturally increase humidity around each other through transpiration.',
    },
    'overwatering': {
      icon: '💧',
      problem: 'Overwatering Issue',
      cause: 'Roots sitting in waterlogged soil are deprived of oxygen and rot rapidly. Symptoms include yellowing, mushy stems, mould on soil surface, and a sour smell from the soil.',
      todo: [
        'Stop watering immediately — let the soil dry out completely before considering watering again',
        'Gently remove the plant from its pot and inspect roots — trim black or mushy roots with sterilised scissors',
        'Repot in fresh, well-draining soil mixture if root rot is present',
        'Ensure the new/existing pot has multiple drainage holes at the bottom',
      ],
      avoid: [
        'Avoid watering on a fixed calendar schedule — always check soil moisture first with your finger',
        'Don\'t use large oversized pots for small plants — excess damp soil retains moisture far too long',
        'Never use pots without drainage holes — even "decorative" ones need a holed liner inside',
      ],
      tips: 'The golden rule: water only when the top 2–3 cm of soil feels dry to the touch. "When in doubt, don\'t water." Most plants recover faster from slight drought than from root rot.',
    },
    'underwatering': {
      icon: '🏜️',
      problem: 'Underwatering Issue',
      cause: 'The plant is not receiving enough water to maintain cellular pressure, causing wilting, dry compacted soil, crispy leaf edges, and slowed growth.',
      todo: [
        'Water thoroughly — pour until water flows freely from the drainage holes',
        'For severely dry, hydrophobic soil: soak the whole pot in a basin of water for 20–30 minutes until soil rehydrates',
        'Increase watering frequency during hot summer months or if the plant is in a sunny, warm spot',
        'Consider adding moisture-retaining perlite or coir to the soil mix',
      ],
      avoid: [
        'Don\'t give tiny "sip" waterings — always water deeply to reach all roots',
        'Avoid terracotta pots if you frequently forget to water — they dry out much faster than plastic',
        'Don\'t let roots remain completely dry for more than 2–3 days, especially during active growth',
      ],
      tips: 'A wilted plant often recovers dramatically within hours of proper watering. Use the "pot weight" trick: a dry pot feels very light — water when it feels light, not on a schedule.',
    },
    'pest-attack': {
      icon: '🐛',
      problem: 'Pest Attack',
      cause: 'Common culprits are aphids (tiny green/black bugs), spider mites (fine webbing under leaves), mealybugs (white cotton-like clusters), scale insects, and fungus gnats attracted by damp soil.',
      todo: [
        'Isolate the affected plant immediately from all other plants to prevent spreading',
        'Wipe leaves on both sides with a cotton ball dipped in diluted neem oil solution (2 tsp per litre)',
        'Spray with insecticidal soap (1 tsp dish soap in 1 litre water) and coat all leaf surfaces',
        'Repeat treatment every 5–7 days for 3–4 weeks to break the pest\'s life cycle',
      ],
      avoid: [
        'Don\'t bring new plants home without inspecting them carefully for pests first',
        'Avoid overwatering which creates the perfect environment for fungus gnats',
        'Don\'t ignore early signs — a few bugs can become thousands within days',
      ],
      tips: 'Yellow sticky traps are excellent for catching flying pests like fungus gnats and whiteflies. For outdoor plants, introduce beneficial insects like ladybugs and lacewings — nature\'s own pest control!',
    },
    'weak-stem': {
      icon: '🎋',
      problem: 'Weak or Drooping Stem',
      cause: 'Insufficient light causes etiolation — stems stretch thin toward light sources and become structurally weak. Overwatering, root rot, or top-heavy flower loads are also common causes.',
      todo: [
        'Move to a brighter spot — weak, leggy stems are almost always a sign of insufficient light',
        'Gently stake the stem with a bamboo cane or support stick, and loosely tie with soft garden twine',
        'Check the roots for rot and adjust watering accordingly',
        'Prune back some top foliage to reduce the weight the stem needs to support',
      ],
      avoid: [
        'Avoid tying stems too tightly — this cuts off the plant\'s circulation and causes more damage',
        'Don\'t keep the plant in very low or artificial light for extended periods',
        'Avoid fertilizing with high nitrogen when trying to build stem strength — it promotes soft, weak growth',
      ],
      tips: 'Outdoor plants develop stronger stems naturally due to wind. Indoors, gently brushing your plant\'s stems with your hand once or twice daily mimics this effect and stimulates structural growth over time!',
    },
    'no-buds': {
      icon: '🌼',
      problem: 'No Buds Appearing',
      cause: 'Insufficient light is the most common reason. Other causes include an excess of nitrogen fertilizer, temperature fluctuations, the plant being too young, or pruning at the wrong time of year.',
      todo: [
        'Ensure 6–8 hours of bright, consistent light — use a grow light if natural light is limited',
        'Switch to a high-phosphorus bloom booster fertilizer for 4–6 weeks',
        'Confirm the plant has reached its flowering maturity age (some take 2–3 years from seed)',
        'Maintain consistent temperature — avoid placing near drafty windows or air conditioning',
      ],
      avoid: [
        'Avoid pruning during or approaching bloom season — you may remove forming bud nodes',
        'Don\'t fertilize heavily with nitrogen — it pushes leafy growth at the expense of flowers',
        'Avoid repotting during the period when buds should be forming — stress halts bud development',
      ],
      tips: 'Some plants like peace lilies actually bloom better when slightly root-bound! Try skipping repotting for one season. Mild stress from drought can also trigger some species to bloom as a survival response.',
    },
    'other': {
      icon: '🌿',
      problem: 'General Plant Care',
      cause: 'Multiple factors affect plant health simultaneously — environment, watering habits, light levels, soil nutrients, pot size, humidity, and seasonal changes all play interconnected roles.',
      todo: [
        'Assess the 4 fundamentals: Light, Water, Soil & Nutrients, and Pot size — check each one',
        'Research your specific plant\'s native habitat and climate to better understand its natural needs',
        'Start a simple plant care log — note each watering, feeding, and any changes you observe',
        'Refer to the flower\'s detail card (search above) for its specific care instructions',
      ],
      avoid: [
        'Avoid making multiple changes at once — change one variable at a time so you can identify what helps',
        'Don\'t apply the exact same watering and feeding routine to all your plants',
        'Don\'t ignore small early warning signs — plants communicate through leaf colour, texture, and growth rate',
      ],
      tips: 'The secret to great plant care is regular observation. Spend 2–3 minutes with each plant every few days. You\'ll quickly learn to read their signals — a drooping leaf or a change in leaf colour always means something.',
    },
  };

  // DOM refs
  const issueSelect  = document.getElementById('care-issue-select');
  const adviceBtn    = document.getElementById('care-advice-btn');
  const adviceCard   = document.getElementById('care-advice-card');
  const customInput  = document.getElementById('care-custom-input');

  if (!adviceBtn) return; // guard

  // Get current flower name
  function getCurrentFlowerName() {
    const nameEl = document.getElementById('learn-name');
    if (nameEl && nameEl.textContent.trim()) return nameEl.textContent.trim();
    return null;
  }

  // Build list HTML
  function buildList(items) {
    return '<ul class="care-block-list">' +
      items.map(item => `<li>${item}</li>`).join('') +
      '</ul>';
  }

  // Render advice card
  function renderAdvice(key) {
    const advice     = CARE_ADVICE_DB[key];
    const flowerName = getCurrentFlowerName();
    const context    = flowerName
      ? `For your <strong>${flowerName}</strong>`
      : 'General advice for all plants';

    adviceCard.innerHTML = `
      <div class="care-problem-banner">
        <span class="care-problem-emoji">${advice.icon}</span>
        <div>
          <p class="care-problem-name">${advice.problem}</p>
          <p class="care-flower-context">${context}</p>
        </div>
      </div>
      <div class="care-advice-body">
        <div class="care-advice-grid">

          <div class="care-advice-block care-block--cause">
            <div class="care-block-heading">
              <i class="fa-solid fa-triangle-exclamation"></i> Possible Cause
            </div>
            <p class="care-block-text">${advice.cause}</p>
          </div>

          <div class="care-advice-block care-block--todo">
            <div class="care-block-heading">
              <i class="fa-solid fa-circle-check"></i> What To Do
            </div>
            ${buildList(advice.todo)}
          </div>

          <div class="care-advice-block care-block--avoid">
            <div class="care-block-heading">
              <i class="fa-solid fa-ban"></i> What To Avoid
            </div>
            ${buildList(advice.avoid)}
          </div>

          <div class="care-advice-block care-block--tips full-span">
            <div class="care-block-heading">
              <i class="fa-solid fa-lightbulb"></i> Extra Care Tip
            </div>
            <p class="care-block-text">${advice.tips}</p>
          </div>

        </div>
      </div>
    `;

    adviceCard.style.display = 'none';
    void adviceCard.offsetWidth;
    adviceCard.style.display = 'block';
    setTimeout(() => adviceCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  }

  // Button click handler
  adviceBtn.addEventListener('click', () => {
    const key = issueSelect.value;
    if (!key) {
      issueSelect.focus();
      issueSelect.style.borderColor = '#dc2626';
      issueSelect.style.boxShadow   = '0 0 0 4px rgba(220,38,38,0.12)';
      setTimeout(() => {
        issueSelect.style.borderColor = '';
        issueSelect.style.boxShadow   = '';
      }, 1800);
      return;
    }
    renderAdvice(key);
  });

  // Reset validation on change
  issueSelect.addEventListener('change', () => {
    issueSelect.style.borderColor = '';
    issueSelect.style.boxShadow   = '';
  });

})();

