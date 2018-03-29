# About
Vialer-js is an open-source communication platform written in JavaScript. It
features an isomorphic design and a modular call-handling core,
with implementations of a free SIP softphone(`CallSIP`) and an optional
proprietary calling API(`CallConnectAB`) for the [VoIPGRID platform](https://voipgrid.nl/).
`CallSIP` implements a SIP-over-websocket softphone (using SIP.js) with all features
you would expect from a softphone like on-hold, blind & attended transfer,
dealing with multiple calls and click-to-dial in browser tabs.

The isomorphic design allows the software to be run as a browser WebExtension,
a webpage widget, an Electron desktop or a headless Node.js application.

Its simple data-orientated design (Vue/Vue-stash) makes it easy to implement
new features for multiple platforms at a very fast pace. Custom protocols can be
incorporated into its core system, so Vialer-js is not bound to SIP.


# Quickstart
## Requirements
* Node.js 9.0.0 or higher
* Npm 5 or higher
* Electron executable for the desktop version (optional)

## Setup
Checkout the project and install its dependencies from npm:
```bash
git clone git@github.com:VoIPGRID/vialer-js.git
cd vialer-js
npm i
# Setup the default settings file:
cp ./.vialer-jsrc.example ~/.vialer-jsrc
# Build a Chrome extension:
gulp build
```

Go to `chrome://extensions` in your Chrome/Chromium browser and point to the
`build/vialer/chrome` directory. You now have a Vialer-js softphone running
as a Chrome WebExtension! Checkout {@tutorial install} to
learn more about different builds.
