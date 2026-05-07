import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom', // Behövs för att simulera webbmiljö (NextRequest etc.)
    globals: true,      // Gör att du slipper importera 'describe', 'it' etc i varje fil
  },
});