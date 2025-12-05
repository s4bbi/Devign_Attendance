import { useEffect } from "react";
import Logo from "./Logo";
import "./loader.css";

export default function Loader({ onFinish }) {
  useEffect(() => {
    setTimeout(() => {
      onFinish(); // signals App.jsx
    }, 2200); // animation duration
  }, []);

  return (
    <div className="loader-wrapper">
      <div className="loader-content">
        <Logo animateToTop={false} />
      </div>
    </div>
  );
}
