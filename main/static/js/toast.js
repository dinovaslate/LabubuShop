(function(){
  const el = document.getElementById('toast-component');
  if (!el) return;
  const titleEl = document.getElementById('toast-title');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');
  const closeEl = document.getElementById('toast-close');

  function applyType(type){
    el.style.borderColor = '#d1d5db';
    el.style.backgroundColor = '#ffffff';
    el.style.color = '#111827';
    iconEl.textContent = 'ℹ️';
    if (type === 'success'){
      el.style.borderColor = '#22c55e';
      el.style.backgroundColor = '#ecfdf5';
      el.style.color = '#065f46';
      iconEl.textContent = '✅';
    } else if (type === 'error'){
      el.style.borderColor = '#ef4444';
      el.style.backgroundColor = '#fef2f2';
      el.style.color = '#7f1d1d';
      iconEl.textContent = '⛔';
    } else if (type === 'warning'){
      el.style.borderColor = '#f59e0b';
      el.style.backgroundColor = '#fffbeb';
      el.style.color = '#78350f';
      iconEl.textContent = '⚠️';
    }
  }

  let timer = null;
  window.showToast = function(title, message, type='normal', duration=2400){
    titleEl.textContent = title || '';
    msgEl.textContent = message || '';
    applyType(type);
    el.classList.remove('opacity-0','translate-y-2');
    el.classList.add('opacity-100','translate-y-0');
    if (timer) clearTimeout(timer);
    timer = setTimeout(hide, duration);
  };
  function hide(){
    el.classList.remove('opacity-100','translate-y-0');
    el.classList.add('opacity-0','translate-y-2');
  }
  if (closeEl) closeEl.addEventListener('click', hide);
})();
