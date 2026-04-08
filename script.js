/* ──────────────────────────────────────────
   script.js — 글 이미지 생성기
   ────────────────────────────────────────── */

// ── State ──
const state = {
  template: 1,
  size: 'a5',
  font: "'Nanum Myeongjo', serif",
  showTitle: true,
  title: '',
  body: '',
  bgImageSrc: null,   // template 1
  bgColor: '#FFFFFF', // template 2
  showPageNum: false, // template 2
};

// ── DOM refs ──
const previewEl       = document.getElementById('previewContainer');
const titleInput      = document.getElementById('titleInput');
const bodyInput       = document.getElementById('bodyInput');
const showTitleChk    = document.getElementById('showTitle');
const titleFieldWrap  = document.getElementById('titleFieldWrap');
const fontSelect      = document.getElementById('fontSelect');
const bgImageInput    = document.getElementById('bgImageInput');
const imageFileName   = document.getElementById('imageFileName');
const clearImageBtn   = document.getElementById('clearImageBtn');
const showPageNumChk  = document.getElementById('showPageNum');
const downloadBtn     = document.getElementById('downloadBtn');

// ── Init ──
renderPreview();
bindEvents();

// ── Event Binding ──
function bindEvents() {
  // Title toggle
  showTitleChk.addEventListener('change', () => {
    state.showTitle = showTitleChk.checked;
    titleFieldWrap.style.display = state.showTitle ? 'block' : 'none';
    renderPreview();
  });

  // Title / body text
  titleInput.addEventListener('input', () => { state.title = titleInput.value; renderPreview(); });
  bodyInput.addEventListener('input',  () => { state.body  = bodyInput.value;  renderPreview(); });

  // Template selection
  document.querySelectorAll('.tpl-card').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tpl-card').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.template = parseInt(btn.dataset.tpl, 10);
      updateConditionalOpts();
      renderPreview();
    });
  });

  // Size selection
  document.querySelectorAll('input[name="size"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        state.size = radio.value;
        previewEl.className = 'preview-container size-' + state.size;
        renderPreview();
      }
    });
  });

  // Font selection
  fontSelect.addEventListener('change', () => {
    state.font = fontSelect.value;
    renderPreview();
  });

  // Image upload
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

  // BG color buttons
  document.querySelectorAll('.bg-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bg-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.bgColor = btn.dataset.color;
      renderPreview();
    });
  });

  // Page number toggle
  showPageNumChk.addEventListener('change', () => {
    state.showPageNum = showPageNumChk.checked;
    renderPreview();
  });

  // Download
  downloadBtn.addEventListener('click', downloadPNG);
}

// ── Conditional Options Visibility ──
function updateConditionalOpts() {
  document.getElementById('opts-tpl1').style.display = state.template === 1 ? 'block' : 'none';
  document.getElementById('opts-tpl2').style.display = state.template === 2 ? 'block' : 'none';
}

// ── Render Preview ──
function renderPreview() {
  previewEl.innerHTML = '';
  previewEl.style.fontFamily = state.font;

  switch (state.template) {
    case 1: renderTemplate1(); break;
    case 2: renderTemplate2(); break;
    case 3: renderTemplate3(); break;
    case 4: renderTemplate4(); break;
  }
}

// ──────────────────────────────────────────
//  Template 1 — 이미지 테두리형
// ──────────────────────────────────────────
function renderTemplate1() {
  const wrap = el('div', 'tpl1-wrap');

  if (state.bgImageSrc) {
    const img = el('img', 'tpl1-bg');
    img.src = state.bgImageSrc;
    img.alt = '';
    wrap.appendChild(img);
  } else {
    wrap.appendChild(el('div', 'tpl1-bg-placeholder'));
  }

  const textbox = el('div', 'tpl1-textbox');

  if (state.showTitle && state.title) {
    const t = el('div', 'tpl1-title');
    t.textContent = state.title;
    textbox.appendChild(t);
  }

  const b = el('div', 'tpl1-body');
  b.textContent = state.body || '본문을 입력하세요.';
  textbox.appendChild(b);

  wrap.appendChild(textbox);
  previewEl.appendChild(wrap);
}

// ──────────────────────────────────────────
//  Template 2 — 단색 배경형
// ──────────────────────────────────────────
function renderTemplate2() {
  const wrap = el('div', 'tpl2-wrap');
  wrap.style.background = state.bgColor;

  const isDark = state.bgColor === '#1A1A1A';
  wrap.style.color = isDark ? '#F0EDE8' : '#1A1A1A';

  if (state.showTitle && state.title) {
    const t = el('div', 'tpl2-title');
    t.textContent = state.title;
    wrap.appendChild(t);
  }

  const b = el('div', 'tpl2-body');
  b.textContent = state.body || '본문을 입력하세요.';
  wrap.appendChild(b);

  if (state.showPageNum) {
    const pn = el('div', 'tpl2-pagenum');
    pn.textContent = '1';
    wrap.appendChild(pn);
  }

  previewEl.appendChild(wrap);
}

// ──────────────────────────────────────────
//  Template 3 — 인용구 강조형
// ──────────────────────────────────────────
function renderTemplate3() {
  const wrap = el('div', 'tpl3-wrap');

  if (state.showTitle && state.title) {
    const t = el('div', 'tpl3-title');
    t.textContent = state.title;
    wrap.appendChild(t);
  }

  const lines = state.body ? state.body.split('\n') : [];
  // First non-empty paragraph as lead quote
  let leadText = '';
  let restText = '';
  let foundLead = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!foundLead) {
      if (line.trim()) {
        leadText = line;
        foundLead = true;
      }
    } else {
      restText += (restText ? '\n' : '') + line;
    }
  }

  const lead = el('div', 'tpl3-lead');
  lead.textContent = leadText || '첫 번째 문장을\n크게 표시합니다.';
  wrap.appendChild(lead);

  if (restText || !state.body) {
    const body = el('div', 'tpl3-body');
    body.textContent = restText || '나머지 본문은 이곳에 작게 표시됩니다.';
    wrap.appendChild(body);
  }

  previewEl.appendChild(wrap);
}

// ──────────────────────────────────────────
//  Template 4 — 신문/잡지형
// ──────────────────────────────────────────
function renderTemplate4() {
  const wrap = el('div', 'tpl4-wrap');

  const titleText = (state.showTitle && state.title) ? state.title : '제목';
  const t = el('div', 'tpl4-title');
  t.textContent = titleText;
  // Apply current font to title as well — but keep it prominent
  t.style.fontFamily = state.font;
  wrap.appendChild(t);

  const hr = document.createElement('hr');
  hr.className = 'tpl4-hr';
  wrap.appendChild(hr);

  const b = el('div', 'tpl4-body');
  b.textContent = state.body || '본문을 입력하세요. 이 템플릿은 2단 컬럼으로 텍스트를 배치하여 신문이나 잡지처럼 보이는 레이아웃을 제공합니다.';
  wrap.appendChild(b);

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
  const footer = el('div', 'tpl4-footer');
  footer.textContent = dateStr;
  wrap.appendChild(footer);

  previewEl.appendChild(wrap);
}

// ──────────────────────────────────────────
//  PNG Download
// ──────────────────────────────────────────
async function downloadPNG() {
  downloadBtn.disabled = true;
  downloadBtn.textContent = '생성 중…';

  try {
    const canvas = await html2canvas(previewEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });

    const link = document.createElement('a');
    link.download = 'writing-output.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
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
