<div class="contacts-component no-padding" :class="widgetState">

    <div class="panel-content">
        <h1>{{$t('Contacts')}}</h1>
        <input class="input" autofocus type="email" :placeholder="$t('Find contact') + '...'" :disabled="module.search.disabled" v-model="module.search.input">
    </div>

    <ul class="list-items">
        <li class="list-item contact" v-for="contact in filteredContacts" @click="callContact(contact)" :class="{'disabled': sip.calls.length}">
            <div class="status-icon" :class="contact.state">
                <i class="icon icon-availability"></i>
            </div>
            <div class="info">
                <div class="name">{{contact.callerid_name}}</div>
                <div class="description">{{contact.internal_number}}</div>
            </div>
            <div class="contact-options">
                <div class="rounded-button" v-if="transferOngoing">
                    <i class="icon icon-transfer" v-on:click.once="transferActivate(contact.internal_number)"></i>
                </div>
            </div>
        </li>
        <!-- No search results -->
        <li class="list-item contact" v-if="!filteredContacts.length">
            <div class="icon status-icon"><i class="icon-availability"></i></div>
            <div class="info">
                <div class="name">{{$t('No contacts')}}</div>
            </div>
        </li>

        <!-- No contacts -->
        <li class="list-item contact" v-else-if="!module.contacts.length">
            <div class="icon status-icon"><i class="icon-availability"></i></div>
            <div class="info">
                <div class="name">{{$t('No contacts')}}</div>
            </div>
        </li>
    </ul>
</div>
