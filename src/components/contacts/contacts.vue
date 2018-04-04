<component class="component-contacts">
    <div class="panel-content">
        <header>
            <h1>{{$t('Contacts')}}</h1>
            <div class="vertical-devider"></div>
            <div class="filters">
                <div class="filter favorites-filter" :class="classes('favorites-filter')" @click="toggleFilterFavorites()">
                    <icon name="star"/>
                    {{$t('Favorites')}}
                </div>
            </div>
        </header>
        <div class="contacts-options">
            <input class="input" autofocus type="email"
                :placeholder="$t('Find contact') + '...'"
                :disabled="search.disabled"
                v-model="search.input"/>
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

        <div class="contacts-list" :class="classes('contacts-list')">
            <div class="contact" v-for="contact in filteredContacts" :class="{'disabled': calls.length}">

                <div class="contact-avatar">
                    <icon class="placeholder" name="user" v-if="displayMode === 'lean'"/>
                    <!-- Show the available endpoints -->
                    <template v-for="endpoint in contact.endpoints">
                        <icon class="call-color-status" name="availability"
                            v-if="['lean', 'regular'].includes(displayMode)" :class="endpoint.status"/>
                        <div class="call-color-status" v-else :class="endpoint.status"/>
                    </template>
                </div>
                <div class="contact-info">
                    <div class="name">{{contact.name}}</div>
                    <div class="description">
                        <template v-for="endpoint in contact.endpoints">
                            {{endpoint.number}}
                        </template>
                    </div>
                </div>
                <div class="contact-specials">
                    <icon class="favorite" name="star" v-if="contact.favorite"/>
                </div>

                <div class="item-slider">
                    <div class="item-slider-option green" v-if="transferStatus === 'select' && !numbersOngoing.includes(contact.number)" v-on:click.once="callContact(contact)">
                        {{$t('Transfer')}}
                        <icon name="transfer"/>
                    </div>
                    <div class="item-slider-option green" v-if="callsReady && !transferStatus && contactIsCallable(contact)" v-on:click="callContact(contact)">
                        {{$t('Call')}}
                        <icon name="phone-circle" :class="contact.status"/>
                    </div>
                    <div class="item-slider-option grey" :class="classes('favorite-button', contact.favorite)" v-if="!transferStatus" v-on:click="toggleFavorite(contact)">
                        {{$t('Fav.')}}
                        <icon name="star-circle" :class="contact.status"/>
                    </div>
                </div>
            </div>

            <div class="contact" v-if="status === 'loading'">
                <div class="avatar">
                    <icon class="spinner" name="spinner"/>
                </div>
                <div class="info">
                    <div class="name">{{$t('Loading contacts')}}...</div>
                </div>
            </div>

            <!-- No search results -->
            <div class="no-results" v-else-if="!filteredContacts.length">
                <icon class="no-results-icon" name="contacts"/>
                <div class="no-results-text">{{$t('No {target} found', {target: $t('contacts')})}}...</div>
            </div>
        </div>
    </div>


</component>
