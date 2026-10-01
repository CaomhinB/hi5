type LogoProps = {
  variant?: "full" | "icon";
  height?: number;
  className?: string;
};

export function Logo({ variant = "full", height = 40, className = "" }: LogoProps) {
  const ratio = variant === "full" ? 1080 / 470 : 1;
  return (
    <span
      role="img"
      aria-label="Hi5"
      className={`logo ${variant === "full" ? "logo-full" : "logo-icon"} ${className}`}
      style={{ height, width: Math.round(height * ratio) }}
    />
  );
}
