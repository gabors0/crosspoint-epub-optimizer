// Supply the two read-only device endpoints used while the original page starts.
// EPUB contents never leave the browser; this only keeps the embedded UI intact.
const nativeFetch = window.fetch.bind(window);

window.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input.url;

  if (url.startsWith('/api/status')) {
    return Promise.resolve(new Response(JSON.stringify({
      version: 'local',
      device: 'X4'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  }

  if (url.startsWith('/api/files')) {
    return Promise.resolve(new Response('[]', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  }

  return nativeFetch(input, init);
};
