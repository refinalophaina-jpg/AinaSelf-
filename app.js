/* ============================================================
   Communication Mastery Blueprint — PWA Application
   ============================================================ */

// --- Constants & State -------------------------------------

const MODULE_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

const MODULE_TITLES = [
  'Mapping the 3 Nested Conversations',
  'Dismantling the Identity Quake',
  'Establishing Conversational Safety',
  'Mastering Internal Narratives',
  'Overcoming the Loner Baseline'
];

const PROGRESS_KEY = 'cmb_progress';

let DATA = null;

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p.current_step === 'number' && Array.isArray(p.completed_steps)) {
        return p;
      }
    }
  } catch (e) { /* ignore */ }
  return { current_step: 1, completed_steps: [] };
}

function saveProgress(p) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

let progress = loadProgress();

// --- Service Worker ----------------------------------------

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  });
}

// --- Navigation --------------------------------------------

function initNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = 'view-' + btn.dataset.view;
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      const view = document.getElementById(viewId);
      if (view) view.classList.add('active');
    });
  });
}

function switchToView(viewName) {
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewName);
  });
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('active', v.id === 'view-' + viewName);
  });
}

// --- Helpers -----------------------------------------------

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function moduleColor(step) {
  return MODULE_COLORS[(step - 1) % MODULE_COLORS.length];
}

function moduleColorForIndex(i) {
  return MODULE_COLORS[i % MODULE_COLORS.length];
}

function chevronSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
    <polyline points="6 9 12 15 18 9"/>
  </svg>`;
}

function formatTimestamp(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function platformIcon(platform) {
  if (platform === 'YouTube') return '📺';
  return '🎙';
}

// Find chapter for a given module step
function findChapterForStep(step) {
  for (const book of DATA.books) {
    for (const ch of book.chapters) {
      if (ch.assigned_module === step) {
        return { book, chapter: ch };
      }
    }
  }
  return null;
}

// --- Render All --------------------------------------------

function renderAll() {
  progress = loadProgress();
  document.getElementById('header-step').textContent =
    `Step ${progress.current_step} of 5`;

  renderToday();
  renderRead();
  renderListen();
  renderWatch();
  renderMore();
}

// ===========================================================
// TODAY VIEW
// ===========================================================

function renderToday() {
  const step = progress.current_step;
  const color = moduleColor(step);
  const title = MODULE_TITLES[step - 1];

  const toWork = DATA.media.to_work[step - 1];
  const fromWork = DATA.media.from_work[step - 1];
  const chapterData = findChapterForStep(step);

  // Progress dots
  let dotsHTML = '';
  for (let i = 1; i <= 5; i++) {
    let cls = 'future';
    if (progress.completed_steps.includes(i)) cls = 'completed';
    else if (i === step) cls = 'current';
    dotsHTML += `<div class="progress-dot ${cls}" title="Step ${i}: ${MODULE_TITLES[i-1]}"></div>`;
  }

  // Complete button state
  const allDone = progress.completed_steps.length === 5 ||
    (progress.completed_steps.includes(step) && step === 5);
  const btnLabel = allDone
    ? '🌟 Full Sequence Complete'
    : `Mark Step ${step} Complete ✓`;

  // Book/chapter section
  let readingHTML = '';
  if (chapterData) {
    const { book, chapter } = chapterData;
    readingHTML = `
      <div class="card">
        <div class="commute-label">📖 TONIGHT</div>
        <div class="reading-book-title">${esc(book.title)}</div>
        <div class="reading-chapter">Chapter ${chapter.number}: ${esc(chapter.title)}</div>
        <div class="reading-actions">
          <button class="btn btn-primary" id="btn-read-summary"
            data-book="${esc(book.id)}" data-ch="${chapter.number}">
            Read Summary
          </button>
          <a class="btn btn-outline" href="${esc(book.borrow_url)}"
            target="_blank" rel="noopener noreferrer">
            Borrow Full Book ↗
          </a>
        </div>
      </div>`;
  }

  const view = document.getElementById('view-today');
  view.innerHTML = `
    <div class="module-banner">
      <div class="module-step-label">STEP ${step} OF 5</div>
      <div class="module-title">${esc(title)}</div>
      <div class="progress-dots">${dotsHTML}</div>
    </div>

    ${toWork ? renderCommuteCard(toWork, '🚗 TO WORK') : ''}
    ${fromWork ? renderCommuteCard(fromWork, '🚗 FROM WORK') : ''}
    ${readingHTML}

    <div class="section-heading">🧪 DAILY EXPORTS</div>
    ${DATA.exports.map((ex, i) => `
      <div class="export-card">
        <div class="export-number">${i + 1}</div>
        <div class="export-content">
          <div class="export-name">${esc(ex.name)}</div>
          <div class="export-prompt">${esc(ex.prompt)}</div>
          <div class="export-example">"${esc(ex.example)}"</div>
        </div>
      </div>`).join('')}

    <button class="btn btn-success" id="btn-complete" ${allDone ? 'disabled' : ''}>
      ${btnLabel}
    </button>
  `;

  // Wire up "Read Summary" button
  const readBtn = view.querySelector('#btn-read-summary');
  if (readBtn) {
    readBtn.addEventListener('click', () => {
      const bookId = readBtn.dataset.book;
      const chNum = parseInt(readBtn.dataset.ch, 10);
      switchToView('read');
      // Wait a tick for render, then open the right section
      setTimeout(() => openBookAndChapter(bookId, chNum), 50);
    });
  }

  // Wire up complete button
  const completeBtn = view.querySelector('#btn-complete');
  if (completeBtn && !allDone) {
    completeBtn.addEventListener('click', () => {
      const p = loadProgress();
      if (p.current_step === 5 && !p.completed_steps.includes(5)) {
        p.completed_steps.push(5);
        saveProgress(p);
        renderAll();
        alert('🌟 Full Sequence Complete! You have finished all 5 modules.');
      } else if (p.current_step < 5) {
        if (!p.completed_steps.includes(p.current_step)) {
          p.completed_steps.push(p.current_step);
        }
        p.current_step = p.current_step + 1;
        saveProgress(p);
        renderAll();
      }
    });
  }
}

function renderYTEmbed(item, uid) {
  if (!item.youtube_id) return '';
  const src = `https://www.youtube.com/embed/${item.youtube_id}?start=${item.timestamp || 0}&rel=0&modestbranding=1`;
  return `
    <div class="yt-embed-container" id="${uid}" data-open="0" style="display:none;">
      <div class="video-wrapper">
        <iframe src="${src}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen loading="lazy" title="${esc(item.title)}"></iframe>
      </div>
    </div>`;
}

