# Deployment process

## Preparation
Deployment to the Firefox and Chrome store is (semi) automated. In order to deploy
to either one, you first need to fill in API credentials in the following file:

```bash
cp .vialer-jsrc.example ~/.vialer-jsrc
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
1. Update the `CHANGELOG.md` with all the changes since the last version

2. Bump the version:

   ```bash
   npm version patch
   git push origin 2.x.x
   git push origin master
   ```

3. Publish the Chrome version. Specify `default` as audience to publish the
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

4. Upload the Firefox version to the store.

   ```bash
   gulp deploy --target firefox
   ```

5. Update the github pages hosted documentation

  ```bash
  gulp docs-deploy
  ```


For help and questions about the reviewing process, you can contact an AMO-editor
on [irc](irc://mozilla.org/%23amo).
