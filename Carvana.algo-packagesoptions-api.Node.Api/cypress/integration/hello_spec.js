
describe('reviews API', () => {

    it('/hello endpoint returns "hello"', () => {
        cy.request('/hello')
            .its('body')
            .should('include', 'hello')
    });

});
