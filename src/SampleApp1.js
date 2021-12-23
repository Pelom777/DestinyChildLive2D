var thisRef = this;
var $msg;

window.onerror = function(msg, url, line, col, error) {
    var errmsg = "file:" + url + "<br>line:" + line + " " + msg;
    l2dError(errmsg);
}

function sampleApp1(defaultModel = 'c521_10')
{
    this.platform = window.navigator.platform.toLowerCase();
    
    this.live2DMgr = new LAppLive2DManager();

    this.isDrawStart = false;
    
    this.gl = null;
    this.canvas = null;
    
    this.dragMgr = null; /*new L2DTargetPoint();*/ 
    this.viewMatrix = null; /*new L2DViewMatrix();*/
    this.projMatrix = null; /*new L2DMatrix44()*/
    this.deviceToScreen = null; /*new L2DMatrix44();*/
    
    this.drag = false; 
    this.oldLen = 0;    
    
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    this.isModelShown = false;
    
    initL2dCanvas("glcanvas");

    $.getJSON('./assets/names.json', function (data) {
        nameList = eval(data);
        init(defaultModel);
    })
}


function initL2dCanvas(canvasId)
{
    
    this.canvas = document.getElementById(canvasId);
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    if(this.canvas.addEventListener) {
        this.canvas.addEventListener("mousewheel", mouseEvent, false);
        this.canvas.addEventListener("click", mouseEvent, false);
        
        this.canvas.addEventListener("mousedown", mouseEvent, false);
        this.canvas.addEventListener("mousemove", mouseEvent, false);
        
        this.canvas.addEventListener("mouseup", mouseEvent, false);
        this.canvas.addEventListener("mouseout", mouseEvent, false);
        this.canvas.addEventListener("contextmenu", mouseEvent, false);
        
        
        this.canvas.addEventListener("touchstart", touchEvent, false);
        this.canvas.addEventListener("touchend", touchEvent, false);
        this.canvas.addEventListener("touchmove", touchEvent, false);
        
    }
    
}
var showMessage = function (text, delay) {
    if ($msg === undefined) {
        $msg = $('<div></div>').attr('class', 'message');
        $('body').append($msg);
    }
    if ($msg.css('display') != 'none') {
        $msg.finish();
    }
    $msg.html(text);
    $msg.fadeIn(500).delay(delay).fadeOut(500);
}
var getUrlParam = function () {
    var url = window.location.href;
    param = url.split('?')[1];
    if (url === undefined) {
        return;
    }
    for (var i in nameList) {
        if (param == nameList[i]) {
            return param;
        }
    }
}
var setUrlParam = function () {
    var url = window.location.href;
    url = url.split('?')[0];
    url += '?' + $currentModel.text();
    return url;
}
var scrollToCurrent = function(){
    $box.animate({scrollTop: $box.scrollTop() + $currentModel.offset().top - $(window).height() / 2}, 1000);
}

