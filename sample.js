var image = new Image();  
image.src = "hs_appl1.png";  
//image.src = "p_blackm.png"

// http://doiop.com/

var zoom = 20;
var offsBase = {x:1, y:6}
var xoffs = offsBase.x;
var yoffs = offsBase.y;
var numbersDisp = 0; // 0:dec, 1:hex, 2:2^n

var xend = 0; 
var ystart = 0;
var labels = null;
var cpedit = null;
var BITS_WIDTH = 24;
var BITS_HEIGHT = 30;

var MAP_SZ = 50;
var map = [];
var inHandPaint = false;
var BLACK = "rgba(0,0,0,255)", WHITE = "rgba(255,255,255,255)";

var urlarg = window.location.search.substring(1)


function initMap() {
	for(var i = 0; i < MAP_SZ; ++i) {
		map[i] = []
		for(var j = 0; j < MAP_SZ; ++j) {
			map[i][j] = WHITE;
		}
	}
}
function copyMap(from) {
	to = []
	for(var i = 0; i < MAP_SZ; ++i) {
		to[i] = []
		for(var j = 0; j < MAP_SZ; ++j) {
			to[i][j] = from[i][j];
		}
	}
	return to;
}
	
function drawGrid() 
{
	for (var x = 0; x < xend ; x += zoom) {
		ctx.moveTo(x, 0);
		ctx.lineTo(x, canvas.height);	
	}
	for (var y = ystart; y < canvas.height; y += zoom) {
		ctx.moveTo(0, y);
		ctx.lineTo(xend, y);	
	}
	ctx.strokeStyle = "rgba(170,170,170,255)";
	ctx.stroke();
	
	ctx.fillStyle = "rgb(0,0,0)";
	ctx.font=""+(zoom-1)+"px monospace";
	ctx.save();
	ctx.translate(xend, ystart);
	ctx.rotate(-Math.PI/2);
	t = 1;
	for(var i = 0; i < BITS_WIDTH; ++i) {
		if (numbersDisp == 0)
			s = "" + t.toLocaleString();
		else if (numbersDisp == 1)
			s = "0x" + t.toString(16);
		else if (numbersDisp == 2)
			s = "2^" + i;
		ctx.fillText(s, 4, -4 - zoom*i);
		t = t*2;
	}
	ctx.restore();
}	
	
function drawMap() {
	for(var y = 0; y < MAP_SZ; ++y) {
		for(var x = 0; x < MAP_SZ; ++x) {
			ctx.fillStyle = map[x][y];
			ctx.fillRect(x * zoom, y * zoom, zoom, zoom);		
		}
	}
}

function initCoord() {
	xend = canvas.width - 2*zoom + 1;
	ystart = zoom * offsBase.y;
}
	
function draw(skipValues, skipCp) {	
	canvas.width = zoom * (BITS_WIDTH + 11);
	canvas.height = zoom * (BITS_HEIGHT + offsBase.y)
	initCoord();
	drawMap();
	drawGrid();
	if (!skipValues)
		updateValues(skipCp);
}

var mouseStart = null;
var mapDragged = null;

var paintColor = BLACK

function handPaint(e, samp) {
	var x = Math.round(e.clientX / zoom) - 1;
	var y = Math.round(e.clientY / zoom) - 1;
	s = map[x][y]
	if (samp) {
		if (s == "rgba(255,255,255,255)")
			paintColor = BLACK
		else
			paintColor = WHITE;
	}
	map[x][y] = paintColor
	draw();
}

function mapToMap(from) {
	initMap();
	for (var x = 0; x < MAP_SZ; ++x){
		for (var y = 0; y < MAP_SZ; ++y){
			var sx = xoffs + x, sy = yoffs + y;
			if (sx < 0 || sx >= MAP_SZ || sy < 0 || sy >= MAP_SZ)
				continue;		
			map[x][y] = from[sx][sy]
		}
	}
}

function mouseDown(e) {
	mouseStart = {x:e.clientX, y:e.clientY};
	if (inHandPaint)
		handPaint(e, true)
	else
		mapDragged = copyMap(map)

}
function mouseUp(e) {
	mouseStart = null;
	mapDragged = null
}

