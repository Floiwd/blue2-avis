(function () {
  function initBlue2Widgets() {
    var containers = document.querySelectorAll('[data-blue2-widget], #blue2-reviews, .blue2-reviews-widget');
    containers.forEach(function (el) {
      if (el.getAttribute('data-loaded')) return;
      el.setAttribute('data-loaded', 'true');

      var site = el.getAttribute('data-site') || 'saint-die-vosges';
      var height = el.getAttribute('data-height') || '680px';
      var baseUrl = 'https://blue2-avis.vercel.app';

      var iframe = document.createElement('iframe');
      iframe.src = baseUrl + '/widget?site=' + encodeURIComponent(site);
      iframe.style.width = '100%';
      iframe.style.height = height;
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.style.borderRadius = '16px';
      iframe.title = 'Avis Clients Blue 2.0';
      iframe.loading = 'lazy';

      el.innerHTML = '';
      el.appendChild(iframe);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlue2Widgets);
  } else {
    initBlue2Widgets();
  }
})();
