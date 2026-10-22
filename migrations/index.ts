import * as migration_20261022_225531_initial from './20261022_225531_initial';
import * as migration_20261022_230749_services_and_pages from './20261022_230749_services_and_pages';
import * as migration_20261022_231142_live_preview_autosave from './20261022_231142_live_preview_autosave';

export const migrations = [
  {
    up: migration_20261022_225531_initial.up,
    down: migration_20261022_225531_initial.down,
    name: '20261022_225531_initial',
  },
  {
    up: migration_20261022_230749_services_and_pages.up,
    down: migration_20261022_230749_services_and_pages.down,
    name: '20261022_230749_services_and_pages',
  },
  {
    up: migration_20261022_231142_live_preview_autosave.up,
    down: migration_20261022_231142_live_preview_autosave.down,
    name: '20261022_231142_live_preview_autosave'
  },
];
