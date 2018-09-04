<div>
<h1>Quickstart guide</h1>

<p>
Just want to see how it works? Just install the <a href="https://chrome.google.com/webstore/detail/bologna-alpha/adgookjhbldhfflndfdgkcbmpmfhapgc">Bologna Alpha</a>
Chrome extension!
</p>

<p>
Want to build a softphone yourself? Lets get you up and running.
Installing Vialer-js is the quickest way to get a grasp on how Vialer-js works.
You need some dependencies installed on your system
to get started. These dependencies are:
</p>
<ul>
    <li>Chrome/Chromium 66 to run as a WebExtension</li>
    <li>Node.js 10.0.0 or higher</li>
    <li>Npm 6 or higher</li>
</ul>


<h2>Setup</h2>
<p>Checkout the project and install the library dependencies from npm:</p>
<pre>
    <code class="bash">
    git clone git@github.com:vialer/vialer-js.git
    cd vialer-js
    npm i
    # Setup a default settings file.
    cp ./.vialer-jsrc.example ~/.vialer-jsrc
    # Build Vialer-js Bologna brand as a Chrome extension.
    gulp build --brand bologna --target chrome
    </code>
</pre>

<p>
Go to <b>chrome://extensions</b> in a Chrome/Chromium browser and point to the
<i>build/vialer/chrome</i> directory. You now have a generic softphone running
as a Chrome WebExtension! Please note that you still need a compatible
SIP-over-websocket provider in order to start calling with this build.
Installing a PBX is not in the scope for this documentation, but you can
get a general idea <a href="https://wearespindle.com/articles/javascript-is-calling/">here</a>
on how to get started with Asterisk and WebRTC.

Checkout <a href="/topics/platforms">platforms</a> to learn more about different builds.
</p>
</div>
