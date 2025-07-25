import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  opacity: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

interface SpiceCloudParticlesProps {
  isActive: boolean;
  intensity: number;
  color: 'spice' | 'steam' | 'molecular';
}

export default function SpiceCloudParticles({ isActive, intensity, color }: SpiceCloudParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  const colorSchemes = {
    spice: ['#D2691E', '#CD853F', '#DEB887', '#F4A460', '#B8860B'],
    steam: ['#E6E6FA', '#F8F8FF', '#F0F8FF', '#FFFAFA', '#F5F5F5'],
    molecular: ['#00CED1', '#20B2AA', '#48D1CC', '#40E0D0', '#AFEEEE']
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = Math.floor(intensity * 100);
      
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 1000,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          vz: (Math.random() - 0.5) * 5,
          size: Math.random() * 8 + 2,
          opacity: Math.random() * 0.8 + 0.2,
          color: colorSchemes[color][Math.floor(Math.random() * colorSchemes[color].length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02
        });
      }
    };

    initParticles();

    const animate = () => {
      if (!isActive) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // Update particle position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;
        particle.rotation += particle.rotationSpeed;

        // Apply 3D perspective
        const perspective = 800;
        const scale = perspective / (perspective + particle.z);
        const x2d = particle.x * scale + canvas.width / 2;
        const y2d = particle.y * scale + canvas.height / 2;

        // Wrap around edges
        if (particle.x > canvas.width / 2) particle.x = -canvas.width / 2;
        if (particle.x < -canvas.width / 2) particle.x = canvas.width / 2;
        if (particle.y > canvas.height / 2) particle.y = -canvas.height / 2;
        if (particle.y < -canvas.height / 2) particle.y = canvas.height / 2;
        if (particle.z > 500) particle.z = -500;
        if (particle.z < -500) particle.z = 500;

        // Draw particle with 3D effects
        ctx.save();
        ctx.translate(x2d, y2d);
        ctx.rotate(particle.rotation);
        ctx.scale(scale, scale);

        // Create gradient for depth
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
        gradient.addColorStop(0, particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, particle.color + '00');

        ctx.fillStyle = gradient;
        
        // Draw different shapes based on color scheme
        if (color === 'spice') {
          // Spice particles - irregular shapes
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = particle.size * (0.5 + Math.random() * 0.5);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        } else if (color === 'steam') {
          // Steam - soft circles
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Molecular - geometric shapes
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        }

        ctx.restore();

        // Update opacity for breathing effect
        particle.opacity += Math.sin(Date.now() * 0.005 + index) * 0.01;
        if (particle.opacity > 1) particle.opacity = 1;
        if (particle.opacity < 0.1) particle.opacity = 0.1;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, intensity, color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ 
        zIndex: 15,
        opacity: isActive ? 1 : 0,
        transition: 'opacity 1s ease-in-out'
      }}
    />
  );
}