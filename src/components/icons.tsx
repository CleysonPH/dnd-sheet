import type { ReactNode } from "react";

/*
 * Os poucos ícones da app, em SVG inline com traço em currentColor (design V7).
 * São decorativos: o texto ao lado ou o aria-label do botão dá o significado.
 */

type IconProps = { className?: string };

function Icon({
  className = "size-5",
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export function D20Icon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2 21 7v10l-9 5-9-5V7z" />
      <path d="M12 2 7.5 9.5h9zM7.5 9.5 3 17M16.5 9.5 21 17M7.5 9.5 12 17l4.5-7.5M12 17v5M3 17h18" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z" />
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.5 4 5.5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-6z" />
    </Icon>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20.5s-8-4.6-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.1c0 5.8-8 10.4-8 10.4z" />
    </Icon>
  );
}

export function DiceIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" />
    </Icon>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </Icon>
  );
}

export function BootIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3h5v8l6 3.5c1 .6 1.5 1.5 1.5 2.5V19H4v-6l2-1V5a2 2 0 0 1 2-2z" />
      <path d="M4 19v2h16.5v-2M13 8h-3" />
    </Icon>
  );
}
