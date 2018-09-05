<component class="view-page">
    <h1>Platforms</h1>

    <h2>Build system</h2>
    <p>
        {{vendor.name}} uses <a href="https://gulpjs.com/">Gulp</a> as its build system.
        The build system is using a configuration file(<code>.vialerjs-rc</code>) and
        runtime flags to determine how to build {{vendor.name}}. There are several
        configuration options that can be used to customize the build, as well
        as flags that indicate which brand to build and what platform to build for.

        The preferred workflow during development is to use the webview build target,
        because it will get you the fastest development feedback loop. Code automatically
        rebuilds as you make filechanges, while the webview automatically reloads
        with the <a href="https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei)">
        livereload extension</a>. Use it whenever you are not developing
        platform-specific code! A handy trick to test API-calls during development
        without the need for CORS:

<pre v-highlightjs><code class="bash"># --ignore-certificate-errors may be useful in certain cases as well.
chromium --disable-web-security --user-data-dir=~/.chromium-temp
# Visit localhost:8999 to see the built webview.
</code></pre>

    <h2>Build targets</h2>
    <h3>WebExtension</h3>
    <p>
        Auto-reloading can not be used while developing a WebExtension. There is a manual
        reload option in <code>chrome://extensions/</code> which works reliable for
        the background and foreground script. A slightly faster way to reload all
        cripts is to use <a href="https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid">
        extension reloader</a>. Keep in mind that you still have to close/open a
        tab in case you want a tab script to reload.
    </p>
    <h4>Chrome</h4>

<pre v-highlightjs><code class="bash"># Generate a development build for Chrome.
gulp build --brand bologna --target chrome
</code></pre>

    <p>
        Navigate to <code>chrome://extension</code>, make sure developer mode is enabled, and load
        the <code>./build/bologna/chrome</code> directory as an unpacked extension in Chrome.
        You can drag-and-drop the distribution zip file from <code>dist/chrome</code> on the
        Chrome extension page. Notice that this may not work on Chrome Windows.
    </p>

    <h4>Firefox</h4>
    <p>
        We would like to be able to support Vialer-js on Firefox, but WebRTC support in
        Firefox WebExtensions is problematic at the moment, because of at least one
        <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1278100">blocking ticket</a>
        that prevents Vialer-js from running properly in Firefox. There is currently
        a build target for Firefox, but don't expect it to work for calling.
        We will update this section when the situation changes.
    </p>

<pre v-highlightjs><code class="bash"># Generate a development build for Firefox.
gulp build --brand bologna --target firefox
</code></pre>

    <p>
        Navigate to <code>about:debugging</code> and switch <i>Enable add-on debugging</i> on. Select
        <i>Load Temporary Add-on</i> and point it to the <i>manifest.json</i> file in the <code>build/firefox</code>
        directory.
    </p>

    <h2>Electron</h2>
    <p>
        Vialer-js runs as a Linux/Windows/MacOS desktop application using the Electron runtime.
        A compatible Electron version from npm is already installed on your system
        after you installed the dependencies through npm. To make a desktop build:
    </p>

<pre v-highlightjs><code class="bash"># A simple development build.
gulp build --brand bologna --target electron
./node_modules/electron/dist/electron build/bologna/electron/main.js
# Or build and run in one step.
gulp build-run --target electron
# Package the app for a platform.
gulp build-dist --target electron --arch x64 --platform linux
</code></pre>
</component>
