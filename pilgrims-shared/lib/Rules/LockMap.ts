import { Result, World, success } from '../Shared';
import { assignInitalRessourcesToPlayers } from './Helpers';

export const LockMap = () => (w: Result<World>): Result<World> => {
  if (w.tag === 'Failure') {
    return w;
  }
  const players = assignInitalRessourcesToPlayers(w);
  const world: World = {
    ...w.value,
    players,
    gameState: 'Pregame',
  };
  return success(world);
};
