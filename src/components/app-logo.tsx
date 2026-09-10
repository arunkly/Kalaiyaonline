import { useTheme } from "@/components/theme-provider";

export function AppLogo({
  variant = "light",
  className,
  alt = "KalaiyaOnline.com",
}: {
  variant?: "light" | "dark";
  className?: string;
  alt?: string;
}) {
  const theme = useTheme();
  const src = variant === "dark" ? theme.logoDarkUrl || "/logo-dark.jpg" : theme.logoUrl || "/logo.jpg";
  return <img src={src} alt={alt} className={className} />;
}
