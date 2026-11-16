import { UserIcon } from "@/components/ui/icons";

type MissingPersonPhotoProps = {
  src: string | null;
  alt: string;
  variant?: "card" | "detail";
};

const SIZE_CLASSES: Readonly<Record<"card" | "detail", string>> = {
  card: "size-20 rounded-lg",
  detail: "h-32 w-32 rounded-xl sm:h-40 sm:w-40",
};

/**
 * Renders a missing person photo from a short-lived signed URL, or a neutral
 * placeholder when the optional photo was not provided. Storage objects are
 * private, so the component never builds a public URL itself.
 */
export function MissingPersonPhoto({
  src,
  alt,
  variant = "card",
}: MissingPersonPhotoProps) {
  const frameClassName = `shrink-0 overflow-hidden border border-line bg-ink-50 ${SIZE_CLASSES[variant]}`;

  if (!src) {
    return (
      <div
        role="img"
        aria-label={`No photo provided for ${alt}`}
        className={`${frameClassName} flex flex-col items-center justify-center gap-1 text-ink-400`}
      >
        <UserIcon
          aria-hidden="true"
          className={variant === "detail" ? "size-10" : "size-7"}
        />
        {variant === "detail" ? (
          <span className="px-2 text-center text-[0.65rem] font-medium uppercase tracking-wide">
            No photo
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={frameClassName}>
      {/* Signed Storage URLs expire and are not known at build time. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Photo of ${alt}`}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
