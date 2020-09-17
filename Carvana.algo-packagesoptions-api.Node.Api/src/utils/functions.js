const R = require('ramda');

const { isNil, isEmpty, compose, replace, has, pipe, reverse, trim } = R;

const composeAsync = async (...promiseFns) => {
    if (isNil(promiseFns) || isEmpty(promiseFns)) {
        throw new Error('compose requires at least one argument');
    }

    return reverse(promiseFns).reduce(async (previousPromise, nextPromise) => previousPromise.then(res => nextPromise(res)), Promise.resolve())

}

export const functions = { trim, isNil, isEmpty, compose, replace, pipe, has, reverse, composeAsync }
