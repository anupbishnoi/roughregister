var tdh = 10;
start = function() {
	div = $('table');
	
	table = $c('table');
	// table.width = "100%";
	// table.height = "100%";
	//table.style.left = "100px";
	div.appendChild(table);
	
	tr = $c('tr');
	table.appendChild(tr);
	
	td = $c('td');
	td.height = tdh;
	td.width = 10;
	td.style.backgroundColor = "#000";
	td.style.position = "absolute";
	td.style.left = "0px";
	td.style.top = "0px";
	tr.appendChild(td);
	
	setInterval(time, 40);
}

window.onload = start;

var t = 0;
var ty = new Array();
var height = 500;
var uy = 0;
var ux = 3;
var g = 1;
var ey = 0.8;
var ex = 0.8;

time = function() {
	t += 1;
	move();
}

move = function() { 
	td = $t($('table'), 'td')[0];
	
	x = eval(td.style.left.replace("px",""));
	x += ux*1;
	td.style.left = x + "px";
	
	y = eval(td.style.top.replace("px",""));
	if ((y) > (height - tdh)) {
		//y = height;
		uy = -ey*uy;
		ux = ex*ux;
	}
	y += uy*1;
	uy += g;
	
	td.style.top = y + "px";
}

	$ = function(arg) {
	return document.getElementById(arg);
}

$c = function(arg) {
	return document.createElement(arg);
}

$t = function(obj, arg) {
	return obj.getElementsByTagName(arg);
}