import { useEffect, useRef, useState } from 'react';
import { autoFormatTimeText, formatTimeMs, parseTimeText } from '../../lib/entry';

interface TimeInputProps {
  valueMs: number;
  onChange: (ms: number) => void; // Called only with valid times
  onValidityChange: (valid: boolean) => void;
  timerMs?: number; // Timer reading, shown as a hint when the typed time differs
  size?: 'sm' | 'lg';
}

/**
 * Finish time typed directly: opens the phone number pad, auto-inserts colons,
 * accepts mm:ss or h:mm:ss, and flags bad entries inline. The last valid time
 * is kept in the participant; validity is reported so Complete/Save can block.
 */
export function TimeInput({ valueMs, onChange, onValidityChange, timerMs, size = 'sm' }: TimeInputProps) {
  const [text, setText] = useState(() => (valueMs > 0 ? formatTimeMs(valueMs) : ''));
  const [focused, setFocused] = useState(false);
  const lastEmitted = useRef(valueMs);
  const parsed = parseTimeText(text);
  // While typing, only complain once it looks like a whole time (mm:ss or longer)
  const showError = !parsed.ok && (!focused || text.length >= 5);

  // Follow outside changes (e.g. a re-loaded run) without clobbering typing
  useEffect(() => {
    if (valueMs !== lastEmitted.current) {
      lastEmitted.current = valueMs;
      setText(valueMs > 0 ? formatTimeMs(valueMs) : '');
    }
  }, [valueMs]);

  useEffect(() => {
    onValidityChange(parsed.ok);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.ok]);

  const handleChange = (raw: string) => {
    const next = autoFormatTimeText(raw);
    setText(next);
    const result = parseTimeText(next);
    if (result.ok && result.ms !== lastEmitted.current) {
      lastEmitted.current = result.ms;
      onChange(result.ms);
    }
  };

  const sizeClasses = size === 'lg' ? 'w-32 py-2 text-xl' : 'w-24 py-1.5 text-lg';
  const showTimer =
    timerMs !== undefined && parsed.ok && Math.floor(timerMs / 1000) !== Math.floor(parsed.ms / 1000);

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="done"
          aria-label="Finish time"
          aria-invalid={!parsed.ok}
          value={text}
          placeholder="mm:ss"
          onFocus={(e) => {
            setFocused(true);
            e.currentTarget.select();
          }}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => {
            setFocused(false);
            if (parsed.ok) setText(formatTimeMs(parsed.ms));
          }}
          className={`${sizeClasses} px-2 text-center font-mono font-bold bg-gray-600 rounded text-white focus:outline-none border ${
            showError ? 'border-red-500 ring-2 ring-red-500/40' : 'border-gray-500 focus:border-orange'
          }`}
        />
        {showTimer && <span className="text-xs text-gray-400">timer said {formatTimeMs(timerMs!)}</span>}
      </div>
      {showError && <p className="text-xs text-red-400 mt-1">{parsed.error}</p>}
    </div>
  );
}
