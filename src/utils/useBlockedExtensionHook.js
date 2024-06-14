import {createChromeStorageStateHookLocal} from 'use-chrome-storage';

const SETTINGS_KEY = 'blockedTime';

export const useBlockedExtensionHook = createChromeStorageStateHookLocal(SETTINGS_KEY);