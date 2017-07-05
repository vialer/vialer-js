Deployment to the Firefox and Chrome store is automated. In order to deploy
to either one, you first need to fill in API credentials in the following file:

    cp .click-to-dialrc.example ~/.click-to-dialrc

For Firefox, fill in the `apiKey` and `apiSecret` from the [API key](https://addons.mozilla.org/nl/developers/addon/api/key/) management page.
For Chrome, the initial setup requires an `extensionId`, `clientId`, `clientSecret`
and a `refreshToken`. See this [manual](https://github.com/DrewML/chrome-webstore-upload/blob/master/How%20to%20generate%20Google%20API%20keys.md) on how to lookup these fields.

In both cases, you need to be an authorized developer, in
order to push to one of the stores. For the release process, please use [release-it](https://www.npmjs.com/package/release-it). It takes care of
bumping the version in package.json, creating automated git tags and publishing
the Desktop app to npm. After running release-it, run the release commands for
Chrome and Firefox and update the hosted jsdoc documentation:

    release-it
    # Specify `default` as audience to publish the version to the world,
    # otherwise the default audience `trustedTesters` will be used.
    gulp deploy --target chrome --audience default
    gulp deploy --target firefox
    # Update github pages hosted documentation
    gulp docs-deploy

The plugin will be first automatically validated on the Firefox addon store,
after which a manual validation will take place by an AMO editor. For help
and questions about the reviewing process, you can contact an AMO-editor
on [irc](irc://mozilla.org/%23amo).

The Chome store has a similar but shorter process. It takes a while before the
updated version is reviewed and checked.
