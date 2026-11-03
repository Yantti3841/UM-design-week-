import {EXHIBITION_END} from '../src/event.js';
import {EVENT} from './flower.js';

export const exhibitionClosed=(now=Date.now())=>now>=Date.parse(EXHIBITION_END);
export async function enforceRetention(db,now=Date.now()){
  if(!exhibitionClosed(now))return false;
  await db.batch([
    db.prepare('INSERT INTO collection_state (event_id,revision) SELECT ?,1 WHERE EXISTS (SELECT 1 FROM flowers WHERE event_id=?) ON CONFLICT(event_id) DO UPDATE SET revision=revision+1').bind(EVENT,EVENT),
    db.prepare('DELETE FROM flowers WHERE event_id=?').bind(EVENT),
  ]);
  return true;
}
