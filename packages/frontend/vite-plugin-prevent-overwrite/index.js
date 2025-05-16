import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Generate a SHA256 hash of the given content
 */
function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Vite plugin to skip writing unchanged files
 */
export function preventOverwritePlugin() {
  return {
    name: 'vite-plugin-prevent-overwrite',
    apply: 'build',
    enforce: 'post',
    generateBundle(options, bundle) {
      const outputDir = options.dir || 'dist';
      let ignoredFileCount = 0;

      for (const [fileName, file] of Object.entries(bundle)) {
        const outputPath = path.resolve(outputDir, fileName);

        let newContent;
        if ('code' in file && typeof file.code === 'string') {
          newContent = Buffer.from(file.code);
        } else if (
          'source' in file &&
          (typeof file.source === 'string' || Buffer.isBuffer(file.source))
        ) {
          newContent = Buffer.isBuffer(file.source)
            ? file.source
            : Buffer.from(file.source);
        } else {
          continue;
        }

        if (fs.existsSync(outputPath)) {
          const existingContent = fs.readFileSync(outputPath);
          const existingHash = hashContent(existingContent);
          const newHash = hashContent(newContent);

          if (existingHash === newHash) {
            delete bundle[fileName];
            ignoredFileCount++;
          }
        }
      }

      if (ignoredFileCount > 0) {
        this.warn(`Skipped ${ignoredFileCount} unchanged files`);
      }
    },
  };
}
