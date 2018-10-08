/* eslint-disable */

// Do not match numbers which are probably part of an IBAN.
// Source: http://www.betaalvereniging.nl/europees-betalen/sepa-documentatie/bic-afleiden-uit-iban/
// codes origin:
const BICCODES = [
    'ABNA', 'FTSB', 'AEGO', 'ANAA', 'ANDL', 'ARBN', 'ARSN', 'ARTE',
    'ASNB', 'ASRB', 'ATBA', 'BBRU', 'BCDM', 'BCIT', 'BICK', 'BKCH',
    'BKMG', 'BLGW', 'BMEU', 'BNGH', 'BNPA', 'BOFA', 'BOFS', 'BOTK',
    'CHAS', 'CITC', 'CITI', 'COBA', 'DEUT', 'DHBN', 'DLBK', 'DNIB',
    'FBHL', 'FLOR', 'FRBK', 'FRGH', 'FVLB', 'GILL', 'HAND', 'HHBA',
    'HSBC', 'ICBK', 'INGB', 'INSI', 'ISBK', 'KABA', 'KASA', 'KNAB',
    'KOEX', 'KRED', 'LOCY', 'LOYD', 'LPLN', 'MHCB', 'NNBA', 'NWAB',
    'OVBN', 'RABO', 'RBOS', 'RBRB', 'SNSB', 'SOGE', 'STAL', 'TEBU',
    'TRIO', 'UBSW', 'UGBI', 'VOWA', 'ZWLB',
]


/**
 * Scan data for phone numbers matching the dutch format
 * and return the node in the DOM.
 */
