<component class="view-page">
<h1>Deployment</h1>

<h2>Release cycle</h2>
<p>
Vialer-js uses <code>alpha</code>, <code>beta</code> and <code>production</code> release channels.
Each channel represents its own Chrome/Firefox store entry. A release will always be targetting the
<em>alpha</em> channel first, so bleeding-edge users can verify within a week that the
release works as expected. An alpha release will always involve a MINOR or a MAJOR semver
version bump. So version <code>4.0.0</code> will either become `4.1.0` or `5.0.0`,
depending on the nature of the changes. The following applies here:
<ul>
    <li>MAJOR when an incompatible API change influences (external) modules</li>
    <li>MINOR when new functionality is added in a backwards-compatible manner</li>
</ul>
</p>

<p>
    Semver PATCH versions are bumped while the alpha version needs to be updated,
    due to unencounted bugs or inconsistencies. So, <code>4.1.0</code> becomes <code>4.1.1</code>, <code>4.1.2</code>,
    or <code>5.0.0</code> becomes <code>5.0.1</code>, <code>5.0.2</code>, etc.,
    depending on the amount of bugfix
    releases needed.

    When the alpa testusers report a succesful release after a week, we proceed by
    publishing the beta version to our larger testusers pool in the beta channel.
    Then after a week again, when the beta testusers didn't report any problems,
    we proceed by publishing the production version to our main users. So, there
    is a two-week delay between an alpha release and a production release.
</p>

<h2>Store details</h2>
<pre v-highlightjs><code class="bash">gulp deploy --brand bologna --target chrome --deploy alpha
</code></pre>

<p>
    The buildsystem can publish to the Chrome webstore and Mozilla <a href="https://addons.mozilla.org">
    addons store</a>. A Google account and a $5 developer fee paid with a creditcard is needed
    to enable publishing rights to the Chrome webstore. Store-related branding
    material includes:
    <ul>
        <li>Plugin logo for the stores (logo-128.png can be reused)</li>
        <li>1 Promotion tile for the Chrome store (440x280 png-file)</li>
        <li>4 Promotional images/screenshots (640x400 png-files)</li>
        <li>English and Dutch WebExtension description texts</li>
        <li>Support email/phone/website</li>
        <li>Google Analytics ID (optional)</li>
    </ul>
</p>

<p>
    Building and deployment to the Firefox and Chrome store is an automated process.
    In order to deploy to one of the supported stores, you need to fill in API credentials in <code>.vialer-jsrc</code>.
</p>

<p>
    For Chrome, the required store credentials are <code>extensionId</code>, <code>clientId</code>,
    <code>clientSecret</code> and <code>refreshToken</code>. See this <a href="https://developer.chrome.com/webstore/using_webstore_api">manual</a>
    on how to lookup these fields. Check the Google <a href="https://chrome.google.com/webstore/developer/dashboard">developer dashboard</a>
    for the newly published plugin's status. The plugin will generally be updated to all users
    within several hours, when the browser checks for extension updates. You can <a href="https://developer.chrome.com/apps/autoupdate#testing">manually override</a>
    this behaviour in Chrome to see if the new version is updated correctly.
</p>

<p>
    For Firefox, fill in the <code>apiKey</code> and <code>apiSecret</code> from the <a href="https://addons.mozilla.org/nl/developers/addon/api/key/">API key</a> management page.
    The Mozilla WebExtension release process is partly automated, but also has random
    manual reviews. Checkout the <a href="https://addons.mozilla.org/nl/developers/addon/vialer/versions">Mozilla developer dashboard</a>
    for the release status. You can contact an AMO-editor on <a href="irc://mozilla.org/%23amo">irc</a>
    for help and questions about the reviewing process.
</p>
</component>
