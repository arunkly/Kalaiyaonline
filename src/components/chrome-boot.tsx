import { useEffect, useState, type ReactNode } from "react";
import { FeaturesProvider } from "@/components/features-provider";
import { ThemeProvider, ThemeVars } from "@/components/theme-provider";
import { DEFAULT_FEATURES, getFeatureFlags } from "@/lib/features";
import { getSeoSettings } from "@/lib/seo";
import { DEFAULT_THEME, fontHref, getThemeSettings } from "@/lib/theme";

export function ChromeBoot({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);

  useEffect(() => {
    void getThemeSettings()
      .then(setTheme)
      .catch(() => undefined);
    void getFeatureFlags()
      .then(setFeatures)
      .catch(() => undefined);
    void getSeoSettings()
      .then((seo) => {
        if (seo.title) document.title = seo.title;
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const href = fontHref(theme.font);
    const existing = document.querySelector<HTMLLinkElement>('link[data-theme-font="1"]');
    if (existing) {
      existing.href = href;
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-theme-font", "1");
    document.head.appendChild(link);
  }, [theme.font]);

  return (
    <ThemeProvider theme={theme}>
      <ThemeVars theme={theme} />
      <FeaturesProvider flags={features}>{children}</FeaturesProvider>
    </ThemeProvider>
  );
}
