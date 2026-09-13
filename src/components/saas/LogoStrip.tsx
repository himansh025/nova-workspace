import React from "react";

export const LogoStrip: React.FC = () => {
  const logos = [
    { name: "Northstar", mark: "✦ NORTHSTAR" },
    { name: "Orbit", mark: "◎ ORBIT" },
    { name: "Frame", mark: "◫ FRAME" },
    { name: "Field", mark: "❖ FIELD" },
    { name: "Vertex", mark: "▲ VERTEX" },
    { name: "Arc", mark: "⌒ ARC" }
  ];

  return (
    <section className="py-14 md:py-18 border-y border-[var(--color-border)] bg-[var(--color-background)]">
      <div className="container-site">
        <h2 className="text-center text-[11px] font-mono tracking-widest uppercase text-[var(--color-muted)] mb-8">
          POWERING TEAMS BUILDING THE FUTURE
        </h2>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8 items-center justify-items-center">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="text-sm md:text-base font-semibold tracking-wider text-neutral-400 hover:text-[var(--color-foreground)] transition-colors duration-200 select-none cursor-default font-mono"
            >
              {logo.mark}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoStrip;
