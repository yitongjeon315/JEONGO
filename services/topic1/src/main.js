import { curriculumData } from './data/curriculum.js';
import { prePracticeBySession } from './data/prePractice.js';

// Application State
let activeCurriculum = []; // Holds edited/customized curriculum
let currentSessionIndex = 0;
const selectedAnswers = {}; // Tracks user's selections: { questionId: selectedIndex }
const submittedQuestions = new Set(); // Tracks submitted/graded questions
let currentUtterances = []; // To track SpeechSynthesisUtterance instances
let activeAudioQuestionId = null; // Tracks which question's audio is playing

// Vocab Game State
let selectedGameCards = []; // Tracks two currently clicked game cards: [ {el, word, type} ]
let matchedPairsCount = 0;
let totalPairsCount = 6; // Number of pairs to match in step 1 minigame
let currentShuffledCards = []; // Active shuffled game cards list

// UI States
let isZoomMode = false;
let isTimelineOpen = true;
let isIntroOpen = true;
let isInstructorMode = false; // Instructor guide hidden by default
let presentationSlideIndex = 0;
let presentationReturnScrollY = 0;
let translationDragState = null;

const vocabVisuals = {
  '옷': '👕', '신발': '👟', '과일': '🍎', '우산': '☂️',
  '돈': '💵', '원': '₩', '잔': '☕', '개': '📦',
  '사다': '🛍️', '팔다': '🏷️', '빌리다': '📚', '주다': '🎁',
  '오늘': '📅', '내일': '⏭️', '주말': '🗓️', '비': '🌧️',
  '아프다': '🤒', '피곤하다': '😴', '바쁘다': '🏃', '맑다': '☀️',
  '쉬다': '🛋️', '약속하다': '🤝', '생각하다': '🤔', '사오다': '🛍️'
};

const requiredQuestionCorrections = {
  q1_r3: ['options', 'optionExplanations'],
  q2_r1: ['explanation'],
  q2_r2: ['question'],
  q3_l4: ['audioScript', 'optionExplanations']
};

const isUnbundledSource = Array.from(document.scripts).some((script) => {
  try {
    return new URL(script.src).pathname.endsWith('/src/main.js');
  } catch {
    return false;
  }
});

function resolveAssetPath(path) {
  if (!path || /^(?:https?:|data:|\/)/.test(path)) return path;
  return isUnbundledSource ? `public/${path}` : path;
}

// DOM Elements
const navContainer = document.getElementById('curriculum-nav');
const contentContainer = document.getElementById('session-content');
const progressBarFill = document.getElementById('progress-bar');
const progressPercentText = document.getElementById('progress-percent');
const zoomToggleBtn = document.getElementById('zoom-toggle');
const instructorToggleBtn = document.getElementById('instructor-toggle');
const pdfPrintBtn = document.getElementById('pdf-print-btn');
const resetBtn = document.getElementById('reset-btn');
const presentationControls = document.getElementById('presentation-controls');
const presentationPrevBtn = document.getElementById('presentation-prev');
const presentationNextBtn = document.getElementById('presentation-next');
const presentationCounter = document.getElementById('presentation-counter');
const translationPopupBtn = document.getElementById('translation-popup-btn');
const translationDialog = document.getElementById('translation-dialog');
const translationDialogClose = document.getElementById('translation-dialog-close');
const translationDialogHeader = translationDialog?.querySelector('.translation-dialog-header');
const translationConnectPanel = document.getElementById('translation-connect-panel');
const translationFramePanel = document.getElementById('translation-frame-panel');
const translationAppUrlInput = document.getElementById('translation-app-url');
const translationUrlSaveBtn = document.getElementById('translation-url-save');
const translationUrlChangeBtn = document.getElementById('translation-url-change');
const translationUrlStatus = document.getElementById('translation-url-status');
const translationFrame = document.getElementById('translation-frame');
const translationNewWindow = document.getElementById('translation-new-window');
const TRANSLATION_URL_STORAGE_KEY = 'topik_translation_app_url';
const TRANSLATION_POSITION_STORAGE_KEY = 'topik_translation_panel_position';

// Initialize App
function init() {
  loadLocalCurriculum();
  renderSidebar();
  loadSession(0);
  bindGlobalEvents();
}

// Load and restore edits from LocalStorage
function loadLocalCurriculum() {
  const saved = localStorage.getItem('topik_curriculum_edits');
  if (saved) {
    try {
      activeCurriculum = JSON.parse(saved);

      // Hot-patch to sync new properties (q3_l2 and Korean-to-Image vocabGamePairs)
      activeCurriculum.forEach((session, idx) => {
        // Force populates fresh game pairs data to strip out English text
        if (curriculumData[idx]) {
          session.vocabGamePairs = JSON.parse(JSON.stringify(curriculumData[idx].vocabGamePairs));
        }

        // Force sync warmup images so that illustrations are loaded properly
        if (session.vocabWarmUp && curriculumData[idx] && curriculumData[idx].vocabWarmUp) {
          session.vocabWarmUp.categories.forEach((cat, cIdx) => {
            const freshCat = curriculumData[idx].vocabWarmUp.categories[cIdx];
            if (freshCat) {
              cat.words.forEach((w, wIdx) => {
                const freshW = freshCat.words[wIdx];
                if (freshW && freshW.image) {
                  w.image = freshW.image;
                }
              });
            }
          });
        }

        // Clean all image paths to remove leading slashes (crucial for Vite base /topic/ subdirectory support)
        if (session.vocabGamePairs) {
          session.vocabGamePairs.forEach(p => {
            if (p.type === 'text-image' && p.matchVal.startsWith('/')) {
              p.matchVal = p.matchVal.substring(1);
            }
          });
        }
        if (session.vocabWarmUp) {
          session.vocabWarmUp.categories.forEach(cat => {
            cat.words.forEach(w => {
              if (w.image && w.image.startsWith('/')) {
                w.image = w.image.substring(1);
              }
            });
          });
        }
        if (session.practiceQuestions) {
          session.practiceQuestions.forEach(q => {
            if (q.image && q.image.startsWith('/')) {
              q.image = q.image.substring(1);
            }
          });
        }

        // Force sync correct answer index and dynamically insert new practice questions
        if (session.practiceQuestions && curriculumData[idx] && curriculumData[idx].practiceQuestions) {
          if (session.practiceQuestions.length !== curriculumData[idx].practiceQuestions.length) {
            const freshQuestions = JSON.parse(JSON.stringify(curriculumData[idx].practiceQuestions));
            freshQuestions.forEach((fq, fIdx) => {
              const existingQ = session.practiceQuestions.find(eq => eq.id === fq.id);
              if (existingQ) {
                // Keep the existing user properties
                freshQuestions[fIdx] = existingQ;
              }
            });
            session.practiceQuestions = freshQuestions;
          } else {
            session.practiceQuestions.forEach((q) => {
              const freshQ = curriculumData[idx].practiceQuestions.find(item => item.id === q.id);
              if (freshQ) {
                q.correct = freshQ.correct;
              }
            });
          }

          session.practiceQuestions.forEach((question) => {
            const freshQuestion = curriculumData[idx].practiceQuestions.find(item => item.id === question.id);
            const fieldsToSync = requiredQuestionCorrections[question.id];
            if (freshQuestion && fieldsToSync) {
              fieldsToSync.forEach((field) => {
                question[field] = JSON.parse(JSON.stringify(freshQuestion[field]));
              });
            }
          });
        }

        if (session.topikIntro && curriculumData[idx]?.topikIntro) {
          session.topikIntro.title = curriculumData[idx].topikIntro.title;
          session.topikIntro.sections = JSON.parse(JSON.stringify(curriculumData[idx].topikIntro.sections));
          session.topikIntro.tips = JSON.parse(JSON.stringify(curriculumData[idx].topikIntro.tips));
        }
      });
    } catch (e) {
      console.error('LocalStorage load error, reverting to default:', e);
      activeCurriculum = JSON.parse(JSON.stringify(curriculumData));
    }
  } else {
    activeCurriculum = JSON.parse(JSON.stringify(curriculumData));
  }

  normalizeCurriculumLabels();
  if (saved) saveLocalCurriculum();
}

