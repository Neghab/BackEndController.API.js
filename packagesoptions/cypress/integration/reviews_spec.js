import btoa from 'btoa';

const query = {
    search: [
        {"value":"Honda civic","rank":1000,"isRequired":true},
        {"value":"2016","rank":90},
    ]
}

describe('reviews API', () => {

    it('/hello endpoint returns "hello"', () => {
        cy.request('/hello')
            .its('body')
            .should('include', 'hello')
    });

    describe('/reviews endpoint returns empty', () => {

        it('from no query', () => {
            cy.request({url:'/reviews', failOnStatusCode: false})
                .its('body')
                .should('have.length', 0)
        });

        it('from invalid non-Base64 encoded query', () => {
            const invalidQuery = 'this is an ivalid query';
            cy.request({url:`/reviews?s=${invalidQuery}`, failOnStatusCode: false})
                .its('body')
                .should('have.length', 0)
        });

        it('from Base64 encoded invalid query', () => {
            const invalidQuery = btoa('this an invalid but properly encoded query');
            cy.request({url:`/reviews?s=${invalidQuery}`, failOnStatusCode: false})
                .its('body')
                .should('have.length', 0)
        });
    });

    describe('/reviews endpoint returns array of reviews', () => {
        it('from Base64 encoded query', () => {
            const validQuery = btoa(JSON.stringify(query));
            cy.request(`/reviews?s=${validQuery}`)
                .its('body')
                .each(review => expect(review).to.have.all.keys('additional','customer','nps_score','review_date', 'review_published_last_date','review_text','review_title','review_score','vehicle'))
        });
    });
    
});