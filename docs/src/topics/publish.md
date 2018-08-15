# Publish information

## General release rules
Vialer-js brands managed by us use a alpha, beta and production release channels.
Each channel has its own separate Firefox/Chrome store entry. A release will
always be targetting the alpha channel first, so our bleeding-edge users
can verify in a week that the release works as expected. An alpha release will
always be a MINOR or a MAJOR semver version bump. Suppose the current public
version is `4.0.0`. Then the next alpha release will either be `4.1.0` or
`5.0.0`, depending on the nature of the changes. Basically the following applies:

* MAJOR when an incompatible API change influences (external) modules
* MINOR when new functionality is added in a backwards-compatible manner

Semver PATCH versions are bumped while the alpha version needs to be updated,
due to unencounted bugs or inconsistencies. So, `4.1.0` becomes `4.1.1`, `4.1.2`,
or `5.0.0` becomes `5.0.1`, `5.0.2`, etc., depending on the amount of bugfix
releases needed.

When the alpa testusers report a succesful release after a week, we proceed by
publishing the beta version to our larger testusers pool in the beta channel.
Then after a week again, when our beta testusers didn't encounter any problems,
we proceed by publish the production version to our main users.


## Publishing platforms
```bash
gulp deploy --brand bologna --target chrome --deploy alpha
```
The buildsystem can publish automatically to the Chrome webstore and
Mozilla [addons store](https://addons.mozilla.org) at the moment.
You need a Google account for the Chrome webstore and a $5 developer fees
needs to be paid with a creditcard to enable publishing rights for the account.
Store-related branding material includes:
* Plugin logo for the stores (logo-128.png can be reused)
* 1 Promotion tile for the Chrome store (440x280 png-file)
* 4 Promotional images/screenshots (640x400 png-files)
* English and Dutch WebExtension description texts.
* Support email/phone/website
* Google Analytics ID (optional)

### Store credentials
Deployment to the Firefox and Chrome store is automated. In order to deploy
to either one, you first need to fill in API credentials in `.vialer-jsrc`.
For Chrome, the required store credentials are `extensionId`, `clientId`, `clientSecret`
and `refreshToken`. See this [manual](https://github.com/DrewML/chrome-webstore-upload/blob/master/How%20to%20generate%20Google%20API%20keys.md)
on how to lookup these fields. Check the Google [developer dashboard](https://chrome.google.com/webstore/developer/dashboard?)
for the newly published plugin's status. The plugin will generally be updated to all users
within several hours, when the browser checks for extension updates. You can [manually override](https://developer.chrome.com/apps/autoupdate#testing)
this behaviour in Chrome to see if the new version is updated correctly.

For Firefox, fill in the `apiKey` and `apiSecret` from the [API key](https://addons.mozilla.org/nl/developers/addon/api/key/) management page.
The Mozilla WebExtension release process is partly automated, but also has random
manual reviews. Checkout the [Mozilla developer dashboard](https://addons.mozilla.org/nl/developers/addon/vialer/versions)
for the release status. You can contact an AMO-editor on [irc](irc://mozilla.org/%23amo)
for help and questions about the reviewing process.
