import React, { useState, useEffect } from 'react';

const BackgroundEffects: React.FC = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            setMousePosition({ x, y });
            setCursorPos({ x: e.clientX, y: e.clientY });
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="absolute inset-0 z-[0] pointer-events-none overflow-hidden fixed">
            {/* Mouse follow spotlight */}
            <div 
                className="fixed top-0 left-0 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 blur-[130px] rounded-full transition-all duration-[50ms] ease-linear will-change-transform mix-blend-normal dark:mix-blend-screen z-[1]"
                style={{ transform: `translate(${cursorPos.x - 300}px, ${cursorPos.y - 300}px)` }}
            />

            {/* Top gradient blob */}
            <div 
                className="absolute top-0 left-[20%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-accent/30 dark:bg-accent/15 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten transition-transform duration-300 ease-out z-[2]" 
                style={{ transform: `translate(${mousePosition.x * -30}px, ${mousePosition.y * -30}px)` }}
            />
            
            {/* Full Mesh Grid System */}
            <div className="absolute inset-0 overflow-hidden z-[0]">
                {/* Horizon fade mesh */}
                <div 
                    className="absolute inset-[-50vw] bg-[linear-gradient(to_right,#80808025_1px,transparent_1px),linear-gradient(to_bottom,#80808025_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_50%,transparent_100%)] dark:opacity-40 transition-transform duration-200 ease-out will-change-transform"
                    style={{ transform: `translate(${mousePosition.x * -10}px, ${mousePosition.y * -10}px)` }}
                />
                
                {/* Deep Perspective floor mesh */}
                <div 
                    className="absolute bottom-[-20vh] left-[-50vw] right-[-50vw] w-[200vw] h-[120vh] bg-[linear-gradient(to_right,#30303020_1px,transparent_1px),linear-gradient(to_bottom,#30303030_2px,transparent_2px)] bg-[size:80px_80px] [mask-image:linear-gradient(to_bottom,transparent_10%,#000_100%)] dark:opacity-50"
                    style={{
                        transform: `perspective(800px) rotateX(65deg) scale(3) translateY(10%)`,
                        transformOrigin: 'bottom center'
                    }}
                />
            </div>
        </div>
    );
};

export default BackgroundEffects;
