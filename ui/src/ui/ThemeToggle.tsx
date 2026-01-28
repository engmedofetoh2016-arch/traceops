import { Button } from "./components";

export function ThemeToggle({ theme, toggle }: { theme: "light" | "dark"; toggle: () => void }) {
  return (
    <Button onClick={toggle} variant="ghost" style={{ padding: "8px 10px" }}>
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </Button>
  );
}
