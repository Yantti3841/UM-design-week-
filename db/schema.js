import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';

export const flowers=sqliteTable('flowers',{
  id:integer('id').primaryKey({autoIncrement:true}),
  submissionId:text('submission_id').notNull().unique(),
  eventId:text('event_id').notNull().default('umdw-2026'),
  name:text('name').notNull().default(''),
  recipe:text('recipe').notNull(),
  svg:text('svg').notNull(),
  projectionSvg:text('projection_svg').notNull(),
  generatorVersion:text('generator_version').notNull().default('final1014-v1'),
  createdAt:text('created_at').notNull(),
  status:text('status').notNull().default('active'),
  restoreStatus:text('restore_status').notNull().default('active'),
  updatedAt:text('updated_at'),
  consentVersion:text('consent_version'),
  expiresAt:text('expires_at'),
},table=>[index('flowers_event_id_idx').on(table.eventId,table.id),index('flowers_event_status_idx').on(table.eventId,table.status,table.id),index('flowers_expiry_idx').on(table.eventId,table.expiresAt)]);

export const collectionState=sqliteTable('collection_state',{
  eventId:text('event_id').primaryKey(),
  revision:integer('revision').notNull().default(0),
});
