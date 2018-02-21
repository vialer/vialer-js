<div class="contacts-component">

    <div class="panel-content">
        <h1>{{$t('Contacts')}}</h1>
        <input class="input" autofocus type="email" :placeholder="$t('Find contact') + '...'" :disabled="search.disabled" v-model="search.input">
    </div>

    <ul class="list-items">
        <li class="list-item contact" v-for="contact in filteredContacts" :key="contact.id" :class="{'disabled': calls.length}">
            <div class="status-icon">
                <svgicon class="icon-availability" name="availability" :class="contact.state"/>
            </div>
            <div class="info">
                <div class="name">{{contact.name}}</div>
                <div class="description">{{contact.number}}</div>
            </div>
            <div class="contact-options list-item-options">
                <div class="rounded-button" v-if="transferStatus === 'select' && !numbersOngoing.includes(contact.number)" v-on:click.once="createCall(contact.number)">
                    <svgicon name="transfer"/>
                </div>
                <div class="rounded-button" v-if="callsReady && !transferStatus" v-on:click="createCall(contact.number)">
                    <svgicon name="phone" :class="contact.state"/>
                </div>
            </div>
        </li>

        <li class="list-item contact" v-if="status === 'loading'">
            <div class="status-icon">
                <svgicon class="spinner" name="spinner"/>
            </div>
            <div class="info">
                <div class="name">{{$t('Loading')}}...</div>
            </div>
        </li>
        <!-- No search results -->
        <li class="list-item contact" v-else-if="!Object.keys(filteredContacts).length">
            <div class="icon status-icon">
                <svgicon class="icon-availability no-results" name="availability"/>
            </div>
            <div class="info">
                <div class="name">{{$t('No {target} found', {target: $t('contacts')})}}...</div>
            </div>
        </li>

        <!-- No contacts -->
        <li class="list-item contact" v-else-if="!Object.keys(contacts).length">
            <div class="icon status-icon">
                <svgicon class="icon-availability no-results" name="availability"/>
            </div>
            <div class="info">
                <div class="name">{{$t('No contacts')}}</div>
            </div>
        </li>
    </ul>
</div>