function normalizeCurriculumLabels() {
  activeCurriculum.forEach((session) => {
    session.timeline?.forEach((item) => {
      item.activity = item.activity.replaceAll('단위 공부', '핵심 어휘 학습').replaceAll('장악', '복습');
    });

    if (session.vocabWarmUp) {
      session.vocabWarmUp.title = session.vocabWarmUp.title.replaceAll('단위 공부', '핵심 어휘 학습');
      session.vocabWarmUp.instructorGuide = session.vocabWarmUp.instructorGuide?.replaceAll('단위 공부', '핵심 어휘 학습');
    }

    if (session.vocabularyMastery) {
      session.vocabularyMastery.title = session.vocabularyMastery.title.replaceAll('장악해야 할', '복습할');
    }

    session.practiceQuestions?.forEach((question) => {
      question.category = question.category
        .replace('추가 기출', '추가 모의문항')
        .replace(/ 기출$/, ' 기출 유형');
      question.question = question.question.replaceAll('(TOPIK I 기출)', '(TOPIK I 기출 유형)');
    });
  });
}

// Save all current edits to LocalStorage
function saveLocalCurriculum() {
  localStorage.setItem('topik_curriculum_edits', JSON.stringify(activeCurriculum));
}

function getPresentationSlides() {
  return Array.from(contentContainer.querySelectorAll('.quiz-card'));
}

function showPresentationSlide(index) {
  const slides = getPresentationSlides();
  if (!slides.length) return;

  presentationSlideIndex = Math.max(0, Math.min(index, slides.length - 1));
  contentContainer.querySelectorAll('.presentation-slide-active').forEach((element) => {
    element.classList.remove('presentation-slide-active');
  });
  contentContainer.querySelectorAll('.presentation-section-active').forEach((element) => {
    element.classList.remove('presentation-section-active');
  });

  slides.forEach((slide, slideIndex) => {
    slide.setAttribute('aria-hidden', slideIndex === presentationSlideIndex ? 'false' : 'true');
  });

  const activeSlide = slides[presentationSlideIndex];
  activeSlide.classList.add('presentation-slide-active');
  activeSlide.closest('.quiz-section')?.classList.add('presentation-section-active');
  activeSlide.scrollTop = 0;

  presentationCounter.textContent = `문제 ${presentationSlideIndex + 1} / ${slides.length}`;
  presentationPrevBtn.disabled = presentationSlideIndex === 0;
  presentationNextBtn.disabled = presentationSlideIndex === slides.length - 1;
  window.scrollTo(0, 0);
}

function enterPresentationMode() {
  const slides = getPresentationSlides();
  if (!slides.length) return;

  const headerOffset = document.querySelector('header')?.offsetHeight || 0;
  presentationSlideIndex = slides.reduce((closestIndex, slide, index) => {
    const currentDistance = Math.abs(slide.getBoundingClientRect().top - headerOffset);
    const closestDistance = Math.abs(slides[closestIndex].getBoundingClientRect().top - headerOffset);
    return currentDistance < closestDistance ? index : closestIndex;
  }, 0);

  stopSpeech();
  presentationReturnScrollY = window.scrollY;
  isZoomMode = true;
  document.body.classList.add('presentation-mode');
  presentationControls.hidden = false;
  zoomToggleBtn.innerText = '🖥️ 일반 모드로 보기';
  requestAnimationFrame(() => showPresentationSlide(presentationSlideIndex));
}

function exitPresentationMode() {
  stopSpeech();
  isZoomMode = false;
  document.body.classList.remove('presentation-mode');
  presentationControls.hidden = true;
  zoomToggleBtn.innerText = '🖥️ 줌 화면 공유 모드 ON';
  contentContainer.querySelectorAll('.presentation-slide-active, .presentation-section-active').forEach((element) => {
    element.classList.remove('presentation-slide-active', 'presentation-section-active');
  });
  getPresentationSlides().forEach((slide) => slide.removeAttribute('aria-hidden'));
  window.scrollTo(0, presentationReturnScrollY);
}

function togglePresentationMode() {
  if (isZoomMode) exitPresentationMode();
  else enterPresentationMode();
}

function normalizeTranslationUrl(value) {
  try {
    const url = new URL(value.trim());
    const allowedHost = url.hostname === 'script.google.com' || url.hostname.endsWith('.script.googleusercontent.com');
    if (url.protocol !== 'https:' || !allowedHost) return '';
    return url.href;
  } catch {
    return '';
  }
}

function showTranslationConnection() {
  const savedUrl = localStorage.getItem(TRANSLATION_URL_STORAGE_KEY) || '';
  translationConnectPanel.hidden = false;
  translationFramePanel.hidden = true;
  translationAppUrlInput.value = savedUrl;
  translationUrlStatus.textContent = '';
  requestAnimationFrame(() => translationAppUrlInput.focus());
}

function showTranslationFrame(url) {
  translationConnectPanel.hidden = true;
  translationFramePanel.hidden = false;
  translationNewWindow.href = url;
  if (translationFrame.src !== url) translationFrame.src = url;
}

function restoreTranslationPosition() {
  if (window.innerWidth <= 680) return;
  try {
    const saved = JSON.parse(localStorage.getItem(TRANSLATION_POSITION_STORAGE_KEY) || 'null');
    if (!saved || !Number.isFinite(saved.left) || !Number.isFinite(saved.top)) return;
    const maxLeft = Math.max(8, window.innerWidth - translationDialog.offsetWidth - 8);
    const maxTop = Math.max(8, window.innerHeight - translationDialog.offsetHeight - 8);
    translationDialog.style.left = `${Math.max(8, Math.min(saved.left, maxLeft))}px`;
    translationDialog.style.top = `${Math.max(8, Math.min(saved.top, maxTop))}px`;
    translationDialog.style.right = 'auto';
  } catch {
    localStorage.removeItem(TRANSLATION_POSITION_STORAGE_KEY);
  }
}

function openTranslationPopup() {
  const savedUrl = normalizeTranslationUrl(localStorage.getItem(TRANSLATION_URL_STORAGE_KEY) || '');
  if (savedUrl) showTranslationFrame(savedUrl);
  else showTranslationConnection();
  translationDialog.hidden = false;
  translationPopupBtn.setAttribute('aria-expanded', 'true');
  translationPopupBtn.innerText = '🌐 번역 숨기기';
  requestAnimationFrame(restoreTranslationPosition);
}

function closeTranslationPopup() {
  translationDialog.hidden = true;
  translationPopupBtn.setAttribute('aria-expanded', 'false');
  translationPopupBtn.innerText = '🌐 실시간 번역';
}

