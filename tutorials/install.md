## Chrom(e/ium) WebExtension
```bash
# Development build. brand and target are defaults:
gulp build --brand vialer --target chrome
# Or make a production build:
NODE_ENV=production gulp build
```

Navigate to `chrome://extension`, make sure developer mode is enabled, and load
the `./build/chrome` directory as an unpacked extension in Chrome. You can also
load the extension in a new Chromium/Chrome browser profile using an npm script:
```bash
npm run test_chrome
npm run test_chromium
# You can also drag-and-drop a zip file on the extension page, after you made a
# distribution zip in `dist/chrome` using:
gulp build-dist
```

This functionality is verified to work on Linux and OSX. Windows users reported
some issues using this method.


## Firefox WebExtension
```bash
gulp build --target firefox
# Or make a production build:
NODE_ENV=production gulp build --target firefox
```
Navigate to `about:debugging` and switch `Enable add-on debugging` on. Select
`Load Temporary Add-on` and point it to the `manifest.json` in the `build/firefox`
directory. Alternatively, you can run Firefox with the addon temporarily loaded
using web-ext in a new profile with:

    npm run test_firefox

There is no way to install unsigned xpi/zip files like with Chrome. The signed
and published Firefox xpi can be installed directly though.


## Electron app
Vialer-js can run as a desktop app using Electron, although this
version is still **experimental** and not (yet) officially supported.
You're free to give it a spin though! It requires Electron to be installed
on your system. To run the desktop version:
```bash
npm run test_electron
```
