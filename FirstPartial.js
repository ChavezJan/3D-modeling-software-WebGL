var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  varying vec4 u_FragColor;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjMatrix;
  void main() {
   gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
   u_FragColor = a_Color;
  }`;

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec4 u_FragColor;
  void main(){
    gl_FragColor = u_FragColor;
  }`;

//------------------------------------------------
// global variable
//------------------------------------------------
// TODO: clean trash var


// Axis
// ...Axis[0] -> x
// ...Axis[1] -> y
// ...Axis[2] -> z
var rotateAxis = [1, 0, 0];
var scaleAxis = [1, 1, 1];
var translateAxis = [0, 0, 0];

// angle
var angle = 0.0;
var angleXYZ = [0.0, 0.0, 0.0];

var selectedFigure = 1;
var index = 0;

var canvas;
var gl;

// Figure
var arrayFigures = [];
var figure = [];
var modelMatrix = [new Matrix4()];

// Figure history
var figureHistory = [];
var arrayOfHistory = [figureHistory];

// Color
var g_colors = [];
var arrayColors = [];
var documentColor = 0.0;
var colors = []; // not in use

// max and min of the rangeslider
var min = -360;
var max = 360;

$(document).ready(function() {
  $("#slider").kendoSlider({
    change: sliderOnChange,
    slide: sliderOnSlide,
    min: min,
    max: max,
    smallStep: 10,
    largeStep: 60,
    value: 0
  });

  $("#rangeslider").kendoRangeSlider({
    change: rangeSliderOnChange,
    slide: rangeSliderOnSlide,
    min: min,
    max: max,
    smallStep: 10,
    largeStep: 60,
    tickPlacement: "both"
  });
});

//------------------------------------------------
// figure history
//------------------------------------------------

// keeps a record about the important values of each axis in each figure
// done
function addHistory() {

  figureHistory.push(rotateAxis[0],rotateAxis[1],rotateAxis[2]);
  figureHistory.push(scaleAxis[0],scaleAxis[1],scaleAxis[2]);
  figureHistory.push(translateAxis[0],translateAxis[1],translateAxis[2]);
  figureHistory.push(angleXYZ[0],angleXYZ[1],angleXYZ[2]);
  arrayOfHistory[index] = figureHistory;

}

//------------------------------------------------
// restart functions
//------------------------------------------------

// restart all the scene
// done
function restart() {
  index = 0;
  arrayFigures = [];
  modelMatrix = [new Matrix4()];
  g_colors = [];
  figure = [];
  arrayColors = [];
  arrayOfHistory = [];
  arrayFigures = [];

  // restart translate
  document.getElementById("translateX").value = 0;
  document.getElementById("translateY").value = 0;
  document.getElementById("translateZ").value = 0;

  // restart scale
  document.getElementById("scaleX").value = 1;
  document.getElementById("scaleY").value = 1;
  document.getElementById("scaleZ").value = 1;

  // restart sliders
  var slider = $("#slider").data("kendoSlider");
  slider.value(0);

  document.getElementById("surface").max = 1;
  document.getElementById("surface").value = 1;

  angleXYZ[0] = 0.0;
  angleXYZ[1] = 0.0;
  angleXYZ[2] = 0.0;

  kendoConsole.log("Restart");
  changeMatrix();
}
// remove an specific surface
// done
function removeFigure() {

  selectedFigure = document.getElementById("surface").value;

  if (index < selectedFigure - 1) {
    var maxNumber = arrayFigures.length + 1;
    kendoConsole.log("1 " + maxNumber);
    kendoConsole.log("Choose between this numbers");
    kendoConsole.log("This number of the figure it dosn't exist");

    return;
  }

  if (selectedFigure - 1 === 0 && index === 0 && figure === null) {
    kendoConsole.log("nothing to delete");
    return;
  }

  arrayFigures[selectedFigure - 1] = null;
  arrayFigures = arrayFigures.filter(function(item) {
    return item !== null;
  });

  g_colors[selectedFigure - 1] = null;
  g_colors = g_colors.filter(function(color) {
    return color !== null;
  });

  modelMatrix[selectedFigure - 1] = null;
  modelMatrix = modelMatrix.filter(function(mtx) {
    return mtx !== null;
  });

  arrayOfHistory[selectedFigure - 1] = null;
  arrayOfHistory = arrayOfHistory.filter(function(mtx) {
    return mtx !== null;
  });

  document.getElementById("surface").max = (arrayFigures.length + 1);
  document.getElementById("surface").value = arrayFigures.length ;

  if (index === 0) {
    return;
  }
  if (arrayFigures[index] === null) {
    index--;
    index--;
  } else {
    index--;
  }
}
// restart all the imputs for the new figure
function resetInput() {

  // restart translate
  document.getElementById("translateX").value = 0;
  document.getElementById("translateY").value = 0;
  document.getElementById("translateZ").value = 0;

  // restart scale
  document.getElementById("scaleX").value = 1;
  document.getElementById("scaleY").value = 1;
  document.getElementById("scaleZ").value = 1;

  // restart sliders
  var slider = $("#slider").data("kendoSlider");
  slider.value(0);

  angleXYZ[0] = 0.0;
  angleXYZ[1] = 0.0;
  angleXYZ[2] = 0.0;

  changeMatrix();

}

