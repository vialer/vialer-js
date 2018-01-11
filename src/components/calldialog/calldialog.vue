<div class="calldialog-component">

    <div class="number-display">{{module.number}}</div>
    <div class="timer">
        {{minutes | two_digits}}:{{seconds | two_digits}}
    </div>

    <div class="options">
        <div class="option">
            <span class="decline fa-stack fa-3x" @click="declineSession">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-hand-scissors-o fa-stack-1x fa-inverse"></i>
            </span>
        </div>

        <div class="option">
            <span class="decline fa-stack fa-3x" @click="declineSession">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-pause fa-stack-1x fa-inverse"></i>
            </span>
        </div>

        <div class="option">
            <span class="decline fa-stack fa-3x" @click="declineSession">
              <i class="fa fa-circle fa-stack-2x"></i>
              <i class="fa fa-th fa-stack-1x fa-inverse"></i>
            </span>
        </div>
    </div>


    <div class="actions">
        <div class="field is-grouped is-grouped-centered">
            <p class="control">
                <span class="decline fa-stack fa-3x" @click="declineSession">
                  <i class="fa fa-circle fa-stack-2x"></i>
                  <i class="fa fa-close fa-stack-1x fa-inverse"></i>
                </span>
            </p>
        </div>

        <div class="field is-grouped is-grouped-centered">
            <p class="control">
                <span class="accept fa-stack fa-3x" @click="acceptSession">
                  <i class="fa fa-circle fa-stack-2x"></i>
                  <i class="fa fa-phone fa-stack-1x fa-inverse"></i>
                </span>
            </p>
        </div>
    </div>


</div>
