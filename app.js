/* ============================================================
   Aina Dara — Communication Mastery Hub
   ============================================================ */

// --- Constants & State -------------------------------------

const MODULE_COLORS = [
  '#9966dd', // m1 — purple
  '#4488cc', // m2 — blue
  '#33aa88', // m3 — teal
  '#cc8822', // m4 — amber
  '#cc5577'  // m5 — rose
];

const MODULE_TITLES = [
  'Mapping the 3 Nested Conversations',
  'Dismantling the Identity Quake',
  'Establishing Conversational Safety',
  'Mastering Internal Narratives',
  'Overcoming the Loner Baseline'
];

const MODULE_CONCEPTS = [
  'Three nested conversations: What Happened, Feelings, Identity. The Identity layer is the freeze engine.',
  'Identity quake: threat to competence, goodness, or lovability. All-or-nothing thinking causes verbal shutdown.',
  'Psychological safety is the prerequisite for honest dialogue. Silence vs. Violence modes.',
  'The Path to Action: Event → Story → Feeling → Act. The story (not the event) causes the freeze.',
  'The loner baseline: closed-system processing. Bids for connection are the currency of intimacy.'
];

const PROGRESS_KEY = 'cmb_progress';

let DATA = null;

// --- Progress ---------------------------------------------

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

// --- Item Completion Tracking ----------------------------

const ITEMS_KEY = 'aina_done';
const NAME_KEY  = 'aina_name';

function loadItems() {
  try { return JSON.parse(localStorage.getItem(ITEMS_KEY) || '{}'); }
  catch (e) { return {}; }
}

function saveItems(items) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

function toggleItem(key) {
  const items = loadItems();
  if (items[key]) { delete items[key]; } else { items[key] = Date.now(); }
  saveItems(items);
  return !!items[key];
}

function isItemDone(key) {
  return !!loadItems()[key];
}

function getStats() {
  const done = loadItems();
  let chRead = 0, totalCh = 0, cmbWatched = 0, trackWatched = 0;
  DATA.books.forEach(b => b.chapters.forEach(ch => {
    totalCh++;
    if (done[`ch_${b.id}_${ch.number}`]) chRead++;
  }));
  DATA.media.to_work.forEach(i => { if (done[`media_tw_m${i.module}`]) cmbWatched++; });
  DATA.media.from_work.forEach(i => { if (done[`media_fw_m${i.module}`]) cmbWatched++; });
  if (DATA.tracks) DATA.tracks.forEach(t => {
    if (done[`track_tw_${t.id}`]) trackWatched++;
    if (done[`track_fw_${t.id}`]) trackWatched++;
  });
  return {
    chRead, totalCh,
    cmbWatched, cmbTotal: 10,
    trackWatched, trackTotal: DATA.tracks ? DATA.tracks.length * 2 : 0
  };
}

function exportSyncCode() {
  return btoa(JSON.stringify({
    p: localStorage.getItem(PROGRESS_KEY) || '{}',
    d: localStorage.getItem(ITEMS_KEY) || '{}',
    n: localStorage.getItem(NAME_KEY) || ''
  }));
}

function importSyncCode(code) {
  try {
    const obj = JSON.parse(atob(code.trim()));
    if (obj.p) localStorage.setItem(PROGRESS_KEY, obj.p);
    if (obj.d) localStorage.setItem(ITEMS_KEY, obj.d);
    if (obj.n) localStorage.setItem(NAME_KEY, obj.n);
    return true;
  } catch (e) { return false; }
}

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
      const viewName = btn.dataset.view;
      switchToView(viewName);
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

