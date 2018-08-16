<component class="component-contacts padded">

    <header>
        <div class="header-line">
            <h1 class="uc">{{$t('contacts')}}</h1>
            <div class="vertical-devider"></div>
            <div class="content-filters">
                <div class="filter" :class="classes('filter-favorites')" @click="toggleFilterFavorites()">
                    <icon name="star"/>
                    <span class="cf">{{$t('favorites')}}</span>
                </div>
                <div class="filter" :class="classes('filter-online')" @click="toggleFilterOnline()">
                    <icon name="softphone"/>
                    <span class="cf">{{$t('online')}}</span>
                </div>
            </div>
        </div>
        <div class="header-line contacts-options">
            <div class="field field-text">
                <div class="control">
                    <input class="input" autofocus type="input"
                        :placeholder="$t('find contact').capitalize() + '...'"
                        :disabled="search.disabled"
                        v-model="search.input"/>
                </div>
            </div>

            <div class="display-mode" :class="classes('display-mode', 'lean')" @click="setDisplayMode('lean')">
                <icon name="contacts-lean"/>
            </div>
            <div class="display-mode" :class="classes('display-mode', 'regular')" @click="setDisplayMode('regular')">
                <icon name="contacts-regular"/>
            </div>
            <div class="display-mode" :class="classes('display-mode', 'dense')" @click="setDisplayMode('dense')">
                <icon name="contacts-dense"/>
            </div>
        </div>
    </header>


    <div class="contacts-list item-list" :class="classes('contacts-list')">
        <div class="loading-indicator" v-if="status === 'loading'">
            <div><icon class="spinner" name="spinner"/></div>
            <div class="text cf">{{$t('loading')}}<span>.</span><span>.</span><span>.</span></div>
        </div>

        <div class="no-results-indicator" v-else-if="!filteredContacts.length">
            <div><icon name="softphone"/></div>
            <div class="text cf">{{$t('no {target}', {target: $t('contacts')})}}...</div>
        </div>

        <div v-else class="contact item" v-for="contact in filteredContacts" :class="{'disabled': calls.length}">

            <div class="contact-representation">
                <icon class="placeholder" name="user" v-if="displayMode === 'lean'"/>
                <!-- Show the available endpoints -->
                <div class="endpoint-container" v-for="endpoint in contact.endpoints">
                    <icon class="endpoint-status-icon" name="availability" v-if="displayMode === 'lean'" :class="endpoint.status"/>
                    <div class="endpoint-status-led" v-else :class="endpoint.status"/>
                </div>
            </div>

            <div class="contact-info">
                <div class="name">{{contact.name}}</div>
                <div class="description">
                    <div v-for="endpoint in contact.endpoints">
                        {{endpoint.number}}
                    </div>
                </div>
            </div>

            <div class="contact-options item-options">
                <button class="item-option grey" :class="classes('favorite-button', contact.favorite)" v-on:click="toggleFavorite(contact)">
                    <icon name="star-circle" :class="contact.status"/>
                </button>
                <button class="item-option green" v-show="transferStatus === 'select'" :disabled="!isTransferTarget(contact)" v-on:click.once="callContact(contact)">
                    <icon name="transfer"/>
                </button>
                <button class="item-option green" v-show="!transferStatus" :disabled="callingDisabled || !callsReady || !contactIsCallable(contact)" v-on:click="callContact(contact)">
                    <icon name="phone-circle" :class="contact.status"/>
                </button>
            </div>

        </div>
    </div>
</component>
