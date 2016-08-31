window.addEventListener("load", windowLoadHandler, false);
//for debug messages
var Debugger = function() { };
Debugger.log = function(message) {
  try {
    console.log(message);
  }
  catch (exception) {
    return;
  }
}

function windowLoadHandler() {
  canvasApp();
}

function canvasSupport() {
  return Modernizr.canvas;
}

function canvasApp() {
  if (!canvasSupport()) {
    return;
  }
  
  var displayCanvas = document.getElementById("displayCanvas");
  var context = displayCanvas.getContext("2d");
  var displayWidth = displayCanvas.width;
  var displayHeight = displayCanvas.height;
  
  init();
  
  function init() {
    generate();
    displayCanvas.addEventListener("click", clickListener, false);
  }
    
  function clickListener(evt) {
    context.clearRect(0,0,displayWidth,displayHeight);
    generate();
        
    //code below prevents the mouse down from having an effect on the main browser window:
    if (evt.preventDefault) {
      evt.preventDefault();
    } //standard
    else if (evt.returnValue) {
      evt.returnValue = false;
    } //older IE
    return false;
  }
  
  function generate() {
    var x0, y0, w, h;
    var numRects = 12;
    var alphaVariation;
    var angleVariation = Math.PI/32;
    var r,g,b,baseAlpha;
    var gradRad;
    var xMid,yMid;
    var gradIterates;
    
    bgColor = "#ffffff";
    
    //rectangle to fill:
    x0 = 0;
    y0 = 0;
    w = displayWidth;
    h = displayHeight;
    
    xMid = x0 + w/2;
    yMid = y0 + h/2;
    
    for (var i = 0; i < numRects; i++) {
          
      //random color
      r = Math.floor(Math.random()*255);
      g = Math.floor(Math.random()*255);
      b = Math.floor(Math.random()*255);      
      baseAlpha = 0;
      alphaVariation = 2/numRects;
            
      context.globalCompositeOperation = "lighter";
      
      
      gradRad = 1.1*h/2;
      gradIterates = 8;
      context.fillStyle = createLinearFractalGradient(context,xMid, yMid - gradRad, xMid, yMid + gradRad, 
                              angleVariation,r,g,b,baseAlpha,alphaVariation,gradIterates);
            
      //draw
      context.fillRect(x0,y0,w,h);
    }
    
    //background color
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = bgColor;
    context.fillRect(x0,y0,w,h);
    context.globalCompositeOperation = "source-over";
  }
  
  function createLinearFractalGradient(whichContext,x0,y0,x1,y1,angleVariation,r,g,b,a,alphaVariation,gradIterates) {
    //gradient - constant rgb values, but changes alpha according to subdivision control points.
    var numGradSteps = Math.pow(2,gradIterates);
    var stopNumber = 0;
    var gradRGB = "rgba(" + r + "," + g + "," + b + ","; //must complete with alpha
    var alpha;
    var zeroAlpha = 0.5/255;    
    var angle = (1 - 2*Math.random())*angleVariation;
    var xm = 0.5*(x0 + x1);
    var ym = 0.5*(y0 + y1);
    var ux = x0 - xm;
    var uy = y0 - ym;
    var sinAngle = Math.sin(angle);
    var cosAngle = Math.cos(angle);
    var vx = cosAngle*ux - sinAngle*uy;
    var vy = sinAngle*ux + cosAngle*uy;
    var driftX0 = xm + vx;
    var driftY0 = ym + vy;
    var driftX1 = xm - vx;
    var driftY1 = ym - vy;
    
    var grad = whichContext.createLinearGradient(driftX0, driftY0, driftX1, driftY1);
      
    var gradPoints = createRandomData(gradIterates);
    var gradFunctionPoint = gradPoints.first;
    while (gradFunctionPoint != null) {
      alpha = a + gradFunctionPoint.y*alphaVariation;
      
      //avoids scientific notation for small numbers screwing up rgba string:
      if (alpha < zeroAlpha) {
        alpha = 0;
      }
      else if (alpha > 1) {
        alpha = 1;
      }
      
      grad.addColorStop(stopNumber/numGradSteps,gradRGB+alpha+")");
      
      stopNumber++;
      gradFunctionPoint = gradFunctionPoint.next;
    }
    
    return grad;
  }

  //The following function uses a subdivision process to create a random variation without abrupt changes.
  //The "pointList" which is returned contains a linked list of data points with x value increasing from 0 to 1 through
  //the beginning to the end of the list, and the y value of each point defined by the noisy function.
  function createRandomData(iterations) {
    var pointList = {};
    pointList.first = {x:0, y:1};
    var lastPoint = {x:1, y:1}
    var minY = 1;
    var maxY = 1;
    var point;
    var nextPoint;
    var dx, newX, newY;
    var ratio;
    
    var minRatio = 0.33;
    
    pointList.first.next = lastPoint;
    for (var i = 0; i < iterations; i++) {
      point = pointList.first;
      while (point.next != null) {
        nextPoint = point.next;
        
        ratio = minRatio + Math.random()*(1 - 2*minRatio);
        newX = point.x + ratio*(nextPoint.x - point.x);
        
        //find the smaller interval
        if (ratio < 0.5) {
          dx = newX - point.x;
        }
        else {
          dx = nextPoint.x - newX;
        }
        
        newY = point.y + ratio*(nextPoint.y - point.y);
        newY += dx*(Math.random()*2 - 1);
        
        var newPoint = {x:newX, y:newY};
        
        //min, max
        if (newY < minY) {
          minY = newY;
        }
        else if (newY > maxY) {
          maxY = newY;
        }
        
        //put between points
        newPoint.next = nextPoint;
        point.next = newPoint;
        
        point = nextPoint;
      }
    }
    
    //normalize to values between 0 and 1
    if (maxY != minY) {
      var normalizeRate = 1/(maxY - minY);
      point = pointList.first;
      while (point != null) {
        point.y = normalizeRate*(point.y - minY);
        point = point.next;
      }
    }
    
    //unlikely that max = min, but could happen if using zero iterations. In this case, set all points equal to 1.
    else {
      point = pointList.first;
      while (point != null) {
        point.y = 1;
        point = point.next;
      }
    }
        
    return pointList;   
  }
    
}
