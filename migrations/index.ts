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
import * as migration_20261024_140836_products_page from './20261024_140836_products_page';
import * as migration_20261026_152914_cruise_sailings from './20261026_152914_cruise_sailings';
import * as migration_20261027_205726_trainers_and_port_time_zones from './20261027_205726_trainers_and_port_time_zones';
import * as migration_20261027_214735_training_sessions from './20261027_214735_training_sessions';
import * as migration_20261028_144457_chat_invitation from './20261028_144457_chat_invitation';
import * as migration_20261028_145254_chat_invitation_picks from './20261028_145254_chat_invitation_picks';
import * as migration_20261028_164728_chat_invitation_times_per_visit from './20261028_164728_chat_invitation_times_per_visit';

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
    name: '20261024_123343_success_stories',
  },
  {
    up: migration_20261024_140836_products_page.up,
    down: migration_20261024_140836_products_page.down,
    name: '20261024_140836_products_page',
  },
  {
    up: migration_20261026_152914_cruise_sailings.up,
    down: migration_20261026_152914_cruise_sailings.down,
    name: '20261026_152914_cruise_sailings',
  },
  {
    up: migration_20261027_205726_trainers_and_port_time_zones.up,
    down: migration_20261027_205726_trainers_and_port_time_zones.down,
    name: '20261027_205726_trainers_and_port_time_zones',
  },
  {
    up: migration_20261027_214735_training_sessions.up,
    down: migration_20261027_214735_training_sessions.down,
    name: '20261027_214735_training_sessions',
  },
  {
    up: migration_20261028_144457_chat_invitation.up,
    down: migration_20261028_144457_chat_invitation.down,
    name: '20261028_144457_chat_invitation',
  },
  {
    up: migration_20261028_145254_chat_invitation_picks.up,
    down: migration_20261028_145254_chat_invitation_picks.down,
    name: '20261028_145254_chat_invitation_picks',
  },
  {
    up: migration_20261028_164728_chat_invitation_times_per_visit.up,
    down: migration_20261028_164728_chat_invitation_times_per_visit.down,
    name: '20261028_164728_chat_invitation_times_per_visit'
  },
];
