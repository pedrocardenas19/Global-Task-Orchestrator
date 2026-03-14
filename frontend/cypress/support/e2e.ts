// Global support file — runs before every test suite
import './commands';

// Prevent Cypress from failing on uncaught exceptions from the app
Cypress.on('uncaught:exception', (_err, _runnable) => false);
