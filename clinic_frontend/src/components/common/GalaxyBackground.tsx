import { useRef, useEffect } from 'react';

export const GalaxyBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: { x: number; y: number; radius: number; vx: number; vy: number; alpha: number }[] = [];
        let width = window.innerWidth;
        let height = window.innerHeight;

        const init = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            stars = [];
            const starCount = Math.floor((width * height) / 3000); // Density control (about 300 stars for 1080p)

            for (let i = 0; i < starCount; i++) {
                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 1.5,
                    vx: (Math.random() - 0.5) * 0.2, // Slow drift x
                    vy: (Math.random() - 0.5) * 0.2, // Slow drift y
                    alpha: Math.random() * 0.8 + 0.2,
                });
            }
        };

        const draw = () => {
            ctx.fillStyle = '#0f172a'; // Deep dark blue background (from slate-900) - fallback
            ctx.clearRect(0, 0, width, height);

            // We actually want a transparent background so CSS can handle the gradient bottom layer if needed,
            // But for a true galaxy, a dark fill is good. Let's rely on the parent CSS for the base color.
            // So clearRect is correct.

            // Draw Nebula effect (subtle gradients)
            const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, width);
            gradient.addColorStop(0, 'rgba(76, 29, 149, 0.1)'); // Purple center
            gradient.addColorStop(0.5, 'rgba(15, 23, 42, 0)'); // Fade out
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            const gradient2 = ctx.createRadialGradient(width * 0.2, height * 0.8, 0, width * 0.2, height * 0.8, width * 0.6);
            gradient2.addColorStop(0, 'rgba(56, 189, 248, 0.05)'); // Light blue accent
            gradient2.addColorStop(0.5, 'rgba(15, 23, 42, 0)');
            ctx.fillStyle = gradient2;
            ctx.fillRect(0, 0, width, height);

            // Draw Stars
            ctx.fillStyle = '#ffffff';
            stars.forEach((star) => {
                ctx.globalAlpha = star.alpha;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();

                // Update Position
                star.x += star.vx;
                star.y += star.vy;

                // Wrap around
                if (star.x < 0) star.x = width;
                if (star.x > width) star.x = 0;
                if (star.y < 0) star.y = height;
                if (star.y > height) star.y = 0;
            });
            ctx.globalAlpha = 1.0;

            animationFrameId = requestAnimationFrame(draw);
        };

        init();
        draw();

        const handleResize = () => {
            init();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};
