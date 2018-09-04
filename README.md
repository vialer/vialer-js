[![CircleCI](https://circleci.com/gh/vialer/vialer-js/tree/develop.svg?style=svg)](https://circleci.com/gh/vialer/vialer-js/tree/develop)

Take me to the [quickstart guide](https://vialer-js.io/topics/quickstart)


# The Vialer-js project
Vialer-js is a free, pluggable, open-source communication platform that
focusses on **customization**, **development pace** and **platform reach**.
Its philosophy is to empower developers and vendors to build their own
communication tools at a fast pace, while maintaining flexibility of
the most opinionated implementation details.


## Customization
From application functionality to the documentation look-and-feel; all parts
about Vialer-js can be styled, branded to fit a corporate identity or customized
through the use of plugins that hook into the core functionality. The build system
accomodates this branding flexibility and offers an easy way to customize
naming, testing, default configurations and more.

![login screen](/screens/alice-login.png "Bologna login")
![device wizard](/screens/alice-wizard-devices.png "Bologna device wizard")
![dialpad](/screens/alice-dialpad-call.png "Bologna dialpad")
![outgoing call](/screens/bob-calldialog-incoming-accepted.png "Bologna outgoing call")


## Development pace
The *Bologna* Vialer-js brand uses [SIP-over-websockets](https://sipjs.com/)
and relies on a suitable [SRTP backend](https://github.com/sipwise/rtpengine)
to tap in to all of the call features a PBX like [Asterisk](https://www.asterisk.org/)
or [Freeswitch](https://freeswitch.com/oss/) has to offer: PSTN connectivity,
on-hold, waiting music, transfers, queues, IVR and callgroups. Besides dealing
with audio calls, video [through a PBX](https://blogs.asterisk.org/2017/09/20/asterisk-15-multi-stream-media-sfu/)
may be another interesting application to your end-users. However, having a
PBX in-between a call may not always be the desired situation.

A decentralized approach with a custom WebRTC signalling protocol and p2p
connections between call participants may be more appropriate in situations
where scalability and/or privacy concerns dictate that (video) data needs to
flow between peers instead of through a centralized service. Another reason to
use a custom signalling protocol, would be that features like
[chat and file transfers](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel)
are much easier to implement without having to deal with the complexity of
the SIP protocol.

The purpose of Vialer-js is not only to facilitate different use-cases,
but also to be able to integrate them in one unified communication experience
for your end-users. In our view, a user will be entirely free to use a
VoIP-service provider with Vialer-js, while at the same time being able to
communicate p2p with their friends over a decentralized signalling network.


## Platform reach
Vialer-js is a readable environment-agnostic ES2017 codebase that uses a simple
but powerful reactive data-oriented design. This allows it to run on several
suitable JavaScript runtimes. At the moment, this includes:
* Blink-compatible WebExtension browsers (Opera, Chrome, Chromium)
* Electron desktop app

Headless Node.js support is implemented partially, to be able to run
unit tests without having to mock data. Calling from Node.js is not supported
yet though.


## Want to learn more?
Great! Nice to have you interested in this project. Head over to the [quickstart guide](https://vialer-js.io/topics/quickstart)
to learn more about how to work with Vialer-js. Are you interested in contributing or
would you like to see some feature implemented? Please read our [code of conduct](https://github.com/vialer/vialer-js/blob/develop/.github/CODE_OF_CONDUCT.md)
and [contributing guide](https://github.com/vialer/vialer-js/blob/develop/.github/CONTRIBUTING.md) first.
Have any non-technical questions? Feel free to [contact us](mailto:vialer@wearespindle.com).
