import { useEffect, useState } from 'react';

// The offer always ends at 23:59:59 on the coming Sunday (local time), then rolls to the next week,
// so the demo never shows an expired deal.
const endOfWeek = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + ((7 - now.getDay()) % 7), 23, 59, 59).getTime();
};

export default function Countdown() {
  const [end, setEnd] = useState(endOfWeek);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setEnd((e) => (t > e ? endOfWeek() : e));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const left = Math.max(0, Math.floor((end - now) / 1000));
  const parts = [
    ['Days', Math.floor(left / 86400)],
    ['Hrs', Math.floor((left % 86400) / 3600)],
    ['Mins', Math.floor((left % 3600) / 60)],
    ['Secs', left % 60],
  ];

  // 320px: 2x2 grid. 375px+: one row of four. Circles grow 64 -> 80 -> 100px.
  return (
    <div
      role="timer"
      aria-label="Time left on this offer"
      className="mx-auto grid max-w-sm grid-cols-2 justify-items-center gap-x-3 gap-y-5 min-[375px]:grid-cols-4 lg:mx-0 lg:max-w-none lg:grid-cols-[repeat(4,100px)] lg:justify-start lg:gap-x-6"
    >
      {parts.map(([label, value]) => (
        <div key={label} className="flex flex-col items-center gap-2 lg:gap-3">
          <span className="grid size-16 place-items-center rounded-full bg-white font-display text-xl font-bold tabular-nums sm:size-20 sm:text-2xl lg:size-[100px] lg:text-[26px]">
            {String(value).padStart(2, '0')}
          </span>
          <span className="text-xs uppercase sm:text-sm lg:text-base">{label}</span>
        </div>
      ))}
    </div>
  );
}
