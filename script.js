/* ──────────────────────────────────────────
   script.js — 글 이미지 생성기
   ────────────────────────────────────────── */

// ── Constants ──
const OVERFLOW_TOLERANCE = 2; // px tolerance for scrollHeight vs clientHeight check

// ── Page dimensions ──
const SIZES = {
  a5:  { w: 560, h: 794 },
  bar: { w: 420, h: 686 },
};

// ── State ──
const state = {
  template: 1,
  size: 'a5',
  font: "'Nanum Myeongjo', serif",
  showTitle: true,
  title: '',
  body: '',
  indent: false,
  textAlign: 'justify',  // 'justify' | 'left' | 'center' | 'right'
  titleSize: 'md',       // 'sm' | 'md' | 'lg'
  titleGap: 20,          // px between title and body
  bgImageSrc: null,    // template 1
  tpl1Opacity: 92,     // template 1, 0–100
  bgColor: '#FFFFFF',  // template 2
  showPageNum: false,  // template 2
};

// ── DOM refs ──
const pagesWrap        = document.getElementById('pagesWrap');
const titleInput       = document.getElementById('titleInput');
const bodyInput        = document.getElementById('bodyInput');
const showTitleChk     = document.getElementById('showTitle');
const titleFieldWrap   = document.getElementById('titleFieldWrap');
const titleStyleWrap   = document.getElementById('titleStyleWrap');
const titleGapSlider   = document.getElementById('titleGapSlider');
const titleGapVal      = document.getElementById('titleGapVal');
const indentToggle     = document.getElementById('indentToggle');
const fontSelect       = document.getElementById('fontSelect');
const bgImageInput     = document.getElementById('bgImageInput');
const imageFileName    = document.getElementById('imageFileName');
const clearImageBtn    = document.getElementById('clearImageBtn');
const tpl1OpacitySlider = document.getElementById('tpl1OpacitySlider');
const tpl1OpacityVal   = document.getElementById('tpl1OpacityVal');
const showPageNumChk   = document.getElementById('showPageNum');
const downloadBtn      = document.getElementById('downloadBtn');

// ── Init ──
renderPreview();
bindEvents();

// ── Event Binding ──
function bindEvents() {
  showTitleChk.addEventListener('change', () => {
    state.showTitle = showTitleChk.checked;
    titleFieldWrap.style.display = state.showTitle ? 'block' : 'none';
    titleStyleWrap.style.display = state.showTitle ? 'block' : 'none';
    renderPreview();
  });

  titleInput.addEventListener('input', () => { state.title = titleInput.value; renderPreview(); });
  bodyInput.addEventListener('input',  () => { state.body  = bodyInput.value;  renderPreview(); });

  indentToggle.addEventListener('change', () => {
    state.indent = indentToggle.checked;
    renderPreview();
  });

  document.querySelectorAll('.tpl-card').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tpl-card').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.template = parseInt(btn.dataset.tpl, 10);
      updateConditionalOpts();
      renderPreview();
    });
  });

  document.querySelectorAll('input[name="size"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        state.size = radio.value;
        renderPreview();
      }
    });
  });

  fontSelect.addEventListener('change', () => {
    state.font = fontSelect.value;
    renderPreview();
  });

  bgImageInput.addEventListener('change', () => {
    const file = bgImageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      state.bgImageSrc = e.target.result;
      imageFileName.textContent = file.name;
      clearImageBtn.style.display = 'inline-block';
      renderPreview();
    };
    reader.readAsDataURL(file);
  });

  clearImageBtn.addEventListener('click', () => {
    state.bgImageSrc = null;
    bgImageInput.value = '';
    imageFileName.textContent = '선택된 파일 없음';
    clearImageBtn.style.display = 'none';
    renderPreview();
  });

  tpl1OpacitySlider.addEventListener('input', () => {
    state.tpl1Opacity = parseInt(tpl1OpacitySlider.value, 10);
    tpl1OpacityVal.textContent = state.tpl1Opacity + '%';
    renderPreview();
  });

  document.querySelectorAll('.bg-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bg-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.bgColor = btn.dataset.color;
      renderPreview();
    });
  });

  showPageNumChk.addEventListener('change', () => {
    state.showPageNum = showPageNumChk.checked;
    renderPreview();
  });

  downloadBtn.addEventListener('click', downloadPNG);

  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.textAlign = btn.dataset.align;
      renderPreview();
    });
  });

  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.titleSize = btn.dataset.size;
      renderPreview();
    });
  });

  titleGapSlider.addEventListener('input', () => {
    state.titleGap = parseInt(titleGapSlider.value, 10);
    titleGapVal.textContent = state.titleGap + 'px';
    renderPreview();
  });
}

