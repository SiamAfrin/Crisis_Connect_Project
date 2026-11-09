import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 5 6v5.5c0 4.2 2.8 7.4 7 9.5 4.2-2.1 7-5.3 7-9.5V6l-7-3Z" />
      <path d="m9.2 12 1.9 1.9 3.7-3.8" />
    </IconBase>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10.3 4.1 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.1a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </IconBase>
  );
}

export function ClipboardListIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 4.5h6A1.5 1.5 0 0 1 16.5 6v.5h1A1.5 1.5 0 0 1 19 8v10.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5V8a1.5 1.5 0 0 1 1.5-1.5h1V6A1.5 1.5 0 0 1 9 4.5Z" />
      <path d="M9 6h6" />
      <path d="M8.5 11h7" />
      <path d="M8.5 15h5" />
    </IconBase>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="8" r="3.2" />
      <path d="M17 4.4a3.2 3.2 0 0 1 0 6.2" />
      <path d="M20 20v-1.4a3.5 3.5 0 0 0-2.4-3.3" />
    </IconBase>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </IconBase>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7.2 3.8 9 8.2a1.5 1.5 0 0 1-.4 1.7l-1.2 1a13.5 13.5 0 0 0 5.7 5.7l1-1.2a1.5 1.5 0 0 1 1.7-.4l4.4 1.8a1.5 1.5 0 0 1 .9 1.5l-.3 2a1.8 1.8 0 0 1-1.8 1.6C10.2 21.9 2.1 13.8 2.1 5.9A1.8 1.8 0 0 1 3.7 4l2-.3a1.5 1.5 0 0 1 1.5.1Z" />
    </IconBase>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </IconBase>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.3 2.3 4.7-4.8" />
    </IconBase>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9.2 9.2 5.6 5.6" />
      <path d="m14.8 9.2-5.6 5.6" />
    </IconBase>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 12h15" />
      <path d="m14 6.5 5.5 5.5-5.5 5.5" />
    </IconBase>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M19.5 12h-15" />
      <path d="M10 6.5 4.5 12l5.5 5.5" />
    </IconBase>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 5.5 6.5 6.5L9 18.5" />
    </IconBase>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 4.5h3.5A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5H14" />
      <path d="M9 8 5 12l4 4" />
      <path d="M5 12h10" />
    </IconBase>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20v-1.5A4.5 4.5 0 0 1 9.5 14h5a4.5 4.5 0 0 1 4.5 4.5V20" />
    </IconBase>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 3.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5Z" />
      <path d="M13 3.5V8h4" />
      <path d="M9 12h6" />
      <path d="M9 15.5h6" />
    </IconBase>
  );
}

export function RadioIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M7.8 7.8a6 6 0 0 0 0 8.4" />
      <path d="M16.2 7.8a6 6 0 0 1 0 8.4" />
      <path d="M4.9 4.9a10 10 0 0 0 0 14.2" />
      <path d="M19.1 4.9a10 10 0 0 1 0 14.2" />
    </IconBase>
  );
}

export function HeartPulseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20.8 8.6a4.8 4.8 0 0 0-8.8-2.9 4.8 4.8 0 0 0-8.8 2.9c0 5 8.8 10.4 8.8 10.4s8.8-5.4 8.8-10.4Z" />
      <path d="M3.8 11.5h4l1.4-2.5 2.2 5 1.6-2.5h3.2" />
    </IconBase>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5c1.8 3.3.5 4.8-.8 6.2-1.1 1.2-2 2.4-2 4.3a2.8 2.8 0 0 0 5.6 0c0-1.1-.4-2-.9-2.9 2.3 1 3.6 2.9 3.6 5a5.5 5.5 0 0 1-11 0c0-4.7 4.1-6.8 5.5-12.6Z" />
    </IconBase>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 20.5V5.2A1.2 1.2 0 0 1 5.2 4h7.6A1.2 1.2 0 0 1 14 5.2v15.3" />
      <path d="M14 9h4.8a1.2 1.2 0 0 1 1.2 1.2v10.3" />
      <path d="M7.5 7.5h3" />
      <path d="M7.5 11h3" />
      <path d="M7.5 14.5h3" />
      <path d="M17 12.5h.01" />
      <path d="M17 16h.01" />
      <path d="M3 20.5h18" />
    </IconBase>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m21 3-7.5 18-3.2-7.3L3 10.5 21 3Z" />
      <path d="M10.3 13.7 21 3" />
    </IconBase>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 13.5V6a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 6v7.5" />
      <path d="M4 13.5h4l1.5 2.5h5l1.5-2.5h4" />
      <path d="M4 13.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18v-4.5" />
    </IconBase>
  );
}

export function LayoutDashboardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </IconBase>
  );
}

export function ListChecksIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m3.5 6 1.5 1.5L8 4.5" />
      <path d="m3.5 12 1.5 1.5L8 10.5" />
      <path d="m3.5 18 1.5 1.5L8 16.5" />
      <path d="M11 6h9.5" />
      <path d="M11 12h9.5" />
      <path d="M11 18h9.5" />
    </IconBase>
  );
}

export function UserCheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h4A4.5 4.5 0 0 1 16 18.5V20" />
      <path d="m16.5 11 2 2 3.5-3.5" />
    </IconBase>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </IconBase>
  );
}

export function HashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9.5 3.5 7 20.5" />
      <path d="M17 3.5 14.5 20.5" />
      <path d="M3.5 9h17" />
      <path d="M3 15h17" />
    </IconBase>
  );
}

export function ActivityIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 12h4l2.2-6 4.2 12 2.1-6H21" />
    </IconBase>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4.5" y="10" width="15" height="10.5" rx="1.8" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M12 14v2.5" />
    </IconBase>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
      <path d="m4.5 6.5 7.5 6 7.5-6" />
    </IconBase>
  );
}

export function LifeBuoyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="m6 6 3.5 3.5" />
      <path d="m14.5 14.5 3.5 3.5" />
      <path d="m18 6-3.5 3.5" />
      <path d="m9.5 14.5-3.5 3.5" />
    </IconBase>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </IconBase>
  );
}

export function XIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </IconBase>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </IconBase>
  );
}
