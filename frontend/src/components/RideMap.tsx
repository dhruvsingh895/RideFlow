import { motion } from "framer-motion";
import type { Location } from "../types";

interface RideMapProps {
  pickup: Location;
  destination: Location;
  driver?: Location | null;
  gridSize?: number;
  className?: string;
}

export function RideMap({
  pickup,
  destination,
  driver = null,
  gridSize = 20,
  className,
}: RideMapProps) {
  const S = 460;

  const px = (v: number) => (v / gridSize) * S;
  const py = (v: number) => S - (v / gridSize) * S;

  const hasDriver =
    driver !== null &&
    driver.lat >= 0 &&
    driver.lat <= gridSize &&
    driver.lng >= 0 &&
    driver.lng <= gridSize;

  const pathPoints = [
    `${px(pickup.lat)} ${py(pickup.lng)}`,
    ...(hasDriver ? [`${px(driver.lat)} ${py(driver.lng)}`] : []),
    `${px(destination.lat)} ${py(destination.lng)}`,
  ].join(" L ");

  const gridLines = Array.from({ length: gridSize + 1 }, (_, i) => i);
  const tick = [0, 5, 10, 15, 20];

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-edge bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-soft dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 ${className ?? ""}`}
    >
      <svg viewBox={`0 0 ${S} ${S}`} className="block w-full">
        <defs>
          <linearGradient id="route" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>

        {gridLines.map((i) => (
          <line
            key={`v${i}`}
            x1={px(i)}
            y1={0}
            x2={px(i)}
            y2={S}
            stroke="rgb(var(--edge))"
            strokeWidth="1"
            opacity="0.7"
          />
        ))}
        {gridLines.map((i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={py(i)}
            x2={S}
            y2={py(i)}
            stroke="rgb(var(--edge))"
            strokeWidth="1"
            opacity="0.7"
          />
        ))}

        {tick.map((i) => (
          <text key={`xl${i}`} x={px(i) + 3} y={S - 5} fill="rgb(var(--muted))" fontSize="9" opacity="0.8">
            {i}
          </text>
        ))}
        {tick.map((i) => (
          <text key={`yl${i}`} x={5} y={py(i) + 3} fill="rgb(var(--muted))" fontSize="9" opacity="0.8">
            {i}
          </text>
        ))}

        <path
          d={`M ${pathPoints}`}
          fill="none"
          stroke="url(#route)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="7 6"
          className="animate-dash"
          opacity="0.9"
        />

        {hasDriver && (
          <motion.g
            initial={false}
            animate={{ x: px(driver.lat), y: py(driver.lng) }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          >
            <circle cx={0} cy={0} r="10" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.5">
              <animate attributeName="r" values="10;20" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <rect x="-9" y="-6" width="18" height="12" rx="3.5" fill="#2563EB" />
            <rect x="-4.5" y="-6" width="9" height="4.5" rx="1.5" fill="#93C5FD" />
            <rect x="-9" y="-4" width="18" height="1.6" fill="#1D4ED8" opacity="0.5" />
            <circle cx="-5" cy="5.5" r="1.6" fill="#1E293B" />
            <circle cx="5" cy="5.5" r="1.6" fill="#1E293B" />
            <text x={13} y={-10} fill="rgb(var(--accent))" fontSize="11" fontWeight="700">
              Driver
            </text>
          </motion.g>
        )}

        <g>
          <circle cx={px(pickup.lat)} cy={py(pickup.lng)} r="13" fill="#10B981" opacity="0.18">
            <animate attributeName="r" values="11;20" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx={px(pickup.lat)} cy={py(pickup.lng)} r="7" fill="#10B981" />
          <circle cx={px(pickup.lat)} cy={py(pickup.lng)} r="2.6" fill="#fff" />
          <text
            x={px(pickup.lat) + 12}
            y={py(pickup.lng) + 4}
            fill="#10B981"
            fontSize="11"
            fontWeight="700"
          >
            Pickup
          </text>
        </g>

        <g>
          <circle cx={px(destination.lat)} cy={py(destination.lng)} r="7" fill="#EF4444" />
          <circle cx={px(destination.lat)} cy={py(destination.lng)} r="2.6" fill="#fff" />
          <text
            x={px(destination.lat) + 12}
            y={py(destination.lng) + 4}
            fill="#EF4444"
            fontSize="11"
            fontWeight="700"
          >
            Drop-off
          </text>
        </g>
      </svg>
    </div>
  );
}
