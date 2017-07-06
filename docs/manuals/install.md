# Requirements
* Node.js 8.0.0 or higher
* Npm 5 or higher
* Electron executable (for the desktop version)

# Checkout the project
You want to build Click-to-dial from source? Great! Then you first have to
checkout the project and install it's dependencies from npm:

    git clone git@github.com:VoIPGRID/click-to-dial.git
    cd click-to-dial
    npm i -g gulp web-ext
    npm i


## As web-extension
Building click-to-dial as a web-extension is straightforward. Chrome is the
default build target, so you don't necessarily have to specify the target:

    gulp build --target chrome

Navigate to `chrome://extension`, make sure developer mode is enabled, and load
the `./build/chrome` directory as an unpacked extension in Chrome. As an alternative
you can automatically load the extension in a new Chromium browser profile with:

    npm run test_chromium

In Firefox, you have to use a tool called `web-ext` that runs the extension in
a temporary user session.

    npm i -g web-ext
    gulp build --target firefox
    web-ext run --source-dir build/firefox

Alternatively, you can run Firefox with the addon loaded in a new profile with:

    npm run test_firefox


## As webview
Click-to-dial's functionality, except for the automatic phonenumber recognizion &
call icon placement in tabs and their frames, can run outside the context of a
browser plugin; i.e. in a browser webview. This is especially useful for doing quick
iterations on styling and functionality that's not specific to web extensions.
You can use the [livereload](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei) extension to immediately reload changes, instead
of having to manually reload the plugin each time.

In order to bypass cross-domain browser security, you need to disable CORS in
Chrom(e/ium):

    gulp build watch --target electron
    chromium --disable-web-security --user-data-dir

Then visit `http://localhost:8999/electron/electron_webview.html`. Alternatively,
you can run the webview in Chromium with a temporary profile and disabled CORS using:

    npm run test_webview


## As desktop app
Click-to-dial can run as a desktop app using Electron. It requires electron to be
installed on your system, and to switch async/await support on through a flag.

    gulp build --target electron
    electron --js-flags='--harmony-async-await' build/electron/electron_main.js

Or run the same command as an npm script:

    npm run test_electron
