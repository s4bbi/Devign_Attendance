import { useEffect } from "react";
import "./loader.css";
import logo from "./assets/logo.png";

export default function Loader() {
  useEffect(() => {
    const wrapper = document.querySelector(".loader-wrapper");
    if (!wrapper) return;

    const startSequence = () => {
      // keep loader visible for a bit
      setTimeout(() => {
        wrapper.classList.add("fade-out");
      }, 2000); // visible ~2s

      setTimeout(() => {
        wrapper.parentNode && wrapper.parentNode.removeChild(wrapper);
      }, 3200); // total ~3.2s
    };

    if (document.readyState === "complete") {
      startSequence();
    } else {
      window.addEventListener("load", startSequence);
    }

    return () => {
      window.removeEventListener("load", startSequence);
    };
  }, []);

  return (
    <div className="loader-wrapper">
      <div className="loader-background" />
      <div className="loader-card">
        <div className="loader-spinner">
          <div className="loader-spinner-inner" />
        </div>
        <img src={logo} alt="Logo" className="loader-logo" />
      </div>
    </div>
  );
}
