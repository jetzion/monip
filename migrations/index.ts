import * as migration_20261022_225531_initial from './20261022_225531_initial';

export const migrations = [
  {
    up: migration_20261022_225531_initial.up,
    down: migration_20261022_225531_initial.down,
    name: '20261022_225531_initial'
  },
];
