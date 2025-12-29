import { useEffect, useRef } from 'react';
import { LocalMatchState } from '../../game/state/models';
import { updateGamePhysics } from '../../game/physics/physics';
import { LocalInputHandler } from '../../game/keyboard/bindings';

export function useGameLoop(gameState: LocalMatchState | null) {
  const animationIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!gameState || gameState.status.isPaused) {
      return;
    }

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const input = LocalInputHandler.getInstance().directions;
      updateGamePhysics(gameState, dt, input.left, input.right);

      animationIdRef.current = requestAnimationFrame(loop);
    };

    animationIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [gameState]);
}