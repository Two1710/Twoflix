import { useEffect } from 'react';

const SCRIPT_URL = 'https://bancadeltempoidea.org/21/31faa945fde29dfbee9eefeb50048426';
const CONTAINER_ID = 'container-31faa945fde29dfbee9eefeb50048426';

export default function NativeBanner() {
  useEffect(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container || container.querySelector('script')) return;

    const script = document.createElement('script');
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = SCRIPT_URL;
    container.appendChild(script);

    return () => {
      script.remove();
      container.replaceChildren();
    };
  }, []);

  return <div id={CONTAINER_ID} />;
}
