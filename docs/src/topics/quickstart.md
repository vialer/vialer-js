# Quickstart guide
Lets get you up and running. Installing Vialer-js is the quickest way to get a
grasp on how Vialer-js works. You need some dependencies installed on your system
to get started. These dependencies are:
* Chrome/Chromium 66 to run as a WebExtension
* Node.js 10.0.0 or higher
* Npm 6 or higher


## Setup
Checkout the project and install the library dependencies from npm:
```bash
git clone git@github.com:vialer/vialer-js.git
cd vialer-js
npm i
# Setup a default settings file.
cp ./.vialer-jsrc.example ~/.vialer-jsrc
# Build Vialer-js Bologna brand as a Chrome extension.
gulp build --brand bologna --target chrome
```

Go to `chrome://extensions` in a Chrome/Chromium browser and point to the
`build/vialer/chrome` directory. You now have a generic softphone running
as a Chrome WebExtension! Please note that you still need a compatible
SIP-over-websocket provider in order to start calling with this build.
Installing a PBX is not in the scope for this documentation, but you can
get a general idea [here](https://wearespindle.com/articles/javascript-is-calling/)
on how to get started with Asterisk and WebRTC.

Checkout [platforms](/topics/platforms) to learn more about different builds.
