"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";

type Theme = "system" | "light" | "dark";

export const THEME_KEY = "competia-theme";

// Runs before paint (inlined in the root layout) so a saved theme never flashes.
export const themeScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage can be blocked; the choice then lasts for this page only.
  }
}

const options: { value: Theme; label: string; icon: "monitor" | "sun" | "moon" }[] = [
  { value: "system", label: "Tema del sistema", icon: "monitor" },
  { value: "light", label: "Tema chiaro", icon: "sun" },
  { value: "dark", label: "Tema scuro", icon: "moon" },
];

export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "light" || current === "dark" ? current : "system");
  }, []);

  return (
    <div className="theme-switch" role="group" aria-label="Tema">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={theme === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => {
            setTheme(o.value);
            apply(o.value);
          }}
        >
          <Icon name={o.icon} />
        </button>
      ))}
    </div>
  );
}
