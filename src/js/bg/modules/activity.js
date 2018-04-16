/**
* The Activity module is mainly used to show recent Call
* history and allow the user to make reminders from
* activity entries.
* @module ModuleActivity
*/
const Module = require('../lib/module')

// Cap the maximum amount of stored activities, so the
// localStorage won't be grinded to a halt.
const MAX_ACTIVITIES = 20

/**
* Main entrypoint for Activity.
* @memberof AppBackground.modules
*/
class ModuleActivity extends Module {
    /**
    * @param {AppBackground} app - The background application.
    */
    constructor(app) {
        super(app)

        this.app.on('bg:calls:call_rejected', ({call}) => {
            let activity = {
                label: 'missed',
                status: 'warning',
                type: `${call.type}-call`,
            }
            const contact = this.app.helpers.matchContact(call.number)
            if (contact) Object.assign(activity, contact)
            else activity.number = call.number
            this.addActivity(activity)
        })

        this.app.on('bg:calls:call_ended', ({call}) => {
            let activity = {
                status: 'success',
                type: `${call.type}-call`,
            }

            const contact = this.app.helpers.matchContact(call.number)
            if (contact) Object.assign(activity, contact)
            else activity.number = call.number
            this.addActivity(activity)
        })
    }


    /**
    * Initializes the module's store.
    * @returns {Object} The module's store properties.
    */
    _initialState() {
        return {
            activity: [],
            filters: {
                missed: false,
                reminders: false,
            },
            unread: false,
        }
    }


    /**
    * And an activity entry. Use an `endpointId` when the activity
    * comes from an existing Contact Endpoint. Use a `number` when
    * the activity is Callable. Use the title directly otherwise.
    * @param {String} [contact] - Contact to link to the activity.
    * @param {String} [endpoint] - Endpoint to link to the activity.
    * @param {String} [label] - Label next to the activity.
    * @param {String} [number] - Number in case of no existing endpoint.
    * @param {String} type - Maps to a svgicon.
    */
    addActivity({contact = null, endpoint = null, label = '', number = null, status = 'success', type = 'incoming'}) {
        let activity = this.app.state.activity.activity
        activity.unshift({
            contact,
            date: new Date().getTime(),
            endpoint,
            id: shortid.generate(),
            label,
            number,
            remind: false,
            status,
            type,
        })

        if (activity.length > MAX_ACTIVITIES) {
            // Check which discarded activities are reminders first.
            let reminders = activity.slice(MAX_ACTIVITIES).filter((i) => i.remind)
            // Slice the list of activities and add the reminders at the end.
            activity = activity.slice(0, MAX_ACTIVITIES).concat(reminders)
        }

        // New activity is added. Mark it as unread when the current layer
        // is not set on `activity`. The unread property is deactivated again
        // when the activity component mounts.
        this.app.setState({
            activity: {
                activity,
                unread: this.app.state.ui.layer !== 'activity',
            },
        }, {persist: true})
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[activity] `
    }
}

module.exports = ModuleActivity
