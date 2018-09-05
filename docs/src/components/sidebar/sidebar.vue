<component class="component-sidebar">
    <header class="header">
        <div class="header-logo">
            <router-link to="/">
                <img src="/img/logo-128.png"/>
            </router-link>
        </div>
        <div class="header-title">{{vendor.name}}</div>
        <div class="header-brand">Vialer-js {{version.current}}</div>
    </header>
    <nav class="navigation">
        <div class="navigation-header">Developer topics</div>
        <router-link class="navigation-link" v-if="topic.name === 'quickstart'" v-for="(topic, name) in topics" :to="{name: 'view_quickstart'}">
            {{topic.title}}
        </router-link>
        <router-link class="navigation-link" v-if="topic.name !== 'quickstart'" :to="{name: 'view_topic', params: {topic_id: topic.name}}" v-for="(topic, name) in topics">
            {{topic.title}}
        </router-link>

    </nav>
</component>
