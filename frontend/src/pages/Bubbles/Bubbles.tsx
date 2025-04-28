import React, { useState } from "react";
import './Bubbles.css'
import perlin from '../../perlin';

const Index = () => {
  const [query, setQuery] = useState<String>('');    
  const [answer, setAnswer] = useState<String>('');
  const { innerWidth: width, innerHeight: height } = window;
  const AMOUNT = 10;

  const bubbles = Array(AMOUNT).fill(0).map((el, i) => ({
    s: Math.random() * (1 - 0.5) + 0.5,
    x: width / (AMOUNT / (i % 2 == 0 ? 2 : 1)) * i,
    y: height / (Math.random() * (height - height/2) + height/2),
  }))

  const CANVAS_WIDTH = 3000;
  // The amplitude. The amount the noise affects the movement.
  const NOISE_AMOUNT = 5;
  // The frequency. Smaller for flat slopes, higher for jagged spikes.
  const NOISE_SPEED = 0.004;
  // Pixels to move per frame. At 60fps, this would be 18px a sec.
  const SCROLL_SPEED = 0.3;

  const animationRef = React.useRef<number>();
  const bubblesRef = React.useRef(
    bubbles.map((bubble) => ({
      ...bubble,
      noiseSeedX: Math.floor(Math.random() * 64000),
      noiseSeedY: Math.floor(Math.random() * 64000),
      xWithNoise: bubble.x,
      yWithNoise: bubble.y,
    })),
  );

  const [isReady, setReady] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setReady(true);
    }, 200);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  function animate() {
    bubblesRef.current = bubblesRef.current.map((bubble, index) => {
      const newNoiseSeedX = bubble.noiseSeedX + NOISE_SPEED;
      const newNoiseSeedY = bubble.noiseSeedY + NOISE_SPEED;

      const randomX = perlin.get(newNoiseSeedX, 0)*10;
      const randomY = perlin.get(newNoiseSeedY, 0)*10;

      const newX = bubble.x - SCROLL_SPEED;

      const newXWithNoise = newX + randomX * NOISE_AMOUNT;
      const newYWithNoise = bubble.y + randomY * NOISE_AMOUNT;

      const element = document.getElementById(`bubble-${index}`);

      if (element)
        element.style.transform = `translate(${newXWithNoise}px, ${newYWithNoise}px) scale(${bubble.s})`;

      return {
        ...bubble,
        noiseSeedX: newNoiseSeedX,
        noiseSeedY: newNoiseSeedY,
        x: newX < -200 ? CANVAS_WIDTH : newX,
        xWithNoise: newXWithNoise,
        yWithNoise: newYWithNoise,
      };
    });

    animationRef.current = requestAnimationFrame(animate);
  }
  
  const backgroundPositions: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      backgroundPositions.push(`${-154 * j}px ${-154 * i}px`);
    }
  }

  return (
    <div className="container">
      {bubbles.map((bubble, index) => (
        <div
          className="bubble"
          id={`bubble-${index}`}
          key={`${bubble.x} ${bubble.y}`}
          style={{
            backgroundPosition: backgroundPositions[index],
            transform: `translate(${bubble.x}px, ${bubble.y}px) scale(${bubble.s})`,
          }}
        />
      ))}
    </div>
  );
};

export default Bubbles;