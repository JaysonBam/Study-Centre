export const lightsaberFilters = {
  kenobi: 'none',
  yoda: 'hue-rotate(-80deg)',
  vader: 'hue-rotate(150deg)',
  windu: 'hue-rotate(65deg)',
  rey: 'hue-rotate(210deg)',
  ahsoka: 'grayscale(1) brightness(1.3)',
  mando: 'grayscale(1) brightness(0.15) drop-shadow(0 0 1px white)',
  baylan: 'hue-rotate(185deg)',
};

export type LightsaberName = keyof typeof lightsaberFilters;
export const lightsaberEvent = 'bookings:lightsaber';

export function activateLightsaber(name: string): boolean {
  const command = name.trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(lightsaberFilters, command)) return false;
  window.dispatchEvent(new CustomEvent(lightsaberEvent, { detail: command }));
  return true;
}
