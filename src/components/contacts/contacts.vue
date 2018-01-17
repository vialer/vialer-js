<div class="contacts-component updating-presence-status panel-content" :class="widgetState">

    <h1>{{$t(name)}}</h1>
    
    <ul class="widget-item-list">
        <li class="widget-item contact" v-for="contact in filteredContacts" @click="callContact(contact)">
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
        <li class="widget-item contact" v-else-if="!module.contacts.length">
            <div class="icon status-icon"><i class="icon-availability"></i></div>
            <div class="info">
                <div class="name">{{$t('No contacts')}}</div>
            </div>
        </li>
    </ul>


    <div class="unauthorized-warning hide">{{$t('You are not authorized to monitor your colleagues\' presence.')}}</div>
</div>
