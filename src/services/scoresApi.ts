import axios from 'axios';
import type { NextGame } from '../types/news';
import type { FollowedEntity } from '../constants/teams';

export async function fetchNextGames(entities: FollowedEntity[]): Promise<NextGame[]> {
  const params = new URLSearchParams();
  for (const e of entities) params.append('e', `${e.kind}:${e.sport}:${e.name}`);
  const { data } = await axios.get<{ games: NextGame[] }>(`/api/scores/next?${params}`);
  return data.games;
}
