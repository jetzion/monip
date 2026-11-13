import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { measureExistingMedia } from '../lib/media/measure-existing'

/**
 * Measures media the previous migration could not read: newer uploads sit in an
 * `_objectKey` folder in Blob, which it did not include. Data only; no schema change.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await measureExistingMedia(payload, req)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Nothing to undo: content boxes are recomputed from the images.
}
