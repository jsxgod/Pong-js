//shaders

var vertexShaderText = [
    `attribute vec4 a_position;
    uniform mat4 u_matrix;
    
    void main(){
        gl_Position = u_matrix * a_position;
    }`
].join('\n');

var fragmentShaderText = [
    `precision mediump float;
    uniform vec4 u_color;
    
    void main(){
        gl_FragColor = u_color;
    }`
].join('\n');


var canvas = document.getElementById('canvas');
var gl = canvas.getContext('webgl');

function createShader(gl, shaderScript, shaderType){
    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderScript);
    gl.compileShader(shader);

    return shader;
}

function createProgram(gl, vertexShader, fragmentShader){
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    return program;
}

var callbackOnKeyDown = function(e) {
    var code = e.key || e["keyIdentifier"];

    switch(code){
        case "ArrowUp":
            keyPressState.up = true;
            break;
        case "ArrowDown":
            keyPressState.down = true;
            break;
        case "w":
            keyPressState.w = true;
            break;
        case "s":
            keyPressState.s = true;
    }
};

var callbackOnKeyUp = function(e) {
    var code = e.key || e["keyIdentifier"];

    switch(code){
        case "ArrowUp":
            keyPressState.up = false;
            break;
        case "ArrowDown":
            keyPressState.down = false;
            break;
        case "w":
            keyPressState.w = false;
            break;
        case "s":
            keyPressState.s = false;
    }
};

var callbackOnKeyPress = function(e){
    var code = e.key || e["keyIdentifier"];

    switch(code){
        case "Space":
            keyPressState.space = !keyPressState.space;
    }
};


const keyPressState = {
    up:     false,
    down:   false,
    w:   false,
    s:  false,
    space: false
};

const allowedToHitBall = {
    left:   true,
    right:  true
};

const background = {
    xyz:    [0,0,2],
    width:  gl.canvas.clientWidth,
    height: gl.canvas.clientHeight,
    color:  [0.5, 0.50, 0.5, 0.8]
};

const playfield = {
    xyz:    [125, 0, 1],
    width:  gl.canvas.clientWidth - 250,
    height: gl.canvas.clientHeight,
    color:  [0.5, 1.0, 0.7, 0.6]
};

const centerLine = {
    xyz:    [gl.canvas.clientWidth / 2, 0, 1.5],
    width:  10,
    height: gl.canvas.clientHeight,
    color: [1,1,1,1]
};

const ball = {
    xyz:            [gl.canvas.clientWidth / 2, 0, 1],
    width:          20,
    height:         20,
    color:          [0, 0, 0, 1],
    xAxisSteps:     5,
    yAxisSteps:     5,
};

const leftPlayer = {
    xyz:  [127, 0, 1],
    width: 20,
    height: 95,
    color: [0, 0, 0, 1]
};

const rightPlayer = {
    xyz:  [gl.canvas.clientWidth - 147, 0, 1],
    width: 20,
    height: 95,
    color: [0, 0, 0, 1]
};

function checkCanvasSize(canvas){
    if(canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight){
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
}

function drawRectangle(gl, x, y, width, height){

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(
        [
            x, y, 0,
            x+width, y, 0,
            x, y+height, 0,
            x, y+height, 0,
            x+width, y, 0,
            x+width, y+height, 0
        ]
    ), gl.STATIC_DRAW);
}

function startBall(){
    ball.xyz[0] = gl.canvas.clientWidth / 2;
    ball.xyz[1] = gl.canvas.clientHeight / 2 - 100;

    ball.xAxisSteps = 3;
    ball.yAxisSteps = 3;
}

function checkBallContact(player){

    if(ball.xyz[0] > player.xyz[0] + player.width){
        return false;
    } else if (ball.xyz[0] + ball.width < player.xyz[0]){
        return false;
    } else if (ball.xyz[1] > player.xyz[1] + player.height){
        return false;
    } else if (ball.xyz[1] + ball.height < player.xyz[1]){
        return false
    }
    console.log("contact");
    return true;
}

