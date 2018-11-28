/* eslint-disable max-len */
const test = require('tape')
const { anonymize } = require('../../src/js/bg/lib/logging/anonymize')


/**
 * Test that anonymizing `str` filters out all
 * Personally Identifiable Information (PII).
 * @param {Test} t - Tape's test object.
 * @param {String} str - String to anonymize.
 * @param {Array} pii - List of PII's.
 */
function testAnon(t, str, pii) {
    const anon = anonymize(str)
    for (let p of pii) {
        t.ok(anon.indexOf(p) === -1, `Does not contain PII ${p}`)
    }
}


test('[bg] test anonymizing SIP REGISTER message', (t) => {
    testAnon(
        t,
        `
        REGISTER sip:voipgrid.nl SIP/2.0
        Via: SIP/2.0/WSS cd2m0b1i5873.invalid;branch=z9hG4bK2224159
        Max-Forwards: 70
        To: <sip:160012345@voipgrid.nl>
        From: <sip:1600012345@voipgrid.nl>;tag=dah98n7tpv
        Call-ID: hrsg4clmp031o5gb65beal
        CSeq: 901 REGISTER
        Contact: <sip:1c1ead12@cd2m0b1i5873.invalid;transport=ws>;reg-id=1;+sip.instance="<urn:uuid:9e926767-a556-4cc5-870d-791c39d5b49d>";expires=600
        Allow: ACK,CANCEL,INVITE,MESSAGE,BYE,OPTIONS,INFO,NOTIFY,REFER
        Supported: path, gruu, outbound
        User-Agent: Vialer-js/4.5.2 (Linux/Chrome) Vialer
        Content-Length: 0
        `,
        [
            '160012345',
            '1c1ead12',
        ]
    )
    t.end()
})


test('[bg] test anonymizing SIP SUBSCRIBE message', (t) => {
    testAnon(
        t,
        `
        SUBSCRIBE sip:161231000@voipgrid.nl SIP/2.0
        Via: SIP/2.0/WSS b2tjnn7mmeer.invalid;branch=z9hG4bK8277666
        Max-Forwards: 70
        To: <sip:161231000@voipgrid.nl>
        From: <sip:160012345@voipgrid.nl>;tag=55c4nlek06
        Call-ID: lo1k9tk3atmac2pi2a54
        CSeq: 2605 SUBSCRIBE
        Event: dialog
        Expires: 3600
        Contact: <sip:1230azy1@b2tjnn7mmeer.invalid;transport=ws>
        Allow: ACK,CANCEL,INVITE,MESSAGE,BYE,OPTIONS,INFO,NOTIFY,REFER
        Supported: outbound
        User-Agent: Vialer-js/4.5.2 (Linux/Chrome) Vialer
        Content-Length: 0
        `,
        [
            '161231000',
            '160012345',
            '1230azy1',
        ]
    )
    t.end()
})


test('[bg] test anonymizing SIP REGISTER with authentication message', (t) => {
    testAnon(
        t,
        `
        SUBSCRIBE sip:161231000@voipgrid.nl SIP/2.0
        Via: SIP/2.0/WSS b2tjnn7mmeer.invalid;branch=z9hG4bK3135619
        Max-Forwards: 70
        To: <sip:161231000@voipgrid.nl>
        From: <sip:160012345@voipgrid.nl>;tag=55c4nlek06
        Call-ID: lo1k9tk3atmac2pi2a54
        CSeq: 2606 SUBSCRIBE
        Proxy-Authorization: Digest algorithm=MD5, username="160012345", realm="voipgrid.nl", nonce="f572d396fae9206628714fb2ce00f72e94f2258f", uri="sip:161231000@voipgrid.nl", response="c11866bc9a2d2bce9c340e2cba30a869"
        Event: dialog
        Expires: 3600
        Contact: <sip:1230azy1@b2tjnn7mmeer.invalid;transport=ws>
        Allow: ACK,CANCEL,INVITE,MESSAGE,BYE,OPTIONS,INFO,NOTIFY,REFER
        Supported: outbound
        User-Agent: Vialer-js/4.5.2 (Linux/Chrome) Vialer
        Content-Length: 0
        `,
        [
            '160012345',
            '161231000',
            '1230azy1',
            'f572d396fae9206628714fb2ce00f72e94f2258f',
        ]
    )
    t.end()
})


test('[bg] test anonymizing email addresses in log messages', (t) => {
    testAnon(
        t,
        '[bg] continuing existing session \'user+test@random\'...',
        [
            'user+test',
            'user+test@random',
        ]
    )

    testAnon(
        t,
        '[bg] continuing existing session "user+test@random"...',
        [
            'user+test',
            'user+test@random',
        ]
    )

    testAnon(
        t,
        '[bg] switch to session "user+test@random.com"',
        [
            'user+test',
            'user+test@random.com',
        ]
    )


    t.end()
})


test('[bg] test anonymizing contactName in sip log messages', (t) => {
    testAnon(
        t,
        '[sip.ua] · contactName: "zs12309ds"',
        [
            'zs12309ds',
        ]
    )
    t.end()
})


test('[bg] test anonymizing authorizationUser in sip log messages', (t) => {
    testAnon(
        t,
        '[sip.ua] · authorizationUser: 160012345',
        [
            '160012345',
        ]
    )
    t.end()
})


test.onFinish(() => process.exit(0))