function toggleTranslationPopup() {
  if (translationDialog.hidden) openTranslationPopup();
  else closeTranslationPopup();
}

function startTranslationDrag(event) {
  if (window.innerWidth <= 680 || event.button !== 0 || event.target.closest('button, a, input')) return;
  const rect = translationDialog.getBoundingClientRect();
  translationDragState = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
  translationDialog.classList.add('is-dragging');
  translationDialogHeader.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function moveTranslationPanel(event) {
  if (!translationDragState) return;
  const maxLeft = Math.max(8, window.innerWidth - translationDialog.offsetWidth - 8);
  const maxTop = Math.max(8, window.innerHeight - translationDialog.offsetHeight - 8);
  const left = Math.max(8, Math.min(event.clientX - translationDragState.offsetX, maxLeft));
  const top = Math.max(8, Math.min(event.clientY - translationDragState.offsetY, maxTop));
  translationDialog.style.left = `${left}px`;
  translationDialog.style.top = `${top}px`;
  translationDialog.style.right = 'auto';
}

function stopTranslationDrag() {
  if (!translationDragState) return;
  translationDragState = null;
  translationDialog.classList.remove('is-dragging');
  const rect = translationDialog.getBoundingClientRect();
  localStorage.setItem(TRANSLATION_POSITION_STORAGE_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
}

function saveTranslationUrl() {
  const url = normalizeTranslationUrl(translationAppUrlInput.value);
  if (!url) {
    translationUrlStatus.textContent = '올바른 Google Apps Script 웹앱 주소를 입력해 주세요.';
    translationAppUrlInput.focus();
    return;
  }

  localStorage.setItem(TRANSLATION_URL_STORAGE_KEY, url);
  translationUrlStatus.textContent = '';
  showTranslationFrame(url);
}

// Bind Global Window-level Events
function bindGlobalEvents() {
  // 1. Zoom Presentation Mode
  if (zoomToggleBtn) {
    zoomToggleBtn.addEventListener('click', togglePresentationMode);
    presentationPrevBtn.addEventListener('click', () => showPresentationSlide(presentationSlideIndex - 1));
    presentationNextBtn.addEventListener('click', () => showPresentationSlide(presentationSlideIndex + 1));
    document.addEventListener('keydown', (event) => {
      if (!isZoomMode) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        exitPresentationMode();
      } else if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault();
        showPresentationSlide(presentationSlideIndex + 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        showPresentationSlide(presentationSlideIndex - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        showPresentationSlide(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        showPresentationSlide(getPresentationSlides().length - 1);
      }
    });
  }

  // 2. Instructor Mode
  if (instructorToggleBtn) {
    instructorToggleBtn.addEventListener('click', () => {
      isInstructorMode = !isInstructorMode;
      instructorToggleBtn.innerText = isInstructorMode ? '🔑 강사 모드 ON' : '🔑 강사 모드 OFF';
      instructorToggleBtn.style.background = isInstructorMode
        ? 'linear-gradient(135deg, #059669, #047857)'
        : 'linear-gradient(135deg, #10b981, #059669)';

      // Reload session to toggle guide visibility
      loadSession(currentSessionIndex);
    });
  }

  // 3. PDF print
  if (pdfPrintBtn) {
    pdfPrintBtn.addEventListener('click', () => {
      stopSpeech();
      window.print();
    });
  }

  // 4. Reset edits
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('모든 편집된 교안 내용을 원본으로 초기화하시겠습니까?')) {
        stopSpeech();
        localStorage.removeItem('topik_curriculum_edits');
        loadLocalCurriculum();
        loadSession(currentSessionIndex);
      }
    });
  }

  // 5. Live translation popup
  if (translationPopupBtn && translationDialog) {
    translationPopupBtn.setAttribute('aria-expanded', 'false');
    translationPopupBtn.addEventListener('click', toggleTranslationPopup);
    translationDialogClose.addEventListener('click', closeTranslationPopup);
    translationUrlSaveBtn.addEventListener('click', saveTranslationUrl);
    translationUrlChangeBtn.addEventListener('click', showTranslationConnection);
    translationAppUrlInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') saveTranslationUrl();
    });
    translationDialogHeader.addEventListener('pointerdown', startTranslationDrag);
    document.addEventListener('pointermove', moveTranslationPanel);
    document.addEventListener('pointerup', stopTranslationDrag);
  }
}

// Render Sidebar Navigation
function renderSidebar() {
  navContainer.innerHTML = '';
  activeCurriculum.forEach((session, index) => {
    const li = document.createElement('li');
    li.className = 'nav-item';

    const button = document.createElement('button');
    button.className = `nav-btn ${index === currentSessionIndex ? 'active' : ''}`;
    button.dataset.index = index;
    button.innerHTML = `
      <span class="session-num">Session 0${index + 1} (${session.duration})</span>
      <span class="session-title">${session.title.split(': ')[1]}</span>
    `;

    button.addEventListener('click', () => {
      stopSpeech();
      currentSessionIndex = index;

      document.querySelectorAll('.nav-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
      });

      loadSession(index);
    });

    li.appendChild(button);
    navContainer.appendChild(li);
  });
}

