import { createContext } from 'react';
import { createContextualCan } from '@casl/react';
import { AppAbility } from '@lpg/permissions';

export const AbilityContext = createContext<AppAbility>({} as AppAbility);
export const Can = createContextualCan(AbilityContext.Consumer);
