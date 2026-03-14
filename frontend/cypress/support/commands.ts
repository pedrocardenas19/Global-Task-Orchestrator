// Custom Cypress commands

/**
 * Fills and submits the task creation form.
 * Waits for the POST /tasks request to complete before resolving.
 */
Cypress.Commands.add('createTask', (title: string, description?: string) => {
  cy.intercept('POST', '**/api/v1/tasks').as('createTask');
  cy.intercept('GET', '**/api/v1/tasks').as('getTasks');

  cy.get('[data-testid="task-title-input"]').clear().type(title);

  if (description) {
    cy.get('[data-testid="task-description-input"]').clear().type(description);
  }

  cy.get('[data-testid="submit-button"]').click();

  // Wait for the full cycle: POST → GET → render
  cy.wait('@createTask');
  cy.wait('@getTasks');
});

declare global {
  namespace Cypress {
    interface Chainable {
      createTask(title: string, description?: string): Chainable<void>;
    }
  }
}
