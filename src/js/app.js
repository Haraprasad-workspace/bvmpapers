import catalogue from '../data/papers.json';
import { getDisplayName, getProfile, saveAnonymous, saveDisplayName } from './user.js';
import { isInSemesterRoom, onPresenceChange, refreshPresenceProfile, startPresence, stopPresence } from './presence.js';

const app = document.querySelector('#app');
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const slug = value => String(value).normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
const route = () => location.hash.replace(/^#/, '') || '/';
let presenceView = { status: 'connecting', count: null };

function shell(content) {
  return `<div class="site-shell">
    <header class="topbar"><a class="brand" href="#/" aria-label="BVM Papers home"><span class="brand-mark">B</span><span>BVM <span class="brand-light">Papers</span></span></a><div class="topbar-tools"><span class="topbar-note">A simpler way to find your papers</span><button class="name-change" type="button" data-change-name>Change name</button></div></header>
    <main>${content}</main>
    <footer class="footer"><span>BVM Papers</span><span>Information Technology · Semester 5</span><button class="footer-name" type="button" data-change-name>Change display name</button></footer>
  </div>`;
}

function subjectCard(subject) {
  const count = subject.papers.length;
  return `<a class="subject-card" href="#/subject/${encodeURIComponent(subject.id)}">
    <span class="card-top"><span class="subject-code">${esc(subject.code || 'ELECTIVE')}</span><span class="card-arrow" aria-hidden="true">↗</span></span>
    <span class="subject-name">${esc(subject.name)}</span>
    <span class="paper-count">${count} ${count === 1 ? 'paper' : 'papers'} available</span>
  </a>`;
}

function home(query = '') {
  const normalized = query.trim().toLocaleLowerCase();
  const matches = catalogue.subjects.filter(subject => `${subject.name} ${subject.code}`.toLocaleLowerCase().includes(normalized));
  return shell(`<section class="intro">
    <p class="eyebrow">${esc(catalogue.department)} <span>·</span> Semester ${esc(catalogue.semester)}</p>
    <h1>Your papers,<br><span>all in one place.</span></h1>
    <p class="intro-copy">Find a subject, choose an exam session, and get straight to the paper.</p>
    <label class="search-wrap"><span class="search-icon" aria-hidden="true">⌕</span><input id="subject-search" type="search" placeholder="Search subjects or codes" value="${esc(query)}" autocomplete="off" aria-label="Search subjects or codes"><kbd>/</kbd></label>
  </section>
  <section class="catalogue" aria-live="polite"><div class="section-heading"><div><p class="eyebrow">THE CATALOGUE</p><h2>Semester subjects</h2></div><span class="subject-total">${matches.length} subjects</span></div>
    <div class="presence-strip" id="presence-room" data-status="${presenceView.status}" aria-live="polite"><span class="presence-light" aria-hidden="true"></span><div class="presence-copy"><strong id="presence-count"></strong><span id="presence-detail"></span></div><span class="presence-tag">LIVE ROOM</span></div>
    ${matches.length ? `<div class="subject-grid">${matches.map(subjectCard).join('')}</div>` : `<div class="empty-state"><span class="empty-icon">⌕</span><h3>No subjects found</h3><p>Try another subject name or code.</p></div>`}
  </section>`);
}

function paperRow(subject, paper) {
  const filename = `${subject.code || slug(subject.name)}-${paper.session}-${paper.year}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '-');
  const file = esc(paper.file);
  return `<article class="paper-card">
    <a class="paper-card-link" href="${file}" target="_blank" rel="noopener" aria-label="Preview ${esc(subject.name)} ${esc(paper.session)} ${esc(paper.year)} PDF">
      <span class="paper-card-top"><span class="paper-session">${esc(paper.session)} session</span><span class="paper-open" aria-hidden="true">↗</span></span>
      <strong class="paper-card-year">${esc(paper.year)}</strong>
      <span class="paper-card-cta">Open paper <span aria-hidden="true">→</span></span>
    </a>
    <a class="paper-download" href="${file}" download="${esc(filename)}" aria-label="Download ${esc(subject.name)} ${esc(paper.session)} ${esc(paper.year)} PDF" title="Download PDF">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v4h14v-4" /></svg><span>Download PDF</span>
    </a>
  </article>`;
}

function subjectPage(id) {
  const subject = catalogue.subjects.find(item => item.id === id);
  if (!subject) return shell(`<section class="not-found"><p class="eyebrow">NOT FOUND</p><h1>We couldn't find that subject.</h1><a class="text-link" href="#/">Return to all subjects <span aria-hidden="true">→</span></a></section>`);
  return shell(`<section class="subject-detail"><a class="back-link" href="#/">← <span>All subjects</span></a><div class="subject-heading"><p class="eyebrow">${esc(catalogue.department)} <span>·</span> Semester ${esc(catalogue.semester)}</p><h1>${esc(subject.name)}</h1>${subject.code ? `<span class="detail-code">${esc(subject.code)}</span>` : ''}</div>
    <div class="papers-panel"><div class="section-heading"><div><p class="eyebrow">QUESTION PAPERS</p><h2>Choose your exam</h2></div><span class="subject-total">${subject.papers.length} papers</span></div>
      ${subject.papers.length ? `<div class="paper-grid">${[...subject.papers].sort((a,b) => b.year-a.year || a.session.localeCompare(b.session)).map(paper => paperRow(subject,paper)).join('')}</div>` : `<div class="empty-state paper-empty"><span class="empty-icon">⌁</span><h3>Papers are on the way</h3><p>There are no papers listed for this subject yet.</p></div>`}
      <p class="pdf-note">Select a card to preview in your browser. Use its download icon to save the PDF.</p>
    </div></section>`);
}

function render(query = '') {
  const current = route();
  const match = current.match(/^\/subject\/([^/]+)$/);
  app.innerHTML = match ? subjectPage(decodeURIComponent(match[1])) : current === '/' ? home(query) : subjectPage('');
  renderPresenceView();
}

function renderPresenceView() {
  const room = document.querySelector('#presence-room');
  if (!room) return;
  room.dataset.status = presenceView.status;
  const count = room.querySelector('#presence-count');
  const detail = room.querySelector('#presence-detail');
  if (presenceView.status === 'connected' && Number.isFinite(presenceView.count)) {
    count.textContent = `${presenceView.count} ${presenceView.count === 1 ? 'student' : 'students'} online`;
    detail.textContent = 'Currently viewing Semester 5';
  } else if (presenceView.status === 'connecting') {
    count.textContent = 'Connecting to live count…';
    detail.textContent = 'Currently viewing Semester 5';
  } else if (presenceView.status === 'disconnected') {
    count.textContent = 'Reconnecting to live count…';
    detail.textContent = 'The paper catalogue is still available';
  } else {
    count.textContent = 'Live count unavailable';
    detail.textContent = 'The paper catalogue is still available';
  }
}

function openNameDialog() {
  app.querySelector('.welcome-backdrop')?.remove();
  const existingName = getDisplayName();
  app.insertAdjacentHTML('beforeend', `<div class="welcome-backdrop"><section class="welcome-dialog" role="dialog" aria-modal="true" aria-labelledby="welcome-title" aria-describedby="welcome-copy">
    <span class="welcome-mark" aria-hidden="true">B</span><p class="eyebrow">BVM PAPERS</p><h2 id="welcome-title">${existingName ? 'Update your display name' : 'Welcome to BVM Papers!'}</h2><p id="welcome-copy" class="welcome-copy">What should we call you?</p>
    <form id="welcome-form"><label class="name-label" for="display-name">Display name</label><input id="display-name" name="displayName" type="text" maxlength="24" autocomplete="nickname" placeholder="Enter a name" value="${esc(existingName === 'Anonymous' ? '' : existingName)}" required><p class="name-error" id="name-error" role="alert"></p><button class="welcome-submit" type="submit">Continue <span aria-hidden="true">→</span></button></form>
    <button class="anonymous-button" type="button" id="continue-anonymous">Continue as Anonymous</button><p class="privacy-note">Your display name stays in this browser for 7 days. No account needed.</p>
  </section></div>`);
  app.querySelector('.site-shell').inert = true;
  const input = app.querySelector('#display-name');
  const form = app.querySelector('#welcome-form');
  input.focus();
  form.addEventListener('submit', event => {
    event.preventDefault();
    const result = saveDisplayName(input.value);
    if (!result.ok) { app.querySelector('#name-error').textContent = result.message; input.focus(); return; }
    closeNameDialog();
  });
  app.querySelector('#continue-anonymous').addEventListener('click', () => {
    saveAnonymous();
    closeNameDialog();
  });
}

function closeNameDialog() {
  app.querySelector('.site-shell').inert = false;
  app.querySelector('.welcome-backdrop')?.remove();
}

function updateRoomLifecycle() {
  if (!getProfile()) return;
  if (isInSemesterRoom(route())) startPresence();
  else stopPresence();
}

function renderHomeSearch(value) {
  app.innerHTML = home(value);
  const input = document.querySelector('#subject-search');
  input.focus(); input.setSelectionRange(value.length, value.length);
}

export function startApp() {
  render();
  onPresenceChange(nextState => { presenceView = nextState; renderPresenceView(); });
  if (!getProfile()) openNameDialog();
  else updateRoomLifecycle();
  window.addEventListener('bvm-profile-change', () => {
    render();
    refreshPresenceProfile();
    updateRoomLifecycle();
  });
  window.addEventListener('storage', event => {
    if (event.key !== 'bvm_papers_user') return;
    render();
    refreshPresenceProfile();
    updateRoomLifecycle();
  });
  app.addEventListener('input', event => {
    if (event.target.id === 'subject-search') renderHomeSearch(event.target.value);
  });
  app.addEventListener('click', event => {
    if (event.target.closest('[data-change-name]')) openNameDialog();
  });
  window.addEventListener('hashchange', () => { render(); updateRoomLifecycle(); });
  window.addEventListener('keydown', event => {
    if (event.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
      event.preventDefault(); document.querySelector('#subject-search')?.focus();
    }
    if (event.key === 'Escape' && document.activeElement.id === 'subject-search') document.activeElement.blur();
  });
}
