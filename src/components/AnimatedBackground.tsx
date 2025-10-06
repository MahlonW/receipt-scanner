// components/AnimatedBackground.tsx
"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";

// Helper function to generate random complex border-radius
const getRandomBorderRadius = () => {
  const tl = gsap.utils.random(20, 80, 5, true);
  const tr = gsap.utils.random(20, 80, 5, true);
  const br = gsap.utils.random(20, 80, 5, true);
  const bl = gsap.utils.random(20, 80, 5, true);
  const tl_h = gsap.utils.random(20, 80, 5, true);
  const tr_h = gsap.utils.random(20, 80, 5, true);
  const br_h = gsap.utils.random(20, 80, 5, true);
  const bl_h = gsap.utils.random(20, 80, 5, true);
  return `${tl()}% ${tr()}% ${br()}% ${bl()}% / ${tl_h()}% ${tr_h()}% ${br_h()}% ${bl_h()}%`;
};

// Define more gradient possibilities
const gradients = [
  "from-[#ff80b5] to-[#9089fc]",
  "from-[#ff4694] to-[#776fff]",
  "from-cyan-400 to-blue-800",
  "from-green-300 via-blue-500 to-purple-600",
  "from-yellow-200 via-red-500 to-fuchsia-500",
  "from-teal-400 to-yellow-200",
  "from-pink-500 via-red-500 to-yellow-500",
  "from-sky-400 via-rose-400 to-lime-400",
];

// Helper to get a base class string without gradient classes
const getBaseClasses = (element: HTMLElement | null): string => {
  if (!element) return "";
  return element.className
    .split(" ")
    .filter(
      (cls) =>
        !cls.startsWith("from-") &&
        !cls.startsWith("via-") &&
        !cls.startsWith("to-"),
    )
    .join(" ");
};

const AnimatedBackground: React.FC = () => {
  const bgShape1Ref = useRef<HTMLDivElement>(null);
  const bgShape2Ref = useRef<HTMLDivElement>(null);
  const bgShape3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shapes = [
      bgShape1Ref.current,
      bgShape2Ref.current,
      bgShape3Ref.current,
    ];
    const validShapes = shapes.filter(
      (shape): shape is HTMLDivElement => shape !== null,
    );

    if (validShapes.length > 0) {
      const animateShape = (outerTarget: HTMLDivElement) => {
        const innerTarget = outerTarget.querySelector(
          "div",
        ) as HTMLDivElement | null;
        if (!innerTarget) return;

        const baseInnerClasses = getBaseClasses(innerTarget);
        innerTarget.className = `${baseInnerClasses} ${gsap.utils.random(gradients)}`;

        gsap.to(innerTarget, {
          borderRadius: getRandomBorderRadius(),
          duration: gsap.utils.random(10, 20),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: gsap.utils.random(0, 3),
          onRepeat: () => {
            gsap.to(innerTarget, {
              className: `${baseInnerClasses} ${gsap.utils.random(gradients)}`,
              duration: 1.5,
              ease: "none",
            });
            gsap.to(innerTarget, {
              borderRadius: getRandomBorderRadius(),
              duration: gsap.utils.random(10, 20),
              ease: "sine.inOut",
              overwrite: "auto",
            });
          },
        });

        gsap.to(outerTarget, {
          xPercent: gsap.utils.random(-30, 30, 1, true),
          yPercent: gsap.utils.random(-30, 30, 1, true),
          rotation: gsap.utils.random(-45, 45, 5, true),
          scale: gsap.utils.random(0.9, 1.4, 0.1, true),
          duration: gsap.utils.random(12, 22),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: gsap.utils.random(0, 3),
        });
      };

      validShapes.forEach(animateShape);
    }

    return () => {
      validShapes.forEach((shape) => {
        gsap.killTweensOf(shape);
        const inner = shape.querySelector("div");
        if (inner) {
          gsap.killTweensOf(inner);
        }
      });
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Shape 1 */}
      <div
        ref={bgShape1Ref}
        className="pointer-events-none absolute left-[max(50%-35rem,0%)] top-1/2 -translate-y-1/2 transform-gpu blur-3xl opacity-30 dark:opacity-20"
      >
        <div className="aspect-[1/1] w-[60rem] bg-gradient-to-tr from-pink-500 to-violet-600 rounded-[50%]" />
      </div>
      {/* Shape 2 */}
      <div
        ref={bgShape2Ref}
        className="pointer-events-none absolute left-[max(50%-10rem,0%)] top-[calc(100%-20rem)] -translate-y-1/2 transform-gpu blur-3xl opacity-40 dark:opacity-25"
      >
        <div className="aspect-[1/1] w-[70rem] bg-gradient-to-tr from-cyan-400 to-sky-600 rounded-[50%]" />
      </div>
      {/* Shape 3 */}
      <div
        ref={bgShape3Ref}
        className="pointer-events-none absolute right-[max(50%-30rem,0%)] bottom-1/4 translate-y-1/2 transform-gpu blur-3xl opacity-20 dark:opacity-15"
      >
        <div className="aspect-[1/1] w-[55rem] bg-gradient-to-tr from-amber-300 to-orange-500 rounded-[50%]" />
      </div>
    </div>
  );
};

export default AnimatedBackground;