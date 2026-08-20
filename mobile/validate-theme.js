/**
 * Light theme implementation validation script.
 * Run with: node validate-theme.js
 */

const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/contexts/ThemeContext.tsx',
  'src/constants/colors.ts',
  'src/screens/ThemeSettingsScreen.tsx',
];

let allFilesExist = true;
for (const file of filesToCheck) {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`Missing ${file}`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  process.exit(1);
}

const themeContext = fs.readFileSync(
  path.join(__dirname, 'src/contexts/ThemeContext.tsx'),
  'utf8'
);
const colors = fs.readFileSync(path.join(__dirname, 'src/constants/colors.ts'), 'utf8');

const checks = {
  'LIGHT_THEME import': themeContext.includes('LIGHT_THEME'),
  'CHAT_COLORS import': themeContext.includes('CHAT_COLORS'),
  'ThemeProvider export': themeContext.includes('export const ThemeProvider'),
  'useTheme export': themeContext.includes('export const useTheme'),
  'useThemedStyles export': themeContext.includes('export const useThemedStyles'),
  'No persisted appearance mode': !themeContext.includes('AsyncStorage'),
  'No selectable appearance state': !themeContext.includes('useState'),
  'LIGHT_THEME export': colors.includes('export const LIGHT_THEME'),
  'CHAT_COLORS export': colors.includes('export const CHAT_COLORS'),
};

const failed = Object.entries(checks).filter(([, passed]) => !passed);

if (failed.length > 0) {
  for (const [name] of failed) {
    console.error(`Failed: ${name}`);
  }
  process.exit(1);
}

console.log('Light theme implementation is valid.');