function renderPrePractice(area, data, stepNumber) {
  if (!data) return '';

  const isReading = area === 'reading';
  const languageItems = data.particles || data.expressions || [];
  const languageTitle = isReading ? '조사·문법 핵심' : '듣기에 나오는 핵심 표현';

  return `
    <section class="pre-practice-card ${area}" aria-labelledby="${area}-prep-title">
      <div class="pre-practice-heading">
        <span class="learning-step-badge">${stepNumber}단계 · ${isReading ? '읽기 준비' : '듣기 준비'}</span>
        <h3 id="${area}-prep-title">${isReading ? '📘' : '🎧'} ${data.title}</h3>
        <p>${data.goal}</p>
      </div>

      <div class="knowledge-grid">
        <div class="knowledge-panel">
          <h4>① 문제에 나올 핵심 명사</h4>
          <div class="knowledge-item-list">
            ${data.nouns.map((item) => `
              <article class="knowledge-item">
                <strong>${item.word}</strong>
                <span>${item.meaning}</span>
                <small>${item.example}</small>
              </article>
            `).join('')}
          </div>
        </div>

        <div class="knowledge-panel">
          <h4>② ${languageTitle}</h4>
          <div class="grammar-table-wrap">
            <table class="grammar-table">
              <thead><tr><th>형태</th><th>쓰임</th><th>예문</th></tr></thead>
              <tbody>
                ${languageItems.map((item) => `
                  <tr><td><strong>${item.form}</strong></td><td>${item.use}</td><td>${item.example}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="strategy-panel">
        <h4>③ 문제 풀이 전에 기억할 순서</h4>
        <ol>${data.strategy.map((item) => `<li>${item}</li>`).join('')}</ol>
      </div>

      <details class="readiness-check">
        <summary>④ 준비 확인 문제: ${data.check.question}</summary>
        <p><strong>정답:</strong> ${data.check.answer}</p>
      </details>
    </section>
  `;
}

// Load Session Contents (Timeline -> Vocab Warm-up -> Practice -> Mastery)
function loadSession(index) {
  currentSessionIndex = index;
  const session = activeCurriculum[index];

  // Update Progress Bar
  const progressPercent = Math.round(((index + 1) / activeCurriculum.length) * 100);
  progressBarFill.style.width = `${progressPercent}%`;
  progressPercentText.innerText = `회차 진도: ${progressPercent}%`;

  // Header (Editable Title)
  let html = `
    <div class="session-header">
      <h2 contenteditable="true" data-type="session-header" data-field="title">${session.title}</h2>
      <p contenteditable="true" data-type="session-header" data-field="subTitle">${session.subTitle}</p>
      <span class="session-badge">⏱ 권장 강의 시간: ${session.duration}</span>
    </div>
  `;

  // 국립국제교육원 TOPIK 공식 소개 규정 아코디언 (1회차에 제공)
  if (session.topikIntro) {
    const intro = session.topikIntro;
    html += `
      <div class="timeline-card" style="border-left: 4px solid var(--primary-light);">
        <div class="timeline-header" id="intro-toggle-btn">
          <h3 style="color: var(--primary-color);">📢 ${intro.title}</h3>
          <span class="timeline-toggle-icon ${isIntroOpen ? 'open' : ''}" id="intro-toggle-icon">▼</span>
        </div>
        <div class="timeline-content ${isIntroOpen ? 'open' : ''}" id="intro-table-content" style="padding-top: 1rem;">
          <div style="margin-bottom: 1.25rem;">
            <strong style="display: block; margin-bottom: 0.25rem; color: var(--primary-light);">🎯 평가 목적:</strong>
            <p contenteditable="true" data-type="intro" data-field="purpose" style="font-size: calc(0.95rem * var(--font-scale)); color: var(--text-muted);">${intro.purpose}</p>
          </div>
          <div style="margin-bottom: 1.5rem;">
            <strong style="display: block; margin-bottom: 0.25rem; color: var(--primary-light);">👥 응시 대상:</strong>
            <p contenteditable="true" data-type="intro" data-field="target" style="font-size: calc(0.95rem * var(--font-scale)); color: var(--text-muted);">${intro.target}</p>
          </div>

          <h4 style="font-size: calc(1.05rem * var(--font-scale)); margin-bottom: 0.5rem; font-weight: 700;">📈 TOPIK I 평가 등급 및 합격 기준</h4>
          <table class="timeline-table" style="margin-bottom: 1.5rem;">
            <thead>
              <tr>
                <th style="width: 150px;">합격 등급</th>
                <th style="width: 180px;">합격 기준 점수</th>
                <th>등급별 평가 기준 요약</th>
              </tr>
            </thead>
            <tbody>
              ${intro.levels.map((lvl, lvlIdx) => `
                <tr>
                  <td style="font-weight: 700; color: var(--primary-light);" contenteditable="true" data-type="intro-level" data-lidx="${lvlIdx}" data-field="grade">${lvl.grade}</td>
                  <td><span class="time-badge" style="background-color: #d1fae5; color: #065f46;" contenteditable="true" data-type="intro-level" data-lidx="${lvlIdx}" data-field="standard">${lvl.standard}</span></td>
                  <td style="color: var(--text-muted); font-size: calc(0.9rem * var(--font-scale));" contenteditable="true" data-type="intro-level" data-lidx="${lvlIdx}" data-field="criteria">${lvl.criteria}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h4 style="font-size: calc(1.05rem * var(--font-scale)); margin-bottom: 0.5rem; font-weight: 700;">📝 시험 영역 및 문항 구성</h4>
          <table class="timeline-table" style="margin-bottom: 1.5rem;">
            <thead>
              <tr>
                <th>평가 영역</th>
                <th>문항 수</th>
                <th>영역별 배점</th>
                <th>시험 시간</th>
                <th>문제 유형</th>
              </tr>
            </thead>
            <tbody>
              ${intro.sections.map((sec, secIdx) => `
                <tr>
                  <td style="font-weight: 700;" contenteditable="true" data-type="intro-section" data-sidx="${secIdx}" data-field="area">${sec.area}</td>
                  <td contenteditable="true" data-type="intro-section" data-sidx="${secIdx}" data-field="questions">${sec.questions}</td>
                  <td style="font-weight: 600; color: var(--primary-light);" contenteditable="true" data-type="intro-section" data-sidx="${secIdx}" data-field="score">${sec.score}</td>
                  <td contenteditable="true" data-type="intro-section" data-sidx="${secIdx}" data-field="time">${sec.time}</td>
                  <td style="color: var(--text-muted); font-size: calc(0.9rem * var(--font-scale));" contenteditable="true" data-type="intro-section" data-sidx="${secIdx}" data-field="format">${sec.format}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="tip-box" style="margin-top: 1rem;">
            <h4 style="font-size: calc(1.05rem * var(--font-scale)); color: var(--secondary-color); margin-bottom: 0.5rem; font-weight: 700;">💡 수험생 유의사항 및 필수 전략</h4>
            <ul class="tip-list" style="margin-top: 0.5rem;">
              ${intro.tips.map((tip, tipIdx) => `<li contenteditable="true" data-type="intro-tip" data-tidx="${tipIdx}">${tip}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  // 상세 시간표 (Timeline Accordion)
  if (session.timeline && session.timeline.length > 0) {
    html += `
      <div class="timeline-card">
        <div class="timeline-header" id="timeline-toggle-btn">
          <h3>📅 2시간 특강 상세 시간표 (상세 운영 일정)</h3>
          <span class="timeline-toggle-icon ${isTimelineOpen ? 'open' : ''}" id="timeline-toggle-icon-node">▼</span>
        </div>
        <div class="timeline-content ${isTimelineOpen ? 'open' : ''}" id="timeline-table-content">
          <table class="timeline-table">
            <thead>
              <tr>
                <th style="width: 100px;">소요 시간</th>
                <th style="width: 180px;">강의 활동</th>
                <th>상세 교육 내용 및 운영 팁</th>
              </tr>
            </thead>
            <tbody>
              ${session.timeline.map((item, tIdx) => `
                <tr>
                  <td><span class="time-badge" contenteditable="true" data-type="timeline" data-tidx="${tIdx}" data-field="time">⏱ ${item.time}</span></td>
                  <td style="font-weight: 700;" contenteditable="true" data-type="timeline" data-tidx="${tIdx}" data-field="activity">${item.activity}</td>
                  <td style="color: var(--text-muted);" contenteditable="true" data-type="timeline" data-tidx="${tIdx}" data-field="detail">${item.detail}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 1단계: 단위 공부 (Vocab Warm-up) - Interactive Flashcards & Matching Game
  if (session.vocabWarmUp) {
    const warmUp = session.vocabWarmUp;

    // Instructor Guide overlay conditional rendering
    let guideHtml = '';
    if (isInstructorMode && warmUp.instructorGuide) {
      guideHtml = `
        <div class="instructor-guide-card" contenteditable="true" data-type="warmup-guide">
          ${warmUp.instructorGuide}
        </div>
      `;
    }

    // Build interactive flip cards
    let cardsHtml = '';
    warmUp.categories.forEach((cat, catIdx) => {
      cardsHtml += `
        <div style="margin-top: 1.5rem;">
          <h4 contenteditable="true" data-type="warmup-cat" data-cidx="${catIdx}" style="margin-bottom: 0.75rem; font-weight: 700;">${cat.name}</h4>
          <div class="vocab-card-grid">
            ${cat.words.map((w, wIdx) => `
              <div class="vocab-card-wrapper" role="button" tabindex="0" aria-label="${w.word} 어휘 카드 뒤집기">
                <div class="vocab-card" id="vocab-card-${catIdx}-${wIdx}">
                  <!-- Front face (Show image only for quiz-style learning) -->
                  <div class="vocab-card-front" style="padding: 0; overflow: hidden;">
                    <span class="word-badge" style="position: absolute; top: 8px; left: 8px; z-index: 10; margin-bottom: 0;">${cat.name.split(' ')[0]}</span>
                    ${vocabVisuals[w.word]
                      ? `<div class="vocab-card-front-symbol" role="img" aria-label="${w.word} 연상 기호">${vocabVisuals[w.word]}</div>`
                      : `<img src="${resolveAssetPath(w.image)}" class="vocab-card-front-img" alt="${w.word} 단어 힌트 그림" />`}
                    <button class="vocab-audio-btn" data-word="${w.word}" style="position: absolute; bottom: 8px; right: 8px; z-index: 10;">🔊</button>
                  </div>
                  <!-- Back face (Show Korean word and definitions) -->
                  <div class="vocab-card-back" style="padding: 0.75rem;">
                    <span class="word-kr" contenteditable="true" data-type="warmup-word" data-cidx="${catIdx}" data-widx="${wIdx}" data-field="word" style="font-size: calc(1.4rem * var(--font-scale)); font-weight: 700; margin-bottom: 0.25rem; color: var(--secondary-light);">${w.word}</span>
                    <span class="word-en" contenteditable="true" data-type="warmup-word" data-cidx="${catIdx}" data-widx="${wIdx}" data-field="definition" style="font-size: calc(1rem * var(--font-scale)); font-weight: 600; margin-bottom: 0.5rem; color: #cbd5e1;">${w.definition}</span>
                    <span class="word-ex" contenteditable="true" data-type="warmup-word" data-cidx="${catIdx}" data-widx="${wIdx}" data-field="example" style="font-size: calc(0.85rem * var(--font-scale)); color: #e0e7ff; background-color: rgba(255,255,255,0.1); padding: 0.35rem 0.5rem; border-radius: 4px; width: 100%; text-align: center;">${w.example}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    // Match Challenge game grid container
    const gameBoxHtml = `
      <div class="vocab-game-section">
        <h3>🕹️ 오늘의 어휘 짝 맞추기 챌린지 (Vocab Match Challenge)</h3>
        <p class="game-desc">오늘 배운 단어와 영어 번역 카드를 하나씩 선택하여 짝을 맞춰 보세요! (줌 회의 대화용 퀴즈)</p>
        <div class="game-grid" id="vocab-game-grid">
          <!-- Game cards will be injected by JS -->
        </div>
        <div id="game-success-overlay"></div>
      </div>
    `;

    html += `
      <div class="vocab-warmup-card">
        <h3 contenteditable="true" data-type="warmup" data-field="title">📖 ${warmUp.title}</h3>
        <p class="desc" contenteditable="true" data-type="warmup" data-field="description">${warmUp.description}</p>

        ${cardsHtml}
        ${gameBoxHtml}
        ${guideHtml}
      </div>
    `;
  }

  // 사전 지식 학습 후 영역별 실전 훈련
  if (session.practiceQuestions && session.practiceQuestions.length > 0) {
    const knowledge = prePracticeBySession[session.id];
    const indexedQuestions = session.practiceQuestions.map((question, questionIndex) => ({ question, questionIndex }));
    const readingQuestions = indexedQuestions.filter(({ question }) => question.type === 'reading');
    const listeningQuestions = indexedQuestions.filter(({ question }) => question.type === 'listening');

    html += `
      ${renderPrePractice('reading', knowledge?.reading, 2)}
      <div class="quiz-section">
        <div class="practice-transition">
          <span>학습 완료 → 문제 적용</span>
          <h3 class="section-title-quiz">✍️ 3단계: 읽기 문제집 풀기</h3>
          <p>방금 익힌 명사와 조사를 표시하며 문제를 풀고, 제출 후 해설로 근거를 확인하세요.</p>
        </div>
        ${readingQuestions.map(({ question, questionIndex }) => renderQuizCard(question, questionIndex)).join('')}
      </div>

      ${renderPrePractice('listening', knowledge?.listening, 4)}
      <div class="quiz-section">
        <div class="practice-transition listening">
          <span>학습 완료 → 듣고 적용</span>
          <h3 class="section-title-quiz">🎧 5단계: 듣기 문제집 풀기</h3>
          <p>보기를 먼저 읽고 핵심어를 예상한 뒤, 음성을 듣고 답을 선택하세요.</p>
        </div>
        ${listeningQuestions.map(({ question, questionIndex }) => renderQuizCard(question, questionIndex)).join('')}
      </div>
    `;
  }

  // 3단계: 마무리 장악 (Vocabulary Mastery)
  if (session.vocabularyMastery) {
    const mastery = session.vocabularyMastery;
    html += `
      <div class="vocab-mastery-card">
        <span class="learning-step-badge review">6단계 · 마무리 복습</span>
        <h3 contenteditable="true" data-type="mastery" data-field="title">🎯 ${mastery.title}</h3>
        <p class="desc" contenteditable="true" data-type="mastery" data-field="description">문제를 푼 뒤 틀린 문항의 명사·조사·핵심 표현을 다시 확인하세요. ${mastery.description}</p>

        <h4 style="margin-bottom: 0.75rem; font-weight: 700;">🏷️ 필수 명사 (Nouns)</h4>
        <div class="flashcard-grid" style="margin-bottom: 2rem;">
          ${mastery.nouns.map((item, nIdx) => `
            <div class="flashcard-wrapper" role="button" tabindex="0" aria-label="${item.word} 뜻 확인">
              <div class="flashcard" data-meaning="${item.meaning}">
                <div class="flashcard-front">
                  <span class="word-type">명사</span>
                  <span class="word-kr" contenteditable="true" data-type="mastery-noun" data-nidx="${nIdx}" data-field="word">${item.word}</span>
                </div>
                <div class="flashcard-back">
                  <span class="word-en" contenteditable="true" data-type="mastery-noun" data-nidx="${nIdx}" data-field="meaning">${item.meaning}</span>
                  <span class="hint">클릭해서 닫기</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <h4 style="margin-bottom: 0.75rem; font-weight: 700;">🏃 필수 동사/형용사 (Verbs & Adjectives)</h4>
        <div class="flashcard-grid">
          ${mastery.verbs.map((item, vIdx) => `
            <div class="flashcard-wrapper" role="button" tabindex="0" aria-label="${item.word} 뜻 확인">
              <div class="flashcard" data-meaning="${item.meaning}">
                <div class="flashcard-front">
                  <span class="word-type">동사/형용사</span>
                  <span class="word-kr" contenteditable="true" data-type="mastery-verb" data-vidx="${vIdx}" data-field="word">${item.word}</span>
                </div>
                <div class="flashcard-back">
                  <span class="word-en" contenteditable="true" data-type="mastery-verb" data-vidx="${vIdx}" data-field="meaning">${item.meaning}</span>
                  <span class="hint">클릭해서 닫기</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  contentContainer.innerHTML = html;

  // Student mode is read-only. Editing is enabled only when instructor mode is on.
  contentContainer.querySelectorAll('[contenteditable]').forEach((element) => {
    element.setAttribute('contenteditable', isInstructorMode ? 'true' : 'false');
  });

  // Event Bindings
  bindSessionEvents(session);

  // Setup Vocab Match Game
  if (session.vocabGamePairs) {
    setupVocabGame(session);
  }

  if (isZoomMode) requestAnimationFrame(() => showPresentationSlide(0));
}

// Render Quiz Card
function renderQuizCard(q, index) {
  const isSubmitted = submittedQuestions.has(q.id);
  const selectedIdx = selectedAnswers[q.id];
  const isCorrect = selectedIdx == q.correct;

  let mediaHtml = '';
  if (q.image) {
    mediaHtml = `<img src="${resolveAssetPath(q.image)}" alt="문항 삽화" class="quiz-image" />`;
  }

  let audioPlayerHtml = '';
  if (q.type === 'listening' && q.audioScript) {
    audioPlayerHtml = `
      <div class="audio-player-card" id="audio-player-${q.id}">
        <div class="audio-controls">
          <button class="play-btn" id="play-btn-${q.id}" data-qid="${q.id}">
            <span class="play-icon">▶</span> 듣기 재생
          </button>
          <div class="play-status" id="play-status-${q.id}">준비됨 (TOPIK 표준 속도)</div>
          <select class="speed-select" id="speed-select-${q.id}">
            <option value="0.7">0.7x (느리게)</option>
            <option value="0.9" selected>0.9x (연습 권장)</option>
            <option value="1.1">1.1x (약간 빠르게)</option>
          </select>
          <button class="script-toggle-btn" id="script-btn-${q.id}" data-qid="${q.id}">대사 보기</button>
        </div>
        <div class="audio-script-box" id="script-box-${q.id}" style="display: none;">
          ${q.audioScript.map((line, lineIdx) => `
            <div class="speaker-line ${line.speaker}">
              <span class="speaker-tag">${line.speaker}:</span>
              <span class="speaker-text" contenteditable="true" data-type="audio-line" data-qid="${q.id}" data-lidx="${lineIdx}">${line.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  let optionsHtml = q.options.map((opt, optIdx) => {
    let optClass = '';
    if (isSubmitted) {
      if (optIdx === q.correct) optClass = 'correct';
      else if (optIdx === selectedIdx) optClass = 'wrong';
    } else if (selectedIdx === optIdx) {
      optClass = 'selected';
    }

    const disabledAttr = isSubmitted ? 'disabled' : '';
    const numberMarkers = ['①', '②', '③', '④'];
    const marker = numberMarkers[optIdx] || (optIdx + 1);

    return `
      <button class="option-btn ${optClass}" data-qid="${q.id}" data-oidx="${optIdx}" ${disabledAttr}>
        <span class="option-marker">${marker}</span>
        <span contenteditable="true" data-type="quiz-option" data-qid="${q.id}" data-oidx="${optIdx}">${opt}</span>
      </button>
    `;
  }).join('');

  let feedbackHtml = '';
  if (isSubmitted) {
    const feedbackClass = isCorrect ? 'correct-feedback' : 'wrong-feedback';
    const feedbackTitle = isCorrect ? '✓ 정답입니다!' : '✗ 틀렸습니다.';

    let optionFeedbackHtml = '';
    if (q.optionExplanations && q.optionExplanations.length > 0) {
      optionFeedbackHtml = `
        <div class="option-explanations-list">
          <div class="analysis-title">📋 선택지별 정오답 상세 분석</div>
          ${q.optionExplanations.map((exp, idx) => {
            const isOptCorrect = idx === q.correct;
            const itemClass = isOptCorrect ? 'opt-analysis-correct' : 'opt-analysis-wrong';
            return `<div class="opt-analysis-item ${itemClass}" contenteditable="true" data-type="quiz-opt-explanation" data-qid="${q.id}" data-oidx="${idx}">${exp}</div>`;
          }).join('')}
        </div>
      `;
    }

    feedbackHtml = `
      <div class="explanation-panel ${feedbackClass}">
        <div class="feedback-title">${feedbackTitle}</div>
        <div class="explanation-text">
          <strong>[정답: ${q.correct + 1}번]</strong><br>
          <span contenteditable="true" data-type="quiz" data-qid="${q.id}" data-field="explanation">${q.explanation}</span>
          ${optionFeedbackHtml}
        </div>
      </div>
    `;
  }

  // Instructor guide under quiz card
  let guideHtml = '';
  if (isInstructorMode && q.instructorGuide) {
    guideHtml = `
      <div class="instructor-guide-card" contenteditable="true" data-type="quiz-guide" data-qid="${q.id}">
        ${q.instructorGuide}
      </div>
    `;
  }

  return `
    <div class="quiz-card ${isSubmitted ? 'answered' : ''}" id="quiz-card-${q.id}">
      <div class="quiz-header">
        <span class="question-num">문제 ${String(index + 1).padStart(2, '0')}</span>
        <span class="question-category" contenteditable="true" data-type="quiz" data-qid="${q.id}" data-field="category">${q.category}</span>
      </div>
      ${audioPlayerHtml}
      ${mediaHtml}
      <div class="question-text" contenteditable="true" data-type="quiz" data-qid="${q.id}" data-field="question">${q.question}</div>
      <div class="options-list">
        ${optionsHtml}
      </div>
      <button class="submit-btn" id="submit-btn-${q.id}" data-qid="${q.id}"
        ${isSubmitted ? 'disabled' : ''}>
        정답 확인
      </button>
      ${feedbackHtml}
      ${guideHtml}
    </div>
  `;
}

// Bind Events inside currently loaded Session
function bindSessionEvents(session) {
  // 0. TOPIK Intro Accordion Toggle handler
  const introToggleBtn = document.getElementById('intro-toggle-btn');
  const introContent = document.getElementById('intro-table-content');
  if (introToggleBtn && introContent) {
    introToggleBtn.addEventListener('click', () => {
      isIntroOpen = !isIntroOpen;
      introContent.classList.toggle('open', isIntroOpen);
      const icon = document.getElementById('intro-toggle-icon');
      if (icon) icon.classList.toggle('open', isIntroOpen);
    });
  }

  // 0.1 Timeline Accordion Toggle handler
  const timelineToggleBtn = document.getElementById('timeline-toggle-btn');
  const timelineContent = document.getElementById('timeline-table-content');
  if (timelineToggleBtn && timelineContent) {
    timelineToggleBtn.addEventListener('click', () => {
      isTimelineOpen = !isTimelineOpen;
      timelineContent.classList.toggle('open', isTimelineOpen);
      const icon = document.getElementById('timeline-toggle-icon-node');
      if (icon) icon.classList.toggle('open', isTimelineOpen);
    });
  }

  // 0.2 1단계: 단위 공부 어휘 플래시카드 뒤집기 & TTS 발음 연동
  document.querySelectorAll('.vocab-card-wrapper').forEach(wrapper => {
    const toggleVocabCard = (e) => {
      // If user is editing text (contenteditable), do not flip
      if (e.target.hasAttribute('contenteditable')) return;

      // If user clicked the speak audio button, trigger speech and block card flipping
      if (e.target.classList.contains('vocab-audio-btn') || e.target.closest('.vocab-audio-btn')) {
        e.stopPropagation();
        const wordBtn = e.target.closest('.vocab-audio-btn');
        const textToSpeak = wordBtn.dataset.word;
        speakWord(textToSpeak);
        return;
      }

      const card = wrapper.querySelector('.vocab-card');
      if (card) {
        card.classList.toggle('flipped');
      }
    };
    wrapper.addEventListener('click', toggleVocabCard);
    wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleVocabCard(e);
      }
    });
  });

  // 1. Option click handlers
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.target.hasAttribute('contenteditable')) return;

      const qid = btn.dataset.qid;
      const oidx = parseInt(btn.dataset.oidx, 10);

      selectedAnswers[qid] = oidx;

      document.querySelectorAll(`.option-btn[data-qid="${qid}"]`).forEach(opt => {
        opt.classList.remove('selected');
      });
      btn.classList.add('selected');

      const submitBtn = document.getElementById(`submit-btn-${qid}`);
      if (submitBtn) submitBtn.removeAttribute('disabled');
    });
  });

  // 2. Submit click handlers
  document.querySelectorAll('.submit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qid = btn.dataset.qid;
      submittedQuestions.add(qid);

      const question = session.practiceQuestions.find(q => q.id === qid);
      if (question) {
        if (activeAudioQuestionId === qid) {
          stopSpeech();
        }

        const cardIndex = session.practiceQuestions.findIndex(q => q.id === qid);
        const cardElement = document.getElementById(`quiz-card-${qid}`);
        if (cardElement) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = renderQuizCard(question, cardIndex);
          const newCard = tempDiv.firstElementChild;
          cardElement.replaceWith(newCard);

          rebindCardEvents(qid, question, session);
        }
      }
    });
  });

  // 3. Audio click handlers
  document.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qid = btn.dataset.qid;
      handleAudioPlay(qid, session);
    });
  });

  document.querySelectorAll('.script-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qid = btn.dataset.qid;
      const scriptBox = document.getElementById(`script-box-${qid}`);
      if (scriptBox) {
        const isHidden = scriptBox.style.display === 'none';
        scriptBox.style.display = isHidden ? 'block' : 'none';
        btn.innerText = isHidden ? '대사 숨기기' : '대사 보기';
      }
    });
  });

  // 4. Flashcard flip handlers (3단계 마무리 장악)
  document.querySelectorAll('.flashcard-wrapper').forEach(wrapper => {
    const toggleMasteryCard = (e) => {
      if (e.target.hasAttribute('contenteditable')) return;
      const card = wrapper.querySelector('.flashcard');
      if (card) {
        card.classList.toggle('flipped');
      }
    };
    wrapper.addEventListener('click', toggleMasteryCard);
    wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMasteryCard(e);
      }
    });
  });

  // 5. Live Edit Listener - contenteditable change handlers
  document.querySelectorAll('[contenteditable="true"]').forEach(el => {
    el.addEventListener('blur', () => {
      updateCurriculumData(el);
    });
  });
}

