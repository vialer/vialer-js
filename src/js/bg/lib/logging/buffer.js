const idb = require('idb')

// Store messages in the local buffer for this many milliseconds.
const WINDOW = 60 * 60 * 1000; // one hour in ms.

// Store at maximum this many messages.
const MAX_MESSAGES = 10000

const STORE_NAME = 'LocalLogBuffer'

/**
 * Stores a sliding window of log messages while remote logging is disabled,
 * or when the LogEntries API is not responding (not yet implemented).
 *
 * At any point in time will store at most `MAX_MESSAGES*2` records.
 * Record older than `WINDOW` are deleted.
 */
class LocalLogBuffer {
    constructor(app) {
        this.dbPromise = idb.open('logs', 1, upgradeDB => {
            upgradeDB
                .createObjectStore(STORE_NAME, {
                    autoIncrement: true,
                })
                .createIndex('timestamp', 'timestamp', {unique: false});
        })
    }

    /**
     * Begin a new transaction.
     * @returns {Object} - idb transaction.
     */
    async _beginTransaction() {
        const db = await this.dbPromise
        return db.transaction(STORE_NAME, 'readwrite')
    }

    /**
     * Count the number of log messages in the buffer.
     * @returns {Number} - Number of log messages.
     */
    async count() {
        const tx = await this._beginTransaction()
        const store = tx.objectStore(STORE_NAME)
        return await store.count()
    }

    /**
     * Append a list of messages to the buffer.
     * @param {Array} messages - List of messages.
     */
    async append(messages) {
        const tx = await this._beginTransaction()
        const store = tx.objectStore(STORE_NAME)
        for (let msg of messages) {
            store.put(msg)
        }
        await tx.complete
        await this.purge()
    }

    /**
     * Remove messages from the buffer that are older than `WINDOW` milliseconds
     * and keep the total number of messages in the buffer at or below
     * `MAX_MESSAGES`.
     */
    async purge() {
        const tx = await this._beginTransaction()
        const store = tx.objectStore(STORE_NAME)
        let count = await store.count()

        store.index('timestamp').iterateCursor(cursor => {
            if (!cursor) return
            const age = new Date() - new Date(cursor.value.timestamp)
            if (count > MAX_MESSAGES || age > WINDOW) {
                cursor.delete()
                cursor.continue()
            }
        })

        await tx.complete
    }

    /**
     * Take out at most `count` messages.
     * Oldest messages are taken first.
     * @param {Number} count - Maximum amount of messages to take out.
     * @returns {Array} - Messages.
     */
    async take(count) {
        if (count <= 0) {
            return []
        }

        const tx = await this._beginTransaction()
        const timestampIndex = tx.objectStore(STORE_NAME).index('timestamp')

        let messages = []
        timestampIndex.iterateCursor(cursor => {
            if (!cursor) return
            messages.push(cursor.value)
            cursor.delete()
            if (messages.length < count) {
                cursor.continue()
            }
        })

        await tx.complete
        return messages
    }
}


module.exports = LocalLogBuffer
