var thisRef = this;

window.onerror = function(msg, url, line, col, error) {
    var errmsg = "file:" + url + "<br>line:" + line + " " + msg;
    l2dError(errmsg);
}

function sampleApp1()
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

    init();
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
    var $msg = $('<div></div>').attr('class', 'message');
    $('body').append($msg);
        
    if ($msg.css('display') != 'none') {
        $msg.finish();
    }
    $msg.html(text);
    $msg.fadeIn(500).delay(delay).fadeOut(500);
}

function init()
{
    showMessage('滚动滚轮以缩放<br>点击左下角图标开始拖动', 4000);

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
                console.log(e.button);
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

    $box = $('#box');
    for(var i=0;i<names.length;i++) {
        $button = $('<button></button>');
        $button.text(names[i])
        $button.on('click',function(){
            changeModel(this.innerHTML);
        })
        $box.append($button);
    }

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

    changeModel('c436_10');
    
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

names=["c000_01","c000_10","c000_11","c000_12","c000_13","c000_14","c000_15","c000_16","c000_17","c001_01","c001_02","c001_12","c001_14","c001_16","c001_17","c002_00","c002_01","c002_02","c002_10","c002_11","c002_12","c003_01","c003_02","c003_10","c003_11","c003_13","c003_14","c003_15","c003_16","c003_17","c003_18","c003_89","c004_00","c004_01","c004_02","c005_00","c005_01","c005_02","c007_00","c007_01","c007_02","c008_00","c008_01","c008_02","c009_00","c009_01","c009_02","c010_00","c010_01","c010_02","c011_00","c011_01","c011_02","c012_00","c012_01","c012_02","c013_00","c013_01","c013_02","c014_00","c014_01","c014_02","c015_01","c017_00","c017_01","c017_02","c018_00","c018_01","c018_02","c019_00","c019_01","c019_02","c020_00","c020_01","c020_02","c022_00","c022_01","c022_02","c022_10","c023_01","c024_00","c024_01","c024_02","c026_00","c026_01","c026_02","c027_00","c027_01","c027_02","c028_00","c028_01","c028_02","c028_10","c029_00","c029_01","c029_02","c030_00","c030_01","c030_02","c031_00","c031_01","c031_02","c032_00","c032_01","c032_02","c033_00","c033_01","c033_02","c034_00","c034_01","c034_02","c035_00","c035_01","c035_02","c036_00","c036_01","c036_02","c036_10","c037_00","c037_01","c037_02","c038_00","c038_01","c038_02","c038_10","c039_00","c039_01","c039_02","c040_00","c040_01","c040_02","c041_00","c041_01","c041_02","c043_00","c043_01","c043_02","c043_10","c044_00","c044_01","c044_02","c045_00","c045_01","c045_02","c045_10","c045_11","c045_12","c045_13","c045_89","c047_00","c047_01","c047_02","c048_00","c048_01","c048_02","c048_10","c049_00","c049_01","c049_02","c049_10","c050_02","c051_00","c051_01","c051_02","c051_10","c051_11","c051_12","c051_21","c051_89","c052_00","c052_01","c052_02","c053_00","c053_01","c053_02","c054_00","c054_01","c054_02","c056_00","c056_01","c056_02","c057_00","c057_01","c057_02","c058_00","c058_01","c058_02","c060_00","c060_01","c060_02","c061_00","c061_01","c061_02","c062_00","c062_01","c062_02","c063_00","c063_01","c063_02","c064_00","c064_01","c064_02","c065_00","c065_01","c065_02","c066_00","c066_01","c066_02","c067_00","c067_01","c067_02","c068_00","c068_01","c068_02","c069_00","c069_01","c069_02","c070_00","c070_01","c070_02","c072_00","c072_01","c072_02","c073_00","c073_01","c073_02","c074_00","c074_01","c074_02","c075_01","c075_02","c081_00","c081_01","c081_02","c082_00","c082_01","c082_02","c083_00","c083_01","c083_02","c085_00","c085_01","c085_02","c086_00","c086_01","c086_02","c087_01","c087_02","c090_00","c090_01","c090_02","c091_00","c091_01","c091_02","c092_01","c095_00","c095_01","c095_02","c099_00","c099_01","c099_02","c101_00","c101_01","c101_02","c106_01","c106_02","c107_00","c107_01","c107_02","c109_01","c109_02","c110_00","c110_01","c110_02","c110_10","c112_00","c112_01","c112_02","c113_00","c115_00","c115_01","c115_02","c116_01","c116_02","c117_00","c117_01","c117_02","c120_00","c120_01","c120_02","c121_00","c121_01","c121_02","c122_01","c123_00","c123_01","c123_02","c124_00","c124_01","c124_02","c124_10","c124_11","c124_12","c125_00","c125_01","c125_02","c125_10","c125_89","c126_00","c126_01","c126_02","c127_00","c127_01","c127_02","c127_10","c128_00","c128_01","c128_02","c129_01","c129_02","c130_00","c130_01","c130_02","c131_00","c131_01","c131_02","c132_00","c132_01","c132_02","c132_10","c132_11","c133_00","c133_01","c133_02","c135_00","c135_01","c135_02","c139_00","c139_01","c139_02","c140_01","c141_00","c141_01","c141_02","c142_00","c142_01","c142_02","c144_00","c144_01","c144_02","c147_00","c147_01","c147_02","c148_00","c148_01","c148_02","c148_10","c148_11","c149_00","c149_01","c149_02","c152_00","c152_01","c152_02","c153_00","c153_01","c153_02","c154_00","c154_01","c154_02","c155_00","c155_01","c155_02","c156_00","c156_01","c156_02","c158_00","c158_01","c158_02","c158_10","c159_00","c159_01","c159_02","c160_00","c160_01","c160_02","c161_01","c164_00","c164_01","c164_02","c167_00","c167_01","c167_02","c167_10","c167_11","c168_00","c168_01","c168_02","c169_00","c169_01","c169_02","c172_00","c172_01","c172_02","c173_00","c173_01","c173_02","c173_10","c174_00","c174_01","c174_02","c174_10","c174_11","c174_12","c175_00","c175_01","c175_02","c176_01","c176_02","c178_00","c178_01","c178_02","c180_00","c180_01","c180_02","c183_00","c183_01","c183_02","c184_00","c184_01","c184_02","c185_00","c185_01","c185_02","c186_00","c186_01","c186_02","c187_00","c187_01","c187_02","c187_89","c188_00","c188_01","c188_02","c189_00","c189_01","c189_02","c190_00","c190_01","c190_02","c191_00","c191_01","c191_02","c193_00","c193_01","c193_02","c193_10","c194_00","c194_01","c194_02","c195_00","c195_01","c195_02","c195_20","c196_00","c196_01","c196_02","c198_00","c198_01","c198_02","c198_10","c199_00","c199_01","c199_02","c199_10","c200_00","c200_01","c200_02","c202_00","c202_01","c202_02","c203_01","c203_02","c203_88","c205_00","c205_01","c205_02","c206_00","c206_01","c206_02","c208_00","c208_01","c208_02","c209_00","c209_01","c209_02","c209_10","c210_00","c210_01","c210_02","c214_00","c214_01","c214_02","c214_10","c215_00","c216_00","c216_01","c216_02","c218_00","c218_01","c218_02","c219_00","c219_01","c219_02","c220_00","c220_01","c220_02","c221_00","c221_01","c221_02","c222_00","c222_01","c222_02","c223_00","c223_01","c223_02","c224_00","c224_01","c224_02","c225_00","c225_01","c225_02","c226_01","c227_00","c227_01","c227_02","c229_00","c229_01","c229_02","c229_10","c230_00","c230_01","c230_02","c231_00","c231_01","c231_02","c232_00","c232_01","c232_02","c233_00","c233_01","c233_02","c234_00","c234_01","c234_02","c234_10","c235_00","c235_01","c235_02","c237_00","c237_01","c237_02","c238_00","c238_01","c238_02","c238_10","c239_01","c239_02","c241_01","c242_00","c242_01","c242_02","c244_01","c244_02","c245_01","c245_02","c246_00","c246_01","c246_02","c246_10","c246_11","c246_88","c246_89","c247_00","c247_01","c247_02","c251_01","c251_02","c252_00","c252_01","c252_02","c252_10","c252_11","c252_12","c252_13","c252_88","c252_89","c253_00","c253_01","c253_02","c253_10","c253_88","c253_89","c254_01","c255_01","c256_01","c257_01","c257_02","c258_01","c258_02","c261_01","c261_02","c262_00","c262_01","c262_02","c265_01","c266_00","c266_01","c266_02","c267_00","c267_01","c267_02","c267_10","c267_11","c267_88","c267_89","c269_01","c269_02","c270_01","c270_02","c271_01","c271_02","c272_01","c272_02","c274_00","c274_01","c274_02","c275_00","c275_01","c275_02","c277_00","c277_01","c277_02","c278_01","c278_02","c279_01","c279_02","c279_88","c279_89","c280_01","c280_02","c281_00","c281_01","c281_02","c283_00","c283_01","c283_02","c283_10","c283_11","c283_12","c283_89","c285_01","c285_02","c285_10","c285_11","c286_00","c286_01","c286_02","c287_00","c287_01","c287_02","c287_88","c287_89","c289_00","c289_01","c289_02","c289_10","c290_00","c290_01","c290_02","c292_00","c292_01","c292_02","c294_00","c294_01","c294_02","c294_10","c295_00","c295_01","c295_02","c295_10","c296_00","c296_01","c296_02","c297_00","c297_01","c297_02","c299_00","c299_01","c299_02","c300_00","c300_01","c300_02","c301_01","c301_02","c302_00","c302_01","c304_01","c304_02","c305_01","c305_02","c305_10","c305_89","c308_00","c308_01","c308_02","c308_10","c310_00","c310_01","c310_02","c311_00","c311_01","c311_02","c311_89","c312_00","c312_01","c312_02","c314_01","c315_01","c315_02","c315_10","c315_89","c316_00","c316_01","c316_02","c317_00","c317_01","c317_02","c318_00","c318_01","c318_02","c318_10","c318_11","c318_88","c318_89","c319_00","c319_01","c319_02","c320_00","c320_01","c320_02","c321_01","c321_02","c322_00","c322_01","c322_02","c322_10","c324_01","c324_02","c324_21","c325_00","c325_01","c326_01","c327_01","c328_01","c329_01","c329_02","c330_01","c331_01","c332_01","c332_02","c333_00","c333_01","c333_02","c333_88","c334_01","c334_02","c336_01","c336_02","c336_89","c338_01","c338_02","c339_01","c339_02","c342_01","c342_02","c343_01","c343_02","c344_01","c344_02","c344_10","c344_88","c344_89","c345_01","c345_02","c345_10","c345_88","c345_89","c346_01","c346_02","c347_01","c347_02","c348_00","c348_01","c348_02","c348_10","c349_00","c349_01","c349_02","c350_00","c350_01","c350_02","c351_00","c351_01","c351_02","c352_00","c353_00","c353_01","c353_02","c354_01","c354_02","c354_10","c354_89","c355_01","c355_02","c357_01","c357_02","c358_01","c358_02","c359_01","c359_02","c360_01","c360_02","c360_10","c361_01","c361_02","c361_10","c361_87","c361_88","c361_89","c362_01","c362_02","c362_10","c362_11","c363_01","c363_02","c364_01","c364_02","c365_01","c365_02","c366_01","c366_02","c367_01","c369_00","c370_01","c370_02","c370_10","c371_01","c371_02","c371_10","c372_01","c372_02","c372_10","c374_01","c374_02","c375_01","c376_01","c377_00","c377_01","c377_02","c377_10","c377_11","c377_89","c378_00","c378_01","c378_02","c379_01","c379_02","c381_01","c381_02","c382_01","c382_02","c384_01","c384_02","c385_01","c385_02","c385_10","c385_11","c385_12","c386_01","c386_02","c386_10","c386_11","c386_12","c386_13","c386_88","c387_01","c387_02","c387_10","c387_11","c388_01","c388_02","c389_01","c389_02","c389_89","c390_01","c390_02","c390_88","c390_89","c391_01","c391_02","c392_01","c392_02","c392_10","c392_89","c393_01","c393_02","c393_10","c394_01","c394_02","c395_01","c395_02","c396_01","c396_02","c397_01","c397_02","c398_01","c398_02","c398_89","c399_01","c400_01","c400_02","c401_01","c401_02","c402_01","c402_02","c402_10","c403_01","c403_02","c404_01","c404_02","c405_01","c405_02","c405_88","c405_89","c406_01","c406_02","c407_01","c407_02","c408_01","c408_02","c409_01","c409_02","c410_00","c410_01","c410_02","c411_01","c412_00","c412_01","c412_02","c412_88","c412_89","c413_00","c413_21","c414_00","c414_01","c414_02","c414_10","c414_89","c415_00","c415_01","c415_02","c416_00","c416_01","c416_02","c417_00","c417_01","c417_02","c417_10","c417_87","c417_89","c418_01","c418_02","c419_01","c419_02","c420_01","c420_02","c420_10","c420_89","c421_01","c421_02","c422_01","c422_02","c422_88","c423_01","c423_02","c424_01","c425_01","c425_02","c425_10","c425_87","c425_88","c425_89","c426_00","c426_01","c426_02","c428_01","c428_02","c428_88","c428_89","c429_00","c429_01","c429_02","c429_10","c429_88","c430_00","c430_01","c430_02","c430_10","c431_01","c431_02","c431_10","c432_01","c432_02","c433_01","c433_02","c434_01","c434_02","c435_01","c435_02","c435_10","c436_01","c436_02","c436_10","c436_89","c437_01","c437_02","c438_01","c438_02","c438_10","c438_11","c438_12","c439_01","c439_02","c440_01","c440_02","c440_10","c441_01","c441_02","c442_00","c442_01","c442_02","c442_10","c442_11","c443_01","c443_02","c444_01","c444_10","c445_01","c445_02","c445_10","c445_11","c445_88","c445_89","c446_01","c446_02","c446_88","c447_01","c447_02","c447_10","c447_89","c448_00","c448_01","c448_02","c448_88","c449_01","c449_02","c450_01","c450_02","c451_01","c451_02","c451_10","c452_01","c452_02","c452_10","c453_01","c453_02","c454_01","c454_02","c454_88","c454_89","c455_01","c455_02","c455_10","c455_11","c455_87","c456_01","c456_02","c457_01","c457_02","c458_01","c458_02","c458_10","c459_01","c459_02","c460_01","c460_02","c460_10","c460_88","c461_01","c461_02","c461_10","c462_01","c462_02","c463_01","c463_02","c464_01","c464_02","c464_10","c464_11","c465_01","c465_02","c465_88","c466_01","c466_02","c467_01","c467_02","c468_00","c468_01","c468_02","c469_01","c469_02","c469_10","c470_01","c470_02","c471_01","c471_02","c471_88","c472_01","c472_02","c473_01","c473_02","c474_01","c474_02","c474_10","c474_88","c474_89","c475_01","c475_02","c476_00","c476_01","c476_02","c476_88","c479_00","c479_01","c479_02","c479_20","c480_00","c480_01","c480_02","c480_20","c481_00","c481_01","c481_02","c481_88","c482_00","c482_01","c482_02","c483_00","c483_01","c483_02","c484_01","c485_01","c485_02","c485_10","c486_01","c486_02","c486_10","c486_87","c486_88","c486_89","c488_00","c488_01","c488_02","c488_20","c489_01","c489_02","c489_10","c489_11","c489_87","c489_88","c489_89","c490_00","c490_01","c490_02","c490_10","c490_88","c491_00","c491_01","c491_02","c491_10","c492_00","c493_00","c493_01","c493_02","c493_88","c494_00","c494_01","c494_02","c495_00","c495_01","c495_02","c496_00","c496_01","c496_02","c497_01","c497_02","c497_10","c501_01","c501_02","c501_10","c501_87","c501_88","c501_89","c502_01","c502_02","c502_10","c503_01","c503_02","c503_10","c503_88","c504_00","c504_01","c504_02","c505_00","c505_01","c505_02","c505_10","c506_00","c506_01","c506_02","c507_00","c507_01","c507_02","c507_10","c507_88","c508_01","c508_02","c509_01","c509_02","c509_10","c509_87","c509_88","c509_89","c510_01","c510_02","c510_10","c511_01","c511_02","c512_01","c512_02","c513_01","c513_02","c513_10","c513_87","c513_88","c513_89","c514_01","c514_02","c515_00","c517_01","c517_02","c518_01","c518_02","c518_88","c519_01","c519_02","c520_01","c520_02","c520_10","c520_87","c520_88","c520_89"];