function checkBallOutOfField(){
    if(ball.xyz[0] < playfield.xyz[0] - 50){
        return true
    } else if (ball.xyz[0] > playfield.xyz[0] + playfield.width + 50){
        return true;
    }

    return false;
}

function checkBallHitEdge(){
    if(ball.xyz[1] < 0 || ball.xyz[1] > playfield.height - 20){
        ball.yAxisSteps -= (2 *ball.yAxisSteps);
    }
}

function speedUpBall(){
    if(ball.xAxisSteps > 0){
        ball.xAxisSteps += 1;
    } else {
        ball.xAxisSteps -= 1;
    }
}

function changeBallDirection(){
    ball.xAxisSteps -= (2*ball.xAxisSteps);
}

function changeBallAngle(contactPosition){
    if(contactPosition >= 0 && contactPosition <= 10){
        ball.yAxisSteps = 4;
    } else if(contactPosition >= 10 && contactPosition < 20){
        ball.yAxisSteps = 3;
    } else if( contactPosition >= 20 && contactPosition < 30){
        ball.yAxisSteps = 2;
    } else if( contactPosition >= 30 && contactPosition < 40){
        ball.yAxisSteps = 1;
    } else if( contactPosition >= 40 && contactPosition < 55){
        ball.yAxisSteps = 0;
    } else if( contactPosition >= 55 && contactPosition < 65){
        ball.yAxisSteps = -1;
    } else if( contactPosition >= 65 && contactPosition < 75){
        ball.yAxisSteps = -2;
    } else if( contactPosition >= 75 && contactPosition < 85){
        ball.yAxisSteps = -3;
    } else if( contactPosition >= 85 && contactPosition < 95){
        ball.yAxisSteps = -4;
    }
}

function moveBall(){
    if(checkBallOutOfField()){
        allowedToHitBall.left = true;
        allowedToHitBall.right = true;
        startBall();
        return;
    }

    ball.xyz[0] += ball.xAxisSteps;
    ball.xyz[1] += ball.yAxisSteps;


    checkBallHitEdge();


    if(checkBallContact(leftPlayer) && allowedToHitBall.left){
        let contactPosition = (leftPlayer.xyz[1] + leftPlayer.height) - ball.xyz[1];

        allowedToHitBall.left = false;
        allowedToHitBall.right = true;

        speedUpBall();
        changeBallDirection();
        changeBallAngle(contactPosition);
    } else if(checkBallContact(rightPlayer) && allowedToHitBall.right){
        let contactPosition = (rightPlayer.xyz[1] + rightPlayer.height) - ball.xyz[1];

        allowedToHitBall.right = false;
        allowedToHitBall.left = true;

        speedUpBall();
        changeBallDirection();
        changeBallAngle(contactPosition);
    }
}

const m4 = {
    projection: function (width, height, depth) {
        return [
            2 / width, 0, 0, 0,
            0, -2 / height, 0, 0,
            0, 0, 2 / depth, 0,
            -1, 1, 0, 1,
        ];
    },

    translation: function (tx, ty, tz) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            tx, ty, tz, 1,
        ];
    },

    multiply: function (a, b) {
        const a00 = a[0 * 4 + 0];
        const a01 = a[0 * 4 + 1];
        const a02 = a[0 * 4 + 2];
        const a03 = a[0 * 4 + 3];
        const a10 = a[1 * 4 + 0];
        const a11 = a[1 * 4 + 1];
        const a12 = a[1 * 4 + 2];
        const a13 = a[1 * 4 + 3];
        const a20 = a[2 * 4 + 0];
        const a21 = a[2 * 4 + 1];
        const a22 = a[2 * 4 + 2];
        const a23 = a[2 * 4 + 3];
        const a30 = a[3 * 4 + 0];
        const a31 = a[3 * 4 + 1];
        const a32 = a[3 * 4 + 2];
        const a33 = a[3 * 4 + 3];
        const b00 = b[0 * 4 + 0];
        const b01 = b[0 * 4 + 1];
        const b02 = b[0 * 4 + 2];
        const b03 = b[0 * 4 + 3];
        const b10 = b[1 * 4 + 0];
        const b11 = b[1 * 4 + 1];
        const b12 = b[1 * 4 + 2];
        const b13 = b[1 * 4 + 3];
        const b20 = b[2 * 4 + 0];
        const b21 = b[2 * 4 + 1];
        const b22 = b[2 * 4 + 2];
        const b23 = b[2 * 4 + 3];
        const b30 = b[3 * 4 + 0];
        const b31 = b[3 * 4 + 1];
        const b32 = b[3 * 4 + 2];
        const b33 = b[3 * 4 + 3];
        return [
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
    },

    translate: function (m, tx, ty, tz) {
        return m4.multiply(m, m4.translation(tx, ty, tz));
    },
};


