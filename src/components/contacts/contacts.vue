<div class="contacts-component panel-content" :class="widgetState">

    <h1>{{$t('Contacts')}}</h1>

    <input class="input" type="email" placeholder="Find colleagues" :disabled="module.search.disabled" v-model="module.search.input">

    <ul class="list-items">
        <li class="list-item contact" v-for="contact in filteredContacts" @click="callContact(contact)">
            <div class="icon status-icon" :class="contact.state">
                <i class="icon-availability"></i>
            </div>
            <div class="info">
                <div class="name">{{contact.callerid_name}}</div>
                <div class="description">{{contact.internal_number}}</div>
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
