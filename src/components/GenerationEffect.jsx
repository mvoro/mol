import { useEffect, useRef } from 'react';
import { ImageGeneration } from 'img-fx';

export default function GenerationEffect({ poster, ready, onRevealed }) {
  const effect = useRef(null);
  useEffect(() => {
    if (ready) effect.current?.triggerReveal({ hold: 'manual' });
  }, [ready]);
  return <ImageGeneration ref={effect} preset="pixels-organic" theme="light" cardBg="#f7f7f7" images={poster} autoReveal={false} borderRadius={20} pixelScale={0.8} onCycle={({ phase }) => { if (phase === 'visible') onRevealed(); }} className="generation-shader">
    <div className="generation-shader-surface" />
  </ImageGeneration>;
}
