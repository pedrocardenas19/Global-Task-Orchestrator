/**
 * E2E Test Suite — Global Task Orchestrator
 *
 * Covers the full flow: Front → API → DB → Front
 * Uses cy.intercept() to verify actual network requests, not just DOM rendering.
 */
describe('Task Management', () => {
  beforeEach(() => {
    // Intercept the initial GET so we can wait for the list to load
    cy.intercept('GET', '**/api/v1/tasks').as('getTasks');
    cy.visit('/');
    cy.wait('@getTasks');
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('loads the dashboard and displays the task form', () => {
    cy.get('[data-testid="task-form"]').should('be.visible');
    cy.get('[data-testid="task-title-input"]').should('be.visible');
    cy.get('[data-testid="task-description-input"]').should('be.visible');
    cy.get('[data-testid="submit-button"]').should('be.visible').and('be.disabled');
  });

  it('creates a task and verifies it appears in the list', () => {
    const title = `Task ${Date.now()}`;
    const description = 'Created by Cypress E2E test';

    // Intercept the POST and confirm the request payload
    cy.intercept('POST', '**/api/v1/tasks', (req) => {
      expect(req.body).to.deep.include({ title, description });
    }).as('postTask');

    cy.intercept('GET', '**/api/v1/tasks').as('refreshList');

    // Fill the form
    cy.get('[data-testid="task-title-input"]').type(title);
    cy.get('[data-testid="task-description-input"]').type(description);

    // Button becomes enabled once the title is filled
    cy.get('[data-testid="submit-button"]').should('not.be.disabled');
    cy.get('[data-testid="submit-button"]').click();

    // Wait for the full cycle: POST → 201 → GET → render
    cy.wait('@postTask').its('response.statusCode').should('eq', 201);
    cy.wait('@refreshList').its('response.statusCode').should('eq', 200);

    // Verify the task appears in the list
    cy.get('[data-testid="task-list"]').should('be.visible');
    cy.get('[data-testid="task-item"]').contains(title).should('be.visible');

    // Verify the form was reset after submission
    cy.get('[data-testid="task-title-input"]').should('have.value', '');
    cy.get('[data-testid="submit-button"]').should('be.disabled');
  });

  it('shows a pending badge on newly created tasks', () => {
    const title = `Pending task ${Date.now()}`;

    cy.createTask(title);

    cy.get('[data-testid="task-item"]')
      .filter(`:contains("${title}")`)
      .find('[data-testid="task-status"]')
      .should('have.text', ' pending ');
  });

  it('creates multiple tasks and all appear in the list', () => {
    const titles = [`Task A ${Date.now()}`, `Task B ${Date.now()}`];

    for (const title of titles) {
      cy.createTask(title);
    }

    for (const title of titles) {
      cy.get('[data-testid="task-list"]').contains(title).should('be.visible');
    }
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  it('disables the Save button when the title is empty', () => {
    cy.get('[data-testid="task-title-input"]').clear();
    cy.get('[data-testid="submit-button"]').should('be.disabled');
  });

  it('disables the Save button when the title is shorter than 3 characters', () => {
    cy.get('[data-testid="task-title-input"]').type('ab');
    cy.get('[data-testid="submit-button"]').should('be.disabled');
  });

  it('enables the Save button when the title has at least 3 characters', () => {
    cy.get('[data-testid="task-title-input"]').type('Fix');
    cy.get('[data-testid="submit-button"]').should('not.be.disabled');
  });

  // ── Network error handling ─────────────────────────────────────────────────

  it('shows an error message when the API returns 422 (duplicate title)', () => {
    cy.intercept('POST', '**/api/v1/tasks', {
      statusCode: 422,
      body: { message: 'Title has already been taken' },
    }).as('duplicateTask');

    cy.get('[data-testid="task-title-input"]').type('Duplicate title');
    cy.get('[data-testid="submit-button"]').click();

    cy.wait('@duplicateTask');

    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Title has already been taken');
  });

  it('shows a generic error message when the API returns 500', () => {
    cy.intercept('POST', '**/api/v1/tasks', { statusCode: 500, body: {} }).as('serverError');

    cy.get('[data-testid="task-title-input"]').type('Task that will fail');
    cy.get('[data-testid="submit-button"]').click();

    cy.wait('@serverError');

    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Error creating task');
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  it('shows an empty state when there are no tasks', () => {
    // Simulate an empty list from the API
    cy.intercept('GET', '**/api/v1/tasks', { statusCode: 200, body: [] }).as('emptyList');
    cy.visit('/');
    cy.wait('@emptyList');

    cy.get('[data-testid="empty-state"]').should('be.visible');
    cy.get('[data-testid="task-list"]').should('exist');
  });
});
