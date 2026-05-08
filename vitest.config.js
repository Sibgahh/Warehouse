import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,           // describe, it, expect globally available
    environment: 'node',     // Node.js environment (not jsdom)
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'src/server.js',
        'src/config/**',
        'src/middlewares/logger.js',
      ],
    },
    // Setup file for test helpers
    setupFiles: ['tests/helpers/setup.js'],
  },
});