<a name="3.0.107"></a>
## [3.0.107](https://github.com/voipgrid/vialer-js/compare/v3.0.106...v3.0.107) (2018-04-03)


### Bug Fixes

* less obtrusive styling of tab icons. ([6370e5c](https://github.com/voipgrid/vialer-js/commit/6370e5c))



<a name="3.0.106"></a>
## [3.0.106](https://github.com/voipgrid/vialer-js/compare/v3.0.105...v3.0.106) (2018-04-03)


### Bug Fixes

* use utils namespace from skeleton. ([c3ee763](https://github.com/voipgrid/vialer-js/commit/c3ee763))



<a name="3.0.105"></a>
## [3.0.105](https://github.com/voipgrid/vialer-js/compare/v3.0.104...v3.0.105) (2018-04-03)


### Bug Fixes

* remove localVideo leftovers. ([2608e6a](https://github.com/voipgrid/vialer-js/commit/2608e6a))



<a name="3.0.104"></a>
## [3.0.104](https://github.com/voipgrid/vialer-js/compare/v3.0.103...v3.0.104) (2018-04-03)


### Bug Fixes

* do not depend on constructor names, since they will change after minification. ([725e2a4](https://github.com/voipgrid/vialer-js/commit/725e2a4))



<a name="3.0.103"></a>
## [3.0.103](https://github.com/voipgrid/vialer-js/compare/v3.0.102...v3.0.103) (2018-04-02)


### Bug Fixes

* bump db scheme. ([a064b55](https://github.com/voipgrid/vialer-js/commit/a064b55))



<a name="3.0.102"></a>
## [3.0.102](https://github.com/voipgrid/vialer-js/compare/v2.2.0...v3.0.102) (2018-04-02)


### Bug Fixes

* add package-lock.json ([268ac68](https://github.com/voipgrid/vialer-js/commit/268ac68))
* add same logic for tel: links. ([8c85d4f](https://github.com/voipgrid/vialer-js/commit/8c85d4f))
* adding logic to deal with disabled icons from the number of calls active. ([9c310fc](https://github.com/voipgrid/vialer-js/commit/9c310fc))
* adding svg icons, buildstep and updated styling. ([4781760](https://github.com/voipgrid/vialer-js/commit/4781760))
* always update token before performing autologin. ([50d09e0](https://github.com/voipgrid/vialer-js/commit/50d09e0))
* better environment detection for css. ([aed8127](https://github.com/voipgrid/vialer-js/commit/aed8127))
* build fixes for electron & firefox. Added Electron packaging. ([4a79417](https://github.com/voipgrid/vialer-js/commit/4a79417))
* changing availability switch now propagates placeholder changes properly. ([4918fd0](https://github.com/voipgrid/vialer-js/commit/4918fd0))
* cleanup connection state handling. ([e9f945d](https://github.com/voipgrid/vialer-js/commit/e9f945d))
* Cleanup helpers, cleanup component store mounts, added app store property, added vendor-specific builds. Added app name. Initial work to style the login page. ([808aa57](https://github.com/voipgrid/vialer-js/commit/808aa57))
* cleanup label styling. ([873acaf](https://github.com/voipgrid/vialer-js/commit/873acaf))
* cleanup notification after timeout. ([da6e366](https://github.com/voipgrid/vialer-js/commit/da6e366))
* cleanup observer, replace remaining $.each with iterator. ([24df3c0](https://github.com/voipgrid/vialer-js/commit/24df3c0))
* cleanup redundant font stuff, streamline svg build with a temp dir. Split svg icons in generic and brand-specific. ([b366585](https://github.com/voipgrid/vialer-js/commit/b366585))
* cleanup restoreState and handle changing internet connection. ([ce599d7](https://github.com/voipgrid/vialer-js/commit/ce599d7))
* contacts unavailable styling, keyboard focus keypad, menubar icon height, forget pw link. ([4d25024](https://github.com/voipgrid/vialer-js/commit/4d25024))
* electron build-dist variable assignment. ([1fadd0a](https://github.com/voipgrid/vialer-js/commit/1fadd0a))
* github pages deploy task. ([03e1a2b](https://github.com/voipgrid/vialer-js/commit/03e1a2b))
* import bulma-switch directive. ([18c769e](https://github.com/voipgrid/vialer-js/commit/18c769e))
* initial work on microphone control. ([635cad7](https://github.com/voipgrid/vialer-js/commit/635cad7))
* log skipped calls. ([a893b9a](https://github.com/voipgrid/vialer-js/commit/a893b9a))
* make component element display:block. ([d959ae8](https://github.com/voipgrid/vialer-js/commit/d959ae8))
* Obey click2dial setting. ([5d5b277](https://github.com/voipgrid/vialer-js/commit/5d5b277))
* osx styling layout. ([fd35940](https://github.com/voipgrid/vialer-js/commit/fd35940))
* pin vue version. ([bc69de6](https://github.com/voipgrid/vialer-js/commit/bc69de6))
* remove async from build-dist. bump schema. ([1e7cdb4](https://github.com/voipgrid/vialer-js/commit/1e7cdb4))
* remove redundant tab script. Add disabled styling. ([c1649e1](https://github.com/voipgrid/vialer-js/commit/c1649e1))
* remove remaining jquery isArray check. ([4c904d9](https://github.com/voipgrid/vialer-js/commit/4c904d9))
* remove remaining logging. ([f9051bc](https://github.com/voipgrid/vialer-js/commit/f9051bc))
* sentence with portal variable now has `the` before it. ([3c3307a](https://github.com/voipgrid/vialer-js/commit/3c3307a))
* simplify active call selection. ([12c281e](https://github.com/voipgrid/vialer-js/commit/12c281e))
* telemetry text changes, keypad disable condition fixes, voipaccount select visibility condition fix. ([15db226](https://github.com/voipgrid/vialer-js/commit/15db226))
* unify call translations and messages. ([08e6aa1](https://github.com/voipgrid/vialer-js/commit/08e6aa1))
* update docs & deps. ([77358c8](https://github.com/voipgrid/vialer-js/commit/77358c8))
* update documenation and cleanup code. ([820ebe6](https://github.com/voipgrid/vialer-js/commit/820ebe6))
* update documentation for bus session. ([f841b13](https://github.com/voipgrid/vialer-js/commit/f841b13))
* use component tag as custom outer element for components. ([a33bc56](https://github.com/voipgrid/vialer-js/commit/a33bc56))
* use correct camera disabled icon. ([9bd0845](https://github.com/voipgrid/vialer-js/commit/9bd0845))
* VIALJS-31 - apply CSS-grid styling. ([76b4992](https://github.com/voipgrid/vialer-js/commit/76b4992))
* VIALJS-33 add jsdoc strings to methods, classes, cleanup doc output. ([bd8380d](https://github.com/voipgrid/vialer-js/commit/bd8380d))
* VIALJS-52 call state stability fixes. Call state icon differentiation. Contacts sorting. ([bf44a69](https://github.com/voipgrid/vialer-js/commit/bf44a69))
* vue template versioning for real. ([fbd32f2](https://github.com/voipgrid/vialer-js/commit/fbd32f2))
* vue-svgicon from local packages. ([4488112](https://github.com/voipgrid/vialer-js/commit/4488112))


### Features

* add alpha build target. make buildname customizable. remove invalid stunserver config. ([9a81678](https://github.com/voipgrid/vialer-js/commit/9a81678))
* Add vendor support email option. More styling login component. Added svg logo and modified build. ([24afcce](https://github.com/voipgrid/vialer-js/commit/24afcce))
* add websocket retry delay, add presence throttle, moved app state to separate module, add online/offline state. ([a7b24f1](https://github.com/voipgrid/vialer-js/commit/a7b24f1))
* Added Telemetry component and events. ([212f49d](https://github.com/voipgrid/vialer-js/commit/212f49d))
* codec selection and functionality to make use of the new Opus feature in the VG backend. ([ae45988](https://github.com/voipgrid/vialer-js/commit/ae45988))
* deal with empty VoIP-account select. Added empty field option. Added notification box for empty situation. ([c57697b](https://github.com/voipgrid/vialer-js/commit/c57697b))
* Disable keypad when Calling conditions are not met. ([3ab92fb](https://github.com/voipgrid/vialer-js/commit/3ab92fb))
* initial unittests and isomorphic setup. ([60ecb89](https://github.com/voipgrid/vialer-js/commit/60ecb89))
* mute rtp sender (mute microphone). ([f019219](https://github.com/voipgrid/vialer-js/commit/f019219))
* onboarding; select voipaccount from available accounts, set installed flag, reorder settings. ([e068fb8](https://github.com/voipgrid/vialer-js/commit/e068fb8))
* removed jquery from vendor. replaced all selectors with querySelector. Fix calling through contextmenu. ([8d66983](https://github.com/voipgrid/vialer-js/commit/8d66983))
* replace all font icons with svg component. modified styling to resemble mockup new style. ([09f3ef2](https://github.com/voipgrid/vialer-js/commit/09f3ef2))
* replace open popup with hold shortcut(ctrl-shift-x). ([464ff60](https://github.com/voipgrid/vialer-js/commit/464ff60))
* settings and login field validation. ([5b9e2fc](https://github.com/voipgrid/vialer-js/commit/5b9e2fc))
* unified notification for click-to-dial label notifications. ([75b9021](https://github.com/voipgrid/vialer-js/commit/75b9021))
* VIALJS-40 about page component including support. ([75547fa](https://github.com/voipgrid/vialer-js/commit/75547fa))



<a name="2.2.0"></a>
# [2.2.0](https://github.com/voipgrid/vialer-js/compare/v2.1.0...v2.2.0) (2018-01-09)



<a name="2.1.0"></a>
# [2.1.0](https://github.com/voipgrid/vialer-js/compare/v2.0.16...v2.1.0) (2017-12-04)



<a name="2.0.16"></a>
## [2.0.16](https://github.com/voipgrid/vialer-js/compare/v2.0.15...v2.0.16) (2017-10-26)



<a name="2.0.15"></a>
## [2.0.15](https://github.com/voipgrid/vialer-js/compare/v2.0.14...v2.0.15) (2017-10-25)



<a name="2.0.14"></a>
## [2.0.14](https://github.com/voipgrid/vialer-js/compare/v2.0.13...v2.0.14) (2017-10-25)



<a name="2.0.13"></a>
## [2.0.13](https://github.com/voipgrid/vialer-js/compare/v2.0.12...v2.0.13) (2017-10-24)



<a name="2.0.12"></a>
## [2.0.12](https://github.com/voipgrid/vialer-js/compare/v2.0.7...v2.0.12) (2017-10-23)



<a name="2.0.7"></a>
## [2.0.7](https://github.com/voipgrid/vialer-js/compare/2.0.6...v2.0.7) (2017-10-12)



<a name="2.0.6"></a>
## 2.0.6 (2017-10-12)