// ── Conditional Options Visibility ──
function updateConditionalOpts() {
  document.getElementById('opts-tpl1').style.display = state.template === 1 ? 'block' : 'none';
  document.getElementById('opts-tpl2').style.display = state.template === 2 ? 'block' : 'none';
}

// ──────────────────────────────────────────
//  Main Render
// ──────────────────────────────────────────
function renderPreview() {
  pagesWrap.innerHTML = '';

  const pageTexts = paginateBody();

  pageTexts.forEach((bodyText, idx) => {
    const pageEl = createPageEl();
    renderPageContent(pageEl, bodyText, idx, pageTexts.length);
    pagesWrap.appendChild(pageEl);
  });
}

function createPageEl() {
  const p = document.createElement('div');
  p.className = 'preview-page size-' + state.size;
  return p;
}

// ──────────────────────────────────────────
//  Pagination — word-level binary search
// ──────────────────────────────────────────
function paginateBody() {
  const body = state.body || '';
  if (!body) return [''];

  const inputParas = body.split('\n');
  const result = [];
  let pageParas = [];
  let isFirstPage = true;

  // Hidden test page for overflow detection
  const testPage = createPageEl();
  testPage.style.cssText += ';position:fixed;left:-9999px;top:0;pointer-events:none;visibility:hidden;';
  document.body.appendChild(testPage);

  function fitsCheck(paras, isFirst) {
    renderPageContent(testPage, paras.join('\n'), isFirst ? 0 : 1, 0);
    const bodyEl = testPage.querySelector('[data-role="body"]');
    if (!bodyEl) return true;
    return bodyEl.scrollHeight <= bodyEl.clientHeight + OVERFLOW_TOLERANCE;
  }

  function flushPage() {
    result.push(pageParas.join('\n'));
    isFirstPage = false;
    pageParas = [];
  }

  // Binary search: how many words (starting at wordStart) can be appended
  // as a new paragraph to pageParas without overflow?
  function fitWords(words, wordStart) {
    const n = words.length - wordStart;
    if (n === 0) return 0;

    const tryN = (count) => {
      const text = words.slice(wordStart, wordStart + count).join(' ');
      return fitsCheck([...pageParas, text], isFirstPage);
    };

    if (!tryN(1)) {
      // Force at least 1 word on an empty page to avoid infinite loop
      return pageParas.length === 0 ? 1 : 0;
    }
    if (tryN(n)) return n;

    // Binary search for maximum count that fits
    let lo = 1, hi = n - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (tryN(mid)) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  try {
    for (const para of inputParas) {
      if (para === '') {
        // Blank line — try to add as empty paragraph
        const candidate = [...pageParas, ''];
        if (fitsCheck(candidate, isFirstPage)) {
          pageParas = candidate;
        } else {
          flushPage();
          pageParas = [''];
        }
        continue;
      }

      const words = para.split(' ');
      let wordStart = 0;

      while (wordStart < words.length) {
        const count = fitWords(words, wordStart);
        if (count === 0) {
          // Nothing fits on current page → flush and retry
          flushPage();
          continue;
        }
        pageParas.push(words.slice(wordStart, wordStart + count).join(' '));
        wordStart += count;
        if (wordStart < words.length) {
          // Words remain in this paragraph → need a new page
          flushPage();
        }
      }
    }
  } finally {
    document.body.removeChild(testPage);
  }

  result.push(pageParas.join('\n'));
  return result;
}

// ──────────────────────────────────────────
//  Page Content Dispatcher
// ──────────────────────────────────────────
function renderPageContent(pageEl, bodyText, pageIdx, totalPages) {
  pageEl.innerHTML = '';
  pageEl.style.fontFamily = state.font;

  switch (state.template) {
    case 1: renderTemplate1(pageEl, bodyText, pageIdx, totalPages); break;
    case 2: renderTemplate2(pageEl, bodyText, pageIdx, totalPages); break;
  }
}

// ──────────────────────────────────────────
//  Render body text (with/without indent)
// ──────────────────────────────────────────
function renderBodyInto(container, text) {
  container.style.textAlign = state.textAlign;
  const paras = text.split('\n');
  paras.forEach(para => {
    const p = document.createElement('p');
    p.className = 'body-para';
    if (!state.indent) p.style.textIndent = '0';
    p.textContent = para;
    container.appendChild(p);
  });
}

// ──────────────────────────────────────────
//  Template 1 — 이미지 테두리형
// ──────────────────────────────────────────
function renderTemplate1(pageEl, bodyText, pageIdx, totalPages) {
  const wrap = el('div', 'tpl1-wrap');

  if (state.bgImageSrc) {
    const img = el('img', 'tpl1-bg');
    img.src = state.bgImageSrc;
    img.alt = '';
    wrap.appendChild(img);
  } else {
    wrap.appendChild(el('div', 'tpl1-bg-placeholder'));
  }

  const opacity = state.tpl1Opacity / 100;
  const textbox = el('div', 'tpl1-textbox');
  textbox.style.background = `rgba(255,255,255,${opacity})`;

  if (state.showTitle && state.title && pageIdx === 0) {
    const t = el('div', 'tpl1-title');
    t.textContent = state.title;
    t.style.textAlign = state.textAlign;
    const titleFontSizes = { sm: '0.84rem', md: '1.05rem', lg: '1.3rem' };
    t.style.fontSize = titleFontSizes[state.titleSize];
    t.style.marginBottom = state.titleGap + 'px';
    textbox.appendChild(t);
  }

  const b = el('div', 'tpl1-body');
  b.setAttribute('data-role', 'body');
  renderBodyInto(b, bodyText || '본문을 입력하세요.');
  textbox.appendChild(b);

  wrap.appendChild(textbox);
  pageEl.appendChild(wrap);
}

// ──────────────────────────────────────────
//  Template 2 — 단색 배경형
// ──────────────────────────────────────────
function renderTemplate2(pageEl, bodyText, pageIdx, totalPages) {
  const wrap = el('div', 'tpl2-wrap');
  wrap.style.background = state.bgColor;

  const isDark = state.bgColor === '#1A1A1A';
  wrap.style.color = isDark ? '#F0EDE8' : '#1A1A1A';

  if (state.showTitle && state.title && pageIdx === 0) {
    const t = el('div', 'tpl2-title');
    t.textContent = state.title;
    t.style.textAlign = state.textAlign;
    const titleFontSizes = { sm: '0.9rem', md: '1.25rem', lg: '1.6rem' };
    t.style.fontSize = titleFontSizes[state.titleSize];
    t.style.marginBottom = state.titleGap + 'px';
    wrap.appendChild(t);
  }

  const b = el('div', 'tpl2-body');
  b.setAttribute('data-role', 'body');
  renderBodyInto(b, bodyText || '본문을 입력하세요.');
  wrap.appendChild(b);

  if (state.showPageNum) {
    const pn = el('div', 'tpl2-pagenum');
    pn.textContent = String(pageIdx + 1);
    wrap.appendChild(pn);
  }

  pageEl.appendChild(wrap);
}

// ──────────────────────────────────────────
//  PNG Download (single page → PNG, multi → ZIP)
// ──────────────────────────────────────────
async function downloadPNG() {
  downloadBtn.disabled = true;
  downloadBtn.textContent = '생성 중…';

  try {
    const pages = [...pagesWrap.querySelectorAll('.preview-page')];
    const SCALE = 2;

    const canvases = [];
    for (const p of pages) {
      const c = await html2canvas(p, {
        scale: SCALE,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });
      canvases.push(c);
    }

    if (canvases.length === 1) {
      const link = document.createElement('a');
      link.download = 'writing-output.png';
      link.href = canvases[0].toDataURL('image/png');
      link.click();
    } else {
      // Multiple pages → separate PNGs bundled in a ZIP
      const zip = new JSZip();
      canvases.forEach((c, i) => {
        const base64 = c.toDataURL('image/png').split(',')[1];
        zip.file(`writing-output-p${i + 1}.png`, base64, { base64: true });
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = 'writing-output.zip';
      link.href = URL.createObjectURL(blob);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 60000);
    }
  } catch (err) {
    console.error('Download failed:', err);
    alert('다운로드 중 오류가 발생했습니다. 다시 시도해주세요.');
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'PNG 다운로드';
  }
}

// ── Helper: create element with class ──
function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}
