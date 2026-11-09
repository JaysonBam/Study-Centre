import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { lightsaberEvent, lightsaberFilters, type LightsaberName } from '../lib/lightsaber';
import saber from '../assets/lightsaber.png';
import './LightsaberCursor.css';

export default function LightsaberCursor() {
  const [name, setName] = useState<LightsaberName | null>(null);
  const [loaded, setLoaded] = useState(false);
  const cursor = useRef<HTMLDivElement>(null);
  const blade = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const activate = (event: Event) => setName((event as CustomEvent<LightsaberName>).detail);
    window.addEventListener(lightsaberEvent, activate);
    return () => window.removeEventListener(lightsaberEvent, activate);
  }, []);

  useEffect(() => {
    if (!name || !loaded) return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let flash: Animation | undefined;
    const hide = () => {
      delete document.body.dataset.lightsaberActive;
      if (cursor.current) cursor.current.style.display = 'none';
    };
    const move = (event: PointerEvent) => {
      if (
        !finePointer.matches ||
        event.pointerType !== 'mouse' ||
        (event.target instanceof Element && event.target.closest('input, textarea, [contenteditable="true"]'))
      ) {
        hide();
        return;
      }
      if (!cursor.current) return;
      // Original artwork hotspot (20, 12), scaled from 128px to 48px.
      cursor.current.style.transform = `translate3d(${event.clientX - 7.5}px, ${event.clientY - 4.5}px, 0)`;
      cursor.current.style.display = 'block';
      document.body.dataset.lightsaberActive = '';
    };
    const click = (event: PointerEvent) => {
      move(event);
      if (reducedMotion.matches || !document.body.hasAttribute('data-lightsaber-active')) return;
      flash?.cancel();
      flash = blade.current?.animate(
        [
          { filter: 'brightness(1)' },
          { filter: 'brightness(1.8) drop-shadow(0 0 4px #9fddff)' },
          { filter: 'brightness(1)' },
        ],
        { duration: 220 },
      );
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerdown', click, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    finePointer.addEventListener('change', hide);
    return () => {
      hide();
      flash?.cancel();
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerdown', click);
      document.documentElement.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
      finePointer.removeEventListener('change', hide);
    };
  }, [name, loaded]);

  if (!name) return null;
  return createPortal(
    <div
      ref={cursor}
      className="lightsaber-cursor"
      data-lightsaber={name}
      aria-hidden="true"
      style={{ filter: lightsaberFilters[name] }}
    >
      <img
        ref={blade}
        src={saber}
        alt=""
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
      />
    </div>,
    document.body,
  );
}
