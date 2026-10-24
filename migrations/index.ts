import * as migration_20261022_225531_initial from './20261022_225531_initial';
import * as migration_20261022_230749_services_and_pages from './20261022_230749_services_and_pages';
import * as migration_20261022_231142_live_preview_autosave from './20261022_231142_live_preview_autosave';
import * as migration_20261023_113531_page_image from './20261023_113531_page_image';
import * as migration_20261023_143316_remove_sustainability_page from './20261023_143316_remove_sustainability_page';
import * as migration_20261023_160929_home_global from './20261023_160929_home_global';
import * as migration_20261023_161444_remove_hero_buttons from './20261023_161444_remove_hero_buttons';
import * as migration_20261023_163326_clients from './20261023_163326_clients';
import * as migration_20261023_210736_offices from './20261023_210736_offices';
import * as migration_20261023_211829_add_client_order from './20261023_211829_add_client_order';
import * as migration_20261023_211844_drop_client_sort_order from './20261023_211844_drop_client_sort_order';
import * as migration_20261024_123343_success_stories from './20261024_123343_success_stories';

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
    name: '20261023_161444_remove_hero_buttons',
  },
  {
    up: migration_20261023_163326_clients.up,
    down: migration_20261023_163326_clients.down,
    name: '20261023_163326_clients',
  },
  {
    up: migration_20261023_210736_offices.up,
    down: migration_20261023_210736_offices.down,
    name: '20261023_210736_offices',
  },
  {
    up: migration_20261023_211829_add_client_order.up,
    down: migration_20261023_211829_add_client_order.down,
    name: '20261023_211829_add_client_order',
  },
  {
    up: migration_20261023_211844_drop_client_sort_order.up,
    down: migration_20261023_211844_drop_client_sort_order.down,
    name: '20261023_211844_drop_client_sort_order',
  },
  {
    up: migration_20261024_123343_success_stories.up,
    down: migration_20261024_123343_success_stories.down,
    name: '20261024_123343_success_stories'
  },
];
