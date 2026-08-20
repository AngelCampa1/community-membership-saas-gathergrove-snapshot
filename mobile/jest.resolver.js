/**
 * Custom Jest Resolver for @/ Alias Paths
 * Enables jest.mock('@/services/...') to work correctly
 */

const path = require('path');

module.exports = (request, options) => {
  // Handle @/ alias paths
  if (request.startsWith('@/')) {
    const relativePath = request.substring(2); // Remove '@/'
    const absolutePath = path.join(options.rootDir, 'src', relativePath);

    // Try to resolve with different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
    for (const ext of extensions) {
      try {
        return options.defaultResolver(absolutePath + ext, options);
      } catch (e) {
        // Continue to next extension
      }
    }

    // If no extension worked, try the path as-is
    try {
      return options.defaultResolver(absolutePath, options);
    } catch (e) {
      // Fall through to default resolver
    }
  }

  // For all other imports, use the default resolver
  return options.defaultResolver(request, options);
};