//------------------------------------------------
// Axis inputs
//------------------------------------------------

// work with all the surface, not individual
// done
function changeAxis() {
  var xAxis = document.getElementById("x-axis");
  var yAxis = document.getElementById("y-axis");
  var zAxis = document.getElementById("z-axis");

  // restart sliders
  var slider = $("#slider").data("kendoSlider");
  //slider.value(0);

  if (xAxis.checked) {
    kendoConsole.log("X");
    kendoConsole.log(angleXYZ[0]);
    rotateAxis = [1, 0, 0];
    slider.value(angleXYZ[0]);
  }
  if (yAxis.checked) {
    kendoConsole.log("Y");
    kendoConsole.log(angleXYZ[1]);
    rotateAxis = [0, 1, 0];
    slider.value(angleXYZ[1]);
  }
  if (zAxis.checked) {
    kendoConsole.log("Z");
    kendoConsole.log(angleXYZ[2]);
    rotateAxis = [0, 0, 1];
    slider.value(angleXYZ[2]);
  }
  changeMatrix();
}
// done
function ScaleAxis() {
  /*scaleAxis
    [0] - x axis
    [1] - y axis
    [2] - z axis
  */

  scaleAxis[0] = document.getElementById("scaleX").value;
  scaleAxis[1] = document.getElementById("scaleY").value;
  scaleAxis[2] = document.getElementById("scaleZ").value;
  changeMatrix();
}
// done
function TranslateAxis() {
  /*translateAxis
    [0] - x axis
    [1] - y axis
    [2] - z axis
  */

  translateAxis[0] = document.getElementById("translateX").value;
  translateAxis[1] = document.getElementById("translateY").value;
  translateAxis[2] = document.getElementById("translateZ").value;
  changeMatrix();
}

//------------------------------------------------
// sliders
//------------------------------------------------

// done
function sliderOnSlide(e) {
  kendoConsole.log("Slide :: new slide value is: " + e.value);
  angle = e.value;

changeAngle(angle,angle,angle);
}
// done
function sliderOnChange(e) {
  kendoConsole.log("Change :: new value is: " + e.value);
  angle = e.value;
changeAngle(angle,angle,angle);
}
// done
function rangeSliderOnSlide(e) {
  kendoConsole.log("Slide :: new slide values are: " + e.value.toString().replace(",", " - "));
}
// done
function rangeSliderOnChange(e) {
  kendoConsole.log("Change :: new values are: " + e.value.toString().replace(",", " - "));
  var slider = $("#slider").data("kendoSlider");
  slider.min(e.value[0]);
  slider.max(e.value[1]);

  if (slider.value() < e.value[0]) {
    slider.value(e.value[0]);
  } else if (slider.value() > e.value[1]) {
    slider.value(e.value[1]);
  }
  slider.resize();
  angle = slider.value();
}

