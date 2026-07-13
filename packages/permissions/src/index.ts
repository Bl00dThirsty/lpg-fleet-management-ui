import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';

export type Role = 'CSPH' | 'MARKETER' | 'TRANSPORTER' | 'DRIVER' | 'GUEST';

export type AppAction = 'manage' | 'read' | 'create' | 'update' | 'delete';
export type AppSubject = 'Trip' | 'Truck' | 'Marketer' | 'Transporter' | 'all';

export type AppAbility = MongoAbility<[AppAction, AppSubject]>;

export function defineAbilitiesFor(role: Role): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  switch (role) {
    case 'GUEST':
      // Cannot do anything
      break;
    case 'CSPH':
      can('manage', 'all'); // CSPH has full access
      break;
    case 'MARKETER':
      can('read', 'Marketer'); // Example rules, to be refined
      can('manage', 'Trip');
      can('read', 'Transporter');
      break;
    case 'TRANSPORTER':
      can('read', 'Transporter');
      can('manage', 'Truck');
      can('read', 'Trip');
      break;
    case 'DRIVER':
      can('read', 'Trip');
      can('update', 'Trip'); // e.g. update status
      break;
  }

  return build();
}