function chevronSVG(size) {
  const s = size || 18;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="${s}" height="${s}">
    <polyline points="6 9 12 15 18 9"/>
  </svg>`;
}

function formatTimestamp(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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

// --- YouTube Embed -----------------------------------------

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

// --- Render All --------------------------------------------

function renderAll() {
  progress = loadProgress();
  document.getElementById('header-step').textContent =
    `Step ${progress.current_step} of 5`;

  renderHome();
  renderLibrary();
  renderMedia();
  renderPractice();
  renderMap();
}

// ===========================================================
// HOME VIEW
// ===========================================================

function renderHome() {
  const step = progress.current_step;
  const color = moduleColor(step);
  const title = MODULE_TITLES[step - 1];

  const toWork = DATA.media.to_work[step - 1];
  const fromWork = DATA.media.from_work[step - 1];
  const chapterData = findChapterForStep(step);

  // Progress bar segments
  let segmentsHTML = '';
  for (let i = 1; i <= 5; i++) {
    let cls = '';
    if (progress.completed_steps.includes(i)) cls = 'done';
    else if (i === step) cls = 'current';
    segmentsHTML += `<div class="seg ${cls}" title="Step ${i}: ${MODULE_TITLES[i-1]}"></div>`;
  }

  // Complete button state
  const isAllDone = progress.completed_steps.length === 5;
  const btnLabel = isAllDone
    ? 'Full Sequence Complete'
    : `Mark Step ${step} Complete`;

  // Tonight's reading
  let readingHTML = '';
  if (chapterData) {
    const { book, chapter } = chapterData;
    readingHTML = `
      <div class="reading-card">
        <div class="reading-label">Tonight's Reading</div>
        <div class="reading-book-title">${esc(book.title)}</div>
        <div class="reading-chapter">Chapter ${chapter.number}: ${esc(chapter.title)}</div>
        <div class="reading-actions">
          <button class="btn btn-primary" id="btn-read-summary"
            data-book="${esc(book.id)}" data-ch="${chapter.number}">
            Read Summary
          </button>
          <a class="btn btn-outline" href="${esc(book.borrow_url)}"
            target="_blank" rel="noopener noreferrer">
            Borrow Book ↗
          </a>
        </div>
      </div>`;
  }

  // Commute cards
  const toWorkUID = `embed-home-tw-m${step}`;
  const fromWorkUID = `embed-home-fw-m${step}`;

  function commuteCard(item, label, uid) {
    if (!item) return '';
    const tsNote = item.timestamp ? ` · starts ${formatTimestamp(item.timestamp)}` : '';
    const durationLabel = `${item.duration_mins} min${tsNote}`;
    const playBtn = item.youtube_id
      ? `<button class="btn btn-play" data-toggle-embed="${uid}">&#9654; Play Here</button>
         <a class="btn btn-outline-sm" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">&#8599; YouTube</a>`
      : `<a class="btn btn-play" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">&#9654; Play</a>`;

    return `
      <div class="commute-card">
        <div class="commute-label">${label} &middot; ${durationLabel}</div>
        <div class="commute-title">${esc(item.title)}</div>
        <div class="commute-show">${esc(item.show)}</div>
        <div class="commute-actions">
          ${playBtn}
        </div>
        ${item.youtube_id ? renderYTEmbed(item, uid) : ''}
      </div>`;
  }

  const view = document.getElementById('view-home');
  view.innerHTML = `
    <div class="module-banner">
      <div class="module-step-label">
        <span class="module-color-dot" style="background:${color};box-shadow:0 0 8px ${color}60;"></span>
        Step ${step} &middot; 5 Modules
      </div>
      <div class="module-title-serif">${esc(title)}</div>
      <div class="module-progress-bar">${segmentsHTML}</div>
    </div>

    <div class="commute-grid">
      ${commuteCard(toWork, 'To Work', toWorkUID)}
      ${commuteCard(fromWork, 'From Work', fromWorkUID)}
    </div>

    ${readingHTML}

    <div class="section-heading">Daily Exports</div>
    ${DATA.exports.map((ex, i) => `
      <div class="export-card">
        <div class="gold-circle">${i + 1}</div>
        <div class="export-content">
          <div class="export-name">${esc(ex.name)}</div>
          <div class="export-prompt">${esc(ex.prompt)}</div>
          <div class="export-example">"${esc(ex.example)}"</div>
        </div>
      </div>`).join('')}

    <div class="complete-step-wrapper">
      <button class="btn btn-gold-pill" id="btn-complete" ${isAllDone ? 'disabled' : ''}>
        ${btnLabel}
      </button>
    </div>
  `;

  // Wire up "Read Summary" button
  const readBtn = view.querySelector('#btn-read-summary');
  if (readBtn) {
    readBtn.addEventListener('click', () => {
      const bookId = readBtn.dataset.book;
      const chNum = parseInt(readBtn.dataset.ch, 10);
      switchToView('library');
      setTimeout(() => openBookAndChapter(bookId, chNum), 50);
    });
  }

  // Wire up complete button
  const completeBtn = view.querySelector('#btn-complete');
  if (completeBtn && !isAllDone) {
    completeBtn.addEventListener('click', () => {
      const p = loadProgress();
      if (!p.completed_steps.includes(p.current_step)) {
        p.completed_steps.push(p.current_step);
      }
      if (p.current_step < 5) {
        p.current_step = p.current_step + 1;
      }
      saveProgress(p);
      renderAll();
    });
  }
}

// ===========================================================
// LIBRARY VIEW
// ===========================================================

function bookNavItem(book) {
  const spineColor = book.cover_color || book._track_color || '#666';
  const chaptersHTML = book.chapters.map(ch => {
    let badge = '';
    if (ch.assigned_module) {
      const mc = moduleColor(ch.assigned_module);
      badge = `<span class="lib-module-badge" style="background:${mc}22;color:${mc};">M${ch.assigned_module}</span>`;
    } else if (book._track_color) {
      badge = `<span class="lib-module-badge" style="background:${book._track_color}22;color:${book._track_color};">${book._track_title}</span>`;
    }
    const chKey = `ch_${book.id}_${ch.number}`;
    const chDone = isItemDone(chKey);
    return `
      <button class="lib-chapter-btn${chDone ? ' is-done' : ''}" data-book="${esc(book.id)}" data-ch="${ch.number}" data-item-key="${chKey}">
        <span class="lib-chapter-num">Ch ${ch.number}</span>
        <span class="lib-chapter-title">${esc(ch.title)}</span>
        ${badge}
        ${chDone ? '<span class="item-done-check">&#10003;</span>' : ''}
      </button>`;
  }).join('');
  return `
    <div class="lib-book-item" data-book-nav="${esc(book.id)}">
      <div class="lib-book-header">
        <div class="lib-book-spine" style="background:${spineColor};"></div>
        <div class="lib-book-info">
          <div class="lib-book-title">${esc(book.title)}</div>
          <div class="lib-book-author">${esc(book.authors)}</div>
        </div>
        <div class="lib-book-chevron">${chevronSVG(16)}</div>
      </div>
      <div class="lib-chapter-list">${chaptersHTML}</div>
    </div>`;
}

