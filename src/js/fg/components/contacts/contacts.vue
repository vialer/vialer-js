<div class="widget contacts" :class="widgetState">
    <div class="widget-header" v-on:click="toggleActive('contacts')">
        <div class="widget-header-icons">
            <i class="widget-icon icon-entity"></i>
            <i class="busy-icon icon-refresh icon-spin"></i>
            <i class="unauthorized-icon icon-warning"></i>
        </div>

        <div class="widget-header-text">{{$t('Colleagues')}}</div>

        <span class="status-indicators">
            <i v-if="module.sip.state=='updating'" class="icon-blink icon-cloud-download"
                :title="$t('Waiting for presence information.')"></i>
            <i v-else-if="module.sip.state=='disconnected'" class="icon-blink icon-lost-connection"
                :title="$t('No presence information available right now.')"></i>
        </span>

        <div class="search">
            <i class="icon-search"></i>
            <input type="text" :disabled="module.search.disabled" v-model="module.search.input" />
        </div>
    </div>

    <div class="widget-content">
        <ul class="widget-item-list">
            <li class="widget-item contact" v-for="contact in filteredContacts" v-on:click="callContact(contact)">
                <div class="icon status-icon" :class="contact.state">
                    <i class="icon-availability"></i>
                </div>
                <div class="info">
                    <div class="name">{{contact.callerid_name}}</div>
                    <div class="description">{{contact.internal_number}}</div>
                </div>
            </li>
            <!-- no search results -->
            <li class="widget-item contact" v-if="!filteredContacts.length">
                <div class="icon status-icon"><i class="icon-availability"></i></div>
                <div class="info">
                    <div class="name">{{$t('No contacts')}}</div>
                </div>
            </li>

            <!-- no contacts -->
            <li class="widget-item contact" v-if="!module.contacts.length">
                <div class="icon status-icon"><i class="icon-availability"></i></div>
                <div class="info">
                    <div class="name">{{$t('No contacts')}}</div>
                </div>
            </li>
        </ul>
    </div>

    <div class="unauthorized-warning hide">{{$t('You are not authorized to monitor your colleagues\' presence.')}}</div>
</div>
