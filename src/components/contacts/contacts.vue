<div class="contacts-component">

    <div class="panel-content">
        <h1>{{$t('Contacts')}}</h1>
        <input class="input" autofocus type="email" :placeholder="$t('Find contact') + '...'" :disabled="search.disabled" v-model="search.input">
    </div>

    <ul class="list-items">
        <li class="list-item contact" v-for="contact in filteredContacts" :key="contact.id" :class="{'disabled': calls.length}">
            <div class="status-icon" :class="contact.state">
                <i class="icon icon-availability"></i>
            </div>
            <div class="info">
                <div class="name">{{contact.name}}</div>
                <div class="description">{{contact.number}}</div>
            </div>
            <div class="contact-options list-item-options">
                <div class="rounded-button" v-if="transferStatus === 'select' && !numbersOngoing.includes(contact.number)">
                    <i class="icon icon-transfer" v-on:click.once="transferActivate(contact.number)"></i>
                </div>
                <div class="rounded-button" v-if="!transferStatus && !numbersOngoing.length">
                    <i class="icon icon-phone" v-on:click="callContact(contact)"></i>
                </div>
            </div>
        </li>

        <li class="list-item contact" v-if="state === 'loading'">
            <div class="icon status-icon"><i class="fa fa-spinner fa-spin"></i></div>
            <div class="info"><div class="name">{{$t('Loading...')}}</div></div>
        </li>
        <!-- No search results -->
        <li class="list-item contact" v-else-if="!Object.keys(filteredContacts).length">
            <div class="icon status-icon"><i class="icon-availability"></i></div>
            <div class="info"><div class="name">{{$t('No {target} found', {target: $t('contacts')})}}...</div></div>
        </li>

        <!-- No contacts -->
        <li class="list-item contact" v-else-if="!Object.keys(contacts).length">
            <div class="icon status-icon"><i class="icon-availability"></i></div>
            <div class="info"><div class="name">{{$t('No contacts')}}</div></div>
        </li>
    </ul>
</div>