function init(defaultModel)
{
    defaultModel = getUrlParam() || defaultModel;
    showMessage('滚动滚轮以缩放<br>点击左下角图标开始拖动', 4000);

    // set translate method
    isMoving = false;
    $move = $('#move');
    $move.on('click', function(){
        if(isMoving == true){
            isMoving = false;
            $move.removeClass('moving');
            $(document).off('mousedown');
        }
        else{
            isMoving = true;
            $move.addClass('moving');
            $(document).on('mousedown', function(e){
                if(e.button != 0)
                    return;
                var startX = e.clientX, startY = e.clientY;
                $(document).on('mousemove', function(e){
                    offsetX = e.clientX - startX, offsetY = e.clientY - startY;
                    startX = e.clientX, startY = e.clientY;
                    thisRef.viewMatrix.multTranslate(offsetX / 225, - offsetY / 225);
                })
                $(document).on('mouseup', function(){
                    $(document).off('mousemove');
                    $(document).off('mouseup');
                })
            })
        }
    })

    // set model list
    $box = $('#box');
    $currentModel = null;
    for(var i=0;i<nameList.length;i++) {
        var $button = $('<button></button>');
        if(nameList[i][0] == 'c'){
            $button.css('background', 'url(./assets/live2d/' + nameList[i] + '/icon.png) scroll 50% 50%');
        }
        else{
            $button.text(nameList[i]);
        }
        $button.attr('id', nameList[i]);
        $button.on('click', function(){
            $currentModel.removeClass('current');
            $(this).addClass('current');
            $currentModel = $(this);
            changeModel(this.id);
            scrollToCurrent();
        })
        $box.append($button);
        if(nameList[i] == defaultModel){
            $button.addClass('current')
            $currentModel = $button;
        }
    }

    //set scroll method
    $box.hover(null, function(){
        setTimeout(function(){
            scrollToCurrent();
        }, 500);
    })

    // set share method
	$('#share').on('click', function () {
		var url = setUrlParam();
		var input = $('<input>').attr('value', url).attr('readonly', 'readonly');
		$('body').append(input);
		input.select();
		document.execCommand('copy');
		input.remove();
		showMessage('链接已复制至剪贴板', 1000);
	})
	$('#share').on('mouseenter', function () {
		showMessage('点击左上分享按钮，即可将当前角色及动作分享给他人', 4000);
	})

    // set scale method
    document.onwheel = function(e){
        if(e.target != canvas)
            return;
        if(e.wheelDelta > 0)
            modelScaling(1.1);
        else modelScaling(0.9);
    }

    var width = this.canvas.width;
    var height = this.canvas.height;
    
    this.dragMgr = new L2DTargetPoint();

    
    var ratio = height / width;
    var left = LAppDefine.VIEW_LOGICAL_LEFT;
    var right = LAppDefine.VIEW_LOGICAL_RIGHT;
    var bottom = -ratio;
    var top = ratio;

    this.viewMatrix = new L2DViewMatrix();

    
    this.viewMatrix.setScreenRect(left, right, bottom, top);
    
    
    this.viewMatrix.setMaxScreenRect(LAppDefine.VIEW_LOGICAL_MAX_LEFT,
                                     LAppDefine.VIEW_LOGICAL_MAX_RIGHT,
                                     LAppDefine.VIEW_LOGICAL_MAX_BOTTOM,
                                     LAppDefine.VIEW_LOGICAL_MAX_TOP); 

    this.viewMatrix.setMaxScale(LAppDefine.VIEW_MAX_SCALE);
    this.viewMatrix.setMinScale(LAppDefine.VIEW_MIN_SCALE);

    this.projMatrix = new L2DMatrix44();
    // this.projMatrix.multScale(1, (width / height)); // adjust to width
    this.projMatrix.multScale((height / width), 1); // adjust to height
    this.projMatrix.multScale(.6, .6);

    
    this.deviceToScreen = new L2DMatrix44();
    this.deviceToScreen.multTranslate(-width / 2.0, -height / 2.0);
    this.deviceToScreen.multScale(2 / width, -2 / width);
    
    
    
    this.gl = getWebGLContext();
    if (!this.gl) {
        l2dError("Failed to create WebGL context.");
        return;
    }
    
    Live2D.setGL(this.gl);

    
    this.gl.clearColor(0.5, 0.5, 0.5, 1.0);

    changeModel(defaultModel);
    scrollToCurrent();
    
    startDraw();
}


function startDraw() {
    if(!this.isDrawStart) {
        this.isDrawStart = true;
        (function tick() {
                draw(); 

                var requestAnimationFrame = 
                    window.requestAnimationFrame || 
                    window.mozRequestAnimationFrame ||
                    window.webkitRequestAnimationFrame || 
                    window.msRequestAnimationFrame;

                
                requestAnimationFrame(tick ,this.canvas);   
        })();
    }
}


function draw()
{
    // l2dLog("--> draw()");

    MatrixStack.reset();
    MatrixStack.loadIdentity();
    
    this.dragMgr.update(); 
    this.live2DMgr.setDrag(this.dragMgr.getX(), this.dragMgr.getY());
    
    
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    MatrixStack.multMatrix(projMatrix.getArray());
    MatrixStack.multMatrix(viewMatrix.getArray());
    MatrixStack.push();
    
    for (var i = 0; i < this.live2DMgr.numModels(); i++)
    {
        var model = this.live2DMgr.getModel(i);

        if(model == null) return;
        
        if (model.initialized && !model.updating)
        {
            model.update();
            model.draw(this.gl);
            
            if (!this.isModelShown && i == this.live2DMgr.numModels()-1) {
                this.isModelShown = !this.isModelShown;
            }
        }
    }
    
    MatrixStack.pop();
}


function changeModel(name)
{
    this.isModelShown = false;
    
    this.live2DMgr.reloadFlg = true;
    this.live2DMgr.count++;

    this.live2DMgr.changeModel(this.gl, name);
}




function modelScaling(scale)
{   
    var isMaxScale = thisRef.viewMatrix.isMaxScale();
    var isMinScale = thisRef.viewMatrix.isMinScale();
    
    thisRef.viewMatrix.adjustScale(0, 0, scale);

    
    if (!isMaxScale)
    {
        if (thisRef.viewMatrix.isMaxScale())
        {
            thisRef.live2DMgr.maxScaleEvent();
        }
    }
    
    if (!isMinScale)
    {
        if (thisRef.viewMatrix.isMinScale())
        {
            thisRef.live2DMgr.minScaleEvent();
        }
    }
}