function mouseMove(e) {
	if (mouseStart === null)
		return;
	if (inHandPaint) {
		handPaint(e)
		return
	}
	var x = Math.floor((mouseStart.x - e.clientX)/zoom);
	var y = Math.floor((mouseStart.y - e.clientY)/zoom);
	if (x == xoffs && y == yoffs) 
		return;
	xoffs = x;
	yoffs = y;	
	if (mapDragged)
		mapToMap(mapDragged);
	draw();
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function isDark(c) {
	c = parseInt(c.substr(5,3));
	return (c < 128)
}

function updateValues(skipCp) {
	if (labels === null)
		return;
	
	for(var y = 0; y < BITS_HEIGHT; ++y) {
		var v = 0;
		bit = 1;
		for(var x = 0; x < BITS_WIDTH; ++x) {
			var sx = BITS_WIDTH + 8 - x//*zoom - (zoom/2)
			var sy = offsBase.y + y//*zoom + (zoom/2)

			var c = map[sx][sy]
			if (isDark(c))
				v += bit
			bit = bit*2	
		}
		if (numbersDisp != 0 && v != 0)
			v = "0x" + pad(v.toString(16), 8)
		labels[y].value = v; //.toString(16);
	}
	if (!skipCp)
		updateCpValues()
}

// large text area at the bottom
function updateCpValues() {
	var v = ""
	for(var y = 0; y < BITS_HEIGHT; ++y) {
		v += labels[y].value
		if (y < BITS_HEIGHT - 1)
			v += ","
	}
	cpedit.value = v
}

function imageToMap(imgData) {
	initMap();
	for (var x = 0; x < image.width; ++x){
		for (var y = 0; y < image.height; ++y){
			var sx = offsBase.x + x, sy = offsBase.y + y;
			if (sx < 0 || sx > MAP_SZ || sy < 0 || sy > MAP_SZ)
				continue;			
			var i = (y * image.width + x)*4;
			var r = imgData[i  ];
			var g = imgData[i+1];
			var b = imgData[i+2];
			var a = imgData[i+3];
			map[sx][sy] = "rgba("+r+","+g+","+b+","+(a)+")";
		}
	}	
}

function loadImage() {
	var offtx = document.createElement('canvas').getContext('2d');
	offtx.drawImage(image,0,0);
	var imgData = offtx.getImageData(0, 0, image.width, image.height).data;
	imageToMap(imgData);
    draw()
}

$(image).load(function() {  
	if (urlarg == "") {
		loadImage();
	}
});  

function argToMap(arg) {
	var nums = arg.split(/[&,]/);
	for(var i = 0; i < nums.length; ++i) {
		setTextFor(i, nums[i])
	}
	updateCpValues();
}


function createElem(kind, type, value, x, y, click) {
    var i = document.createElement(kind);
    i.type = type;
	if (value !== null)
		i.value = value;
	i.style.position = "absolute"
	i.style.left = x + "px";
	i.style.top = y + "px";
    i.onclick = click;
    document.body.appendChild(i);
	return i;
}
function createInput(type, label, x, y, func) {
	return createElem("input", type, label, x, y, func);
}

function repos() {
	draw();
	for(var i = 0; i < labels.length; ++i) {
		l = labels[i]
		l.style.left = (xend + 20) + "px";
		l.style.top = (ystart + 5 + i*zoom) + "px";
	}
	cpedit.style.top = ystart + BITS_HEIGHT * zoom + 20 + "px"
}

function setTextFor(i, s) {
	bit = 1;
	i += 6;
	val = parseInt(s, (numbersDisp == 0)?10:16  )
	for(x = 0; x < BITS_WIDTH; ++x) {
		var sx = BITS_WIDTH + 8 - x//*zoom - (zoom/2)
		var dark = isDark(map[sx][i])
		if ( (val & bit) != 0) {
			if (!dark)
				map[sx][i] = BLACK
		}
		else if (dark)
			map[sx][i] = WHITE
		bit = bit * 2;
	}
}

function textChange(i, ed) {
	setTextFor(i, ed.value)
	draw(true)
	updateCpValues()
}

function cpEditInput() {
	var x = cpedit.value.split(",")
	for(var i = 0; i < labels.length; ++i) {
		if (i < x.length)
			setTextFor(i, x[i])
		else
			setTextFor(i, 0)
	}
	draw(false, true)
}


initMap();	

window.onload = function()
{
	//alert("X" + urlarg +"X")	
	initCoord();
    createInput("button", "numbers", xend + 20, 10, function(){
        numbersDisp = (numbersDisp + 1) % 3;
		draw();
    });
	labels = []
	for(var i = 0; i < BITS_HEIGHT; ++i) {
		var l = createInput("text", "0", xend + 20, ystart + 5 + i*zoom, null);
		l.style.fontFamily = "monospace"
		labels[i] = l
		l.oninput = function(ii,ll) { return function() { textChange(ii, ll) } }(i,l)
	}
	createInput("button", "+", xend + 20, 35, function(){
        zoom += 2;
		repos();
    });
	createInput("button", "-", xend + 50, 35, function(){
        zoom -= 2;
		repos();
    });	
	
	var pnt = createInput("checkbox", false, xend + 20, 60, function(){
		inHandPaint = !inHandPaint
    });	
	pnt.id = "paintCheckbox";
	var lbl = createElem("label", null, "Paint", (xend + 45), 60, null)
	lbl.htmlFor = "paintCheckbox"
	lbl.innerText = "Paint";
	
	createInput("button", "clear", xend + 90, 10, function(){
        initMap()
		draw()
    });	

	var fload = createInput("file", null, xend + 90, 35, null);
	fload.onchange = function() {
		var f = this.files[0]
		image.src = window.URL.createObjectURL(f)
		fload.value = null
	};
	
	cpedit = createElem("textarea", null, "0", 10, ystart + BITS_HEIGHT * zoom + 20, null)
	cpedit.style.width = xend + "px"
	cpedit.style.height = "70px"
	cpedit.oninput = cpEditInput
	
	canvas.onmousedown = mouseDown;
	document.onmouseup = mouseUp;
	document.onmousemove = mouseMove;
	

	if (urlarg != "") {
		argToMap(urlarg)
		draw()
	}
}


