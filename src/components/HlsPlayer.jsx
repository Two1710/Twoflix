/**
 * Smart HLS Player – Controls matching rophims.vip
 * Layout: [play] [skip±10] [vol+slider] [time]   [settings(quality+speed)] [fullscreen]
 * Settings menu: Cài đặt → Chất lượng, Tốc độ (submenu)
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { enterFullscreen, exitFullscreen, syncFullscreenOrientation } from '../utils/screenOrientation';
import {
  FiPlay, FiPause, FiVolume2, FiVolumeX, FiVolume1,
  FiMaximize, FiMinimize, FiLoader, FiSettings,
  FiRotateCcw, FiRotateCw, FiChevronRight, FiChevronLeft
} from 'react-icons/fi';
import './HlsPlayer.css';

const HLS_TIMEOUT = 8000;

export default function HlsPlayer({ src, embedSrc, title, poster, roomState, onRoomStateChange, onPlayerModeChange }) {
  const videoRef    = useRef(null);
  const containerRef= useRef(null);
  const hlsRef      = useRef(null);
  const hideTimer   = useRef(null);
  const timeoutRef  = useRef(null);
  const flashTimer  = useRef(null);
  const stallTimer  = useRef(null);
  const playbackStartedRef = useRef(false);
  const recoverRef = useRef({ network: 0, media: 0 });
  const roomControlled = Boolean(roomState);
  const roomStateRef = useRef(roomState);
  const roomStateCallbackRef = useRef(onRoomStateChange);
  const playerModeCallbackRef = useRef(onPlayerModeChange);
  const roomRemoteUntilRef = useRef(0);
  const roomLastPublishRef = useRef(0);
  roomStateRef.current = roomState;
  roomStateCallbackRef.current = onRoomStateChange;
  playerModeCallbackRef.current = onPlayerModeChange;

  const [mode, setMode]                 = useState('loading'); // 'hls'|'iframe'|'loading'
  const [playing, setPlaying]           = useState(false);
  const [muted, setMuted]               = useState(true);
  const [volume, setVolume]             = useState(0.9);
  const [curTime, setCurTime]           = useState(0);
  const [duration, setDuration]         = useState(0);
  const [buffered, setBuffered]         = useState(0);
  const [fullscreen, setFullscreen]     = useState(false);
  const [showCtrl, setShowCtrl]         = useState(true);
  const [loading, setLoading]           = useState(true);
  const [sourceError, setSourceError]   = useState('');
  const [showUnmute, setShowUnmute]     = useState(true);
  const [flashIcon, setFlashIcon]       = useState(null);

  // Settings menu
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState('main'); // 'main'|'quality'|'speed'
  const [speed, setSpeed]               = useState(1);
  const [qualities, setQualities]       = useState([]);   // [{label, level}]
  const [activeQuality, setActiveQuality]= useState(-1);  // -1 = Auto

  // Volume popup
  const [volHover, setVolHover]         = useState(false);

  // ── Init source ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setMode('loading'); setLoading(true); setPlaying(false);
    setCurTime(0); setDuration(0); setShowUnmute(true);
    setSourceError('');
    setQualities([]); setActiveQuality(-1); setSettingsOpen(false);

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    clearTimeout(timeoutRef.current);
    clearTimeout(stallTimer.current);
    playbackStartedRef.current = false;
    recoverRef.current = { network: 0, media: 0 };

    const hasSrc   = !!(src && src.trim());
    const hasEmbed = !!(embedSrc && embedSrc.trim());
    if (!hasSrc && !hasEmbed) { setMode('iframe'); setLoading(false); return; }
    if (hasSrc) initHls(src, hasEmbed ? embedSrc : null);
    else { setMode('iframe'); setLoading(false); }
  }, [src, embedSrc, roomControlled]);

  function initHls(hlsSrc, fallback) {
    const video = videoRef.current;
    if (!video) { if (fallback) { setMode('iframe'); setLoading(false); } return; }
    const fallbackToIframe = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (!fallback) {
        setSourceError('Nguồn phim này không hỗ trợ phát HLS trên thiết bị hiện tại.');
        setMode('error');
        setLoading(false);
        return;
      }
      setMode('iframe');
      setLoading(false);
    };

    // Safari
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsSrc; video.muted = true; video.load();
      if (!roomControlled) video.play().catch(() => {});
      setMode('hls'); setLoading(false);
      return;
    }
    if (!Hls.isSupported()) {
      if (fallback) setMode('iframe');
      else { setMode('error'); setSourceError('Thiết bị này không hỗ trợ phát HLS.'); }
      setLoading(false);
      return;
    }

    const hls = new Hls({ enableWorker: false, maxBufferLength: 30, startLevel: -1, debug: false });
    hlsRef.current = hls;
    hls.loadSource(hlsSrc);
    hls.attachMedia(video);

    // Timeout → fallback iframe
    timeoutRef.current = setTimeout(() => {
      fallbackToIframe();
    }, HLS_TIMEOUT);

    hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
      clearTimeout(timeoutRef.current);
      setMode('hls'); setLoading(false);
      // Build quality list from HLS levels
      const lvls = [{ label: 'Tự Động', level: -1 }];
      (data.levels || []).forEach((l, i) => {
        const h = l.height || 0;
        const label = h >= 1080 ? '1080p' : h >= 720 ? '720p' : h >= 480 ? '480p' : h >= 360 ? '360p' : `${h}p`;
        lvls.push({ label, level: i });
      });
      if (lvls.length > 1) setQualities(lvls);
      video.muted = true;
      if (!roomControlled) {
        video.play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false));
      }

      // Some desktop streams can parse manifest but never start playback.
      clearTimeout(stallTimer.current);
      if (!roomControlled) {
        stallTimer.current = setTimeout(() => {
          if (!playbackStartedRef.current) fallbackToIframe();
        }, 6000);
      }
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setActiveQuality(data.level));

    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (!data.fatal) return;

      clearTimeout(timeoutRef.current);
      clearTimeout(stallTimer.current);

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR && recoverRef.current.network < 1) {
        recoverRef.current.network += 1;
        hls.startLoad();
        return;
      }

      if (data.type === Hls.ErrorTypes.MEDIA_ERROR && recoverRef.current.media < 1) {
        recoverRef.current.media += 1;
        hls.recoverMediaError();
        return;
      }

      fallbackToIframe();
    });
  }

  // ── Video events ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'hls') return;
    const v = videoRef.current; if (!v) return;
    const publish = (force = false) => {
      if (!roomControlled || Date.now() < roomRemoteUntilRef.current) return;
      const now = Date.now();
      if (!force && now - roomLastPublishRef.current < 2200) return;
      roomLastPublishRef.current = now;
      roomStateCallbackRef.current?.({ playing: !v.paused, currentTime: v.currentTime || 0 });
    };
    const H = {
      timeupdate:     () => { setCurTime(v.currentTime); publish(); },
      durationchange: () => { if (isFinite(v.duration)) setDuration(v.duration); },
      waiting:        () => setLoading(true),
      canplay:        () => setLoading(false),
      playing:        () => {
        playbackStartedRef.current = true;
        clearTimeout(stallTimer.current);
        setLoading(false);
        setPlaying(true);
        publish(true);
      },
      pause:          () => { setPlaying(false); publish(true); },
      seeked:         () => publish(true),
      error:           () => {
        if (embedSrc) { setMode('iframe'); setLoading(false); }
        else {
          setSourceError('Không phát được nguồn phim trên thiết bị này.');
          setMode('error');
          setLoading(false);
        }
      },
      volumechange:   () => { setMuted(v.muted); if (!v.muted) setVolume(v.volume); },
      progress:       () => { if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1)); },
    };
    Object.entries(H).forEach(([e,fn]) => v.addEventListener(e,fn));
    return () => Object.entries(H).forEach(([e,fn]) => v.removeEventListener(e,fn));
  }, [mode, roomControlled, embedSrc]);

  useEffect(() => {
    const state = roomStateRef.current;
    const v = videoRef.current;
    if (!roomControlled || mode !== 'hls' || !state || !v) return;

    const elapsed = state.playing ? Math.max(0, Date.now() - state.updatedAt) / 1000 : 0;
    const target = Math.max(0, state.currentTime + elapsed);
    roomRemoteUntilRef.current = Date.now() + 1400;
    if (Number.isFinite(v.duration) && Math.abs(v.currentTime - target) > 1.5) v.currentTime = target;
    if (state.playing && v.paused) v.play().catch(() => {});
    else if (!state.playing && !v.paused) v.pause();
  }, [mode, roomControlled, roomState?.updatedAt, duration]);

  useEffect(() => {
    playerModeCallbackRef.current?.(mode);
  }, [mode]);

  useEffect(() => () => {
    clearTimeout(stallTimer.current);
  }, []);

  // ── Auto-hide controls ────────────────────────────────────────────────────
  const showControls = useCallback(() => {
    setShowCtrl(true);
    clearTimeout(hideTimer.current);
    const v = videoRef.current;
    if (v && !v.paused) hideTimer.current = setTimeout(() => setShowCtrl(false), 3500);
  }, []);

  useEffect(() => {
    if (!playing) { setShowCtrl(true); clearTimeout(hideTimer.current); }
    else hideTimer.current = setTimeout(() => setShowCtrl(false), 3500);
    return () => clearTimeout(hideTimer.current);
  }, [playing]);

  // Fullscreen
  useEffect(() => {
    const fn = () => {
      const active = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setFullscreen(active);
      syncFullscreenOrientation(active);
    };
    document.addEventListener('fullscreenchange', fn);
    document.addEventListener('webkitfullscreenchange', fn);
    return () => {
      document.removeEventListener('fullscreenchange', fn);
      document.removeEventListener('webkitfullscreenchange', fn);
      syncFullscreenOrientation(false);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (mode !== 'hls') return;
    const onKey = (e) => {
      if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'Space')      { e.preventDefault(); togglePlay(); }
      else if (e.code === 'KeyF') { toggleFS(); }
      else if (e.code === 'KeyM') { toggleMute(); }
      else if (e.code === 'ArrowRight') { skip(10); }
      else if (e.code === 'ArrowLeft')  { skip(-10); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, playing]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    clearTimeout(flashTimer.current);
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => {
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        if (embedSrc) setMode('iframe');
        else {
          setSourceError('Trình duyệt không thể phát nguồn phim này.');
          setMode('error');
        }
        setLoading(false);
      });
      setFlashIcon('play');
    }
    else          { v.pause(); setFlashIcon('pause'); }
    flashTimer.current = setTimeout(() => setFlashIcon(null), 700);
    showControls();
  }, [showControls, embedSrc]);

  const skip = (sec) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + sec));
    showControls();
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setShowUnmute(false);
  };

  const setVol = (val) => {
    const v = videoRef.current; if (!v) return;
    const vol = Math.max(0, Math.min(1, parseFloat(val)));
    v.volume = vol; v.muted = vol === 0;
    setVolume(vol); setShowUnmute(false);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const v = videoRef.current; if (!v || !duration) return;
    v.currentTime = (parseFloat(e.target.value) / 100) * duration;
  };

  const changeQuality = (level) => {
    const hls = hlsRef.current; if (!hls) return;
    hls.currentLevel = level; // -1 = auto
    setActiveQuality(level);
    setSettingsOpen(false); setSettingsView('main');
  };

  const changeSpeed = (s) => {
    const v = videoRef.current; if (v) v.playbackRate = s;
    setSpeed(s); setSettingsOpen(false); setSettingsView('main');
  };

  const toggleFS = (e) => {
    e?.stopPropagation();
    if (!(document.fullscreenElement || document.webkitFullscreenElement)) enterFullscreen(containerRef.current);
    else exitFullscreen();
  };

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60);
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${m}:${String(sec).padStart(2,'0')}`;
  };

  const prog = duration > 0 ? (curTime / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const volIcon = (muted || volume === 0) ? <FiVolumeX/> : volume < 0.5 ? <FiVolume1/> : <FiVolume2/>;
  const qualLabel = qualities.find(q => q.level === activeQuality)?.label ?? 'Tự Động';
  const speedLabel = speed === 1 ? '1x' : `${speed}x`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`hls-container${fullscreen ? ' hls-fullscreen' : ''}${mode === 'hls' && !showCtrl ? ' hls-hide-cursor' : ''}`}
      onMouseMove={mode === 'hls' ? showControls : undefined}
      onMouseLeave={() => mode === 'hls' && playing && setShowCtrl(false)}
      onClick={() => { if (settingsOpen) setSettingsOpen(false); }}
    >
      {/* HLS video */}
      <video
        ref={videoRef}
        className="hls-video"
        style={{ display: mode === 'hls' ? 'block' : 'none' }}
        poster={poster} muted={muted} playsInline preload="metadata"
        onClick={togglePlay}
      />

      {/* Iframe fallback */}
      {mode === 'iframe' && embedSrc && (
        <iframe key={embedSrc} src={embedSrc} className="hls-iframe"
          allowFullScreen frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups"
        />
      )}

      {/* Loading */}
      {(mode === 'loading' || (mode === 'hls' && loading)) && (
        <div className="hls-loader"><FiLoader className="hls-spin"/></div>
      )}

      {mode === 'error' && <div className="hls-source-error">{sourceError}</div>}

      {/* Flash icon */}
      {flashIcon && mode === 'hls' && (
        <div className="hls-flash">{flashIcon === 'play' ? <FiPlay/> : <FiPause/>}</div>
      )}

      {/* Unmute toast */}
      {mode === 'hls' && showUnmute && muted && playing && (
        <button className="hls-unmute" onClick={toggleMute}>
          <FiVolumeX/> Nhấn để bật tiếng
        </button>
      )}

      {/* ── Custom controls (HLS only) ── */}
      {mode === 'hls' && (
        <div className={`hls-ctrl-overlay${showCtrl ? ' visible' : ''}`}
             onClick={e => e.stopPropagation()}>

          {/* Progress bar */}
          <div className="hls-progress" onClick={e => e.stopPropagation()}>
            <div className="hls-progress-track">
              <div className="hls-buf" style={{ width: `${bufPct}%` }}/>
              <div className="hls-play-bar" style={{ width: `${prog}%` }}>
                <div className="hls-dot"/>
              </div>
            </div>
            <input className="hls-seek" type="range" min={0} max={100} step={0.05}
              value={prog} onChange={handleSeek}/>
          </div>

          {/* Control bar */}
          <div className="hls-bar">
            {/* LEFT */}
            <div className="hls-bar-left">
              {/* Play/Pause */}
              <button className="hls-btn hls-play-btn" onClick={togglePlay}>
                {playing ? <FiPause/> : <FiPlay/>}
              </button>

              {/* Skip -10 */}
              <button className="hls-btn hls-skip-btn" onClick={() => skip(-10)} title="-10s">
                <FiRotateCcw/>
                <span className="hls-skip-label">10</span>
              </button>

              {/* Skip +10 */}
              <button className="hls-btn hls-skip-btn" onClick={() => skip(10)} title="+10s">
                <FiRotateCw/>
                <span className="hls-skip-label">10</span>
              </button>

              {/* Volume */}
              <div className="hls-vol-group"
                onMouseEnter={() => setVolHover(true)}
                onMouseLeave={() => setVolHover(false)}>
                <button className="hls-btn" onClick={toggleMute}>{volIcon}</button>
                <div className={`hls-vol-bar${volHover ? ' show' : ''}`}>
                  <input type="range" min={0} max={1} step={0.02}
                    value={muted ? 0 : volume}
                    onChange={e => setVol(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ '--vol': `${(muted ? 0 : volume) * 100}%` }}
                  />
                </div>
                <span className="hls-vol-pct">{muted ? 0 : Math.round(volume * 100)}%</span>
              </div>

              {/* Time */}
              <span className="hls-time">{fmt(curTime)} / {fmt(duration)}</span>
            </div>

            {/* CENTER title */}
            <div className="hls-title-display">{title}</div>

            {/* RIGHT */}
            <div className="hls-bar-right">

              {/* Settings */}
              <div className="hls-settings-wrap">
                <button className="hls-btn" title="Cài đặt"
                  onClick={e => { e.stopPropagation(); setSettingsOpen(p => !p); setSettingsView('main'); }}>
                  <FiSettings className={settingsOpen ? 'spin-slow' : ''}/>
                </button>

                {settingsOpen && (
                  <div className="hls-settings-menu" onClick={e => e.stopPropagation()}>
                    {settingsView === 'main' && (
                      <>
                        <div className="hls-sm-title">Cài đặt</div>
                        <button className="hls-sm-row" onClick={() => setSettingsView('quality')}>
                          <span>Chất lượng</span>
                          <span className="hls-sm-val">{qualLabel} <FiChevronRight/></span>
                        </button>
                        <button className="hls-sm-row" onClick={() => setSettingsView('speed')}>
                          <span>Tốc độ</span>
                          <span className="hls-sm-val">{speedLabel} <FiChevronRight/></span>
                        </button>
                      </>
                    )}

                    {settingsView === 'quality' && (
                      <>
                        <div className="hls-sm-title">
                          <button className="hls-sm-back" onClick={() => setSettingsView('main')}><FiChevronLeft/></button>
                          Chất lượng
                        </div>
                        {(qualities.length > 0 ? qualities : [{ label: 'Tự Động', level: -1 }]).map(q => (
                          <button key={q.level} className={`hls-sm-option${activeQuality === q.level ? ' active' : ''}`}
                            onClick={() => changeQuality(q.level)}>
                            {q.label}
                            {activeQuality === q.level && <span className="hls-sm-check">✓</span>}
                          </button>
                        ))}
                      </>
                    )}

                    {settingsView === 'speed' && (
                      <>
                        <div className="hls-sm-title">
                          <button className="hls-sm-back" onClick={() => setSettingsView('main')}><FiChevronLeft/></button>
                          Tốc độ phát
                        </div>
                        {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(s => (
                          <button key={s} className={`hls-sm-option${speed === s ? ' active' : ''}`}
                            onClick={() => changeSpeed(s)}>
                            {s === 1 ? 'Bình thường' : `${s}x`}
                            {speed === s && <span className="hls-sm-check">✓</span>}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button className="hls-btn" onClick={toggleFS}>
                {fullscreen ? <FiMinimize/> : <FiMaximize/>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
