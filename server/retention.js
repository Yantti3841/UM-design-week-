import {EXHIBITION_END} from '../src/event.js';
import {EVENT} from './flower.js';

export const exhibitionClosed=(now=Date.now())=>now>=Date.parse(EXHIBITION_END);
export async function enforceRetention(db,now=Date.now()){
  if(!exhibitionClosed(now))return false;
  const closed=exhibitionClosed(now),expiresBefore=new Date(now).toISOString();
  const expired='event_id=? AND ((expires_at IS NOT NULL AND expires_at<=?) OR (consent_version IS NULL AND ?))';
  await db.batch([
    db.prepare(`INSERT INTO collection_state (event_id,revision) SELECT ?,1 WHERE EXISTS (SELECT 1 FROM flowers WHERE ${expired}) ON CONFLICT(event_id) DO UPDATE SET revision=revision+1`).bind(EVENT,EVENT,expiresBefore,closed?1:0),
    db.prepare(`DELETE FROM flowers WHERE ${expired}`).bind(EVENT,expiresBefore,closed?1:0),
  ]);
  return closed;
}
