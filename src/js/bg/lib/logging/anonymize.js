const PIPELINE = [
    (str) => str.replace(/sip:\+?\d+/g, 'sip:SIP_USER_ID'),
    (str) => str.replace(/"caller_id" = (.+?);/g, '<CALLER_ID>'),
    (str) => str.replace(/To:(.+?)>/g, 'To: <SIP_ANONYMIZED>'),
    (str) => str.replace(/From:(.+?)>/g, 'From: <SIP_ANONYMIZED>'),
    (str) => str.replace(/Contact:(.+?)>/g, 'Contact: <SIP_ANONYMIZED>'),
    (str) => str.replace(/username=\"(.+?)\"/g, 'Digest username="<SIP_USERNAME>"'),
    (str) => str.replace(/nonce=\"(.+?)\"/g, 'nonce="<NONCE>"'),
    (str) => str.replace(/username=(.+?)&/g, 'username=<USERNAME>'),
    (str) => str.replace(/session ['"][^'"]+['"]/g, 'session "<SESSION>"'),
    (str) => str.replace(/contactName: "[^"]+"/g, 'contactName: "<CONTACT>"'),
    (str) => str.replace(/authorizationUser: .+/g, 'authorizationUser: "<SIP_USER_ID>"'),
]


/**
 * Anonymize a string. Removes all Personally Identifiable Information (PII)
 * from the string.
 *
 * This code is very specifically aimed at the `RemoteLogger`. If log messages
 * are added or changed the `PIPELINE` above needs to be verified again.
 *
 * @param {String} str - String to anonymize
 * @returns {String} - Anonymized string.
 */
function anonymize(str) {
    // Run str through the pipeline.
    return PIPELINE.reduce((acc, fn) => fn(acc), str)
}


module.exports = {
    anonymize,
}
