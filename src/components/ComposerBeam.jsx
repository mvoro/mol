import React, { useCallback, useEffect, useState } from "react";
import { BorderBeam } from "border-beam";
import "./composer-beam.css";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const mollyPalette =
  "linear-gradient(115deg, #ff723f 0%, #dc3fff 24%, #7a3fff 49%, #3f8cff 74%, #00d7bd 100%)";

/** Decorative sibling: the library's clipping never encloses the composer. */
export function ComposerBeam({ active, mode }) {
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(reducedMotionQuery).matches,
  );

  useEffect(() => {
    const preference = window.matchMedia(reducedMotionQuery);
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    update();
    return () => preference.removeEventListener("change", update);
  }, []);

  const connectAngle = useCallback((node) => {
    if (!node) return;
    // Reuse BorderBeam's animated angle for the custom-colored outer bloom.
    node.style.setProperty(
      "--composer-beam-angle",
      `var(--beam-angle-${node.dataset.beam})`,
    );
  }, []);

  return (
    <div
      className="composer-beam-layer"
      aria-hidden="true"
      data-generating={active ? "true" : "false"}
      style={{
        "--composer-beam-palette":
          mode === "auto"
            ? mollyPalette
            : "linear-gradient(var(--accent), var(--accent))",
      }}
    >
      <BorderBeam
        // Only the decoration resets when motion preferences change.
        key={reducedMotion ? "still" : "moving"}
        ref={connectAngle}
        className="composer-beam"
        size="md"
        theme="light"
        colorVariant="colorful"
        staticColors
        brightness={1}
        saturation={1}
        strength={0.9}
        duration={2.6}
        borderRadius={26}
        active={active && !reducedMotion}
      >
        {null}
      </BorderBeam>
    </div>
  );
}
