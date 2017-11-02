# Release process
The Vialer-js deploy process makes a distinction between a beta release and
a public release. The beta version and the public version are two separate
(Firefox/Chrome) store entries. Semver (x.x.x) is used with the following
disinctions:

* MAJOR version when you make incompatible API changes
* MINOR version when you add functionality in a backwards-compatible manner
* PATCH version when you make backwards-compatible bug fixes.

Suppose the current public version is `2.3.4`. Then the next (patch) public
release will be `2.3.5`. We first deploy a beta release with a postfix deploy
number on the current version, e.g. `2.3.4.0`. The beta release could proof to
be unsuccessful during a one-week blackbox testing period. In that case, a
new beta version `2.3.4.1` is published, until we are convinced that the
release is stable. The public release is then done as `2.3.5`.


## Preparation
Deployment to the Firefox and Chrome store is automated. In order to deploy
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

Checkout {@tutorial branding}) if you want to be able to deploy multiple brands
at once. Make sure you distinguish between the correct `extensionId/extensionId_beta`
and `id/id_beta` in `.vialerjs-rc`.

## Beta release
1. Bump the version in package.json, e.g. 2.3.4.0.
2. Tag and commit the beta release
```bash
git tag -a v2.3.4.0 -m 'v2.3.4.0'
git push origin v2.3.4.0
git push origin master
```
3. Release the beta version:
```bash
gulp deploy-brands --deploy beta
```

## Public release
1. Update the `CHANGELOG.md` with all the changes since the last version

2. Bump the version:

   ```bash
   git tag -a v2.3.5 -m 'v2.3.5'
   git push origin 2.3.5
   git push origin master
   ```

3. Release the public version:
```bash
gulp deploy-brands --deploy production
```

4. Update the github pages hosted documentation
```bash
gulp docs-deploy
```


# Additional info & tips

## Stores
Check the Google [developer dashboard](https://chrome.google.com/webstore/developer/dashboard?)
for the newly published plugin's status. The plugin will generally be updated to all users
within several hours, when the browser checks for extension updates. You can [manually override](https://developer.chrome.com/apps/autoupdate#testing) this behaviour in Chrome,
to see if the new version is updated correctly.


The Mozilla WebExtension release process is nowadays a lot faster than it used
to be. Checkout the [Mozilla developer dashboard](https://addons.mozilla.org/nl/developers/addon/vialer/versions)
for the release status. You can contact an AMO-editor on [irc](irc://mozilla.org/%23amo)
for help and questions about the reviewing process.

## Deployment tips
You can fine-tune deployment by supplying several build flags, e.g.:

   ```bash
   gulp deploy --target firefox --brand vialer --deploy beta
   ```