function renderLibrary() {
  const navInner = document.querySelector('#library-nav .library-nav-inner');
  if (!navInner) return;

  const cmbBooks = DATA.books.filter(b => !b._track);
  const trackBooks = DATA.books.filter(b => !!b._track);

  let navHTML = `<div class="lib-nav-heading">Communication Mastery</div>`;
  cmbBooks.forEach(book => { navHTML += bookNavItem(book); });

  if (trackBooks.length) {
    navHTML += `<div class="lib-nav-heading" style="margin-top:20px;">Topic Tracks</div>`;
    trackBooks.forEach(book => { navHTML += bookNavItem(book); });
  }

  navInner.innerHTML = navHTML;

  // Build mobile TOC
  const tocSelect = document.getElementById('library-toc-select');
  if (tocSelect) {
    let tocHTML = '<option value="">— Select a chapter —</option>';
    if (cmbBooks.length) {
      tocHTML += `<optgroup label="Communication Mastery">`;
      cmbBooks.forEach(book => {
        book.chapters.forEach(ch => {
          tocHTML += `<option value="${esc(book.id)}__${ch.number}">${esc(book.title)} — Ch ${ch.number}: ${esc(ch.title)}</option>`;
        });
      });
      tocHTML += `</optgroup>`;
    }
    if (trackBooks.length) {
      const byTrack = {};
      trackBooks.forEach(book => {
        const grp = book._track_title || 'Topic Tracks';
        if (!byTrack[grp]) byTrack[grp] = [];
        byTrack[grp].push(book);
      });
      Object.entries(byTrack).forEach(([grpName, books]) => {
        tocHTML += `<optgroup label="${esc(grpName)}">`;
        books.forEach(book => {
          book.chapters.forEach(ch => {
            tocHTML += `<option value="${esc(book.id)}__${ch.number}">${esc(book.title)} — Ch ${ch.number}: ${esc(ch.title)}</option>`;
          });
        });
        tocHTML += `</optgroup>`;
      });
    }
    tocSelect.innerHTML = tocHTML;
    tocSelect.addEventListener('change', () => {
      const val = tocSelect.value;
      if (!val) return;
      const [bookId, chNumStr] = val.split('__');
      openBookAndChapter(bookId, parseInt(chNumStr, 10));
    });
  }

  // Wire up book headers
  navInner.querySelectorAll('.lib-book-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.lib-book-item');
      item.classList.toggle('open');
    });
  });

  // Wire up chapter buttons
  navInner.querySelectorAll('.lib-chapter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const bookId = btn.dataset.book;
      const chNum = parseInt(btn.dataset.ch, 10);
      openBookAndChapter(bookId, chNum);
    });
  });

  // Auto-open current step's book + chapter
  const chapterData = findChapterForStep(progress.current_step);
  if (chapterData) {
    const bookItem = navInner.querySelector(`[data-book-nav="${chapterData.book.id}"]`);
    if (bookItem) bookItem.classList.add('open');
  }
}

async function openBookAndChapter(bookId, chNum) {
  const book = DATA.books.find(b => b.id === bookId);
  if (!book) return;
  const chapter = book.chapters.find(c => c.number === chNum);
  if (!chapter) return;

  // Mark active in nav
  document.querySelectorAll('.lib-chapter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.book === bookId && parseInt(btn.dataset.ch, 10) === chNum);
  });

  // Check if epub exists
  const epubPath = await tryEpubReader(bookId);

  const reader = document.getElementById('library-reader');
  if (!reader) return;

  let modBadge = '';
  if (chapter.assigned_module) {
    const modColor = moduleColor(chapter.assigned_module);
    modBadge = `<span class="reader-module-badge" style="background:${modColor}22;color:${modColor};border:1px solid ${modColor}44;">Module ${chapter.assigned_module}: ${MODULE_TITLES[chapter.assigned_module - 1]}</span>`;
  } else if (book._track_color) {
    modBadge = `<span class="reader-module-badge" style="background:${book._track_color}22;color:${book._track_color};border:1px solid ${book._track_color}44;">${esc(book._track_title)}</span>`;
  }

  const conceptsHTML = chapter.key_concepts
    .map(c => `<li>${esc(c)}</li>`)
    .join('');

  let epubSection = '';
  if (epubPath && epubPath.type === 'pdf') {
    epubSection = `
      <div class="reader-full-chapter-heading">Full Book — In-Browser Reader</div>
      <div class="pdf-reader-container">
        <iframe
          src="${esc(epubPath.path)}"
          class="pdf-iframe"
          title="${esc(book.title)}"
          allow="fullscreen">
        </iframe>
      </div>
      <div class="reader-borrow-actions" style="margin-top:10px;">
        <a class="btn btn-outline-sm" href="${esc(epubPath.path)}" target="_blank" rel="noopener noreferrer">
          Open in New Tab &#8599;
        </a>
      </div>`;
  } else if (epubPath && epubPath.type === 'epub') {
    epubSection = `
      <div class="epub-reader-container" id="epub-reader-container">
        <div class="reader-full-chapter-heading">In-Browser Reader</div>
        <div id="epub-render" style="height:580px;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:#fff;"></div>
        <div class="epub-controls">
          <button class="btn btn-outline-sm" id="epub-prev">&#8592; Prev</button>
          <button class="btn btn-outline-sm" id="epub-next">Next &#8594;</button>
        </div>
      </div>`;
  } else {
    epubSection = `
      <div class="reader-full-chapter-heading">Read the Full Chapter</div>
      <div class="reader-borrow-actions">
        <button class="btn btn-outline" id="btn-archive-embed" data-archive="${esc(book.archive_id)}" data-title="${esc(book.title)}">
          Open on Archive.org
        </button>
        <a class="btn btn-outline-sm" href="https://archive.org/download/${esc(book.archive_id)}/${esc(book.archive_id)}.epub" target="_blank" rel="noopener noreferrer">
          Download EPUB &#8599;
        </a>
      </div>
      <p class="reader-borrow-note">Free to borrow with a free Archive.org account.</p>`;
  }

  const chKey = `ch_${bookId}_${chNum}`;
  const chAlreadyDone = isItemDone(chKey);

  reader.innerHTML = `
    <div class="reader-chapter-num">Chapter ${chapter.number}</div>
    <h2 class="reader-chapter-title">${esc(chapter.title)}</h2>
    ${modBadge}
    <p class="reader-summary">${esc(chapter.summary)}</p>
    <blockquote class="reader-quote">"${esc(chapter.key_quote)}"</blockquote>
    <div class="reader-concepts-heading">Key Concepts</div>
    <ul class="reader-concepts">${conceptsHTML}</ul>
    <div class="reader-done-row">
      <button class="btn-done-toggle${chAlreadyDone ? ' is-done' : ''}" id="btn-mark-read" data-toggle-done="${chKey}">
        ${chAlreadyDone ? '&#10003; Marked as Read' : 'Mark as Read'}
      </button>
    </div>
    <hr class="reader-divider">
    ${epubSection}
  `;

  // Init epub reader if EPUB available
  if (epubPath && epubPath.type === 'epub') {
    initEpubReader(epubPath.path, chapter.number);
  }

  // Wire up archive.org embed button
  const archiveBtn = reader.querySelector('#btn-archive-embed');
  if (archiveBtn) {
    archiveBtn.addEventListener('click', () => {
      openArchiveOverlay(archiveBtn.dataset.archive, archiveBtn.dataset.title);
    });
  }

  // Scroll reader to top
  reader.scrollTop = 0;
}

