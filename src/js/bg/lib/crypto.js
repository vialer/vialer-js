/**
* Symmetric and assymetric WebCrypto helper class.
* Source: https://github.com/garage11/lib11/
*/
class Crypto {
    /**
    * Setup some crypto algorithm parameters.
    * @param {AppBackground} app - The background application.
    */
    constructor(app) {
        this.app = app

        this.__cryptoParams = {
            aes: {
                params: {
                    length: 256,
                    name: 'AES-GCM',
                },
            },
            ecdh: {
                params: {
                    name: 'ECDH',
                    namedCurve: 'P-256',
                },
                uses: ['deriveKey', 'deriveBits'],
            },
            rsa: {
                params: {
                    hash: {name: 'SHA-256'},
                    modulusLength: 2048,
                    name: 'RSA-PSS',
                    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                },
                uses: ['sign', 'verify'],
            },
        }
    }


    /**
    * Convert a base-64 encoded string to a DataArray.
    * @param {String} data - The base-64 formatted string.
    * @returns {ArrayBuffer} - A Buffer(Node) or Uint8Array(Browser).
    */
    __base64ToDataArray(data) {
        if (this.app.env.isBrowser) {
            let binaryString = atob(data)
            let len = binaryString.length
            let bytes = new Uint8Array(len)
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i)
            }
            return bytes.buffer
        }
        return new Buffer(data, 'base64')
    }


    /**
    * Get a binary datatype with a set size, based on the environment.
    * @param {Number} size - The size of the DataArray.
    * @returns {Uint8Array|Buffer} - A Uint8Array in the browser; a Buffer in Node.js.
    */
    __dataArray(size) {
        if (this.app.env.isBrowser) {
            return new Uint8Array(size)
        } else {
            return new Buffer(size)
        }
    }


    /**
    * Convert an ArrayBuffer to a base-64 encoded string.
    * @param {ArrayBuffer} data - The DataArray to convert.
    * @returns {String} - The base-64 encoded string of the DataArray.
    */
    __dataArrayToBase64(data) {
        if (this.app.env.isBrowser) {
            let binary = ''
            let bytes = new Uint8Array(data)
            let len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i])
            }
            return btoa(binary)
        }
        return data.toString('base64')
    }


    /**
    * Convert an Uint8Array to a hexadecimal encoded string.
    * Useful to convert an ArrayBuffer hash to an id string.
    * @param {ArrayBuffer} dataArray - The DataArray to convert.
    * @returns {String} - A hexadecimal encoded string.
    */
    __dataArrayToHex(dataArray) {
        let byteArray = new Uint8Array(dataArray)
        let hexString = ''
        let nextHexByte

        for (let i = 0; i < byteArray.byteLength; i++) {
            nextHexByte = byteArray[i].toString(16)
            if (nextHexByte.length < 2) {
                nextHexByte = '0' + nextHexByte
            }
            hexString += nextHexByte
        }
        return hexString
    }


    /**
     * Convert an Uint8Array to a string.
     * @param {ArrayBuffer} dataArray - The DataArray to convert.
     * @returns {String} - The stringified DataArray.
     */
    __dataArrayToString(dataArray) {
        return String.fromCharCode.apply(null, new Uint8Array(dataArray))
    }


    /**
    * Derive a common AES-GCM session key from a public key and the
    * user's private key.
    * @param {CryptoKey} publicKey - A public key to generate the session key for.
    * @returns {Promise} - Resolves with a AES-GCM CryptoKey that can be used for
    * encryption and decryption between endpoints.
    */
    async __deriveAESKeyFromECDH(publicKey) {
        this.app.logger.debug(`${this}deriving common aes-gcm key from ecdh secret`)
        const sessionKey = await crypto.subtle.deriveKey({
            name: 'ECDH',
            namedCurve: 'P-256',
            public: publicKey,
        }, this.keypair.privateKey, {
            length: 256,
            name: 'AES-GCM',
        }, true, ['encrypt', 'decrypt'])
        return sessionKey
    }


    /**
    * Export an AES-GCM CryptoKey to a base-64 encoded string.
    * @param {CryptoKey} aesKey - An AES-GCM CryptoKey to convert.
    * @returns {Promise} - Resolves with a base-64 representation of an AES-GCM
    * CryptoKey.
    */
    async __exportAESKey(aesKey) {
        // Export the AES key, so we can see if they look the same.
        const keydata = await crypto.subtle.exportKey('raw', aesKey)
        //returns the exported key data
        let base64Keydata = this.__dataArrayToBase64(keydata)
        this.app.logger.info(`${this}export aes-gcm sessionkey`)
        return base64Keydata
    }


    /**
    * Export an ECDH private key to a base-64 encoded string.
    * @param {CryptoKey} privateKey - The private key to export.
    * @returns {Promise} - Resolves with a base-64 encoded pkcs8 private key.
    */
    async __exportPrivateKey(privateKey) {
        // Export the AES key, so we can see if they look the same.
        const keydata = await crypto.subtle.exportKey('pkcs8', privateKey)
        this.app.logger.debug(`${this}exported private key`)
        return this.__dataArrayToBase64(keydata)
    }


    /**
    * Export an ECDH public key to a base-64 encoded string.
    * @param {CryptoKey} publicKey - The public key to export.
    * @returns {Promise} - Resolves with a base-64 encoded spki public key.
    */
    async __exportPublicKey(publicKey) {
        const keydata = await crypto.subtle.exportKey('spki', publicKey)
        let base64Keydata = this.__dataArrayToBase64(keydata)
        this.app.logger.debug(`${this}exported public key`)
        return base64Keydata
    }


    /**
    * Generate a SHA-256 checksum hash from a string.
    * @param {String} data - The data to hash.
    * @returns {Promise} - Resolves with the SHA-256 hash of the supplied data.
    */
    __hashString(data) {
        return crypto.subtle.digest({name: 'SHA-256'}, this.__stringToDataArray(data))
            .then(generatedIdArrayBuffer => {
                let hash = this.__dataArrayToHex(generatedIdArrayBuffer)
                return hash
            })
    }


    /**
    * Import a base-64 encoded ECDH private key as CryptoKey. The browser
    * version replaces the OID for Chrome, because Chrome's BoringSSL doesn't
    * follow the OID as set out by WebCrypto yet.
    * @param {String} privateKey - A base-64 encoded private key.
    * @param {Object} params - The crypto params.
    * @param {Array} uses - What the CryptoKey should be able to do.
    * @returns {Promise} - Resolves with a private CryptoKey.
    */
    __importPrivateKey(privateKey, params, uses) {
        this.app.logger.debug(`${this}importing ${params.name} private key`)
        if (!this.app.env.isBrowser) {
            privateKey = new Buffer(privateKey, 'base64')
        } else {
            privateKey = this.__base64ToDataArray(privateKey.replace(
                'MFYwEAYEK4EEcAYIKoZIzj0DAQcDQgAE',
                'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE'
            ))
        }

        return crypto.subtle.importKey('pkcs8', privateKey, params, true, uses)
    }


    /**
    * Import a base-64 encoded spki public key as an ECDH CryptoKey.
    * @param {String} publicKey - Base-64 encoded spki public key.
    * @param {Object} params - The crypto params.
    * @param {Array} uses - What the CryptoKey should be able to do.
    * @returns {Promise} - Resolves with the imported public ECDH CryptoKey.
    */
    __importPublicKey(publicKey, params, uses = []) {
        this.app.logger.debug(`${this}importing ${params.name} public key`)
        let publicKeyData
        if (!this.app.env.isBrowser) {
            publicKeyData = new Buffer(publicKey, 'base64')
        } else {
            let chromeSpkiPublickey = publicKey.replace(
                'MFYwEAYEK4EEcAYIKoZIzj0DAQcDQgAE',
                'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE'
            )
            publicKeyData = this.__base64ToDataArray(chromeSpkiPublickey)
        }

        return crypto.subtle.importKey('spki', publicKeyData, params, true, uses)
    }


    /**
    * Convert an ASCII string to an ArrayBuffer/Uint8Array.
    * @param {String} data - The string to convert.
    * @returns {ArrayBuffer|Uint8Array} - Return a Buffer in Node.js; an Uint8Array in the browser.
    */
    __stringToDataArray(data) {
        if (this.app.env.isBrowser) {
            let bytes = new Uint8Array(data.length)
            for (let iii = 0; iii < data.length; iii++) {
                bytes[iii] = data.charCodeAt(iii)
            }
            return bytes
        }

        return new Buffer(data)
    }


    /**
    * The session key is generated from the user's password and is
    * cached in-memory. The user has to refill it's password as soon
    * the plugin is restarted. All application data is decrypted using
    * the session key.
    * @param {String} username - Username to generate an AES key for.
    * @param {String} password - Password to generate an AES key for.
    * @returns {Promise} - Resolves with an AES-GCM key.
    */
    async _generateVaultKey(username, password) {
        let salt
        // The salt is bound to the username and is therefor required.
        if (this.app.state.settings.vault && this.app.state.settings.vault.salt && this.app.state.user.username) {
            salt = this.__base64ToDataArray(this.app.state.settings.vault.salt)
        } else {
            salt = crypto.getRandomValues(new Uint8Array(16))
        }

        this.app.setState({
            settings: {
                vault: {active: true, salt: this.__dataArrayToBase64(salt)},
            },
        }, {encrypt: false, persist: true})

        this.pdkdf2Key = await crypto.subtle.importKey(
            'raw', this.__stringToDataArray(`${username}${password}`),
            {name: 'PBKDF2'}, false, ['deriveKey', 'deriveBits'],
        )

        // Use a decent iteration count to make the hashing mechanism slow
        // enough, to make it less likely that the password can be brute-forced.
        const sessionKey = await crypto.subtle.deriveKey(
            {hash: {name: 'SHA-256'}, iterations: 500000, name: 'PBKDF2', salt},
            this.pdkdf2Key, {length: 256, name: 'AES-GCM'}, true, ['encrypt', 'decrypt'])
        return sessionKey
    }


    /**
    * Import a base64 AES vault key. This key is stored as base64
    * in localStorage when the user enabled it. The user is informed about
    * the security implications.
    * @param {String} vaultKey - Base64 encoded version of the Vault key (AES-GCM).
    */
    async _importVaultKey(vaultKey) {
        try {
            this.sessionKey = await crypto.subtle.importKey(
                'raw', this.__base64ToDataArray(vaultKey), this.__cryptoParams.aes.params,
                true, ['encrypt', 'decrypt'])
        } catch (err) {
            console.error(err)
        }
    }


    /**
    * Decrypt a cypher object with an AES-GCM session key.
    * @param {CryptoKey} sessionKey - The AES-GCM CryptoKey to decrypt a message with.
    * @param {Object} ciphertext - The cipher object.
    * @param {Object} [ciphertext.additionalData] - Additional authenticated data.
    * @param {Object} [ciphertext.cipher] - The actual encrypted payload.
    * @param {Object} [ciphertext.iv] - The initialization vector.
    * @returns {Promise} - Resolves with the decrypted plaintext message.
    */
    async decrypt(sessionKey, ciphertext) {
        let decrypted = await crypto.subtle.decrypt({
            additionalData: this.__base64ToDataArray(ciphertext.additionalData),
            iv: this.__base64ToDataArray(ciphertext.iv),
            name: 'AES-GCM',
            tagLength: 128,
        }, sessionKey, this.__base64ToDataArray(ciphertext.cipher))

        return this.__dataArrayToString(decrypted)
    }


    /**
    * Encrypt a plaintext string with AES-GCM.
    * @param {CryptoKey} sessionKey - An AES-GCM key used to encrypt session data with.
    * @param {String} plaintext - The message data to encrypt.
    * @param {String} additionalData - Additional AES-GCM data that must be verifiable.
    * @returns {Promise} - Resolves with an AES cipher data object.
    */
    async encrypt(sessionKey, plaintext, additionalData = null) {
        const iv = crypto.getRandomValues(this.__dataArray(16))
        if (additionalData) additionalData = this.__stringToDataArray(additionalData)
        else additionalData = this.__dataArray(0)
        const encrypted = await crypto.subtle.encrypt(
            {additionalData, iv, name: 'AES-GCM', tagLength: 128},
            sessionKey, this.__stringToDataArray(plaintext))
        return {
            additionalData: this.__dataArrayToBase64(additionalData),
            cipher: this.__dataArrayToBase64(encrypted),
            iv: this.__dataArrayToBase64(iv),
        }
    }


    /**
    * An identity is foremost a sessionkey that is used to encrypt
    * locally stored data with. It can also provide means to setup a secure
    * communication channel with between two endpoints. In that case a transient
    * ECDH key and a static RSA-PSS key is used to negotiate a PFS secret key
    * between the two endpoints.
    * @param {String} username - The username to unlock local data with.
    * @param {String} password - The password to unlock local data with.
    * @param {Boolean} e2e - Whether to create an asymmetric encryption key.
    */
    async loadIdentity(username, password, e2e = false) {
        this.sessionKey = await this._generateVaultKey(username, password)
        if (!e2e) return

        const rsa = this.app.store.get('rsa')
        if (!rsa) {
            try {
                this.rsa = await crypto.subtle.generateKey(this.__cryptoParams.rsa.params, true, this.__cryptoParams.rsa.uses)
            } catch (err) {
                console.error(err)
            }

            let [privateKey, publicKey] = await Promise.all([
                this.__exportPrivateKey(this.rsa.privateKey),
                this.__exportPublicKey(this.rsa.publicKey),
            ])

            const rsaEncrypted = await this.encrypt(this.sessionKey, JSON.stringify({privateKey, publicKey}))
            this.app.store.set('rsa', rsaEncrypted)
        } else {
            try {
                let decryptedRsa = JSON.parse(await this.decrypt(this.sessionKey, rsa))
                let [privateKey, publicKey] = await Promise.all([
                    this.__importPrivateKey(decryptedRsa.privateKey, this.__cryptoParams.rsa.params, ['sign']),
                    this.__importPublicKey(decryptedRsa.publicKey, this.__cryptoParams.rsa.params, ['verify']),
                ])
                this.rsa = {privateKey, publicKey}
            } catch (err) {
                console.error(`${this}unable to decrypt rsa identity`)
            }
        }
    }


    /**
    * Persist the encryption key to the unencrypted part
    * of the store, so the plugin can automatically unlock.
    * This is a tradeoff between usability and security.
    */
    async storeVaultKey() {
        const sessionKey = await this.__exportAESKey(this.sessionKey)
        this.app.setState({settings: {vault: {key: sessionKey}}}, {encrypt: false, persist: true})
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[crypto] `
    }

}

module.exports = Crypto
