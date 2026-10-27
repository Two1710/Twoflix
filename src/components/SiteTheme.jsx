import { useEffect } from 'react';
import { parseJsonResponse } from '../utils/parseJsonResponse';

export default function SiteTheme() {
  useEffect(() => {
    let active = true;
    const loadTheme = () => fetch('/api/site-theme', { cache: 'no-store' })
      .then(response => response.ok ? parseJsonResponse(response, 'Giao diện website') : null)
      .then(data => {
        if (!active || !data?.theme) return;
        document.documentElement.dataset.theme = data.theme;
      })
      .catch(() => {});

    loadTheme();
    const timer = window.setInterval(loadTheme, 15_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  return null;
}