//------------------------------------------------
// Change functions
//------------------------------------------------

// Change the matrix of the Figure
// done
function changeMatrix() {

  modelMatrix[selectedFigure - 1] = new Matrix4();
  // rotate
  modelMatrix[selectedFigure - 1].rotate(angleXYZ[0], 1, 0, 0);
  modelMatrix[selectedFigure - 1].rotate(angleXYZ[1], 0, 1, 0);
  modelMatrix[selectedFigure - 1].rotate(angleXYZ[2], 0, 0, 1);
  // translate
  modelMatrix[selectedFigure - 1].translate(translateAxis[0] / 10, translateAxis[1] / 10, translateAxis[2] / 10);
  // scale
  modelMatrix[selectedFigure - 1].scale(scaleAxis[0], scaleAxis[1], scaleAxis[2]);
  if (figure.length >= 3) {

//  updateHistory();
}
  console.log("arrayOfHistory");
  console.log(arrayOfHistory);

}
// done
function changeAngle(angleX,angleY,angleZ){
  var slider = $("#slider").data("kendoSlider");

  if (rotateAxis[0] === 1) {
    angleXYZ[0] = angleX;
    slider.value(angleX);
  }
  if (rotateAxis[1] === 1) {
    angleXYZ[1] = angleY;
    slider.value(angleY);
  }
  if (rotateAxis[2] === 1) {
    angleXYZ[2] = angleZ;
    slider.value(angleZ);
  }
    changeMatrix();


}
// in progress
function changeColor() {

  documentColor = document.getElementById("color").value;

  colors.push(parseInt(color.substr(1, 2), 16));
  colors.push(parseInt(color.substr(3, 2), 16));
  colors.push(parseInt(color.substr(5, 2), 16));

  kendoConsole.log("New color: Red: " + colors[0] + " Green: " + colors[1] + " Blue: " + colors[2]);

}

//------------------------------------------------
// Main functions
//------------------------------------------------

function main() {
  canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas);

  if (!gl) {
    console.log('Failed to get the WebGL context');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders');
    return;
  }

  canvas.onmousedown = function(ev) {
    click(ev, gl, canvas);
  };
  canvas.oncontextmenu = function(ev) {
    rightClick(ev, gl);
    return false;
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  console.log("modelMatrix");
  console.log(modelMatrix);
  requestAnimationFrame(update, canvas);
}

//------------------------------------------------
// funtionality functions
//------------------------------------------------

