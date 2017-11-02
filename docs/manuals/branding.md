# Prerequisites
The following prerequisites apply when you want to release a branded version
of Vialer-js:

* Unique name of the plugin in the vendor stores
* Registered plugin at the vendor stores:
 * [Google store](https://chrome.google.com/webstore/developer/dashboard)
 * [Mozilla store](https://addons.mozilla.org/developers/addons)
* Deployment credentials (see {@tutorial deployment}). Please [contact us](http://voipgrid.nl/contact/) if you want your branded plugin to be deployed together with the Vialer-js release.
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
* Plugin logo (use logo-128.png)
* 1 Promotion tile for the Chrome store (440x280 png*file)
* 4 Promotional images/screenshots (640x400 png*files) for the Google and Mozilla store
* English and Dutch plugin description texts for the stores.
* Portal/platform URL; manifest permissions & links to the settings page from the popup. Also referenced from the stores.
* Support/help URL; opened from the popup help button. Also referenced from the stores.
* Google Analytics ID


# Building a branded version
* Add your brand, e.g. `yourbrand` in the `brands` section of .vialer-jsrc by modifying the `vialer` brand or by adding the
brand config next to the Vialer config. Make sure this is valid JSON.
* Modify the color palette of `yourbrand` to match your brand's color-scheme.
* Copy the `src/brand/vialer` directory and its content to `src/brand/yourbrand`. Make sure the name matches the key you used in the brands section of `.vialer-jsrc` exactly.
* Modify the images in `src/brand/yourbrand/img` to match your brand. Do not reuse the branded images from Vialer!
* Build your branded version:
```
gulp build --brand yourbrand --target chrome
gulp build --brand yourbrand --target firefox
gulp build --brand yourbrand --target electron
```