// Rebind events on a graded card
function rebindCardEvents(qid, question, session) {
  if (question.type === 'listening') {
    const playBtn = document.getElementById(`play-btn-${qid}`);
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        handleAudioPlay(qid, session);
      });
    }

    const scriptBtn = document.getElementById(`script-btn-${qid}`);
    if (scriptBtn) {
      scriptBtn.addEventListener('click', () => {
        const scriptBox = document.getElementById(`script-box-${qid}`);
        if (scriptBox) {
          const isHidden = scriptBox.style.display === 'none';
          scriptBox.style.display = isHidden ? 'block' : 'none';
          scriptBtn.innerText = isHidden ? '대사 숨기기' : '대사 보기';
        }
      });
    }
  }

  // Rebind contenteditable blur triggers
  const cardElement = document.getElementById(`quiz-card-${qid}`);
  if (cardElement) {
    cardElement.querySelectorAll('[contenteditable]').forEach((element) => {
      element.setAttribute('contenteditable', isInstructorMode ? 'true' : 'false');
    });

    cardElement.querySelectorAll('[contenteditable="true"]').forEach(el => {
      el.addEventListener('blur', () => {
        updateCurriculumData(el);
      });
    });
  }
}

// Update local curriculum object when edit is made
function updateCurriculumData(el) {
  const type = el.dataset.type;
  const field = el.dataset.field;
  const newValue = el.innerHTML.trim();
  const session = activeCurriculum[currentSessionIndex];

  if (type === 'session-header') {
    session[field] = newValue;
  }
  else if (type === 'intro') {
    session.topikIntro[field] = newValue;
  }
  else if (type === 'intro-level') {
    const lidx = parseInt(el.dataset.lidx, 10);
    session.topikIntro.levels[lidx][field] = newValue;
  }
  else if (type === 'intro-section') {
    const sidx = parseInt(el.dataset.sidx, 10);
    session.topikIntro.sections[sidx][field] = newValue;
  }
  else if (type === 'intro-tip') {
    const tidx = parseInt(el.dataset.tidx, 10);
    session.topikIntro.tips[tidx] = newValue;
  }
  else if (type === 'timeline') {
    const tidx = parseInt(el.dataset.tidx, 10);
    session.timeline[tidx][field] = newValue;
  }
  else if (type === 'warmup') {
    session.vocabWarmUp[field] = newValue;
  }
  else if (type === 'warmup-cat') {
    const cidx = parseInt(el.dataset.cidx, 10);
    session.vocabWarmUp.categories[cidx].name = newValue;
  }
  else if (type === 'warmup-word') {
    const cidx = parseInt(el.dataset.cidx, 10);
    const widx = parseInt(el.dataset.widx, 10);
    session.vocabWarmUp.categories[cidx].words[widx][field] = newValue;
  }
  else if (type === 'warmup-guide') {
    session.vocabWarmUp.instructorGuide = newValue;
  }
  else if (type === 'quiz') {
    const qid = el.dataset.qid;
    const q = session.practiceQuestions.find(item => item.id === qid);
    if (q) q[field] = newValue;
  }
  else if (type === 'audio-line') {
    const qid = el.dataset.qid;
    const lidx = parseInt(el.dataset.lidx, 10);
    const q = session.practiceQuestions.find(item => item.id === qid);
    if (q && q.audioScript) q.audioScript[lidx].text = newValue;
  }
  else if (type === 'quiz-option') {
    const qid = el.dataset.qid;
    const oidx = parseInt(el.dataset.oidx, 10);
    const q = session.practiceQuestions.find(item => item.id === qid);
    if (q) q.options[oidx] = newValue;
  }
  else if (type === 'quiz-opt-explanation') {
    const qid = el.dataset.qid;
    const oidx = parseInt(el.dataset.oidx, 10);
    const q = session.practiceQuestions.find(item => item.id === qid);
    if (q) q.optionExplanations[oidx] = newValue;
  }
  else if (type === 'quiz-guide') {
    const qid = el.dataset.qid;
    const q = session.practiceQuestions.find(item => item.id === qid);
    if (q) q.instructorGuide = newValue;
  }
  else if (type === 'mastery') {
    session.vocabularyMastery[field] = newValue;
  }
  else if (type === 'mastery-noun') {
    const nidx = parseInt(el.dataset.nidx, 10);
    session.vocabularyMastery.nouns[nidx][field] = newValue;
  }
  else if (type === 'mastery-verb') {
    const vidx = parseInt(el.dataset.vidx, 10);
    session.vocabularyMastery.verbs[vidx][field] = newValue;
  }

  // Save changes silently
  saveLocalCurriculum();
}