// epub.js integration
async function tryEpubReader(bookId) {
  const bases = {
    'difficult_conversations': 'difficult_conversations',
    'crucial_conversations': 'crucial_conversations',
    'relationship_cure': 'relationship_cure',
    'how_to_be_yourself': 'how_to_be_yourself',
    'quiet': 'quiet',
    'platonic': 'platonic',
    'how_to_win_friends': 'how_to_win_friends',
    'how_to_talk_to_anyone': 'how_to_talk_to_anyone'
  };
  const base = bases[bookId];
  if (!base) return null;

  // Prefer EPUB (epub.js)
  try {
    const r = await fetch(`books/${base}.epub`, { method: 'HEAD' });
    if (r.ok) return { path: `books/${base}.epub`, type: 'epub' };
  } catch (e) { /* not present */ }

  // Fall back to PDF (native browser iframe)
  try {
    const r = await fetch(`books/${base}.pdf`, { method: 'HEAD' });
    if (r.ok) return { path: `books/${base}.pdf`, type: 'pdf' };
  } catch (e) { /* not present */ }

  return null;
}

function initEpubReader(epubPath, targetChapter) {
  if (typeof ePub === 'undefined') return;

  const container = document.getElementById('epub-reader-container');
  if (!container) return;

  const book = ePub(epubPath);
  const rendition = book.renderTo('epub-render', {
    width: '100%',
    height: '100%',
    spread: 'none'
  });

  book.ready.then(() => {
    if (targetChapter) {
      let found = false;
      book.spine.each((item, i) => {
        if (!found && i === targetChapter - 1) {
          rendition.display(item.href);
          found = true;
        }
      });
      if (!found) rendition.display();
    } else {
      rendition.display();
    }
  });

  const prevBtn = document.getElementById('epub-prev');
  const nextBtn = document.getElementById('epub-next');
  if (prevBtn) prevBtn.addEventListener('click', () => rendition.prev());
  if (nextBtn) nextBtn.addEventListener('click', () => rendition.next());
}

