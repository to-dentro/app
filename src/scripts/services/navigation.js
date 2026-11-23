(() => {
  'use strict';
  import(new URL('../components/device-tip.js', document.currentScript.src).href).catch(() => { /* A recomendação não impede a navegação. */ });
  const root = new URL('../../../', document.currentScript.src);
  const returnKey = 'to-dentro-navigation-return';
  function local(value) {
    if (!value) return null;
    try {
      const url = new URL(value, location.href);
      return url.origin === root.origin && url.pathname.startsWith(root.pathname) ? url : null;
    } catch {
      return null;
    }
  }

  function comparable(url) {
    const path = url.pathname === root.pathname ? new URL('index.html', root).pathname : url.pathname;
    const params = new URLSearchParams(url.search);
    params.sort();
    const query = params.toString();
    return path + (query ? '?' + query : '') + url.hash;
  }

  window.addEventListener('pageshow', () => {
    try {
      const pending = JSON.parse(sessionStorage.getItem(returnKey));
      if (!pending || pending.entry !== window.navigation?.currentEntry?.key) return;
      sessionStorage.removeItem(returnKey);
      const destination = local(pending.destination);
      if (destination && comparable(destination) !== comparable(new URL(location.href))) location.replace(destination.href);
    } catch { /* O retorno continua disponível pelo link da página. */ }
  });

  window.ToDentroNavigation = {
    from(params, ...allowedPaths) {
      const source = local(params.get('from'));
      if (!source) return null;
      return allowedPaths.some(path => local(path)?.pathname === source.pathname) ? source : null;
    },
    returnTo(value) {
      const destination = local(value);
      if (!destination) return;
      const navigation = window.navigation;
      const index = navigation?.currentEntry?.index;
      const previous = index > 0 ? navigation.entries()[index - 1] : null;
      const origin = local(previous?.url);
      if (origin?.pathname === destination.pathname) {
        try {
          sessionStorage.setItem(returnKey, JSON.stringify({ entry: previous.key, destination: destination.href }));
          navigation.traverseTo(previous.key).finished.catch(() => {
            sessionStorage.removeItem(returnKey);
          });
          return;
        } catch { /* Substitui o formulário se o histórico ou o armazenamento estiver indisponível. */ }
      }
      location.replace(destination.href);
    },
  };

  document.addEventListener('click', event => {
    const link = event.target?.closest?.('a[aria-label^="Voltar"], a[data-back]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target === '_blank') return;

    const destination = local(link.href);
    if (!destination) return;
    event.preventDefault();
    const expected = comparable(destination);
    if (expected === comparable(new URL(location.href))) return;

    const navigation = window.navigation;
    const current = navigation?.currentEntry;
    const previous = current && navigation.entries().slice(0, current.index).findLast(entry => {
      const url = local(entry.url);
      return url && comparable(url) === expected;
    });

    if (previous) history.go(previous.index - current.index);
    else location.replace(destination.href);
  }, true);
})();
