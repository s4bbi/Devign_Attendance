import { useEffect, useState } from "react";
import "./loader.css";

export default function LoaderOverlay({ active }) {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (!active) {
      // Wait for fade-out animation before unmounting
      const t = setTimeout(() => setVisible(false), 700);
      return () => clearTimeout(t);
    } else {
      setVisible(true);
    }
  }, [active]);

  if (!visible) return null;

  return (
    <div className={`loader-overlay ${active ? "" : "loader-fade-out"}`}>
      <div className="loader-spinner" />
    </div>
  );
}