// Speak single vocabulary word using TTS
function speakWord(text) {
  window.speechSynthesis.cancel(); // Stop current speech
  const cleanText = text.replace(/<\/?[^>]+(>|$)/g, ""); // Strip HTML tags
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.85;
  utterance.pitch = 1.1; // Friendly teaching tone
  window.speechSynthesis.speak(utterance);
}

// 🕹️ Set up and shuffle the Vocab Match Challenge Minigame (Text-to-Text & Text-to-Image)
function setupVocabGame(session) {
  const gameGrid = document.getElementById('vocab-game-grid');
  const successOverlay = document.getElementById('game-success-overlay');
  if (!gameGrid || !session.vocabGamePairs) return;

  // Clear previous states
  gameGrid.innerHTML = '';
  if (successOverlay) successOverlay.innerHTML = '';
  selectedGameCards = [];
  matchedPairsCount = 0;

  const pairs = session.vocabGamePairs;
  totalPairsCount = pairs.length;

  // Split into flat card objects (6 Left-hand cards, 6 Right-hand cards)
  const cards = [];
  pairs.forEach(pair => {
    // Left card is always Korean text
    cards.push({ text: pair.text, key: pair.key, type: 'left', isImage: false });
    // Right card can be English text OR image path
    const isImg = pair.type === 'text-image';
    cards.push({ text: pair.matchVal, key: pair.key, type: 'right', isImage: isImg });
  });

  // Fisher-Yates Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  currentShuffledCards = cards;

  // Render cards to game grid
  cards.forEach((card, index) => {
    const cardEl = document.createElement('button');
    cardEl.type = 'button';
    cardEl.className = 'game-card';
    if (card.isImage) {
      cardEl.classList.add('game-card-image-type');
    }
    cardEl.dataset.key = card.key;
    cardEl.dataset.type = card.type;
    cardEl.dataset.index = index;
    cardEl.setAttribute('aria-label', card.isImage ? '어휘 매칭 그림' : `${card.text} 매칭 카드`);

    if (card.isImage) {
      cardEl.innerHTML = `<img src="${resolveAssetPath(card.text)}" class="game-card-img" alt="매칭 그림" />`;
    } else {
      cardEl.innerText = card.text.replace(/<\/?[^>]+(>|$)/g, "");
    }

    cardEl.addEventListener('click', () => {
      handleGameCardClick(cardEl, card);
    });

    gameGrid.appendChild(cardEl);
  });
}