function renderCommuteCard(item, label) {
  const uid = `embed-${label.replace(/\W+/g, '-')}-m${item.module}`;
  const durationLabel = `${item.duration_mins} MIN`;
  const tsNote = item.timestamp ? ` · starts ${formatTimestamp(item.timestamp)}` : '';

  const playRow = item.youtube_id
    ? `<button class="btn btn-play" data-toggle-embed="${uid}">▶ Play Here</button>
       <a class="btn btn-outline-sm" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">↗ YouTube</a>`
    : `<a class="btn btn-play" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">▶ PLAY</a>`;

  return `
    <div class="card">
      <div class="commute-label">${label} · ${durationLabel}${tsNote}</div>
      <div class="commute-title">${esc(item.title)}</div>
      <div class="commute-show">${esc(item.show)} · ${esc(item.network)}</div>
      <div class="commute-row">
        ${playRow}
        <span class="badge badge-platform">${esc(item.platform)}</span>
      </div>
      ${renderYTEmbed(item, uid)}
    </div>`;
}

// ===========================================================
// READ VIEW
// ===========================================================

function renderRead() {
  const view = document.getElementById('view-read');
  const step = progress.current_step;

  let html = '<div class="section-heading">READING LIBRARY</div>';

  DATA.books.forEach(book => {
    const chaptersHTML = book.chapters.map(ch => {
      const modColor = ch.assigned_module ? moduleColor(ch.assigned_module) : null;
      const modBadge = modColor
        ? `<span class="badge badge-module" style="background:${modColor}22;color:${modColor};border:1px solid ${modColor}44;">MODULE ${ch.assigned_module}</span>`
        : '';

      const conceptsHTML = ch.key_concepts
        .map(c => `<li>${esc(c)}</li>`)
        .join('');

      return `
        <div class="chapter-item" data-book="${esc(book.id)}" data-ch="${ch.number}">
          <div class="chapter-header">
            <div class="chapter-num">Ch ${ch.number}</div>
            <div class="chapter-title-text">${esc(ch.title)}</div>
            <div class="chapter-badges">${modBadge}</div>
            <div class="chapter-chevron">${chevronSVG()}</div>
          </div>
          <div class="chapter-body">
            <p class="chapter-summary">${esc(ch.summary)}</p>
            <blockquote class="chapter-quote">"${esc(ch.key_quote)}"</blockquote>
            <div class="section-heading" style="margin-top:14px;">KEY CONCEPTS</div>
            <ul class="chapter-concepts">${conceptsHTML}</ul>
            <div class="chapter-actions">
              <a class="btn btn-outline" href="${esc(book.borrow_url)}"
                target="_blank" rel="noopener noreferrer">
                Borrow &amp; Read Full Book ↗
              </a>
            </div>
          </div>
        </div>`;
    }).join('');

    html += `
      <div class="book-section" data-book-id="${esc(book.id)}">
        <div class="book-header">
          <div class="book-spine" style="background:${book.cover_color};"></div>
          <div class="book-header-content">
            <div class="book-title-main">${esc(book.title)}</div>
            <div class="book-subtitle">${esc(book.subtitle)}</div>
            <div class="book-authors">${esc(book.authors)}</div>
          </div>
          <div class="book-chevron">${chevronSVG()}</div>
        </div>
        <div class="chapter-list">${chaptersHTML}</div>
      </div>`;
  });

  view.innerHTML = html;

  // Wire up book toggles
  view.querySelectorAll('.book-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.book-section');
      section.classList.toggle('open');
    });
  });

  // Wire up chapter toggles
  view.querySelectorAll('.chapter-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.chapter-item');
      item.classList.toggle('open');
    });
  });

  // Auto-open current step's book + chapter
  const chapterData = findChapterForStep(step);
  if (chapterData) {
    openBookAndChapter(chapterData.book.id, chapterData.chapter.number);
  }
}

