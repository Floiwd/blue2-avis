/**
 * Blue 2.0 - Widget d'avis clients officiel
 * Intégration haute performance, auto-redimensionnement dynamique & SEO Google Rich Snippets
 */
(function () {
  'use strict';

  var BASE_URL = 'https://blue2-avis.vercel.app';

  // 1. Injection automatique du Schema.org JSON-LD dans le <head> du site hôte pour Google Rich Snippets
  function injectGoogleSchema(siteSlug) {
    if (document.getElementById('blue2-schema-' + siteSlug)) return;

    fetch(BASE_URL + '/api/avis?site=' + encodeURIComponent(siteSlug))
      .then(function (res) {
        if (!res.ok) throw new Error('Erreur API');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.site) return;

        var stats = data.stats || {};
        var avisList = data.avis || [];

        var schema = {
          '@context': 'https://schema.org',
          '@type': 'HomeAndConstructionBusiness',
          '@id': window.location.origin + window.location.pathname + '#blue2-reviews',
          name: data.site.nom || 'Blue 2.0',
          url: window.location.href,
          description: 'Avis clients certifiés pour ' + (data.site.nom || 'Blue 2.0') + ' : construction de piscines, spas et aménagements.',
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: stats.moyenne_globale ? stats.moyenne_globale.toFixed(1) : '5.0',
            bestRating: '5',
            worstRating: '1',
            ratingCount: stats.total || avisList.length || 1,
            reviewCount: stats.total || avisList.length || 1
          },
          review: avisList.slice(0, 20).map(function (a) {
            return {
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: (a.prenom + ' ' + (a.initiale_nom || '')).trim()
              },
              datePublished: a.created_at ? a.created_at.split('T')[0] : '2026-11-06',
              reviewBody: a.commentaire || (a.intitule_prestation ? 'Prestation réalisée : ' + a.intitule_prestation : 'Prestation piscine réalisée avec Blue 2.0.'),
              reviewRating: {
                '@type': 'Rating',
                ratingValue: a.notes && a.notes.moyenne ? a.notes.moyenne.toFixed(1) : '5',
                bestRating: '5',
                worstRating: '1'
              }
            };
          })
        };

        var scriptEl = document.createElement('script');
        scriptEl.id = 'blue2-schema-' + siteSlug;
        scriptEl.type = 'application/ld+json';
        scriptEl.textContent = JSON.stringify(schema);
        document.head.appendChild(scriptEl);
      })
      .catch(function (err) {
        console.warn('[Blue 2.0] Info SEO JSON-LD:', err);
      });
  }

  // 2. Initialisation des widgets dans la page
  function initBlue2Widgets() {
    var containers = document.querySelectorAll(
      '[data-blue2-widget], #blue2-reviews, .blue2-reviews-widget'
    );

    containers.forEach(function (el) {
      if (el.getAttribute('data-loaded')) return;
      el.setAttribute('data-loaded', 'true');

      var site = el.getAttribute('data-site') || 'saint-die-vosges';
      var minHeight = el.getAttribute('data-min-height') || '500px';

      // Injection SEO automatique dans la page hôte
      injectGoogleSchema(site);

      // Création de l'iframe avec communication de hauteur en temps réel
      var iframe = document.createElement('iframe');
      var iframeId = 'blue2-iframe-' + Math.random().toString(36).substring(2, 9);
      iframe.id = iframeId;
      iframe.src = BASE_URL + '/widget?site=' + encodeURIComponent(site) + '&embed=true&frameId=' + iframeId;
      iframe.style.width = '100%';
      iframe.style.minHeight = minHeight;
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.style.borderRadius = '0';
      iframe.style.background = 'transparent';
      iframe.style.colorScheme = 'light';
      iframe.style.display = 'block';
      iframe.style.transition = 'height 0.2s ease';
      iframe.setAttribute('allowtransparency', 'true');
      iframe.title = 'Avis Clients Certifiés Blue 2.0';
      iframe.loading = 'lazy';

      el.innerHTML = '';
      el.appendChild(iframe);
    });
  }

  // 3. Écoute du redimensionnement automatique envoyé par le widget (Fix anti-boucle et anti-descente)
  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'blue2-widget-resize') return;
    var frameId = event.data.frameId;
    var height = parseInt(event.data.height, 10);
    if (!height || isNaN(height) || height < 80) return;

    function applyHeight(f) {
      var current = parseInt(f.style.height || f.offsetHeight || 0, 10);
      if (Math.abs(current - height) >= 5) {
        f.style.height = height + 'px';
      }
    }

    if (frameId) {
      var targetFrame = document.getElementById(frameId);
      if (targetFrame) applyHeight(targetFrame);
    } else {
      var allIframes = document.querySelectorAll('iframe[src*="/widget"]');
      allIframes.forEach(applyHeight);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlue2Widgets);
  } else {
    initBlue2Widgets();
  }
})();
