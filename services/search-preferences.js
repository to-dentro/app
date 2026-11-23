import { getProfile } from './profile.js';
import { preferencesToFilters } from './preferences.js';

export async function loadSearchPreferences(params, catalog) {
  const profile = await getProfile();
  const state = new URLSearchParams(params);
  if (profile) {
    for (const [name, value] of preferencesToFilters(profile.preferences, catalog)) state.append(name, value);
  }
  return state;
}
