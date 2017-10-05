# Deployment process

## Preparation
Deployment to the Firefox and Chrome store is (semi) automated. In order to deploy
to either one, you first need to fill in API credentials in the following file:

```bash
cp .click-to-dialrc.example ~/.click-to-dialrc
```

For Firefox, fill in the `apiKey` and `apiSecret` from the
[API key](https://addons.mozilla.org/nl/developers/addon/api/key/) management page.
For Chrome, the initial setup requires an `extensionId`, `clientId`, `clientSecret`
and a `refreshToken`. See this
[manual](https://github.com/DrewML/chrome-webstore-upload/blob/master/How%20to%20generate%20Google%20API%20keys.md)
on how to lookup these fields. In both cases, you need to be an authorized
developer, in order to push to one of the stores.

To be able to push to npm, an authorized developer first have to login to the
`Spindle` npm account.

```bash
npm login
```

## Public release
1. Make sure you updated `CHANGELOG.md` with all changes since the last version
2. Bump the version and create git tags.

   ```bash
   npm version patch
   ```

2. Check the build integrity of the plugin:

    ```bash
    ./test_build.sh
    # Should show this at the end:
    # Build integrity check passed...
    ```


4. Publish the Chrome version. Specify `default` as audience to publish the
   version to the world. The default audience is `trustedTesters` and will only
   be visible on a per-user basis.

   ```bash
   gulp deploy --target chrome --audience default
   ```

   Check the Google [developer dashboard](https://chrome.google.com/webstore/developer/dashboard?)
   for the newly published plugin's status. The plugin will generally be
   updated to all users within several hours, when the browser checks for
   extension updates. You can [manually override](https://developer.chrome.com/apps/autoupdate#testing)
   this behaviour, to see if the new version is updated correctly.

5. Upload the Firefox version to the store.

   ```bash
   gulp deploy --target firefox
   ```

   No worries when you see a message about a failure to sign the plugin. A new
   plugins version can't be signed utomatically when it's listed in the addons
   store.

6. Go to the Mozilla addons [versions page](https://addons.mozilla.org/nl/developers/addon/click-to-dial-v2/versions)
   and open the detail view for the newly uploaded version.

   * Set Compatibility to Firefox only, and pin it to Firefox 57 and upwards.
   * Copy the changes from `CHANGELOG.md` to the Release notes (for the users).
   * Add the following template to the Release notes for developers:

    ```bash
    To confirm contents xpi and sources.zip:
    node -v
    # v8.6.0
    npm -v
    # 5.4.2
    unzip click-to-dial-*.xpi -d /tmp/click-to-dial-xpi-unzipped
    unzip sources.zip -d /tmp/click-to-dial-sources-unzipped
    cd /tmp/click-to-dial-sources-unzipped
    npm i
    cp src/brand.json.example src/brand.json
    NODE_ENV=production gulp build --target firefox
    cd -
    diff -r /tmp/click-to-dial-xpi-unzipped /tmp/click-to-dial-sources-unzipped/build/firefox
    rm -Rf /tmp/click-to-dial*
    ```

    For help and questions about the reviewing process, you can contact an AMO-editor
    on [irc](irc://mozilla.org/%23amo).

7. Update the github pages hosted documentation

   ```bash
   gulp docs-deploy
   ```