// Archive.org overlay
function openArchiveOverlay(archiveId, title) {
  const overlay = document.getElementById('archive-overlay');
  const iframe = document.getElementById('archive-iframe');
  const titleEl = document.getElementById('archive-modal-title');

  if (!overlay || !iframe) return;
  titleEl.textContent = title || 'Archive.org Reader';
  iframe.src = `https://archive.org/embed/${archiveId}`;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeArchiveOverlay() {
  const overlay = document.getElementById('archive-overlay');
  const iframe = document.getElementById('archive-iframe');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  if (iframe) iframe.src = '';
}

// ===========================================================
// MEDIA VIEW
// ===========================================================

function renderMedia() {
  const view = document.getElementById('view-media');
  const step = progress.current_step;

  function renderEpisodeCard(item, queueKey, isCurrent) {
    const color = moduleColor(item.module);
    const uid = `embed-media-${queueKey}-m${item.module}`;
    const tsLabel = item.timestamp ? ` &middot; starts ${formatTimestamp(item.timestamp)}` : '';
    const itemKey = `media_${queueKey}_m${item.module}`;
    const done = isItemDone(itemKey);

    const nowPlayingTag = isCurrent
      ? `<span class="now-playing-tag">Now Playing</span>`
      : '';

    return `
      <div class="media-card ${isCurrent ? 'featured' : ''}">
        <div class="media-card-top">
          <div class="media-card-top-left">
            <div class="media-module-dot" style="background:${color};"></div>
            <span class="media-show-label">${esc(item.show)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="badge badge-duration">${item.duration_mins} MIN${tsLabel}</span>
            ${nowPlayingTag}
          </div>
        </div>
        <div class="media-episode-title">${esc(item.title)}</div>
        <div class="media-theme">${esc(item.theme)}</div>
        <div class="media-card-actions">
          ${item.youtube_id
            ? `<button class="btn btn-play" data-toggle-embed="${uid}">&#9654; Play Here</button>
               <a class="btn btn-outline-sm" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">&#8599; YouTube</a>`
            : `<a class="btn btn-play" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">&#9654; Play</a>`
          }
          <button class="btn-done-toggle${done ? ' is-done' : ''}" data-toggle-done="${itemKey}">
            ${done ? '&#10003; Watched' : 'Mark Watched'}
          </button>
        </div>
        ${isCurrent
          ? `<div class="yt-embed-container" id="${uid}" data-open="1" style="margin-top:12px;">
              <div class="video-wrapper">
                <iframe src="https://www.youtube.com/embed/${item.youtube_id}?start=${item.timestamp || 0}&rel=0&modestbranding=1"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen loading="lazy" title="${esc(item.title)}"></iframe>
              </div>
            </div>`
          : renderYTEmbed(item, uid)
        }
      </div>`;
  }

  const toWorkHTML = DATA.media.to_work.map(item => renderEpisodeCard(item, 'tw', item.module === step)).join('');
  const fromWorkHTML = DATA.media.from_work.map(item => renderEpisodeCard(item, 'fw', item.module === step)).join('');

  let tracksHTML = '';
  if (DATA.tracks && DATA.tracks.length) {
    tracksHTML = `<div class="media-queue-heading" style="margin-top:32px;">Topic Tracks</div>`;
    DATA.tracks.forEach(track => {
      if (!track.media) return;
      const tw = track.media.to_work;
      const fw = track.media.from_work;
      const twUID = `embed-track-tw-${track.id}`;
      const fwUID = `embed-track-fw-${track.id}`;

      function trackCard(item, uid, itemKey) {
        if (!item) return '';
        const done = isItemDone(itemKey);
        return `
          <div class="media-card">
            <div class="media-card-top">
              <div class="media-card-top-left">
                <div class="media-module-dot" style="background:${track.color};"></div>
                <span class="media-show-label">${esc(item.show)}</span>
              </div>
              <span class="badge badge-duration">${item.duration_mins} MIN</span>
            </div>
            <div class="media-episode-title">${esc(item.title)}</div>
            <div class="media-theme">${esc(item.theme)}</div>
            <div class="media-card-actions">
              ${item.youtube_id
                ? `<button class="btn btn-play" data-toggle-embed="${uid}">&#9654; Play Here</button>
                   <a class="btn btn-outline-sm" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">&#8599; YouTube</a>`
                : `<a class="btn btn-play" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">&#9654; Play</a>`
              }
              <button class="btn-done-toggle${done ? ' is-done' : ''}" data-toggle-done="${itemKey}">
                ${done ? '&#10003; Watched' : 'Mark Watched'}
              </button>
            </div>
            ${item.youtube_id ? renderYTEmbed(item, uid) : ''}
          </div>`;
      }

      tracksHTML += `
        <div class="track-section-label" style="color:${track.color};border-left:3px solid ${track.color};padding-left:10px;margin:20px 0 8px;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;font-weight:600;">
          ${esc(track.title)}
        </div>
        ${trackCard(tw, twUID, `track_tw_${track.id}`)}
        ${trackCard(fw, fwUID, `track_fw_${track.id}`)}`;
    });
  }

  view.innerHTML = `
    <div class="media-queue-heading">To Work Queue</div>
    ${toWorkHTML}
    <div class="media-queue-heading">From Work Queue</div>
    ${fromWorkHTML}
    ${tracksHTML}
  `;
}

// ===========================================================
// PRACTICE VIEW
// ===========================================================

function renderPractice() {
  const view = document.getElementById('view-practice');

  const scriptsHTML = DATA.scripts.map(script => `
    <div class="script-card" data-script="${esc(script.id)}">
      <div class="script-header">
        <div class="script-header-left">
          <div class="script-name">${esc(script.name)}</div>
          <div class="script-trigger-label">${esc(script.trigger)}</div>
        </div>
        <div class="script-chevron">${chevronSVG()}</div>
      </div>
      <div class="script-body">
        <div class="script-text">"${esc(script.text)}"</div>
        <div class="script-copy-row">
          <button class="btn btn-copy" data-copy="${esc(script.id)}">Copy</button>
        </div>
        <div class="script-when">
          <strong>When to use</strong>
          ${esc(script.trigger)}
        </div>
      </div>
    </div>`).join('');

  const exportsHTML = DATA.exports.map((ex, i) => `
    <div class="practice-export-card">
      <div class="gold-circle">${i + 1}</div>
      <div class="practice-export-content">
        <div class="practice-export-name">${esc(ex.name)}</div>
        <div class="practice-export-prompt">${esc(ex.prompt)}</div>
        <div class="practice-export-example">"${esc(ex.example)}"</div>
      </div>
    </div>`).join('');

  view.innerHTML = `
    <div class="section-heading">Conversation Scripts</div>
    ${scriptsHTML}

    <div class="section-heading">Daily Exports</div>
    ${exportsHTML}
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
          btn.textContent = 'Copied';
          setTimeout(() => { btn.textContent = orig; }, 2000);
        }).catch(() => {});
      }
    });
  });
}

