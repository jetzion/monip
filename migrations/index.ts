import * as migration_20261022_225531_initial from './20261022_225531_initial';
import * as migration_20261022_230749_services_and_pages from './20261022_230749_services_and_pages';
import * as migration_20261022_231142_live_preview_autosave from './20261022_231142_live_preview_autosave';
import * as migration_20261023_113531_page_image from './20261023_113531_page_image';
import * as migration_20261023_143316_remove_sustainability_page from './20261023_143316_remove_sustainability_page';
import * as migration_20261023_160929_home_global from './20261023_160929_home_global';
import * as migration_20261023_161444_remove_hero_buttons from './20261023_161444_remove_hero_buttons';

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
    name: '20261022_231142_live_preview_autosave',
  },
  {
    up: migration_20261023_113531_page_image.up,
    down: migration_20261023_113531_page_image.down,
    name: '20261023_113531_page_image',
  },
  {
    up: migration_20261023_143316_remove_sustainability_page.up,
    down: migration_20261023_143316_remove_sustainability_page.down,
    name: '20261023_143316_remove_sustainability_page',
  },
  {
    up: migration_20261023_160929_home_global.up,
    down: migration_20261023_160929_home_global.down,
    name: '20261023_160929_home_global',
  },
  {
    up: migration_20261023_161444_remove_hero_buttons.up,
    down: migration_20261023_161444_remove_hero_buttons.down,
    name: '20261023_161444_remove_hero_buttons'
  },
];
