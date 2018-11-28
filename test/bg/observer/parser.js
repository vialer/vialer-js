/* eslint-disable sort-keys */
const test = require('tape')
const { JSDOM } = require('jsdom')
const window = new JSDOM().window

global.document = window.document
const parsers = require('../../../src/js/observer/parsers')


test('[bg] test parsing NL numbers', (t) => {
    function parse(str) {
        const parser = parsers.find(([locale, _]) => locale === 'NL')[1]()
        return parser.parse(str)
    }

    function match(str, expected, msg) {
        const name = msg || `'${str}'`
        t.deepEqual(parse(str), expected, `${name} matches`)
    }

    function noMatch(str, msg) {
        const name = msg || `'${str}'`
        t.deepEqual(parse(str), [], `${name} does not match`)
    }

    noMatch('US 20130007225 A1', 'US Patent number')
    noMatch('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:.-_', 'Random chars')
    noMatch('153fa67.0501234567.551b673@posting.google.com', 'Generated google address')
    noMatch('news:eff59def.0501234567.49a23acf@posting.google.com', 'Google news address')

    match('tel.0501234567.', [ { start: 4, end: 14, number: '0501234567' } ])
    match('tl.0501234567.', [ { start: 3, end: 13, number: '0501234567' } ])
    match('t.0501234567.', [ { start: 2, end: 12, number: '0501234567' } ])
    match('t: 0501234567.', [ { start: 3, end: 13, number: '0501234567' } ])
    noMatch('F. 0501234567')

    noMatch('F +31(0)88-1234567')
    match('T +31(0)88-1234567', [ { start: 2, end: 18, number: '+31881234567' } ])
    noMatch('Fax.&nbsp;+31(0)88-1234567')
    match('(+31)88-1234567', [ { start: 1, end: 15, number: '+31881234567' } ])

    match('<span>T:</span> +31 (0)88 123 45 67', [ { start: 16, end: 35, number: '+31881234567' } ])
    noMatch('F:+31 (0)88 123 45 67')

    match('0621222324 (test)', [ { start: 0, end: 11, number: '0621222324' } ])
    match('+31 651 88 22 88', [ { start: 0, end: 16, number: '+31651882288' } ])
    match('ABC, +31 50 123 45 67', [ { start: 5, end: 21, number: '+31501234567' } ])
    match('ABC,+31 50 123 45 67', [ { start: 4, end: 20, number: '+31501234567' } ])
    match('T;+31 50 123 45 67', [ { start: 2, end: 18, number: '+31501234567' } ])
    noMatch('F;+31 10 123 00 45')
    match('T &nbsp;+31 10 123 00 55', [ { start: 8, end: 24, number: '+31101230055' } ])
    noMatch('F &nbsp;+31 10 123 00 55')
    match('TEL. &nbsp;+31 10 123 00 55', [ { start: 11, end: 27, number: '+31101230055' } ])
    noMatch('Fax. &nbsp;+31 10 123 00 55')
    noMatch('F +31 10 123 00 55')
    noMatch('F: +31 10 123 00 55')
    noMatch('F. +31 10 123 00 55')
    noMatch('Fax. +31 10 123 00 55')
    noMatch('Fax: +31 10 123 00 55')
    noMatch('Fax.+31 10 123 00 55')
    match('T +31 10 123 00 50', [ { start: 2, end: 18, number: '+31101230050' } ])
    noMatch('F +31 10 123 00 50')
    noMatch('IBAN: NL13 RABO 01234 5678 29')
    match('+31 (0)50 - 123 08 75', [ { start: 0, end: 21, number: '+31501230875' } ])
    match('. 0501&nbsp;123456', [ { start: 2, end: 18, number: '0501123456' } ])
    match('06-12345678', [ { start: 0, end: 11, number: '0612345678' } ])
    match('06-12345678 -', [ { start: 0, end: 12, number: '0612345678' } ])

    match(
        `<p>
        Tel&nbsp; 0501-123456<br />
        T 0501-123457<br />
        Fax 0501-123458<br />
        Fax 0501-123459<br />
        </p>`,
        [
            { start: 22, end: 33, number: '0501123456' },
            { start: 50, end: 61, number: '0501123457' },
        ],
        'Two phonenumbers and ignore two faxnumbers')

    match(
        `<td style="width: 200px">Pietje Puk<br />
        De Brandstraat 123<br />
        1234 AB&nbsp; Plaats<br />
        &nbsp;<br />
        Tel&nbsp; 0501-123457<br />
        Fax 0501-123459<br />
        Email <a href="mailto:info@void.nl">info@void.nl</a>
        <br />
        &nbsp;&nbsp;<br />
        &nbsp;<br />
        <br />
        <br />
        <strong>Openingstijden</strong>
        </td>`,
        [ { start: 149, end: 160, number: '0501123457' } ],
        'Contact details in a TD')

    match('050 1234 121', [ { start: 0, end: 12, number: '0501234121' } ])
    match('+31111123412', [ { start: 0, end: 12, number: '+31111123412' } ])
    match('Telefoonnummer +31111700505 wijzigen', [ { start: 15, end: 28, number: '+31111700505' } ])
    match('08001000', [ { start: 0, end: 8, number: '08001000' } ])
    match('<a href="tel:+31611111111"> +31611111111 </a>', [
        { start: 13, end: 25, number: '+31611111111' },
        { start: 28, end: 41, number: '+31611111111' },
    ])

    noMatch('https://www.facebook.com/events/1231231231231233/?notif_t=plan_user_invited')
    match('T +31 10 307 00 50', [ { start: 2, end: 18, number: '+31103070050' } ])

    match('+31(0)611111111', [ { start: 0, end: 15, number: '+31611111111' } ])
    match('T: 0504443331.', [ { start: 3, end: 13, number: '0504443331' } ])
    match('t:0504443331.', [ { start: 2, end: 12, number: '0504443331' } ])

    noMatch('4e196aa4-0141-4601-8138-7aa33db0f577', 'Celery task hash')
    noMatch('14:00:01.000000000 +1100')
    noMatch('5397063213641', 'EAN')
    noMatch('1ZW000166868930335', 'trace number')
    noMatch('N300A IP/42.072.00.000.000', 'Phone\'s user agent')

    match('+31 123 12 12 00', [ { start: 0, end: 16, number: '+31123121200' } ])
    match('+31&nbsp;(0) 612300012', [ { start: 0, end: 22, number: '+31612300012' } ])
    match('050 - 123&nbsp;4123', [ { start: 0, end: 19, number: '0501234123' } ])
    match('050 - 123 4123', [ { start: 0, end: 14, number: '0501234123' } ])
    match('<strong>T</strong>&nbsp;050 -&nbsp;123 4123', [ { start: 24, end: 43, number: '0501234123' } ])
    match('050 - 123 4123', [ { start: 0, end: 14, number: '0501234123' } ])

    match('T. +31 (0) 12 345 6789', [ { start: 3, end: 22, number: '+31123456789' } ])

    t.end()
})

test.onFinish(() => process.exit(0))
