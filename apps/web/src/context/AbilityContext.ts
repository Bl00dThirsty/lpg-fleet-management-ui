import { createContext } from 'react';
import { AppAbility } from '@lpg/permissions';

export const AbilityContext = createContext<AppAbility>({} as AppAbility);
