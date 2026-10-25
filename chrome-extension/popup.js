const TRACKING_PARAMS = ['fbclid','gclid','dclid','msclkid','twclid','igshid','ttclid','si','mc_cid','mc_eid','_hsenc','_hsmi','rb_clickid','s_kwcid','vero_id'];

function cleanAndExtract(rawUrl) {
  let u = new URL(rawUrl);
  let source = 'Direct';

  if (u.hostname.includes('facebook.com') && u.pathname === '/l.php' && u.searchParams.has('u')) {
    source = 'Facebook';
    u = new URL(u.searchParams.get('u'));
  } else if (u.hostname.includes('google.') && u.pathname === '/url' && (u.searchParams.has('q') || u.searchParams.has('url'))) {
    source = 'Google';
    u = new URL(u.searchParams.get('q') || u.searchParams.get('url'));
  }

  if (u.searchParams.has('fbclid')) source = 'Facebook';
  else if (u.searchParams.has('gclid')) source = 'Google';
  else if (u.searchParams.has('igshid')) source = 'Instagram';
  else if (u.searchParams.has('ttclid')) source = 'TikTok';
  else if (u.searchParams.has('utm_source')) source = u.searchParams.get('utm_source');

  [...u.searchParams.keys()].forEach(key => {
    if (key.startsWith('utm_') || TRACKING_PARAMS.includes(key.toLowerCase())) {
      u.searchParams.delete(key);
    }
  });

  return { cleanUrl: u.toString(), source };
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.url) return;
  const { cleanUrl, source } = cleanAndExtract(tab.url);
  document.getElementById('sourceBadge').textContent = `Forrás: ${source}`;
  document.getElementById('cleanUrl').textContent = cleanUrl;
  document.getElementById('titleInput').value = tab.title || '';

  document.getElementById('saveBtn').onclick = async () => {
    await navigator.clipboard.writeText(cleanUrl);
    const { bookmarks = [] } = await chrome.storage.local.get('bookmarks');
    bookmarks.unshift({
      id: Date.now(),
      title: document.getElementById('titleInput').value,
      cleanUrl,
      source,
      tags: document.getElementById('tagsInput').value.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString()
    });
    await chrome.storage.local.set({ bookmarks });
    document.getElementById('saveBtn').textContent = '✓ Mentve & vágólapra másolva!';
  };
});
