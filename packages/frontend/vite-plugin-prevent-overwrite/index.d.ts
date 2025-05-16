import { Plugin } from 'vite';

/**
 * Vite plugin to prevent overwriting unchanged files in the output directory.
 * Skips writing files whose content hasn't changed since the last build.
 *
 * @returns A Vite plugin object.
 */
declare function preventOverwritePlugin(): Plugin;

export { preventOverwritePlugin };
