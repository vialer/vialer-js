# Supported platforms
Vialer-js uses a tool called [Gulp](https://gulpjs.com/) for its build system.
The build system is quite flexible because of its usage of a set of variables that
involve branding and build targets, as well as several configuration options that
are linked to a brand within the `.vialerjs-rc` configuration file. The current
platform build targets are:

## WebExtension
### Chrome
```bash
# Generate a development build.
gulp build --brand bologna --target chrome
```
Navigate to `chrome://extension`, make sure developer mode is enabled, and load
the `./build/bologna/chrome` directory as an unpacked extension in Chrome.
You can drag-and-drop the distribution zip file from `dist/chrome`  on the
Chrome extension page. Notice that this may not work on Chrome Windows.

### Firefox
We would like to be able to support Vialer-js on Firefox, but WebRTC support in
Firefox WebExtensions is problematic at the moment, because of at least one [blocking ticket](https://bugzilla.mozilla.org/show_bug.cgi?id=1278100)
that prevents Vialer-js from running properly in Firefox. There is currently
a build target for Firefox, but don't expect it to work for calling.
We will update this section when the situation changes.
```bash
# Generate a development build.
gulp build --brand bologna --target firefox
```
Navigate to `about:debugging` and switch `Enable add-on debugging` on. Select
`Load Temporary Add-on` and point it to the `manifest.json` in the `build/firefox`
directory.

## Electron Desktop
Vialer-js can run as a desktop application using an Electron container.
A compatible Electron version from npm is already installed on your system
after you installed the dependencies through npm. To build to the desktop platform:
```bash
# A simple development build.
gulp build --brand bologna --target electron
./node_modules/electron/dist/electron build/bologna/electron/main.js
# Or build and run in one step.
gulp build-run --target electron
# Package the app for a platform.
gulp build-dist --target electron --arch x64 --platform linux
```
