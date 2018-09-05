<component class="view-page">
    <h1>Customization</h1>

    <h2>Branding</h2>
    <p>
        To start customizing a brand, the first thing you want to do is to add your brand
        (e.g. <b>yourbrand</b>) in the <em>brands</em> section of <code>.vialer-jsrc</code>
        by copying the <em>bologna</em> brand schema. Then copy the <code>src/brand/bologna</code>
        directory and its content to <code>src/brand/yourbrand</code>.
        Make sure that the name exactly matches the key you use in the brands section of <code>.vialer-jsrc</code>.
        Overwrite the images in <code>src/brand/yourbrand/img</code> with your own. The color palette of
        <em>yourbrand</em> can be used to match your branding identity.
    </p>

    <p>
        Please <b>do not</b> publish Vialer-js under a different name with a branding
        that already exists. If you want to create your own brand, come up with
        a unique branding name for your plugin, a unique color scheme and create branded
        versions of at least the following images:
    </p>
    <ul>
        <li>menubar-active.png</li>
        <li>menubar-dnd.png</li>
        <li>menubar-disconnected.png</li>
        <li>menubar-inactive.png</li>
        <li>menubar-lock.png</li>
        <li>menubar-unavailable.png</li>
        <li>menubar-ringing-0.png ... menubar-ringing-4.png (sprite animation)</li>
        <li>notification.png</li>
        <li>electron-systray.png</li>
        <li>electron-systray.icns</li>
        <li>logo-16.png</li>
        <li>logo-32.png</li>
        <li>logo-64.png</li>
        <li>logo-128.png</li>
    </ul>

    <h2>Plugins</h2>
    <p>
        In <code>.vialer-jsrc</code> there is a section that references plugins which
        are used to add custom functionality to your build. The <em>Bologna</em> build is
        quite minimal. A different build with a more extensive plugin setup could look like:
    </p>

<pre v-highlightjs><code class="json">"plugins": {
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
</code></pre>
    <p>
        The <em>builtin</em> plugins are existing core plugins, that can be extended
        by using a custom <i>adapter</i>, a <i>provider</i> or an <i>addon</i>.
        This whole system is still a bit in flux and not documented yet.
        Please checkout the sourcecode of <a href="https://github.com/vialer/vjs-adapter-user-vg">example plugins</a>
        for documentation.
    </p>

</component>