// Game Card Click handler
function handleGameCardClick(el, card) {
  // Block if card is already matched, incorrect, or already selected
  if (el.classList.contains('matched') || el.classList.contains('incorrect') || el.classList.contains('selected')) {
    return;
  }

  // Speak word if user clicked on left Korean card
  if (card.type === 'left') {
    speakWord(card.text);
  }

  el.classList.add('selected');
  selectedGameCards.push({ el, card });

  // Evaluate matching when two cards are chosen
  if (selectedGameCards.length === 2) {
    const card1 = selectedGameCards[0];
    const card2 = selectedGameCards[1];

    if (card1.card.key === card2.card.key && card1.card.type !== card2.card.type) {
      // Match SUCCESS
      card1.el.classList.remove('selected');
      card2.el.classList.remove('selected');
      card1.el.classList.add('matched');
      card2.el.classList.add('matched');

      // Text updates only for non-image text cards
      if (!card1.card.isImage) {
        card1.el.innerHTML = `✓ ${card1.el.innerText}`;
      }
      if (!card2.card.isImage) {
        card2.el.innerHTML = `✓ ${card2.el.innerText}`;
      }

      matchedPairsCount++;
      selectedGameCards = [];

      // Check WIN condition
      if (matchedPairsCount === totalPairsCount) {
        setTimeout(() => {
          const successOverlay = document.getElementById('game-success-overlay');
          if (successOverlay) {
            successOverlay.innerHTML = `
              <div class="game-success-message">
                🎉 축하합니다! 오늘의 기초 어휘 짝을 모두 완벽하게 맞추었습니다!
              </div>
            `;
            // Trigger speech congratulations
            speakWord("참 잘했습니다! 오늘의 필수 어휘를 정복했습니다.");
          }
        }, 300);
      }
    } else {
      // Match FAILURE
      card1.el.classList.remove('selected');
      card2.el.classList.remove('selected');
      card1.el.classList.add('incorrect');
      card2.el.classList.add('incorrect');

      setTimeout(() => {
        card1.el.classList.remove('incorrect');
        card2.el.classList.remove('incorrect');
      }, 500);

      selectedGameCards = [];
    }
  }
}