function redraw(gl, program, positionAttribLocation, positionBuffer, coordinates, width, height, resolutionUniformLocation,
                colorUniformLocation, matrixUniformLocation, color){

    checkCanvasSize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttribLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    drawRectangle(gl, coordinates[0], coordinates[1], width, height);

    gl.vertexAttribPointer(
        positionAttribLocation,
        3,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform4fv(colorUniformLocation, color);

    const matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);

    gl.uniformMatrix4fv(
        matrixUniformLocation,
        false,
        matrix
    );

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function run(){

}


//   gl.enable(gl.DEPTH_TEST);

window.onkeydown = callbackOnKeyDown;
window.onkeyup = callbackOnKeyUp;
window.onkeypress = callbackOnKeyPress;

const vertexShader = createShader(gl, vertexShaderText, gl.VERTEX_SHADER);
const fragmentShader = createShader(gl, fragmentShaderText, gl.FRAGMENT_SHADER);

const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttribLocation = gl.getAttribLocation(program, "a_position");
const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
const matrixUniformLocation = gl.getUniformLocation(program, 'u_matrix');
const colorUniformLocation = gl.getUniformLocation(program, 'u_color');

const positionBuffer = gl.createBuffer();

function main(){
    gl.clear(gl.COLOR_BUFFER_BIT);

    moveBall();

    window.requestAnimationFrame(main);

    redraw(gl, program, positionAttribLocation, positionBuffer, background.xyz, background.width, background.height,
        resolutionUniformLocation, colorUniformLocation, matrixUniformLocation, background.color);
    redraw(gl, program, positionAttribLocation, positionBuffer, playfield.xyz, playfield.width, playfield.height,
        resolutionUniformLocation, colorUniformLocation, matrixUniformLocation, playfield.color);
    redraw(gl, program, positionAttribLocation, positionBuffer, centerLine.xyz, centerLine.width, centerLine.height,
        resolutionUniformLocation, colorUniformLocation, matrixUniformLocation, centerLine.color);

    if (keyPressState.w && leftPlayer.xyz[1] > 0) {
        leftPlayer.xyz[1] -= 10;
    }
    if (keyPressState.s && leftPlayer.xyz[1] < playfield.height - 100) {
        leftPlayer.xyz[1] += 10;
    }
    if (keyPressState.up && rightPlayer.xyz[1] > 0) {
        rightPlayer.xyz[1] -= 10;
    }
    if (keyPressState.down && rightPlayer.xyz[1] < playfield.height - 100) {
        rightPlayer.xyz[1] += 10;
    }

    redraw(gl, program, positionAttribLocation, positionBuffer, leftPlayer.xyz, leftPlayer.width, leftPlayer.height,
        resolutionUniformLocation, colorUniformLocation, matrixUniformLocation, leftPlayer.color);

    redraw(gl, program, positionAttribLocation, positionBuffer, rightPlayer.xyz, rightPlayer.width, rightPlayer.height,
        resolutionUniformLocation, colorUniformLocation, matrixUniformLocation, rightPlayer.color,);

    redraw(gl, program, positionAttribLocation, positionBuffer, ball.xyz, ball.width, ball.height,
        resolutionUniformLocation, colorUniformLocation, matrixUniformLocation, ball.color);

}

startBall();
window.requestAnimationFrame(main);