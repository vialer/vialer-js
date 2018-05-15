[![Build status](https://travis-ci.com/VoIPGRID/vialer-js.svg?branch=develop)](https://travis-ci.com/VoIPGRID/vialer-js)

# About Vialer-js
Vialer-js is a free and open-source communication platform in development.
It's purpose is to be an attractive unified communication tool to end-users,
who value cross-platform user- and privacy-friendly features, like being able
to accept and place calls over a phone network, setting up (p2p) video
conferences, chatting and sharing files; all over secured encrypted channels.

<img align="left" src="https://vialer-js.io/screenshot-1.png" height="200">
<img align="left" src="https://vialer-js.io/screenshot-2.png" height="200">
<img align="left" src="https://vialer-js.io/screenshot-3.png" height="200">
<img src="https://vialer-js.io/screenshot-4.png" height="200">

The project is written in environment-agnostic JavaScript using a simple and
powerful reactive data-orientated design. It can operate as a WebExtension for
Blink & Gecko-compatible browsers, a website widget, a desktop app(Electron)
or as a headless Node.js application, while at the same time keeping it easy
for developers to implement new features for all platforms at once at a very
fast pace.

As a developer platform, the Vialer-js project aims to be open and accessible
to developers that may be interested in adding their own custom endpoint
protocol to Vialer-js, which is much faster to implement than building all
the involved plumbing themselves. Vialer-js may also be an attractive option
for those interested in creating their own softphones, without having to
reinvent the wheel.

The core of the software is designed around the notion of a generic 'Call'
abstraction, that allows it to be flexible about using different technology
stacks, while keeping the core functionality generic. Core functionality
includes:

* Audio for: DTMF, Busy, ringback & build-time selected ringtone
* Audio device selection for headset input/output and ringtone device
* Automated builds and deploys using gulp
* Brandable design
* Call dialogs with context switching
* Call notifications with animated menubar icons and system notifications
* Clickable call icons and call status next to phonenumbers in browser tabs
* Configuration screen + developer modus
* Configuration wizard
* Contacts & endpoints
* Dialpad with Contact autocomplete and volume meter
* Do-not-disturb
* Password-encrypted data storage (WebCrypto/PBKDF2)]
* Keyboard shortcuts (WebExtension-only) for several Call actions
* Multi-language support (NL/EN only at the moment)
* Non-blocking UX for Call management
* Online/offline detection & status monitoring
* Reactive flexible UI & data store (Vue & Vue-stash)
* Recent calls list
* Telemetry opt-in (Google-analytics events & Sentry exception logging)
* User sessions

The `CallSIP` implementation can be harnessed to use Vialer-js as a softphone
when used in combination with an SIP-over-websocket compatible PBX infrastructure.
It supports most of the features you would expect from a PBX softphone, like:
* Blind & attended transfer
* On-hold & call switching
* DTMF support
* VoIP-account selection and feature detection (avpf/encryption)


# Quickstart
## Requirements
* Node.js 10.0.0 or higher
* Npm 6 or higher
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
