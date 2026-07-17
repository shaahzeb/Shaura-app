import { useRef } from "react";

// Wrap any card, button, or panel in this to get a real cursor-tracked 3D
// tilt (perspective + rotateX/rotateY) instead of a flat CSS hover state.
// Keep `max` small (4-6deg) for interactive elements like forms so clicks
// stay easy to land; go bigger (10-14deg) for purely visual display cards.
export default function Tilt3D({ children, max = 10, scale = 1.03, className = "", style = {} }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg) scale3d(${scale}, ${scale}, ${scale})`;
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
      style={{
        transition: "transform 0.15s ease-out",
        transformStyle: "preserve-3d",
        willChange: "transform",
        height: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
