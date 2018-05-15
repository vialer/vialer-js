## Using gulp
Use the gulp watch method to work on the plugin like:

```bash
gulp watch # when working on Chrom(e/ium)
gulp watch --target firefox # when working on Firefox
gulp watch --target electron # when working on Electron
```

After every filechange, the plugin will be automatically rebuilt. However,
the plugin won't be automatically reloaded in the browser. You can trigger the
Chrome plugin to reload from `chrome://extensions/`. This sometimes fails to
 properly reload all scripts. Use the [extension reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid)
to force a reload each time. Keep in mind that you still have to close/open a
tab in case you want the tab & observer scripts to reload.

Web-ext for Firefox reloads the plugin automatically after each change, so
you don't have to force a reload in the browser. This process is error-prone.
Also, the Firefox debugger lacks most of the debugging consoles for
each running script, making it far less suitable for generic
non-browser-vendor specific development.

For Electron, there is currently no way to autoreload.

When working on styling/testing the popup, there is also another option.
Besides running the Vialer-js popup in the context of an Electron webview,
it is also possible to run it in a regular browser view when the browser's
same-origin policy is disabled. This is useful during development, because
it allows developers to quickly iterate on styling and functionality
of the main popup. See for example:

```bash
gulp build watch --target electron
# Make sure you don't already have a Chrom(e/ium) window open when running this.
npm run test_webview
```

The popup should work as expected. For development it is easier to use an existing browser profile,
so you can watch for changes using the [livereload extension](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei).
Start the browser with:

```bash
chromium --disable-web-security --user-data-dir http://localhost:8999/electron/electron_webview.html
```

Switch livereload and make some changes to styling (instant reload) or a Javascript
file (page reload).