function initVertexBuffers(gl, vertices, colors, indexMatrix) {
  var n = vertices.length / 3;
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get program for a_Position');
    return;
  }

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get location of u_ModelMatrix');
    return;
  }


  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix[indexMatrix].elements);


  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get location of u_ViewMatrix');
    return;
  }

  var viewMatrix = new Matrix4();
  viewMatrix.setLookAt(0.0, 0.0, 1.8, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ProjMatrix) {
    console.log('Failed to get location of u_ProjMatrix');
    return;
  }

  var projMatrix = new Matrix4();
  //projMatrix.setOrtho(-1.0,1.0,-1.0,1.0,1.0,2.0);
  projMatrix.setPerspective(60.0, 1.0, 0.1, 5.0);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);


  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);

  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
    console.log('Failed to get location of a_Color');
    return;
  }


  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Color);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  return n;
}
// updates the web view
function update() {
  //angle += 1.0;

  if(selectedFigure !== document.getElementById("surface").value){

    selectedFigure = document.getElementById("surface").value;

    if(arrayOfHistory.length > 1 && figure.length >= 3){

      //updateValues();

    }
  }

  draw(gl);
  requestAnimationFrame(update, canvas);
}
// fail issue ()
function updateValues () {

  document.getElementById("scaleX").value = arrayOfHistory[selectedFigure - 1][3];
  document.getElementById("scaleY").value =arrayOfHistory[selectedFigure - 1][4];
  document.getElementById("scaleZ").value =arrayOfHistory[selectedFigure - 1][5];

  document.getElementById("translateX").value =arrayOfHistory[selectedFigure - 1][6];
  document.getElementById("translateY").value =arrayOfHistory[selectedFigure - 1][7];
  document.getElementById("translateZ").value = arrayOfHistory[selectedFigure - 1][8];

  angleXYZ[0] =  arrayOfHistory[selectedFigure - 1][9];
  angleXYZ[1] =  arrayOfHistory[selectedFigure - 1][10];
  angleXYZ[2] =  arrayOfHistory[selectedFigure - 1][11];


  changeAngle(angleXYZ[0],angleXYZ[1],angleXYZ[2]);


}
// fail issue (TypeError: undefined is not an object (evaluating 'arrayOfHistory[selectedFigure - 1][0] = rotateAxis[0]'))
function updateHistory () {

  console.log(arrayOfHistory[selectedFigure - 1]);
  console.log(arrayOfHistory);

 arrayOfHistory[selectedFigure - 1][0] = rotateAxis[0];
 arrayOfHistory[selectedFigure - 1][1] = rotateAxis[1];
 arrayOfHistory[selectedFigure - 1][2] = rotateAxis[2];

 arrayOfHistory[selectedFigure - 1][3] = scaleAxis[0];
 arrayOfHistory[selectedFigure - 1][4] = scaleAxis[1];
 arrayOfHistory[selectedFigure - 1][5] = scaleAxis[2];

 arrayOfHistory[selectedFigure - 1][6] = translateAxis[0];
 arrayOfHistory[selectedFigure - 1][7] = translateAxis[1];
 arrayOfHistory[selectedFigure - 1][8] = translateAxis[2];

 arrayOfHistory[selectedFigure - 1][9] = angleXYZ[0];
 arrayOfHistory[selectedFigure - 1][10] = angleXYZ[1];
 arrayOfHistory[selectedFigure - 1][11] = angleXYZ[2];

}
// done
function draw(gl) {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (var i = 0; i < arrayFigures.length; i++) {
    var n = initVertexBuffers(gl, new Float32Array(arrayFigures[i]), new Float32Array(g_colors[i]),i);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
  }
}

//------------------------------------------------
// Clicks
//------------------------------------------------
// done
// end the figure and start another one
function rightClick(ev, gl) {
  document.getElementById("surface").max = (arrayFigures.length + 1);
  document.getElementById("surface").value = arrayFigures.length + 1;

  modelMatrix.push(new Matrix4());

  selectedFigure = arrayFigures.length + 1;
  kendoConsole.log(selectedFigure);

  if (arrayFigures[index]) {
    addHistory();
    figureHistory = [];
    figure = [];

    resetInput();


    index++;
  }
}
// done
// adds a new vector
function click(ev, gl, canvas) {
  if (event.buttons == 1) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    if (arrayFigures.length <= index) {
      figure = [];
      arrayFigures.push(figure);
      //modelMatrix.push(new Matrix4());
      arrayColors = [];
      g_colors.push(arrayColors);
    }

    //modelMatrix[index] = new Matrix4();

    arrayFigures[index].push(x);
    arrayFigures[index].push(y);
    var z = 0.0;
    if (ev.altKey) {
      z = -0.5;
    } else if (ev.shiftKey) {
      z = -1.0;
    }
    arrayFigures[index].push(z);



    g_colors[index].push(Math.random());
    g_colors[index].push(Math.random());
    g_colors[index].push(Math.random());
    /*
    g_colors[index].push(color);
    g_colors[index].push(color);
    g_colors[index].push(color);
    */

    console.log("figure");
    console.log(figure);


  }
}
