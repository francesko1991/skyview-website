import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Auto-open the tweaks panel when the page is loaded standalone (not embedded
// in a host iframe). The panel listens for `__activate_edit_mode` messages.
if (window.parent === window) {
  setTimeout(() => {
    window.postMessage({ type: '__activate_edit_mode' }, '*');
  }, 600);
}

// Occasional subtle pulse on the highlighted accent words.
(function scheduleAccentPulses() {
  const start = () => {
    if (document.body && document.body.getAttribute('data-anim') === 'off') return;
    const targets = document.querySelectorAll('.headline .accent-word');
    if (!targets.length) return;
    targets.forEach((el, i) => {
      const firstDelay = 4000 + i * 1800 + Math.random() * 2000;
      setTimeout(function tick() {
        if (document.body.getAttribute('data-anim') === 'off') {
          setTimeout(tick, 8000);
          return;
        }
        el.classList.remove('is-pulsing');
        // force reflow so the class re-add restarts the animation
        void (el as HTMLElement).offsetWidth;
        el.classList.add('is-pulsing');
        const next = 6000 + Math.random() * 6000;
        setTimeout(tick, next);
      }, firstDelay);
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    setTimeout(start, 500);
  }
})();
