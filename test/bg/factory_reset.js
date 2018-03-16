var test = require('tape')
require('../../src/js/vendor')


test('factory resetting with invalid schema', function(t) {
    t.plan(2)

    const app = require('../../src/js/bg')({name: 'bg'})
    // There is no schema in the database on a fresh start.
    t.equal(app.store.get('schema'), null, 'no schema on startup')

    app.on('factory-defaults', () => {
        // The schema is set after a factory reset.
        t.equal(app.store.get('schema'), app.store.schema, 'schema set after factory reset')
    })
})