function modelTurnHead(event)
{
    thisRef.drag = true;
    
    var rect = event.target.getBoundingClientRect();
    
    var sx = transformScreenX(event.clientX - rect.left);
    var sy = transformScreenY(event.clientY - rect.top);
    var vx = transformViewX(event.clientX - rect.left);
    var vy = transformViewY(event.clientY - rect.top);
    
    if (LAppDefine.DEBUG_MOUSE_LOG)
        l2dLog("onMouseDown device( x:" + event.clientX + " y:" + event.clientY + " ) view( x:" + vx + " y:" + vy + ")");

    thisRef.lastMouseX = sx;
    thisRef.lastMouseY = sy;

    thisRef.dragMgr.setPoint(vx, vy); 
    
    if(isMoving)
        return;
    thisRef.live2DMgr.tapEvent(vx, vy, event);
}



function followPointer(event)
{    
    var rect = event.target.getBoundingClientRect();
    
    var sx = transformScreenX(event.clientX - rect.left);
    var sy = transformScreenY(event.clientY - rect.top);
    var vx = transformViewX(event.clientX - rect.left);
    var vy = transformViewY(event.clientY - rect.top);
    
    if (LAppDefine.DEBUG_MOUSE_LOG)
        l2dLog("onMouseMove device( x:" + event.clientX + " y:" + event.clientY + " ) view( x:" + vx + " y:" + vy + ")");

    if (thisRef.drag)
    {
        thisRef.lastMouseX = sx;
        thisRef.lastMouseY = sy;

        thisRef.dragMgr.setPoint(vx, vy); 
    }
}



function lookFront()
{   
    if (thisRef.drag)
    {
        thisRef.drag = false;
    }

    thisRef.dragMgr.setPoint(0, 0);
}


function mouseEvent(e)
{
    e.preventDefault();
    
    if (e.type == "mousewheel") {
        if (e.clientX < 0 || thisRef.canvas.clientWidth < e.clientX || 
        e.clientY < 0 || thisRef.canvas.clientHeight < e.clientY)
        {
            return;
        }
        
        if (e.wheelDelta > 0) modelScaling(1.1); 
        else modelScaling(0.9); 

        
    } else if (e.type == "mousedown") {

        
        if("button" in e && e.button == 1) return;
        
        modelTurnHead(e);
        
    } else if (e.type == "mousemove") {
        
        followPointer(e);
        
    } else if (e.type == "mouseup") {
        
        
        if("button" in e && e.button != 0) return;
        
        lookFront();
        
    } else if (e.type == "mouseout") {
        
        lookFront();
        
    }
}


function touchEvent(e)
{
    e.preventDefault();
    
    var touch = e.touches[0];
    
    if (e.type == "touchstart") {
        if (e.touches.length == 1) modelTurnHead(touch);
        // onClick(touch);
        
    } else if (e.type == "touchmove") {
        followPointer(touch);
        
        if (e.touches.length == 2) {
            var touch1 = e.touches[0];
            var touch2 = e.touches[1];
            
            var len = Math.pow(touch1.pageX - touch2.pageX, 2) + Math.pow(touch1.pageY - touch2.pageY, 2);
            if (thisRef.oldLen - len < 0) modelScaling(1.025); 
            else modelScaling(0.975); 
            
            thisRef.oldLen = len;
        }
        
    } else if (e.type == "touchend") {
        lookFront();
    }
}




function transformViewX(deviceX)
{
    var screenX = this.deviceToScreen.transformX(deviceX); 
    return viewMatrix.invertTransformX(screenX); 
}


function transformViewY(deviceY)
{
    var screenY = this.deviceToScreen.transformY(deviceY); 
    return viewMatrix.invertTransformY(screenY); 
}


function transformScreenX(deviceX)
{
    return this.deviceToScreen.transformX(deviceX);
}


function transformScreenY(deviceY)
{
    return this.deviceToScreen.transformY(deviceY);
}



function getWebGLContext()
{
    var NAMES = [ "webgl" , "experimental-webgl" , "webkit-3d" , "moz-webgl"];

    for( var i = 0; i < NAMES.length; i++ ){
        try{
            var ctx = this.canvas.getContext(NAMES[i], {premultipliedAlpha : true});
            if(ctx) return ctx;
        }
        catch(e){}
    }
    return null;
};



function l2dLog(msg) {
    if(!LAppDefine.DEBUG_LOG) return;
    
    console.log(msg);
}



function l2dError(msg)
{
    if(!LAppDefine.DEBUG_LOG) return;
    
    l2dLog( "<span style='color:red'>" + msg + "</span>");
    
    console.error(msg);
};