import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiSettings } from 'react-icons/fi';
import './CustomPlayer.css';

const CustomPlayer = ({ url, title }) => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const playerRef = useRef(null);
  const wrapperRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // --- Auto-Hide Controls Logic ---
  const handleInteraction = () => {
    setShowControls(true);
    resetControlsTimeout();
  };

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    // Hide controls after 3 seconds of inactivity, REGARDLESS of playing state
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    handleInteraction();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // --- Player Handlers ---
  const handlePlayPause = () => setPlaying(!playing);

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
    if (parseFloat(e.target.value) > 0) setMuted(false);
  };

  const handleToggleMuted = () => setMuted(!muted);

  const handleSeekChange = (e) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e) => {
    playerRef.current.seekTo(parseFloat(e.target.value));
  };

  const handleProgress = (state) => {
    // Only update time slider if not currently dragging it
    if (!showControls) {
      setPlayed(state.played);
    } else {
      // If controls are visible, we still want to update it unless user is seeking
      setPlayed(state.played);
    }
    setLoaded(state.loaded);
  };

  const handleDuration = (dur) => setDuration(dur);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (wrapperRef.current.requestFullscreen) {
        wrapperRef.current.requestFullscreen();
      } else if (wrapperRef.current.webkitRequestFullscreen) { /* Safari */
        wrapperRef.current.webkitRequestFullscreen();
      } else if (wrapperRef.current.msRequestFullscreen) { /* IE11 */
        wrapperRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
      }
    }
  };

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Format time (seconds -> mm:ss or hh:mm:ss)
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh > 0) return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    return `${mm}:${ss}`;
  };

  const currentTime = duration * played;

  return (
    <div 
      ref={wrapperRef}
      className={`cp-wrapper ${isFullscreen ? 'cp-fullscreen' : ''}`}
      onMouseMove={handleInteraction}
      onMouseLeave={() => setShowControls(false)}
      onKeyDown={handleInteraction}
      tabIndex="0"
    >
      <ReactPlayer
        ref={playerRef}
        className="cp-react-player"
        url={url}
        width="100%"
        height="100%"
        playing={playing}
        volume={volume}
        muted={muted}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onClick={handlePlayPause}
        playsinline
        config={{
          file: {
            attributes: {
              crossOrigin: "anonymous"
            }
          }
        }}
      />

      {/* --- UI OVERLAY --- */}
      <div className={`cp-overlay ${showControls ? 'cp-show' : 'cp-hide'}`}>
        
        {/* Top Gradient & Title */}
        <div className="cp-top-bar">
          <div className="cp-title">{title}</div>
        </div>

        {/* Center Big Play/Pause Button */}
        <div className="cp-center-controls" onClick={handlePlayPause}>
          <div className="cp-big-btn">
            {playing ? <FiPause /> : <FiPlay className="cp-play-icon" />}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="cp-bottom-bar">
          {/* Progress Slider */}
          <div className="cp-progress-container">
            <div className="cp-progress-loaded" style={{ width: `${loaded * 100}%` }}></div>
            <input
              type="range"
              min={0}
              max={0.999999}
              step="any"
              value={played}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
              onTouchEnd={handleSeekMouseUp}
              className="cp-progress-slider"
              style={{ backgroundSize: `${played * 100}% 100%` }}
            />
          </div>

          <div className="cp-controls-row">
            {/* Left Controls */}
            <div className="cp-controls-left">
              <button className="cp-control-btn" onClick={handlePlayPause}>
                {playing ? <FiPause /> : <FiPlay />}
              </button>
              
              <div className="cp-volume-group">
                <button className="cp-control-btn" onClick={handleToggleMuted}>
                  {muted || volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step="any"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="cp-volume-slider"
                  style={{ backgroundSize: `${(muted ? 0 : volume) * 100}% 100%` }}
                />
              </div>

              <div className="cp-time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="cp-controls-right">
              <button className="cp-control-btn">
                <FiSettings />
              </button>
              <button className="cp-control-btn" onClick={toggleFullscreen}>
                {isFullscreen ? <FiMinimize /> : <FiMaximize />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomPlayer;
