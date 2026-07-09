import React from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

interface TabTransitionPlaneProps {
  transitionKey: string;
}

export default function TabTransitionPlane({ transitionKey }: TabTransitionPlaneProps) {
  if (!transitionKey) return null;
  // Use key={transitionKey} so React remounts the component and triggers the anim every single switch action!
  return (
    <div key={transitionKey} className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Background ripple swipe wave across the screen */}
      <motion.div
        initial={{ opacity: 0, x: "-100%" }}
        animate={{ opacity: [0, 0.2, 0.2, 0], x: ["-100%", "0%", "0%", "100%"] }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
        className="absolute inset-y-0 w-full bg-gradient-to-r from-transparent via-sky-500/10 to-transparent"
      />

      {/* Magical staggered trail particles following the exact path behind the plane */}
      {[...Array(8)].map((_, i) => {
        const colors = [
          "text-sky-400",
          "text-teal-400",
          "text-indigo-400",
          "text-pink-400",
          "text-purple-400",
          "text-amber-400",
          "text-emerald-400",
          "text-blue-400",
        ];
        const size = 14 - i * 1.5;
        // Delay staggered behind the plane
        const delay = 0.04 * (i + 1);

        return (
          <motion.div
            key={i}
            initial={{ x: "-15vw", y: "105vh", rotate: -35, scale: 0, opacity: 0 }}
            animate={{
              x: ["-15vw", "22vw", "58vw", "115vw"],
              y: ["105vh", "52vh", "33vh", "-15vh"],
              rotate: [-35, -15, 10, -45],
              scale: [0, 1.3 - i * 0.12, 0.9, 0],
              opacity: [0, 0.95, 0.7, 0],
            }}
            transition={{
              duration: 1.3,
              ease: "easeOut",
              delay: delay,
            }}
            className={`absolute ${colors[i % colors.length]} drop-shadow-[0_0_8px_currentColor]`}
            style={{ width: size, height: size }}
          >
            {i % 2 === 0 ? (
              <Sparkles className="w-full h-full" />
            ) : (
              <div className="w-1.5 h-1.5 bg-current rounded-full" />
            )}
          </motion.div>
        );
      })}

      {/* Extra cute micro sparkles scattered in path */}
      {[...Array(5)].map((_, i) => {
        const offset = i * 0.15;
        return (
          <motion.div
            key={`sparkle-rand-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 0.6,
              delay: 0.2 + offset,
              ease: "easeInOut",
            }}
            className="absolute text-yellow-300 drop-shadow-[0_0_6px_#f59e0b]"
            style={{
              left: `${20 + i * 15}%`,
              top: `${80 - i * 15}%`,
              width: 8,
              height: 8,
            }}
          >
            <Sparkles className="w-full h-full" />
          </motion.div>
        );
      })}

      {/* The main elegant flying Paper Airplane with glowing wings */}
      <motion.div
        initial={{ x: "-15vw", y: "105vh", rotate: -35, scale: 0.5, opacity: 0 }}
        animate={{
          x: ["-15vw", "22vw", "58vw", "115vw"],
          y: ["105vh", "52vh", "33vh", "-15vh"],
          rotate: [-35, -15, 10, -45],
          scale: [0.5, 1.4, 1.1, 0.4],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 1.3,
          ease: "easeOut",
        }}
        className="absolute text-sky-200 drop-shadow-[0_0_16px_rgba(56,189,248,0.75)] w-14 h-14 flex items-center justify-center"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-full h-full transform -rotate-45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Main center fold line */}
          <path d="M22 2L11 13" />
          {/* Wings */}
          <path d="M22 2L15 22L11 13L2 9L22 2Z" fill="rgba(14,165,233,0.25)" />
        </svg>
      </motion.div>
    </div>
  );
}