// ===========================================================
// MAP VIEW
// ===========================================================

let searchIndex = null;

function buildSearchIndex() {
  const index = [];

  DATA.books.forEach(book => {
    book.chapters.forEach(ch => {
      index.push({
        type: 'chapter',
        title: ch.title,
        subtitle: `${book.title} — Chapter ${ch.number}`,
        text: ch.title + ' ' + ch.summary + ' ' + ch.key_concepts.join(' '),
        module: ch.assigned_module,
        bookId: book.id,
        chNum: ch.number
      });
    });
  });

  [...DATA.media.to_work, ...DATA.media.from_work].forEach(item => {
    index.push({
      type: 'media',
      title: item.title,
      subtitle: `${item.show} — Module ${item.module}`,
      text: item.title + ' ' + item.theme + ' ' + item.show,
      module: item.module
    });
  });

  DATA.scripts.forEach(s => {
    index.push({
      type: 'script',
      title: s.name,
      subtitle: `Script — ${s.trigger}`,
      text: s.name + ' ' + s.trigger + ' ' + s.text,
      module: null
    });
  });

  if (DATA.tracks) {
    DATA.tracks.forEach(track => {
      if (!track.media) return;
      [track.media.to_work, track.media.from_work].filter(Boolean).forEach(item => {
        index.push({
          type: 'media',
          title: item.title,
          subtitle: `${item.show} — ${track.title}`,
          text: item.title + ' ' + (item.theme || '') + ' ' + item.show + ' ' + track.title,
          module: null
        });
      });
    });
  }

  return index;
}

function runSearch(query, index) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return index.filter(item => item.text.toLowerCase().includes(q));
}

