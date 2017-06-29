# Click-to-dial
This is the Click-to-dial project. It includes build targets for Firefox and Chrome web extension, web(requires CORS) and Electron desktop app.

# Install
First install all Gulp modules. A recent Node version(8+) and npm version(5+)
is required.

    git clone git@github.com:VoIPGRID/click-to-dial.git
    cd click-to-dial
    npm i

## Web-extension
Build click-to-dial as an extension. Chrome is the default build target,
so you don't necessarily have to specify the target:

    gulp build --target chrome

Navigate to `chrome://extension`, make sure developer mode is enabled, and load
the `./build/chrome` directory as an unpacked extension in Chrome.

In Firefox, there is a tool called `web-ext` that runs the extension in a temporary
user session.

    npm i -g web-ext
    gulp build --target firefox
    web-ext run --source-dir build/firefox

## Electron
Build click-to-dial as a desktop app and run it. It requires electron to be
installed on your system.

    gulp build --target electron
    npm run electron

## Web
You can run the Electron webview as a regular webpage. This is especially useful
for doing quick iterations on styling. You need to disable CORS in Chromium in
order to test Click-to-dial from localhost within a webpage, because XHR requests
are normally not allowed to pass cross-domain. Start chromium like:

    gulp build watch --target electron
    chromium --disable-web-security --user-data-dir

Then visit `http://localhost:8999/electron/electron_webview.html`. Use livereload
for instant reloads while editing scss files.
