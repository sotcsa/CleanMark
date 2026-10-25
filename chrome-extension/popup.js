const TRACKING_PARAMS = ['fbclid','gclid','dclid','msclkid','twclid','igshid','ttclid','si','mc_cid','mc_eid','_hsenc','_hsmi','rb_clickid','s_kwcid','vero_id'];
const YOUTUBE_PARAMS = ['feature','pp'];

function cleanAndExtract(rawUrl) {
  let u = new URL(rawUrl);
  let source = 'Direct';

  // Átirányító linkek kibontása; hibás cél esetén az eredeti URL-lel dolgozunk tovább
  const unwrap = (target) => {
    try { return new URL(target); } catch { return u; }
  };
  if (u.hostname.includes('facebook.com') && u.pathname === '/l.php' && u.searchParams.has('u')) {
    source = 'Facebook';
    u = unwrap(u.searchParams.get('u'));
  } else if (u.hostname.includes('google.') && u.pathname === '/url' && (u.searchParams.has('q') || u.searchParams.has('url'))) {
    source = 'Google';
    u = unwrap(u.searchParams.get('q') || u.searchParams.get('url'));
  }

  const isYouTube = /(^|\.)(youtube\.com|youtu\.be)$/.test(u.hostname);

  if (u.searchParams.has('fbclid')) source = 'Facebook';
  else if (u.searchParams.has('gclid')) source = 'Google';
  else if (u.searchParams.has('igshid')) source = 'Instagram';
  else if (u.searchParams.has('ttclid')) source = 'TikTok';
  else if (u.searchParams.has('utm_source')) source = u.searchParams.get('utm_source');
  else if (isYouTube) source = 'YouTube';

  [...u.searchParams.keys()].forEach(key => {
    const k = key.toLowerCase();
    if (k.startsWith('utm_') || TRACKING_PARAMS.includes(k) || (isYouTube && YOUTUBE_PARAMS.includes(k))) {
      u.searchParams.delete(key);
    }
  });

  return { cleanUrl: u.toString(), source };
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const badge = document.getElementById('sourceBadge');
  const saveBtn = document.getElementById('saveBtn');
  if (!tab?.url || !/^https?:/.test(tab.url)) {
    badge.textContent = 'Ez az oldal nem menthető';
    document.getElementById('cleanUrl').textContent = 'Csak http(s) weboldalak tisztíthatók.';
    saveBtn.disabled = true;
    return;
  }
  const { cleanUrl, source } = cleanAndExtract(tab.url);
  badge.textContent = `Forrás: ${source}`;
  document.getElementById('cleanUrl').textContent = cleanUrl;
  document.getElementById('titleInput').value = tab.title || '';

  saveBtn.onclick = async () => {
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
    saveBtn.textContent = '✓ Mentve & vágólapra másolva!';
  };
});
