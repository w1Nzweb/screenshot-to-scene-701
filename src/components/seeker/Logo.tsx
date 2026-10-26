import eye from "@/assets/seeker-eye.jpg.asset.json";

export const EYE_URL = eye.url;

export function EyeMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img
      src={eye.url}
      alt=""
      aria-hidden
      className={`shrink-0 rounded-sm bg-ink object-contain ${className}`}
    />
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <div className="flex items-center gap-3">
      <EyeMark className={size === "lg" ? "h-11 w-11" : "h-9 w-9"} />
      <span className={`font-semibold tracking-[0.32em] text-foreground ${size === "lg" ? "text-lg" : "text-sm"}`}>
        SEEKER
      </span>
    </div>
  );
}

export function LoadingScreen({ label = "Checking session" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background">
      <EyeMark className="h-16 w-16 animate-pulse" />
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
    </div>
  );
}
