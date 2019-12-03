import btoa from 'btoa';

const query = {
    search: [
        {"value":"honda-civic","rank":1000,"isRequired":true},
        {"value":"2016","rank":90},
    ]
}

describe('reviews v2 API', () => {

    describe('/reviews endpoint returns empty', () => {

        it('from no query', () => {
            cy.request({url:'/reviews/v2', failOnStatusCode: false})
                .its('body.reviews')
                .should('have.length', 0)
        });

        it('from invalid non-Base64 encoded query', () => {
            const invalidQuery = 'this is an ivalid query';
            cy.request({url:`/reviews/v2?s=${invalidQuery}`, failOnStatusCode: false})
                .its('body.reviews')
                .should('have.length', 0)
        });

        it('from Base64 encoded invalid query', () => {
            const invalidQuery = btoa('this an invalid but properly encoded query');
            cy.request({url:`/reviews/v2?s=${invalidQuery}`, failOnStatusCode: false})
                .its('body.reviews')
                .should('have.length', 0)
        });
    });

    describe('/reviews endpoint returns array of reviews', () => {
        it('from Base64 encoded query', () => {
            const validQuery = btoa(JSON.stringify(query));
            cy.request({url:`/reviews/v2?s=${validQuery}`, failOnStatusCode: false})
                .its('body.reviews')
                .each(review => expect(review).to.have.all.keys('additional','customer','nps_score','review_date', 'review_published_last_date','review_text','review_title','review_score','vehicle'));
        });
    });

    describe('/reviews endpoint returns summary of reviews', () => {
        it('from Base64 encoded query', () => {
            const validQuery = btoa(JSON.stringify(query));
            cy.request({url:`/reviews/v2?s=${validQuery}`, failOnStatusCode: false})
                .its('body.summary')
                .should('have.all.keys', ['review_average_rating', 'review_highest_rating', 'review_lowest_rating', 'review_count_total'])

        });
    });
    
});