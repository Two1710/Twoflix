import { useEffect, useState } from 'react';
import './SeasonalEffects.css';

const EVENT_PARTICLES = {
  tet: ['petal', 'spark', 'petal', 'lantern', 'spark', 'petal', 'lantern', 'petal', 'spark', 'petal', 'lantern', 'spark'],
  valentine: ['heart', 'spark', 'petal', 'heart', 'spark', 'heart', 'petal', 'spark', 'heart', 'petal', 'heart', 'spark'],
  'mid-autumn': ['lantern', 'star', 'moon', 'lantern', 'star', 'moon', 'lantern', 'star', 'moon', 'lantern', 'star', 'moon'],
  halloween: ['bat', 'spark', 'moon', 'bat', 'spark', 'bat', 'moon', 'spark', 'bat', 'moon', 'bat', 'spark'],
  christmas: ['snowflake', 'star', 'snowflake', 'fir', 'snowflake', 'star', 'fir', 'snowflake', 'star', 'snowflake', 'fir', 'star'],
  'new-year': ['burst', 'spark', 'burst', 'star', 'burst', 'spark', 'star', 'burst', 'spark', 'burst', 'star', 'spark'],
};

function EventGlyph({ type }) {
  if (type === 'petal') return <svg viewBox="0 0 32 32"><path d="M16 27C7 22 6 13 16 4c10 9 9 18 0 23Z" /><path d="M16 27c0-8 1-14 0-23" /></svg>;
  if (type === 'heart') return <svg viewBox="0 0 32 32"><path d="M16 27 5.8 17C-1 9.7 8.5 2.1 16 9.1 23.5 2.1 33 9.7 26.2 17L16 27Z" /></svg>;
  if (type === 'lantern') return <svg viewBox="0 0 32 40"><path d="M16 2v5m-8 0h16m-17 3h18l-2 20H9L7 10Zm2 24h14m-7-24v20m-7-10h14" /></svg>;
  if (type === 'moon') return <svg viewBox="0 0 32 32"><path d="M23.8 21.9A12.6 12.6 0 0 1 10 5.1a12.8 12.8 0 1 0 13.8 16.8Z" /><path d="m24 5 .8 2.2L27 8l-2.2.8L24 11l-.8-2.2L21 8l2.2-.8L24 5Z" /></svg>;
  if (type === 'bat') return <svg viewBox="0 0 40 28"><path d="M20 22c-3-5-7-7-14-8l-4-8 10 4 3-7 5 6 5-6 3 7 10-4-4 8c-7 1-11 3-14 8Z" /></svg>;
  if (type === 'snowflake') return <svg viewBox="0 0 32 32"><path d="M16 2v28M4 9l24 14M4 23 28 9M12 5l4 4 4-4m-8 22 4-4 4 4M4 14l6-1-1-6m19 17-6 1 1 6M4 18l6 1-1 6m19-17-6-1 1-6" /></svg>;
  if (type === 'fir') return <svg viewBox="0 0 32 38"><path d="m16 2 3 7 7-2-4 7 7 3-8 2 5 7-8-2-2 9-2-9-8 2 5-7-8-2 7-3-4-7 7 2 3-7Zm0 31v4" /></svg>;
  if (type === 'burst') return <svg viewBox="0 0 36 36"><path d="M18 2v8m0 16v8M2 18h8m16 0h8M6.7 6.7l5.7 5.7m11.2 11.2 5.7 5.7m0-22.6-5.7 5.7m-11.2 11.2-5.7 5.7" /><circle cx="18" cy="18" r="4" /></svg>;
  return <svg viewBox="0 0 32 32"><path d="m16 2 2.6 10.1L29 16l-10.4 3.9L16 30l-2.6-10.1L3 16l10.4-3.9L16 2Z" /></svg>;
}

export default function SeasonalEffects() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'default');

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setTheme(root.dataset.theme || 'default'));
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const particles = EVENT_PARTICLES[theme];
  if (!particles) return null;

  return (
    <div className={`seasonal-effects seasonal-effects--${theme}`} aria-hidden="true">
      {particles.map((particle, index) => (
        <span
          className={`seasonal-particle seasonal-particle--${particle}`}
          key={`${theme}-${index}`}
          style={{
            '--particle-x': `${index % 2 ? 81 + (index * 11) % 17 : 2 + (index * 13) % 17}%`,
            '--particle-delay': `${-((index * 1.73) % 16)}s`,
            '--particle-duration': `${14 + (index % 6) * 2}s`,
            '--particle-size': `${18 + (index % 4) * 6}px`,
            '--particle-sway': `${(index % 2 ? 1 : -1) * (24 + (index % 4) * 10)}px`,
          }}
        ><EventGlyph type={particle} /></span>
      ))}
    </div>
  );
}
