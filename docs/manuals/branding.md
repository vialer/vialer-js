# Prerequisites
The following prerequisites apply when you want to release a branded version
of Vialer-js:

* Accounts for the following vendor stores:
 * Google account for the [Chrome web store](https://chrome.google.com/webstore).
   $5 developer fees need to be paid with a creditcard to enable publishing
   rights for the account.
 * Mozilla developer account for the [addons store](https://addons.mozilla.org).
* Come up with a branding name for the plugin
* Branded images for:
 * icon-menubar-active.png
 * icon-menubar-inactive.png
 * icon-menubar-unavailable.png
 * icon-notification-info.png
 * icon-notification-warning.png
 * icon-systray.png
 * logo-16.png
 * logo-32.png
 * logo-64.png
 * logo-128.png
* Plugin logo for the stores (logo-128.png can be reused)
* 1 Promotion tile for the Chrome store (440x280 png-file)
* 4 Promotional images/screenshots (640x400 png-files) for both stores.
* English and Dutch plugin description texts for the stores.
* A branded portal/platform URL. Used in manifest permissions & links to the settings page from the popup. Also referenced from the stores.
* Support/help URL; opened from the popup help button. Also referenced from the stores.
* Google Analytics ID


# Deployment process

## Auto-deploy with Vialer-js releases
Please [contact us](http://voipgrid.nl/contact/) if you want a branded plugin to be
deployed together with the Vialer-js release process. We need the following
information to be able to deploy your brand:
* Deployment credentials for the [Chrome web store](https://chrome.google.com/webstore/developer/dashboard). See the `Preparation` section of {@tutorial deployment}
  how to generate these.
* Your [Mozilla store](https://addons.mozilla.org/developers/addons) addon item should have our developers as collaborators listed.


## Manual deployment
* Add your brand, e.g. `yourbrand` in the `brands` section of .vialer-jsrc by modifying the `vialer` brand or by adding the
brand config next to the Vialer config. Make sure this is valid JSON.
* Modify the color palette of `yourbrand` to match your brand's color-scheme.
* Copy the `src/brand/vialer` directory and its content to `src/brand/yourbrand`. Make sure the name matches the key you
  used in the brands section of `.vialer-jsrc` exactly.
* Modify the images in `src/brand/yourbrand/img` to match your brand. Do not reuse the branded Vialer images listed in the `Prerequisites` section!
* Build your branded version:
```
gulp build --brand yourbrand --target chrome
gulp build --brand yourbrand --target firefox
gulp build --brand yourbrand --target electron
```
