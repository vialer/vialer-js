# Click-to-dial
This is the Click-to-dial project. It includes build targets for Firefox and Chrome web extension, web(requires CORS) and Electron desktop app.

# Install
First install all Gulp modules. A recent Node version(8+) and npm version(5+)
is required.

    git clone git@github.com:VoIPGRID/click-to-dial.git
    cd click-to-dial
    npm i
    gulp build

## Web-extension
Navigate to `chrome://extension`, make sure developer mode is enabled, and just load
the build directory as an unpacked extension in Chrome.

In Firefox, there is a tool called `web-ext` that runs the extension in a temporary
user session.

    npm i -g web-ext
    cd build
    web-ext run

## Web
You need to disable CORS in Chromium in order to test the Click-to-dial plugin
from localhost within a webpage, because XHR requests are normally not allowed
crossdomain. Start chromium like:

    chromium --disable-web-security --user-data-dir

Then visit `http://localhost:8999/click-to-dial-web.html`.

## Desktop
The desktop version doesn't need any transpiling at all. Just run with electron:

    cd click-to-dial/src/js
    electron desktop.js
