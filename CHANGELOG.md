# Changelog

## Version 2.0.7
* Move logout icon in front of email
* Change colleagues widget icon
* Update font with added entity icon

## Version 2.0.2
This release is a major refactor of the Vialer plugin. Most of the work
that was done, had to do with making the plugin WebExtensions-ready when
Firefox 57 is released. Visible changes:

* Presence information is synced more reliably to the UI
* Cleaned up styling, improved styling consistency, new icons and Roboto font
* Styled settings page
* Automatic logout after changing platform url when logged in
* Cleaned up popout view, changed flexbox layout
* Changing the platform url while being logged in, will show a warning and log the user out after save
* Queues list will show an empty list initially
* Queue updates are done with 1 API call instead of 1 request per queue
* Cleaned up callstatus status poller and notifications. Notification and Callstatus now inform earlier on
* Callstatus iframe now takes the whole page width/height. Not possible to click on items behind the overlay anymore
* Repeated timer functions are now handled async
* Widget open state is not affected anymore by refreshing the popout
* Disable call options when a call is in progress

Invisible changes:
* Refactored codebase
* Rewrote to use chrome namespace; plugin can now be deployed as Firefox and Chrome plugin
* Improved logging
* Simplified Eventemitter API to deal with IPC messaging
* Experimental Electron build
* Gulp buildsystem, simplified development and deployment
