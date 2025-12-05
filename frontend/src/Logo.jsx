// src/Logo.jsx
import "./logo.css";
import logo from "./assets/logo.png"; // adjust path if needed

export default function Logo({ animateToTop }) {
  return (
    <img
      src={logo}
      alt="Devign logo"
      className={`devign-logo ${
        animateToTop ? "devign-logo--top" : "devign-logo--center"
      }`}
    />
  );
}