function openBookAndChapter(bookId, chNum) {
  const view = document.getElementById('view-read');
  const section = view.querySelector(`.book-section[data-book-id="${bookId}"]`);
  if (section) {
    section.classList.add('open');
    const chItem = section.querySelector(`.chapter-item[data-ch="${chNum}"]`);
    if (chItem) {
      chItem.classList.add('open');
      setTimeout(() => {
        chItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
}

// ===========================================================
// LISTEN VIEW
// ===========================================================

function renderListen() {
  const view = document.getElementById('view-listen');
  const step = progress.current_step;

  const toWorkHTML = DATA.media.to_work.map(item => renderMediaCard(item, step, 'tw')).join('');
  const fromWorkHTML = DATA.media.from_work.map(item => renderMediaCard(item, step, 'fw')).join('');

  view.innerHTML = `
    <div class="section-heading">TO WORK QUEUE</div>
    ${toWorkHTML}
    <div class="section-heading">FROM WORK QUEUE</div>
    ${fromWorkHTML}
  `;
}

function renderMediaCard(item, currentStep, queueKey) {
  const isCurrent = item.module === currentStep;
  const color = moduleColor(item.module);
  const uid = `embed-${queueKey}-m${item.module}`;
  const tsLabel = item.timestamp ? ` · starts ${formatTimestamp(item.timestamp)}` : '';

  const currentBadge = isCurrent
    ? `<span class="badge badge-current">CURRENT</span>` : '';

  const playRow = item.youtube_id
    ? `<button class="btn btn-play" data-toggle-embed="${uid}">▶ Play Here</button>
       <a class="btn btn-outline-sm" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">↗ YouTube</a>`
    : `<a class="btn btn-play" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">▶ PLAY</a>`;

  return `
    <div class="media-card ${isCurrent ? 'current-module' : ''}"
      style="${isCurrent ? `border-left-color:${color};` : ''}">
      <div class="media-info">
        <div class="media-show">${esc(item.show)} · Module ${item.module}</div>
        <div class="media-title">${esc(item.title)}</div>
        <div class="media-theme">${esc(item.theme)}</div>
        <div class="media-row">
          ${playRow}
          <span class="badge badge-duration">${item.duration_mins} MIN${tsLabel}</span>
          ${currentBadge}
        </div>
      </div>
      ${renderYTEmbed(item, uid)}
    </div>`;
}

// ===========================================================
// WATCH VIEW
// ===========================================================

function renderWatch() {
  const view = document.getElementById('view-watch');
  const step = progress.current_step;

  // Find current module's to_work item with youtube_id
  const currentVideo = DATA.media.to_work[step - 1];
  const hasVideo = currentVideo && currentVideo.youtube_id;

  let heroHTML = '';
  if (hasVideo) {
    const src = `https://www.youtube.com/embed/${currentVideo.youtube_id}?start=${currentVideo.timestamp}&rel=0`;
    heroHTML = `
      <div class="video-info">
        <div class="video-title">${esc(currentVideo.title)}</div>
        <div class="video-meta">${esc(currentVideo.show)} · ${esc(currentVideo.network)} · Module ${step}: ${esc(currentVideo.theme)}</div>
      </div>
      <div class="video-wrapper">
        <iframe
          src="${src}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
          title="${esc(currentVideo.title)}">
        </iframe>
      </div>`;
  } else {
    heroHTML = `
      <div class="no-video-card">
        <div class="no-video-icon">🎙</div>
        <div class="no-video-text">Today's commute audio is a podcast — open it in Listen to play it in your podcast app.</div>
        <button class="btn btn-primary" id="btn-go-listen">Go to Listen ↗</button>
      </div>`;
  }

  // All video segments (both queues, all have youtube_id now)
  const toWorkVideos = DATA.media.to_work.filter(i => i.youtube_id);
  const fromWorkVideos = DATA.media.from_work.filter(i => i.youtube_id);

  function watchVideoCard(item, queueKey) {
    const uid = `embed-watch-${queueKey}-m${item.module}`;
    const tsLabel = item.timestamp ? ` · starts ${formatTimestamp(item.timestamp)}` : '';
    return `
      <div class="video-card">
        <div class="video-card-info">
          <div class="video-card-title">${esc(item.title)}</div>
          <div class="video-card-ts">${esc(item.show)} · Module ${item.module}${tsLabel}</div>
        </div>
        <div class="video-card-actions">
          <button class="btn btn-play" data-toggle-embed="${uid}">▶ Play</button>
          <a class="btn btn-outline-sm" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">↗</a>
        </div>
        ${renderYTEmbed(item, uid)}
      </div>`;
  }

  const toWorkVideoCards = toWorkVideos.map(i => watchVideoCard(i, 'tw')).join('');
  const fromWorkVideoCards = fromWorkVideos.map(i => watchVideoCard(i, 'fw')).join('');

  view.innerHTML = `
    ${heroHTML}
    <div class="section-heading">TO WORK — ALL MODULES</div>
    ${toWorkVideoCards}
    <div class="section-heading">FROM WORK — ALL MODULES</div>
    ${fromWorkVideoCards}
  `;

  // Wire up "go to listen" button if present
  const goListenBtn = view.querySelector('#btn-go-listen');
  if (goListenBtn) {
    goListenBtn.addEventListener('click', () => switchToView('listen'));
  }
}

// ===========================================================
// MORE VIEW
// ===========================================================

function renderMore() {
  const view = document.getElementById('view-more');
  const step = progress.current_step;

  // --- Scripts ---
  const scriptsHTML = DATA.scripts.map(script => `
    <div class="script-card" data-script="${esc(script.id)}">
      <div class="script-header">
        <div class="script-name">${esc(script.name)}</div>
        <div class="script-chevron">${chevronSVG()}</div>
      </div>
      <div class="script-body">
        <div class="script-trigger">
          WHEN: <span>${esc(script.trigger)}</span>
        </div>
        <div class="script-text" data-script-text="${esc(script.id)}">"${esc(script.text)}"</div>
        <div class="script-copy-row">
          <button class="btn btn-copy" data-copy="${esc(script.id)}">Copy</button>
        </div>
      </div>
    </div>`).join('');

  // --- Module cards ---
  const modulesHTML = MODULE_TITLES.map((title, i) => {
    const s = i + 1;
    const color = moduleColorForIndex(i);
    const tw = DATA.media.to_work[i];
    const fw = DATA.media.from_work[i];
    const chData = findChapterForStep(s);

    const detailRows = `
      <div class="module-detail-row">
        <div class="module-detail-icon">🚗</div>
        <div>
          <div class="module-detail-label">To Work</div>
          <div class="module-detail-value">${tw ? esc(tw.title) : '—'}</div>
        </div>
      </div>
      <div class="module-detail-row">
        <div class="module-detail-icon">🏠</div>
        <div>
          <div class="module-detail-label">From Work</div>
          <div class="module-detail-value">${fw ? esc(fw.title) : '—'}</div>
        </div>
      </div>
      <div class="module-detail-row">
        <div class="module-detail-icon">📖</div>
        <div>
          <div class="module-detail-label">Reading</div>
          <div class="module-detail-value">${chData
            ? `${esc(chData.book.title)} — Ch ${chData.chapter.number}: ${esc(chData.chapter.title)}`
            : '—'}</div>
        </div>
      </div>`;

    return `
      <div class="module-card" data-module="${s}">
        <div class="module-card-header">
          <div class="module-step-dot" style="background:${color};">${s}</div>
          <div class="module-card-title">${esc(title)}</div>
          <div class="module-card-chevron">${chevronSVG()}</div>
        </div>
        <div class="module-card-body">
          ${detailRows}
        </div>
      </div>`;
  }).join('');

  view.innerHTML = `
    <div class="section-heading">CONVERSATION SCRIPTS</div>
    ${scriptsHTML}

    <div class="section-heading">ALL MODULES</div>
    ${modulesHTML}

    <div class="reset-section">
      <button class="btn btn-danger-ghost" id="btn-reset">Reset Progress</button>
    </div>
  `;

  // Wire up script accordions
  view.querySelectorAll('.script-card').forEach(card => {
    const header = card.querySelector('.script-header');
    header.addEventListener('click', () => card.classList.toggle('open'));
  });

  // Wire up copy buttons
  view.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const scriptId = btn.dataset.copy;
      const script = DATA.scripts.find(s => s.id === scriptId);
      if (script && navigator.clipboard) {
        navigator.clipboard.writeText(script.text).then(() => {
          const orig = btn.textContent;
          btn.textContent = 'Copied ✓';
          setTimeout(() => { btn.textContent = orig; }, 2000);
        }).catch(() => {});
      }
    });
  });

  // Wire up module card accordions
  view.querySelectorAll('.module-card').forEach(card => {
    const header = card.querySelector('.module-card-header');
    header.addEventListener('click', () => card.classList.toggle('open'));
  });

  // Wire up reset button
  const resetBtn = view.querySelector('#btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all progress and return to Step 1?')) {
        const fresh = { current_step: 1, completed_steps: [] };
        saveProgress(fresh);
        renderAll();
      }
    });
  }
}

// --- Init --------------------------------------------------

async function init() {
  try {
    const res = await fetch('content.json');
    DATA = await res.json();
  } catch (e) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100dvh;
        font-family:sans-serif;color:#e8e8f2;background:#070710;padding:24px;text-align:center;">
        <div>
          <div style="font-size:2rem;margin-bottom:12px;">⚠️</div>
          <div style="font-size:1rem;color:#8888aa;">Failed to load content.json.<br>
          Please ensure you are serving this app via a local server or HTTPS.</div>
        </div>
      </div>`;
    return;
  }

  // Global embed toggle — handles all "▶ Play Here" buttons anywhere in the app
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-toggle-embed]');
    if (!btn) return;
    const target = document.getElementById(btn.dataset.toggleEmbed);
    if (!target) return;
    const isOpen = target.dataset.open === '1';
    target.style.display = isOpen ? 'none' : 'block';
    target.dataset.open = isOpen ? '0' : '1';
    btn.textContent = isOpen ? '▶ Play Here' : '▼ Collapse';
  });

  initNav();
  renderAll();
}

init();
