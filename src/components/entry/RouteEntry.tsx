import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { OWN_DISTANCE_PRESETS, parseDistanceText } from '../../lib/entry';

interface RouteEntryProps {
  ownDistance?: number; // undefined = Loops mode, 0 = Own route with no distance yet
  onSetOwnDistance: (km: number | undefined) => void;
  onDistanceValidityChange: (valid: boolean) => void;
  loops: ReactNode; // The loop counters, shown in Loops mode
}

/**
 * Loops / Own route switch. Own route = quick picks plus an exact km box,
 * for runners who do their own thing instead of the loops.
 */
export function RouteEntry({ ownDistance, onSetOwnDistance, onDistanceValidityChange, loops }: RouteEntryProps) {
  const isOwn = ownDistance !== undefined;

  return (
    <div>
      <div className="flex bg-gray-900 rounded-md p-0.5 mb-2 text-xs font-semibold" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={!isOwn}
          onClick={() => {
            onSetOwnDistance(undefined);
            onDistanceValidityChange(true);
          }}
          className={`flex-1 py-1.5 rounded ${!isOwn ? 'bg-orange text-white' : 'text-gray-400'}`}
        >
          Loops
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isOwn}
          onClick={() => {
            if (!isOwn) onSetOwnDistance(0);
          }}
          className={`flex-1 py-1.5 rounded ${isOwn ? 'bg-orange text-white' : 'text-gray-400'}`}
        >
          Own route
        </button>
      </div>
      {isOwn ? (
        <OwnDistancePicker km={ownDistance} onChange={onSetOwnDistance} onValidityChange={onDistanceValidityChange} />
      ) : (
        loops
      )}
    </div>
  );
}

function OwnDistancePicker({
  km,
  onChange,
  onValidityChange,
}: {
  km: number;
  onChange: (km: number) => void;
  onValidityChange: (valid: boolean) => void;
}) {
  const [text, setText] = useState(() => (km > 0 ? String(km) : ''));
  const lastEmitted = useRef(km);
  const parsed = parseDistanceText(text);

  useEffect(() => {
    if (km !== lastEmitted.current) {
      lastEmitted.current = km;
      setText(km > 0 ? String(km) : '');
    }
  }, [km]);

  useEffect(() => {
    onValidityChange(parsed.ok);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.ok]);

  const update = (next: string) => {
    setText(next);
    const r = parseDistanceText(next);
    if (r.ok && r.km !== lastEmitted.current) {
      lastEmitted.current = r.km;
      onChange(r.km);
    }
  };

  return (
    <div className="mb-2">
      <div className="flex gap-1.5 mb-2">
        {OWN_DISTANCE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => update(String(preset))}
            className={`flex-1 py-2 rounded-md text-sm font-bold no-select ${
              parsed.ok && parsed.km === preset ? 'bg-orange text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {preset}k
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>or exact:</span>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label="Distance in km"
          aria-invalid={!parsed.ok}
          value={text}
          placeholder="5.0"
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => update(e.target.value.replace(/[^\d.,]/g, '').slice(0, 5))}
          className={`w-20 px-2 py-1.5 text-center font-mono text-base bg-gray-600 rounded text-white focus:outline-none border ${
            parsed.ok ? 'border-gray-500 focus:border-orange' : 'border-red-500 ring-2 ring-red-500/40'
          }`}
        />
        <span>km</span>
      </div>
      {!parsed.ok && <p className="text-xs text-red-400 mt-1">{parsed.error}</p>}
    </div>
  );
}
