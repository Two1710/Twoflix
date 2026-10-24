import React, { useRef } from 'react';
import './AdBanner.css';

/**
 * AdBanner Component
 * @param {string} type 'horizontal' | 'rectangle' (sidebar)
 * @param {string} adCode HTML string or script URL from Ad Network
 */
export default function AdBanner({ type = 'horizontal', adCode = '' }) {
  const adRef = useRef(null);

  return (
    <div className={`ad-banner-container ad-${type}`}>
      {adCode ? (
        <div ref={adRef} dangerouslySetInnerHTML={{ __html: adCode }} />
      ) : (
        <div className="ad-placeholder">
          <span>{type === 'horizontal' ? 'Quảng cáo Banner (728x90)' : 'Quảng cáo Cột bên (300x250)'}</span>
          <small>Liên hệ tài trợ hoặc dán mã Ad Network vào đây</small>
        </div>
      )}
    </div>
  );
}