function renderMap() {
  const view = document.getElementById('view-map');
  const step = progress.current_step;

  // All 5 module cards
  const modulesHTML = MODULE_TITLES.map((title, i) => {
    const s = i + 1;
    const color = MODULE_COLORS[i];
    const tw = DATA.media.to_work[i];
    const fw = DATA.media.from_work[i];
    const chData = findChapterForStep(s);

    const twUid = `embed-map-tw-m${s}`;
    const fwUid = `embed-map-fw-m${s}`;

    function compactMediaRow(item, uid, label) {
      if (!item) return '';
      return `
        <div class="map-resource-row">
          <div class="map-resource-info">
            <div class="map-resource-title">${esc(item.title)}</div>
            <div class="map-resource-sub">${label} &middot; ${esc(item.show)} &middot; ${item.duration_mins} min</div>
          </div>
          ${item.youtube_id
            ? `<button class="btn btn-play" style="padding:5px 10px;font-size:.72rem;" data-toggle-embed="${uid}">&#9654;</button>
               <a class="btn btn-outline-sm" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" style="padding:5px 10px;">&#8599;</a>`
            : `<a class="btn btn-play" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" style="padding:5px 10px;font-size:.72rem;">&#9654;</a>`
          }
        </div>
        ${item.youtube_id ? renderYTEmbed(item, uid) : ''}`;
    }

    let readingRow = '';
    if (chData) {
      readingRow = `
        <div class="map-resource-row">
          <div class="map-resource-info">
            <div class="map-resource-title">${esc(chData.book.title)} — Ch ${chData.chapter.number}</div>
            <div class="map-resource-sub">Reading &middot; ${esc(chData.chapter.title)}</div>
          </div>
          <button class="btn btn-ghost" style="padding:5px 10px;font-size:.72rem;" data-open-chapter="${esc(chData.book.id)}" data-ch="${chData.chapter.number}">Read</button>
        </div>`;
    }

    return `
      <div class="map-module-card" data-module="${s}">
        <div class="map-module-header">
          <div class="map-module-dot" style="background:${color};">${s}</div>
          <div class="map-module-title">${esc(title)}</div>
          <div class="map-module-chevron">${chevronSVG()}</div>
        </div>
        <div class="map-module-body">
          <div class="map-module-concept">${esc(MODULE_CONCEPTS[i])}</div>
          <div class="map-detail-label">To Work</div>
          ${compactMediaRow(tw, twUid, 'To Work')}
          <div class="map-detail-label">From Work</div>
          ${compactMediaRow(fw, fwUid, 'From Work')}
          <div class="map-detail-label">Reading</div>
          ${readingRow}
        </div>
      </div>`;
  }).join('');

  // Cross-reference index
  const allItems = [];

  DATA.media.to_work.forEach(item => allItems.push({
    type: 'media', label: 'Media', title: item.title,
    sub: `Module ${item.module} &middot; To Work`, module: item.module
  }));
  DATA.media.from_work.forEach(item => allItems.push({
    type: 'media', label: 'Media', title: item.title,
    sub: `Module ${item.module} &middot; From Work`, module: item.module
  }));
  DATA.books.forEach(book => {
    book.chapters.forEach(ch => allItems.push({
      type: 'chapter', label: 'Chapter', title: `${book.title} Ch ${ch.number}`,
      sub: `${esc(ch.title)} &middot; Module ${ch.assigned_module}`, module: ch.assigned_module
    }));
  });
  DATA.scripts.forEach(s => allItems.push({
    type: 'script', label: 'Script', title: s.name,
    sub: s.trigger, module: null
  }));

  const indexItemsHTML = allItems.map((item, idx) => {
    const typeStyle = item.type === 'media'
      ? 'background:rgba(68,136,204,.15);color:#4488cc;'
      : item.type === 'chapter'
        ? 'background:rgba(153,102,221,.15);color:#9966dd;'
        : 'background:rgba(51,170,136,.15);color:#33aa88;';
    return `
      <div class="index-item" data-module-filter="${item.module || 0}">
        <span class="index-type-badge" style="${typeStyle}">${item.label}</span>
        <span class="index-item-title">${esc(item.title)}</span>
        <span class="index-item-sub">${item.sub}</span>
      </div>`;
  }).join('');

  const stats = getStats();
  const userName = localStorage.getItem(NAME_KEY) || '';

  view.innerHTML = `
    <div class="map-search-wrapper">
      <span class="map-search-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </span>
      <input type="search" class="map-search-input" id="map-search" placeholder="Search chapters, episodes, scripts..." autocomplete="off">
    </div>

    <div class="search-results" id="search-results"></div>

    <div class="progress-stats-card">
      <div class="stats-card-title">My Progress${userName ? ' — ' + esc(userName) : ''}</div>
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-value">${stats.chRead}/${stats.totalCh}</div>
          <div class="stat-label">Chapters Read</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.cmbWatched}/${stats.cmbTotal}</div>
          <div class="stat-label">CMB Episodes</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.trackWatched}/${stats.trackTotal}</div>
          <div class="stat-label">Track Media</div>
        </div>
      </div>
    </div>

    <div class="section-heading">All 5 Modules</div>
    ${modulesHTML}

    <div class="section-heading">Full Resource Index</div>
    <div class="index-filter-row">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="1">Module 1</button>
      <button class="filter-btn" data-filter="2">Module 2</button>
      <button class="filter-btn" data-filter="3">Module 3</button>
      <button class="filter-btn" data-filter="4">Module 4</button>
      <button class="filter-btn" data-filter="5">Module 5</button>
    </div>
    <div class="index-grid">${indexItemsHTML}</div>

    <div class="sync-section">
      <div class="sync-section-title">Profile &amp; Sync</div>
      <div class="sync-name-row">
        <input type="text" class="sync-name-input" id="sync-name-input"
          placeholder="Your name (optional — shows above stats)"
          value="${esc(userName)}">
      </div>
      <div class="sync-btn-row">
        <button class="btn btn-outline-sm" id="btn-export-sync">Copy Sync Code</button>
        <button class="btn btn-outline-sm" id="btn-import-sync">Import Code</button>
      </div>
      <div class="sync-import-area" id="sync-import-area">
        <textarea class="sync-code-textarea" id="sync-code-input" placeholder="Paste your sync code here, then tap Apply..."></textarea>
        <button class="btn btn-primary" id="btn-apply-sync">Apply &amp; Reload</button>
      </div>
      <p class="sync-note">Sync Code exports all your read/watched marks and module progress. Paste it on any device to restore.</p>
    </div>

    <div class="reset-section">
      <button class="btn btn-danger-ghost" id="btn-reset">Reset All Progress</button>
    </div>
  `;

  // Wire up module card accordions
  view.querySelectorAll('.map-module-card').forEach(card => {
    const header = card.querySelector('.map-module-header');
    header.addEventListener('click', () => card.classList.toggle('open'));
  });

  // Wire up "Read" buttons in map
  view.querySelectorAll('[data-open-chapter]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const bookId = btn.dataset.openChapter;
      const chNum = parseInt(btn.dataset.ch, 10);
      switchToView('library');
      setTimeout(() => openBookAndChapter(bookId, chNum), 50);
    });
  });

  // Wire up filter buttons
  view.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      view.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      view.querySelectorAll('.index-item').forEach(item => {
        const modVal = item.dataset.moduleFilter;
        if (filter === 'all' || modVal === filter) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });

  // Wire up reset button
  const resetBtn = view.querySelector('#btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all progress and return to Step 1? This also clears read/watched marks.')) {
        saveProgress({ current_step: 1, completed_steps: [] });
        saveItems({});
        localStorage.removeItem(NAME_KEY);
        renderAll();
      }
    });
  }

  // Profile name — save on blur/enter
  const nameInput = view.querySelector('#sync-name-input');
  if (nameInput) {
    const saveName = () => {
      const v = nameInput.value.trim();
      if (v) localStorage.setItem(NAME_KEY, v);
      else localStorage.removeItem(NAME_KEY);
    };
    nameInput.addEventListener('blur', saveName);
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') { saveName(); nameInput.blur(); } });
  }

  // Export sync code
  const exportBtn = view.querySelector('#btn-export-sync');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (nameInput) {
        const v = nameInput.value.trim();
        if (v) localStorage.setItem(NAME_KEY, v);
      }
      const code = exportSyncCode();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
          const orig = exportBtn.textContent;
          exportBtn.textContent = 'Copied!';
          setTimeout(() => { exportBtn.textContent = orig; }, 2000);
        }).catch(() => {
          prompt('Copy this sync code:', code);
        });
      } else {
        prompt('Copy this sync code:', code);
      }
    });
  }

  // Toggle import area
  const importToggleBtn = view.querySelector('#btn-import-sync');
  const importArea = view.querySelector('#sync-import-area');
  if (importToggleBtn && importArea) {
    importToggleBtn.addEventListener('click', () => {
      importArea.classList.toggle('open');
    });
  }

  // Apply imported sync code
  const applyBtn = view.querySelector('#btn-apply-sync');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const code = view.querySelector('#sync-code-input').value.trim();
      if (!code) return;
      if (importSyncCode(code)) {
        renderAll();
        switchToView('map');
      } else {
        applyBtn.textContent = 'Invalid code — try again';
        setTimeout(() => { applyBtn.textContent = 'Apply & Reload'; }, 2500);
      }
    });
  }

  // Build search index and wire up search
  searchIndex = buildSearchIndex();
  const searchInput = view.querySelector('#map-search');
  const searchResults = view.querySelector('#search-results');

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      if (!q) {
        searchResults.classList.remove('visible');
        searchResults.innerHTML = '';
        return;
      }
      const results = runSearch(q, searchIndex);
      if (results.length === 0) {
        searchResults.innerHTML = `<div class="search-empty">No results for "${esc(q)}"</div>`;
      } else {
        searchResults.innerHTML = results.map(r => {
          const typeStyle = r.type === 'chapter'
            ? 'search-type-chapter'
            : r.type === 'media'
              ? 'search-type-media'
              : 'search-type-script';
          return `
            <div class="search-result-item"
              data-type="${r.type}"
              data-book="${r.bookId || ''}"
              data-ch="${r.chNum || ''}">
              <span class="search-result-type ${typeStyle}">${r.type}</span>
              <div class="search-result-text">
                <div class="search-result-title">${esc(r.title)}</div>
                <div class="search-result-sub">${esc(r.subtitle)}</div>
              </div>
            </div>`;
        }).join('');
      }
      searchResults.classList.add('visible');
    });

    // Handle clicking search results
    searchResults.addEventListener('click', e => {
      const item = e.target.closest('.search-result-item');
      if (!item) return;
      const type = item.dataset.type;
      if (type === 'chapter' && item.dataset.book && item.dataset.ch) {
        switchToView('library');
        setTimeout(() => openBookAndChapter(item.dataset.book, parseInt(item.dataset.ch, 10)), 50);
      } else if (type === 'media') {
        switchToView('media');
      } else if (type === 'script') {
        switchToView('practice');
      }
      searchInput.value = '';
      searchResults.classList.remove('visible');
      searchResults.innerHTML = '';
    });
  }
}

// ===========================================================
// GLOBAL EVENT WIRING
// ===========================================================

// Global embed toggle — handles all "Play Here" buttons anywhere in the app
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-toggle-embed]');
  if (!btn) return;
  const target = document.getElementById(btn.dataset.toggleEmbed);
  if (!target) return;
  const isOpen = target.dataset.open === '1';
  target.style.display = isOpen ? 'none' : 'block';
  target.dataset.open = isOpen ? '0' : '1';
  if (!isOpen) {
    btn.textContent = '▼ Collapse';
  } else {
    btn.innerHTML = '&#9654; Play Here';
  }
});

// Global done toggle — handles all "Mark Read/Watched" buttons
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-toggle-done]');
  if (!btn) return;
  const key = btn.dataset.toggleDone;
  const nowDone = toggleItem(key);

  if (btn.id === 'btn-mark-read') {
    btn.textContent = nowDone ? '✓ Marked as Read' : 'Mark as Read';
  } else {
    btn.innerHTML = nowDone ? '&#10003; Watched' : 'Mark Watched';
  }
  btn.classList.toggle('is-done', nowDone);

  // For chapter keys, also update the nav checkmark
  if (key.startsWith('ch_')) {
    const navBtn = document.querySelector(`.lib-chapter-btn[data-item-key="${key}"]`);
    if (navBtn) {
      navBtn.classList.toggle('is-done', nowDone);
      let check = navBtn.querySelector('.item-done-check');
      if (nowDone && !check) {
        const span = document.createElement('span');
        span.className = 'item-done-check';
        span.textContent = '✓';
        navBtn.appendChild(span);
      } else if (!nowDone && check) {
        check.remove();
      }
    }
  }
});

// Archive overlay close
document.addEventListener('click', e => {
  if (e.target.closest('#archive-close-btn')) {
    closeArchiveOverlay();
  }
  if (e.target === document.getElementById('archive-overlay')) {
    closeArchiveOverlay();
  }
});

// Escape key for overlay
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeArchiveOverlay();
});

// ===========================================================
// INIT
// ===========================================================

async function init() {
  try {
    const res = await fetch('content.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    DATA = await res.json();

    // Flatten track books into DATA.books so Library/reader/search work uniformly
    if (DATA.tracks) {
      DATA.tracks.forEach(track => {
        if (!track.book) return;
        if (!DATA.books.find(b => b.id === track.book.id)) {
          DATA.books.push({
            ...track.book,
            _track: track.id,
            _track_title: track.title,
            _track_color: track.color
          });
        }
      });
    }
  } catch (e) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100dvh;
        font-family:sans-serif;color:#ede8d8;background:#07070f;padding:24px;text-align:center;">
        <div>
          <div style="font-size:2.5rem;margin-bottom:16px;color:#c9a227;">&#9888;</div>
          <div style="font-size:1rem;color:#8a8475;line-height:1.7;">
            Failed to load content.json.<br>
            Serve this app via a local server or HTTPS.
          </div>
        </div>
      </div>`;
    return;
  }

  initNav();
  renderAll();
}

init();
