import { useState } from 'react';
import { MAX_QTY, clampQty } from '../lib/cart';
import { MinusIcon, PlusIcon } from './Icons';

const stepBtn =
  'grid size-11 shrink-0 place-items-center transition-colors duration-200 hover:bg-lime hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-40';

// - [ 2 ] +  : 44px buttons, and the number itself can be typed (digits only, clamped to 1-99 on blur / Enter).
// `draft` is the text being typed; when it is null the box simply shows the real value, so + / - update it instantly.
export default function QuantityStepper({ value, onChange, label }) {
  const [draft, setDraft] = useState(null);

  const commit = () => {
    const next = clampQty(draft ?? value);
    setDraft(null);
    if (next !== value) onChange(next);
  };

  return (
    <div className="inline-flex items-stretch border border-line bg-white">
      <button type="button" aria-label={`Decrease quantity of ${label}`} disabled={value <= 1} onClick={() => onChange(clampQty(value - 1))} className={stepBtn}>
        <MinusIcon className="size-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={`Quantity of ${label}`}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 2))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), commit())}
        className="h-11 w-12 border-x border-line text-center text-base font-semibold outline-none focus:border-lime"
      />
      <button type="button" aria-label={`Increase quantity of ${label}`} disabled={value >= MAX_QTY} onClick={() => onChange(clampQty(value + 1))} className={stepBtn}>
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}
