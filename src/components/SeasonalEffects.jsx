import { useEffect, useRef, useState } from 'react';
import './SeasonalEffects.css';

function TransparentGif({ src, className, resolution = 256 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !context) return undefined;

    canvas.width = resolution;
    canvas.height = resolution;
    const image = new Image();
    image.src = src;
    let frameId;
    let lastPaint = 0;
    const draw = timestamp => {
      frameId = requestAnimationFrame(draw);
      if (!image.complete || !image.naturalWidth || timestamp - lastPaint < 50) return;
      lastPaint = timestamp;

      context.clearRect(0, 0, resolution, resolution);
      context.drawImage(image, 0, 0, resolution, resolution);
      const frame = context.getImageData(0, 0, resolution, resolution);
      const pixels = frame.data;
      const width = resolution;
      const height = resolution;
      const background = [pixels[0], pixels[1], pixels[2]];
      if (pixels[3] === 0) {
        context.putImageData(frame, 0, 0);
        return;
      }

      const matchesBackground = index => pixels[index + 3] === 0 || (
        Math.abs(pixels[index] - background[0]) <= 42 &&
        Math.abs(pixels[index + 1] - background[1]) <= 42 &&
        Math.abs(pixels[index + 2] - background[2]) <= 42
      );
      const visited = new Uint8Array(width * height);
      const queue = new Int32Array(width * height);
      let read = 0;
      let write = 0;
      const enqueue = pixel => {
        if (visited[pixel]) return;
        const offset = pixel * 4;
        if (!matchesBackground(offset)) return;
        visited[pixel] = 1;
        queue[write++] = pixel;
      };

      for (let x = 0; x < width; x++) {
        enqueue(x);
        enqueue((height - 1) * width + x);
      }
      for (let y = 1; y < height - 1; y++) {
        enqueue(y * width);
        enqueue(y * width + width - 1);
      }

      while (read < write) {
        const pixel = queue[read++];
        pixels[pixel * 4 + 3] = 0;
        const x = pixel % width;
        if (x > 0) enqueue(pixel - 1);
        if (x + 1 < width) enqueue(pixel + 1);
        if (pixel >= width) enqueue(pixel - width);
        if (pixel + width < width * height) enqueue(pixel + width);
      }
      context.putImageData(frame, 0, 0);
    };

    frameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameId);
      image.src = '';
    };
  }, [resolution, src]);

  return <canvas ref={canvasRef} className={`seasonal-gif ${className}`} aria-hidden="true" />;
}

export default function SeasonalEffects() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'default');

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setTheme(root.dataset.theme || 'default'));
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  if (theme === 'halloween') return (
    <div className="seasonal-effects seasonal-effects--halloween" aria-hidden="true">
      <TransparentGif className="halloween-pumpkin halloween-pumpkin--one" src="/seasonal/halloween-pumpkin-transparent.gif" />
      <TransparentGif className="halloween-pumpkin halloween-pumpkin--two" src="/seasonal/halloween-pumpkin-transparent.gif" />
      <TransparentGif className="halloween-ghost halloween-ghost--one" src="/seasonal/halloween-ghost.gif" />
      <TransparentGif className="halloween-ghost halloween-ghost--two" src="/seasonal/halloween-ghost.gif" />
    </div>
  );

  if (theme === 'new-year') return (
    <div className="seasonal-effects seasonal-effects--new-year" aria-hidden="true">
      <TransparentGif className="new-year-fireworks new-year-fireworks--one" src="/seasonal/new-year-fireworks.gif" />
      <TransparentGif className="new-year-fireworks new-year-fireworks--two" src="/seasonal/new-year-fireworks.gif" />
      <TransparentGif className="new-year-fireworks new-year-fireworks--three" src="/seasonal/new-year-fireworks.gif" />
    </div>
  );

  return null;
}
