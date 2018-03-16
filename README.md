# About
Vialer-js is an open-source communication platform written in JavaScript. It
features a modular call-handling core, with implementations of a free SIP
softphone(`CallSIP`) and an optional proprietary calling API(`CallConnectAB`)
for the [VoIPGRID platform](https://voipgrid.nl/). `CallSIP` implements a
SIP-over-websocket softphone (using SIP.js) with all features you would expect
like on-hold, blind & attended transfer, dealing with multiple calls and
click-to-dial in browser tabs.

The code is written to be compliant with the WebExtension standard, so it runs
by default as a browser plugin, but can just as easily run inside the context of
a webpage or an Electron container. Its simple data-orientated design
(Vue/Vue-stash) makes it a breeze to implement new features for multiple
platforms at a very fast pace. Custom protocols can be incorporated into its
core system, so Vialer-js is not bound to SIP. Currently, the code is already
modular enough to incorporate multiple protocols, but - truth be told - still
requires significant work to make it truly modular.

Check out the [documentation](https://voipgrid.github.io/vialer-js/)
for detailed information on how to install Vialer-js from source.

# Building from source
## Requirements
* Node.js 8.0.0 or higher
* Npm 5 or higher
* Electron executable for the desktop version (optional)

## Setup
Checkout the project and install its dependencies from npm:
```bash
git clone git@github.com:VoIPGRID/vialer-js.git
cd vialer-js
npm i -g gulp web-ext
npm i
# Set the default branding file.
cp ./.vialer-jsrc.example ~/.vialer-jsrc
```

Make a build:
```bash
gulp build
```

Now go to `chrome://extensions` and point to `build/vialer/chrome`. You should
have a working Chrome WebExtension by now! Checkout the {@tutorial install} to
learn more about builds.
