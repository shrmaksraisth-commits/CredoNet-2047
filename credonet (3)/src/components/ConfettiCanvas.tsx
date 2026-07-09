import React, { useEffect, useRef } from "react";

interface ConfettiCanvasProps {
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  shape: "circle" | "square" | "triangle";
  opacity: number;
}

export default function ConfettiCanvas({ active }: ConfettiCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Initialize and update canvas size based on container resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Particle creation logic
  const colors = [
    "#FF1493", // Deep Pink
    "#FF4500", // Orange Red
    "#FFD700", // Gold
    "#32CD32", // Lime Green
    "#00BFFF", // Deep Sky Blue
    "#9400D3", // Dark Violet
    "#FF69B4", // Hot Pink
    "#00FA9A", // Medium Spring Green
  ];

  const createParticles = (width: number, height: number) => {
    const particles: Particle[] = [];
    
    // Side bursts (Left and Right)
    for (let i = 0; i < 70; i++) {
      // Left side burst
      particles.push({
        x: 0,
        y: height * 0.8,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 12 + 6,
        speedY: -(Math.random() * 18 + 12),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        shape: Math.random() > 0.6 ? "circle" : Math.random() > 0.4 ? "square" : "triangle",
        opacity: 1,
      });

      // Right side burst
      particles.push({
        x: width,
        y: height * 0.8,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: -(Math.random() * 12 + 6),
        speedY: -(Math.random() * 18 + 12),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        shape: Math.random() > 0.6 ? "circle" : Math.random() > 0.4 ? "square" : "triangle",
        opacity: 1,
      });
    }

    // Top rain particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * width,
        y: -20,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 2,
        speedY: Math.random() * 4 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        shape: Math.random() > 0.5 ? "circle" : "square",
        opacity: 0.9,
      });
    }

    return particles;
  };

  useEffect(() => {
    if (!active) {
      particlesRef.current = [];
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize particles
    particlesRef.current = createParticles(canvas.width, canvas.height);

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Physics
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.3; // Gravity
        p.speedX *= 0.98; // Friction
        p.rotation += p.rotationSpeed;
        
        // Horizontal swaying
        p.x += Math.sin(p.y / 25) * 0.4;

        // Fade out
        if (p.speedY > 0) {
          p.opacity -= 0.007;
        }

        // Remove dead particles
        if (p.opacity <= 0 || p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "square") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === "triangle") {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      // Loop if particles remain
      if (particles.length > 0) {
        animationFrameRef.current = requestAnimationFrame(updateAndDraw);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateAndDraw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none w-full h-full z-50 overflow-hidden"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
