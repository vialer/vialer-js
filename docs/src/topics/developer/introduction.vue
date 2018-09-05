<component class="view-page">
    <h1>Quickstart</h1>

    <p>
        Install the <a href="https://chrome.google.com/webstore/detail/bologna-alpha/adgookjhbldhfflndfdgkcbmpmfhapgc">{{app.name}}</a>
        Chrome extension if you just want to try a demo.

        Do you want to build a softphone yourself? Installing {{app.name}} is the
        quickest way to get a grasp on how it works. You need some dependencies
        installed on your system to get started. These dependencies are:
    </p>

    <ul>
        <li>Chrome/Chromium 66+ to run as a WebExtension</li>
        <li>Node.js 10.0.0 or higher</li>
        <li>Npm 6 or higher</li>
    </ul>

    <h2>Setup</h2>
    <p>
        Checkout the project and install the library dependencies from npm:
    </p>

<pre v-highlightjs><code class="bash">git clone git@github.com:vialer/vialer-js.git
cd vialer-js
npm i
# Setup a default settings file.
cp ./.vialer-jsrc.example ~/.vialer-jsrc
# Build {{app.name}} brand as a Chrome extension.
gulp build --brand bologna --target chrome
</code></pre>

    <p>
        Go to <code>chrome://extensions</code> in a Chrome/Chromium browser and point to the
        <code>build/vialer/chrome</code> directory. You now have a generic softphone running
        as a Chrome WebExtension! Please note that you still need a compatible
        SIP-over-websocket provider in order to start calling with this build.
        Installing a PBX is not in the scope for this documentation, but you can
        get a general idea <a href="https://wearespindle.com/articles/javascript-is-calling/">here</a>
        on how to get started with Asterisk and WebRTC.

        Checkout <a href="/topics/platforms">Supported platforms</a> to learn more about different builds.
    </p>
</component>