// Handle Audio playback (SpeechSynthesis)
function handleAudioPlay(qid, session) {
  if (activeAudioQuestionId === qid) {
    stopSpeech();
    return;
  }

  if (activeAudioQuestionId) {
    stopSpeech();
  }

  const question = session.practiceQuestions.find(q => q.id === qid);
  if (!question || !question.audioScript) return;

  activeAudioQuestionId = qid;

  const playBtn = document.getElementById(`play-btn-${qid}`);
  const playStatus = document.getElementById(`play-status-${qid}`);
  const speedSelect = document.getElementById(`speed-select-${qid}`);
  const rate = parseFloat(speedSelect ? speedSelect.value : 0.9);

  if (playBtn) {
    playBtn.innerHTML = '<span class="play-icon">■</span> 듣기 정지';
    playBtn.classList.add('playing');
  }

  if (playStatus) {
    playStatus.innerText = '재생 중...';
  }

  const synth = window.speechSynthesis;
  currentUtterances = [];

  question.audioScript.forEach((line, index) => {
    // Read text stripping raw HTML tags if any (from edits)
    const cleanText = line.text.replace(/<\/?[^>]+(>|$)/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ko-KR';
    utterance.rate = rate;

    if (line.speaker === '여') {
      utterance.pitch = 1.25;
    } else {
      utterance.pitch = 0.8;
    }

    utterance.onstart = () => {
      if (activeAudioQuestionId === qid && playStatus) {
        playStatus.innerText = `🎙 [${line.speaker}] 말하는 중...`;
      }
    };

    utterance.onend = () => {
      if (index === question.audioScript.length - 1) {
        resetAudioUI(qid);
      }
    };

    utterance.onerror = (err) => {
      console.error('SpeechSynthesis error:', err);
      if (index === question.audioScript.length - 1) {
        resetAudioUI(qid);
      }
    };

    currentUtterances.push(utterance);
    synth.speak(utterance);
  });
}

// Reset Audio Interface
function resetAudioUI(qid) {
  const playBtn = document.getElementById('play-btn-' + qid);
  const playStatus = document.getElementById('play-status-' + qid);

  if (playBtn) {
    playBtn.innerHTML = '<span class="play-icon">▶</span> 듣기 재생';
    playBtn.classList.remove('playing');
  }

  if (playStatus) {
    playStatus.innerText = '재생 완료';
  }

  if (activeAudioQuestionId === qid) {
    activeAudioQuestionId = null;
    currentUtterances = [];
  }
}

// Stop ongoing speech
function stopSpeech() {
  if (activeAudioQuestionId) {
    const qid = activeAudioQuestionId;
    window.speechSynthesis.cancel();
    resetAudioUI(qid);
  }
}

// Run
window.addEventListener('DOMContentLoaded', init);
// Final deployment sync. Build OK.
