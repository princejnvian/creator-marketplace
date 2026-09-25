import Link from "next/link";

export default function YoutentLogo({
  href = "/",
  size = "md",
  showWordmark = true,
  lightWordmark = false,
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  lightWordmark?: boolean;
}) {
  const box =
    size === "lg" ? "h-14 w-14" : size === "sm" ? "h-8 w-8" : "h-10 w-10";

  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-lg" : "text-xl";

  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <span className={`relative flex ${box} shrink-0 items-center justify-center overflow-visible`}>
        <img
          src="/youtent-logo-3d.svg"
          alt="YOUTENT"
          className="h-full w-full object-contain"
        />
      </span>
      {showWordmark && (
        <span
          className={`${text} font-black tracking-tight ${
            lightWordmark ? "text-white" : "text-slate-950"
          }`}
        >
          YOUTENT<span className={lightWordmark ? "text-blue-200" : "text-blue-600"}>.</span>
        </span>
      )}
    </Link>
  );
}
