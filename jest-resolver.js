const path = require('path');
const fs = require('fs');

module.exports = (request, options) => {
  // Default to Jest's default resolver
  try {
    return options.defaultResolver(request, options);
  } catch (error) {
    // If TypeORM module is not found, try to resolve it from pnpm structure
    if (request === 'typeorm') {
      const pnpmModulesPath = path.join(
        options.rootDir,
        '..',
        'node_modules',
        '.pnpm',
      );

      try {
        // Look for TypeORM in pnpm structure
        const pnpmDirs = fs.readdirSync(pnpmModulesPath);
        const typeormDir = pnpmDirs.find((dir) => dir.startsWith('typeorm@'));

        if (typeormDir) {
          const typeormPath = path.join(
            pnpmModulesPath,
            typeormDir,
            'node_modules',
            'typeorm',
          );
          const packageJsonPath = path.join(typeormPath, 'package.json');

          if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(
              fs.readFileSync(packageJsonPath, 'utf8'),
            );
            const mainFile = packageJson.main || 'index.js';
            const mainPath = path.join(typeormPath, mainFile);

            if (fs.existsSync(mainPath)) {
              return mainPath;
            }
          }
        }
      } catch (pnpmError) {
        console.error('PNPM resolution error:', pnpmError);
      }
    }

    // If we can't resolve it, re-throw the original error
    throw error;
  }
};
