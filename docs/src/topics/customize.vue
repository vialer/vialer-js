# Customize your build

## Brand target
### Settings
To start customizing a brand, the first thing you want to do is to add your brand
(e.g. `yourbrand`) in the *brands* section of `.vialer-jsrc` by copying the *bologna* brand
schema. Then copy the `src/brand/bologna` directory and its content to `src/brand/yourbrand`.
Make sure the name exactly matches the key you use in the brands section of `.vialer-jsrc`.
Overwrite the images in `src/brand/yourbrand/img` with your own. The color palette of `yourbrand`
can be used to match your corporate identity.

### Plugins
In `.vialer-jsrc` there is a section that references plugins which can be used
while building Vialer-js. The Bologna build is quite minimal. Another
vendor-specific build (VoIPGRID) uses a more extensive plugin setup:

```javascript
"plugins": {
    "builtin": {
        "availability": {
            "addons": {
                "bg": ["vjs-addon-availability-vg"],
                "fg": ["vjs-addon-availability-vg"],
                "i18n": ["vjs-addon-availability-vg"]
            }
        },
        "contacts": {
            "i18n": ["vjs-provider-contacts-vg"],
            "providers": ["vjs-provider-contacts-vg"]
        },
        "user": {
            "adapter": "vjs-adapter-user-vg",
            "i18n": ["vjs-adapter-user-vg"]
        }
    },
    "custom": {
        "queues": {
            "name": "vjs-mod-queues-vg",
            "parts": ["bg", "fg", "i18n"]
        }
    }
}
```
Builtin plugins already contain functionality, but uses either an *adapter*
pattern, *providers* or *addons* to add functionality. For now, the only
documentation on how to write a plugin is to checkout the plugin source code for
more information.

### Images
Please do not publish Vialer-js under a different name with the same branding
as one of the existing brands. If you want to create your own brand, come up with
a branding name for your plugin, a unique color scheme and create branded versions
of at least the following images:
* *menubar-active.png*
* *menubar-dnd.png*
* *menubar-disconnected.png*
* *menubar-inactive.png*
* *menubar-lock.png*
* *menubar-unavailable.png*
* *menubar-ringing-0.png...menubar-ringing-4.png (sprite animation)*
* *notification.png*
* *electron-systray.png*
* *electron-systray.icns*
* *logo-16.png*
* *logo-32.png*
* *logo-64.png*
* *logo-128.png*


## Build targets
### Webview
```bash
gulp build watch --brand yourbrand --target webview
```
The preferred workflow for development is to use the webview build target.
The Vialer-js brand will be automatically rebuilt after every filechange in
the sourcecode. You will get the fastest development feedback loop if you use the
webview build. Use this whenever you are not developing platform-specific code.
You can trigger the webview to automatically reload after the build finished using
the [livereload extension](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei).
A handy trick to test API-calls during development without the need for CORS:
```bash
# --ignore-certificate-errors may be useful in certain cases as well.
chromium --disable-web-security --user-data-dir=~/.chromium-temp
# Visit localhost:8999 to see the built webview.
```

### WebExtension
```bash
gulp build watch --brand yourbrand --target chrome
gulp build watch --brand yourbrand --target firefox
```
Livereloading is not supported when building a WebExtension. There is a manual
reload option in `chrome://extensions/` which works most of the time for
the background and foreground script. A slightly faster and more reliable way
to reload all scripts is to use the [extension reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid).
Keep in mind that you still have to close/open a tab in case you want a
tab script to reload.

Web-ext for Firefox reloads the plugin automatically after each change, so you
don't have to force a reload in the browser. This process can be error-prone though.
Also, the Firefox debugger lacks specific debugging consoles for each running
script instance, making it a less attractive IDE for developing WebExtensions.

### Electron
```bash
gulp build watch --brand yourbrand --target electron
./node_modules/electron/dist/electron build/yourbrand/electron/main.js
```
The Electron build currently uses a [autoreload package](https://www.npmjs.com/package/electron-reload)
in the main.js file, which seems to work well. After making changes, the webview is reloaded.
However, in most situations you'll find that a webview is the fastest option to
develop functionality with. Especially autoreload on styling works quite nice
in the webview mode.