module.exports = function() {
    let matches
    let input
    let buffer
    let result
    let result_raw
    let pos = 0
    let peekpos = 0
    let start = -1

    let whitespace = '[\\xA0\\x20\\t]'
    let nbsp = '(?:&nbsp;)'
    let nextline = '[\\r\\n\\f]'

    // functions which process `buffer`
    let actions = {
        ignore: function() {
            buffer = ''
            return false
        },
        keep: function(kept) {
            if (start == -1) {
                // Starting anew
                result_raw = ''

                let posInFront = pos - (1 + kept.length)
                let charsInFront = input.substring(posInFront, (posInFront + 1))
                if (!charsInFront.trim().length) {
                    // Extend charsInFront if it's just a space.
                    posInFront -= 1
                    charsInFront = input.substring(posInFront, (pos - 2)) + charsInFront
                }

                // Shift behindpos if &nbsp; is adjacent.
                if (charsInFront.trim() == ';' && input.substring((posInFront - 5), (posInFront + 1)) == '&nbsp;') {
                    posInFront -= 6
                    charsInFront = input[posInFront] || ''

                    if (!charsInFront.trim().length) {
                        // extend charsInFront if it's just a space
                        posInFront -= 1
                        charsInFront = input.substring(posInFront, (posInFront + 1)) + charsInFront
                    }
                }

                // Perform a few checks to see if we're starting mid-string
                // or if we're "isolated".
                let ignore = false

                // test if we're starting mid-string and allow some cases
                if (charsInFront.length && !(new RegExp(whitespace + '|' + nextline + '|[(,\'"]|[^\\d+]').test(charsInFront))) {
                    if (charsInFront.slice(-1) == ';') {
                        // allow `;` as long there is not an isolated `f` or `fax` in front of it
                        if (
                            input.substring((posInFront - 2), (posInFront + 1)).toLowerCase().trim() == 'f;' ||
                            input.substring((posInFront - 4), (posInFront + 1)).toLowerCase().trim() == 'fax;'
                        ) {
                            ignore = true
                        }
                    } else if (charsInFront.slice(-1) == '.') {
                        // allow `.` as long there is not an isolated `f` or `fax` in front of it
                        if (input.substring((posInFront - 2), (posInFront + 1)).toLowerCase().trim() == 'f.' ||
                                input.substring((posInFront - 4), (posInFront + 1)).toLowerCase().trim() == 'fax.') {
                            ignore = true
                        } else if (new RegExp('\\d+').test(input.substring((posInFront - 2), posInFront))) {
                            ignore = true
                        }
                    } else if(charsInFront.slice(-1) == ':') {
                        // Allow `:` as long there is not an isolated `f` or `fax` in front of it.
                        if(input.substring((posInFront - 2), (posInFront + 1)).toLowerCase().trim() == 'f:' ||
                                input.substring((posInFront - 4), (posInFront + 1)).toLowerCase().trim() == 'fax:') {
                            ignore = true
                        }
                    } else {
                        if(input.substring((posInFront - 1), (posInFront + 1)).trim().toLowerCase() == 'f' ||
                                input.substring((posInFront - 3), (posInFront + 1)).trim().toLowerCase() == 'fax') {
                            ignore = true
                        } else if (new RegExp('\\d+').test(charsInFront)) {
                            ignore = true
                        }
                    }
                } else {
                    if (kept == '0') {
                        // Prevent matching START on the `0` in `F. +31(0) xxx`.
                        if (input.substring((posInFront - 1), (posInFront + 1)).slice(-1) == '(' &&
                                input.substring((posInFront + 2), (posInFront + 4)).slice(0, 1) == ')') {
                            ignore = true
                        } else if(charsInFront.trim().length) {
                            if (input.substring((posInFront + 1), (posInFront + 2)) != ' ' && input.substring((posInFront + 1), (posInFront + 7)) != '&nbsp;') {
                                if (new RegExp('[a-zA-Z]').test(input.substring(posInFront, (posInFront + 2)))) {
                                    ignore = true
                                }
                            }
                        }
                    }
                }

                if(!ignore) {
                    charsInFront = charsInFront.trim()

                    // Test if we're starting mid-sentence and ignore in some cases
                    // has some significant similarities with the code above, but slightly different!!
                    if (charsInFront.length && !(new RegExp(whitespace + '|' + nextline + '|[(,\'"]').test(charsInFront))) {
                        if (charsInFront.slice(-1) == ';') {
                            // Allow `;` as long there is not an isolated `f` or `fax` in front of it.
                            if (
                                input.substring((posInFront - 2), (posInFront + 1)).toLowerCase().trim() == 'f;' ||
                                input.substring((posInFront - 4), (posInFront + 1)).toLowerCase().trim() == 'fax;'
                            ) {
                                ignore = true
                            }
                        } else if (charsInFront.slice(-1) == '.') {
                            // allow `.` as long there is not an isolated `f` or `fax` in front of it
                            if (
                                input.substring((posInFront - 2), (posInFront + 1)).toLowerCase().trim() == 'f.' ||
                                input.substring((posInFront - 4), (posInFront + 1)).toLowerCase().trim() == 'fax.'
                            ) {
                                ignore = true
                            } else if (new RegExp('\\d+').test(input.substring((posInFront - 2), (posInFront)))) {
                                ignore = true
                            }
                        } else if(charsInFront.slice(-1) == ':') {
                            // allow `:` as long there is not an isolated `f` or `fax` in front of it
                            if (
                                input.substring((posInFront - 2), (posInFront + 1)).toLowerCase().trim() == 'f:' ||
                                input.substring((posInFront - 4), (posInFront + 1)).toLowerCase().trim() == 'fax:'
                            ) {
                                ignore = true
                            }
                        } else {
                            if (
                                input.substring((posInFront - 1), (posInFront + 1)).trim().toLowerCase() == 'f' ||
                                input.substring((posInFront - 3), (posInFront + 1)).trim().toLowerCase() == 'fax'
                            ) {
                                ignore = true
                            } else {
                                if (BICCODES.includes(input.substring((posInFront - 3), (posInFront + 1)).toUpperCase())) {
                                    ignore = true
                                }
                            }
                        }
                    } else {
                        if (kept == '0') {
                            // prevent matching START on the 0 in `F. &nbsp;+31(0) xxx`
                            if (input.substring((posInFront - 1), (posInFront + 1)).slice(-1) == '(' &&
                                    input.substring((posInFront + 2), (posInFront + 4)).slice(0, 1) == ')') {
                                ignore = true
                            }
                        }
                    }
                }

                if (ignore) return actions.ignore()
                start = (pos - 1)
            }

            // not all dashes look the same
            if (new RegExp(rules[12].pattern).test(kept)) {
                // do `actions.end()` when encountering a second `-`
                if (result.search(rules[12].pattern) !== -1) {
                    return actions.end(buffer)
                }

                kept = '-'
            }

            result += kept
            buffer = ''

            return true
        },
        end: function(kept) {
            if(kept) {
                // discard whatever it is triggered the end
                pos -= kept.length
                buffer = buffer.slice(-kept.length)
            }

            let valid = false

            // only bother validating when a start position is marked
            if(start > -1) {
                valid = validate(result)
                if(valid) {
                    matches.push({
                        start: start,
                        end: pos,
                        number: result.replace(new RegExp('[^\\d+]', 'g'), ''),
                    })
                    actions.reset()
                } else {
                    actions.reset()
                }
            }

            start = -1
        },
        end_or_ignore: function(kept) {
            // discard whatever it is triggered the end
            pos -= kept.length
            buffer = buffer.slice(-kept.length)
            let startbuffer = buffer
            // See if result so far is valid.
            let valid = validate(result)

            // at this point, look if a new match could be found up ahead
            let startRules = rulesMap['START']
            let ruleMatched = false

            for (let i = 0; i < startRules.length; i++) {
                let rule = rules[startRules[i]]

                // Add to buffer.
                peekpos = pos
                buffer = peek(1)

                // test buffer until
                // - pattern matches, or
                // - buffer length exceeds rule length
                for(let j = 0 ; j < rule.length && (buffer.length == (j+1)); j++) {
                    if (new RegExp(rule.pattern).test(buffer)) {
                        ruleMatched = true
                        break
                    } else {
                        // Increase buffer.
                        buffer += peek(1)
                    }
                }

                if (ruleMatched) {
                    // A new match can be found ahead, end here.
                    // Do no pass `kept` to prevent repeating discarding it.
                    if (valid) actions.end()
                    else actions.reset()
                    break
                }
            }

            // undo changes we made
            pos += kept.length
            peekpos = pos
            buffer = startbuffer
        },
        reset: function(kept) {
            // Re-evaluate from the same position with initial state.
            peekpos = pos
            // Clear whatever.
            state.reset()
            buffer = ''
            result = ''
            result_raw = ''
            start = -1
        },
    }

    let state = function() {
        // states used are:
        // - START
        // - INTERNATIONAL
        // - AREA
        // - LINE
        let states = []

        let set = function(state) {
            if (current() != state) {
                states.push(state)
            }
        }

        let replace = function(state) {
            if (replace === true) states.pop()
            set(state)
        }

        let reset = function() {
            while (states.length > 1) {
                states.pop()
            }
        }

        let current = function() {
            return states[states.length - 1]
        }

        return {
            set: set,
            replace: replace,
            reset: reset,
            current: current,

            print: function() {
                console.log(states)
            },
        }
    }()

    let rules = []
    rules[0] = {
        pattern: '[^\\d]', action: actions.reset, length: 1,
    }
    rules[1] = {
        pattern: nextline, action: actions.end, length: 1,
    }
    rules[13] = {
        pattern: '^\\b|' + whitespace + nextline + '|' + nbsp + '|$', action: actions.end, length: 6,
    }

    //////////////////////
    // starting characters
    //////////////////////

    // international notation
    rules[2] = {
        pattern: '(^|\\b[\\p{P}|' + whitespace + '|' + nextline + '])\\+',
        filter: '[^\\+]',
        action: actions.keep, length: 3,
        state: 'INTERNATIONAL',
    }
    rules[3] = {
        pattern: '(^|\\b[\\p{P}|' + whitespace + '|' + nextline + '])00',
        action: actions.keep, length: 2,
        state: 'INTERNATIONAL',
    }
    rules[4] = {
        pattern: '^31',
        action: actions.keep, length: 2,
        state: 'AREA',
    }

    // Optional `(0)` behind international notation.
    rules[5] = {
        pattern: '^(\\((' + whitespace + '|' + nbsp + ')?0(' + whitespace + '|' + nbsp + ')?\\))',
        action: actions.ignore, length: 15,
        state: 'AREA',
    }

    // national notation
    rules[6] = {
        pattern: '(^|\\b[\\p{P}|' + whitespace + '|' + nextline + '])0',
        action: actions.keep, length: 1,
        state: 'AREA',
    }

    // ordinary line number digits
    rules[7] = {
        pattern: '^[\\d]',
        action: actions.keep, length: 1,
        state: 'LINE',
    }

    /////////////////////
    // garbage characters
    /////////////////////

    // whitespace: error out on two next to each other
    rules[8] = {
        pattern: '^((' + whitespace + '|' + nbsp + ')){2}',
        action: actions.end, length: 7,
    }
    // whitespace: allow just one
    rules[9] = {
        pattern: '^((' + whitespace + '|' + nbsp + ')){1}',
        action: actions.end_or_ignore, length: 6,
    }
    // parenthesis: have at least 1 digit between them
    rules[10] = {
        pattern: '^(\\((' + whitespace + '|' + nbsp + ')?\\d{1,})',
        filter: '\\s',
        action: actions.keep, length: 8,
    }
    rules[11] = {
        pattern: '^((' + whitespace + '|' + nbsp + ')?\\d{1,}\\)',
        filter: '\\s',
        action: actions.keep, length: 8,
    }
    // hyphen
    rules[12] = {
        pattern: '[-\u2012-\u2015]',
        action: actions.keep, length: 1,
    }

    let rulesMap = {
        'START': [2, 3, 6],
        'INTERNATIONAL': [4],
        'AREA': [7, 12, 5],
        'LINE': [7, 1, 8, 9, 10, 12, 5, 13, 0],
    }

    /**
     * Lookahead using a separate pos-variable.
     */
    let peek = function(size) {
        peekpos += size
        return input.substring(peekpos - size, peekpos)
    }

    /**
     * Find phone number matches in `text`.
     */
    let parse = function(text) {
        matches = []
        // Very crude, but fast, early fails:

        // 1) we need at least 8 digits
        let digits = text.match(/\d/g)
        if (digits === null || digits.length < 8) {
            return matches
        }

        // 2) if it looks like a decimal, ignore it
        if (new RegExp(/\d+[\.,]\d+/g).test(text)) {
            return matches
        }

        // 3) we need at least two consecutive digits!
        if (!new RegExp(/\d{2,}/g).test(text)) {
            return matches
        }

        // 4) we need at least 7 digits behind a '0'
        // OR
        // 5) we need at least 7 digits behind a '31'
        if (digits) {
            let num_behind_0 = -1
            for (let i = 0; i < digits.length && num_behind_0 < 8; i++) {
                if (digits[i] === '0' && num_behind_0 === -1) {
                    num_behind_0++
                }
                if (num_behind_0 !== -1) {
                    num_behind_0++
                }
            }
            let num_behind_31 = -1
            for (let j = 0; j < digits.length - 1 && num_behind_31 < 8; j++) {
                if (digits[j] === '3' && digits[j + 1] === '1' && num_behind_31 === -1) {
                    num_behind_31++
                }
                if (num_behind_31 !== -1) {
                    num_behind_31++
                }
            }
            if (num_behind_0 < 8 && num_behind_31 < 8) {
                return matches
            }
        }

        input = text
        result = result_raw = buffer = ''
        state.set('START')

        for (; pos < input.length;) {
            let startpos = pos
            // Test rules applicable for current state.
            let stateRules = rulesMap[state.current()]
            let ruleMatched = false

            for (let i = 0; i < stateRules.length; i++) {
                let rule = rules[stateRules[i]]
                // Add to buffer.
                peekpos = pos
                buffer = peek(1)

                // test buffer until
                // - pattern matches, or
                // - buffer length exceeds rule length
                for (let j = 0; j < rule.length && (buffer.length == (j+1)); j++) {
                    if (new RegExp(rule.pattern).test(buffer)) {
                        pos = peekpos
                        ruleMatched = true
                        break
                    } else {
                        // Increase buffer.
                        buffer += peek(1)
                    }
                }

                if (ruleMatched) {
                    // Shift pos.
                    pos = peekpos

                    // Take action for buffer.
                    let kept = buffer
                    if (rule.filter !== undefined) {
                        kept = kept.replace(new RegExp(rule.filter, 'g'), '')
                    }
                    let switchState = rule.action(kept)
                    // Clear buffer.
                    buffer = ''

                    // change state if the rule has a new rule
                    if (rule.state !== undefined) {
                        if (switchState) state.set(rule.state)
                    }

                    // break to start over testing every rule in order
                    break
                }
            }

            // Make sure to keep progressing if possible
            if (pos == startpos) {
                pos++
            }
            // Because a skip can happen, keep track of everything for
            // proper validation later on
            result_raw += input.substring(startpos, pos)
        }

        // Validate whatever is in the buffer after finished looping.
        pos = peekpos
        actions.end(buffer)
        return matches
    }

    // Validate result. Result is guaranteed to have no whitespace, which makes life easy.
    let validate = function() {
        let matches = new RegExp('^(?:(?:(?:\\+|00)31)|0)(.*)').exec(result)
        if (!matches) {
            // The number...
            // - doesn't start with `((+|00)31|0)`, or
            // - has no trailing characters, or
            // - has no trailing digits
            return false
        }

        // Sanity check: are there any unwanted characters we kept because of skipping ?
        const tag = document.createElement('span')
        tag.innerHTML = result_raw
        // Try innerText (https://html.spec.whatwg.org/multipage/dom.html#the-innertext-idl-attribute)
        // fallback to textContent (jsdom has no innerText support).
        let justText = tag.innerText || tag.textContent

        // Find first digit
        let pos_digit = justText.search(/\d/g)
        if (pos_digit != -1) {
            // Validate justText from pos_digit because prefixes
            // are already validated.
            justText = justText.substring(pos_digit)
        }
        if (new RegExp('[^\\+\\d\\(\\)\\-(\\xA0\\x20\\t)]').test(justText)) {
            return false
        }

        // Everything behind `((+|00)31|0)`
        let line_number = matches[1]
        // Just the digits behind `((+|00)31|0)`.
        let just_digits = line_number.replace(new RegExp('[^\\d]', 'g'), '')

        // Numbers with `097` are not callable numbers, but used for machine-to-machine.
        if (new RegExp('^97').test(just_digits.substring(0, 3))) {
            return false
        }

        // There shouldn't be a `00` in the area code: `+31005xxxxxx` or `+31500xxxxxx`
        // but allow `0800`, `0900`
        if (new RegExp('^00|[^89]00').test(just_digits.substring(0, 3))) {
            return false
        }

        // Check for characters other than `(`, `)`, `-`
        if(new RegExp('[^\\d\\-\\(\\)]').test(line_number)) {
            return false
        }

        // A single hyphen is only allowed on a few positions
        let hyphens = []
        for (let i = 0; i < line_number.length && hyphens.length < 2; i++) {
            if (line_number[i] == '-') {
                hyphens.push(i)
            }
        }
        if (hyphens.length == 1) {
            if (hyphens[0] < 1 || hyphens[0] > 3) {
                return false
            }
        } else if(hyphens.length == 2) {
            return false
        }

        // Check for bad parentheses.
        let nesting = 0
        for (let j = 0; j < result.length; j++) {
            let c = result.charAt(j)
            if (c == '(') {
                nesting++
            } else if (c == ')') {
                nesting--
            }
        }
        if (nesting !== 0) return false

        // More than one length can be valid if result is a service number.
        if (just_digits.substring(0, 1) == '8') {
            if (just_digits.substring(0, 3) == '800') {
                return just_digits.length == 7 || just_digits.length == 10
            } else if (!new RegExp('^8([24578]|00)').test(just_digits)) {
                // 08x service number must be `08([24578]|00)`
                return false
            }
        } else if (just_digits.substring(0, 1) == '9') {
            if (new RegExp('^9(00|06|09)').test(just_digits)) {
                return just_digits.length == 7 || just_digits.length == 10
            } else if (!new RegExp('^91').test(just_digits)) {
                // 09x service number must be `09(1|00|06|09)`
                return false
            }
        }

        return just_digits.length == 9
    }

    let isBlockingNode = function(node) {
        let blocking = false
        if (node) {
            let text = node.textContent.trim().toLowerCase()
            if (text == 'fax' || text == 'fax.' || text == 'fax:' ||  text == 'f' || text == 'f.' || text == 'f:') {
                blocking = true
            }
        }

        return blocking
    }

    // exposed functions
    return {
        parse: parse,
        isBlockingNode: isBlockingNode,
    }
}
