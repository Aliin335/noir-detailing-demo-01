import Image from "next/image";

export function NoirLogo({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <Image
        src="/assets/noir-logo.png"
        alt="NOIR Detailing"
        width={32}
        height={32}
        priority
        className="h-8 w-8 object-contain"
      />
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-[0.2em] text-noir-text">
          NOIR
        </span>
        <span className="text-[10px] font-medium tracking-[0.3em] text-noir-text-secondary">
          DETAILING
        </span>
      </span>
    </span>
  );
}
