<div class="contacts-component updating-presence-status panel-content" :class="widgetState">

    <h1>{{$t('Contacts')}}</h1>

    <input class="input" type="email" placeholder="Find colleagues" :disabled="module.search.disabled" v-model="module.search.input">

    <ul class="list">
        <li class="list-item contact" v-for="contact in filteredContacts" @click="callContact(contact)">
            <div class="icon status-icon" :class="contact.state">
                <i class="icon-availability"></i>
            </div>
            <div class="info">
                <div class="name">{{contact.callerid_name}}</div>
                <div class="description">{{contact.internal_number}}</div>
            </div>
        </li>
        <!-- no search results -->
        <li class="list-item contact" v-if="!filteredContacts.length">
            <div class="icon status-icon"><i class="icon-availability"></i></div>
            <div class="info">
                <div class="name">{{$t('No contacts')}}</div>
            </div>
        </li>

        <!-- no contacts -->
        <li class="list-item contact" v-else-if="!module.contacts.length">
            <div class="icon status-icon"><i class="icon-availability"></i></div>
            <div class="info">
                <div class="name">{{$t('No contacts')}}</div>
            </div>
        </li>
    </ul>


    <div class="unauthorized-warning hide">{{$t('You are not authorized to monitor your colleagues\' presence.')}}</div>
</div>
