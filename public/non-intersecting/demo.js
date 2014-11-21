var css = { start: "start", finish: "finish", wall: "wall", active: "active" };

function GraphSearch($graph, implementation) {
  this.$graph = $graph;
  this.search = implementation;
  this.opts = {wallFrequency:0, gridSize:100};
  this.initialize();
}

GraphSearch.prototype.initialize = function() {
  var self = this;
	var grid = this.grid = [];
	var $graph = this.$graph;
	$graph.empty();
	
  var cellWidth = ($graph.width()/this.opts.gridSize)-2;  // -2 for border
  var cellHeight = ($graph.height()/this.opts.gridSize)-2;
  var $cellTemplate = $("<span />").addClass("grid_item").width(cellWidth).height(cellHeight);
  
  for(var x=0;x<this.opts.gridSize;x++) {
    var $row = $("<div class='clear' />");
  	$graph.append($row);
  	var row = [];
  	for(var y=0;y<this.opts.gridSize;y++) {
  		var id = "cell_"+x+"_"+y;
  		var $cell = $cellTemplate.clone();
  		$cell.attr("id", id).attr("x", x).attr("y", y);
  		$row.append($cell);
  		row.push(GraphNodeType.OPEN);
  	}
  	grid.push(row);
  }
  this.graph = new Graph(grid);

  $graph.find(".grid_item").click(function() {
    self.cellClicked($(this));
  });
};

GraphSearch.prototype.updateGrid = function () {
  var grid = this.grid;
  this.$graph.find('.active').each(function () {
    grid[$(this).attr('x')][$(this).attr('y')] = GraphNodeType.WALL;
  });
  this.graph = new Graph(grid);
};

GraphSearch.prototype.cellClicked = function($end) {
  var end = this.nodeFromElement($end);
 	if($end.hasClass(css.wall) || $end.hasClass(css.start)) {
 		log("clicked on wall or start...", $end);
 		return;
 	}
 	var $start = this.$graph.find("." + css.start);
 	if (!$start.length) {
 	  $end.addClass(css.start);
 	  return;
 	}
 	var start = this.nodeFromElement($start);
  var path = this.search(this.graph.nodes, start, end);
	if(!path || !path.length) { 
    this.animateNoPath();
	} else {
    this.animatePath(path);
  }
  this.$graph.find("." + css.start).removeClass(css.start)
};
GraphSearch.prototype.nodeFromElement = function($cell) {
  return this.graph.nodes[parseInt($cell.attr("x"))][parseInt($cell.attr("y"))];
};
GraphSearch.prototype.animateNoPath = function() {
    var $graph = this.$graph;
    var jiggle = function(lim, i) {
	    if(i>=lim) { $graph.css("top", 0).css("left", 0); return;  }
	    if(!i) i=0;
	    i++;
	    $graph.css("top", Math.random()*6).css("left", Math.random()*6);
	    setTimeout( function() { jiggle(lim, i) }, 5 );
    };
    jiggle(15);
};
GraphSearch.prototype.animatePath = function(path) {
	var $graph = this.$graph;
	var elementFromNode = function(node) {
		return $graph.children().eq(node.x).children().eq(node.y);
	};
	
	var timeout = 100/this.graph.nodes.length;
    var addClass = function(path, i)  {
	    if(i>=path.length) return this.updateGrid();
	    elementFromNode(path[i]).addClass(css.active);
	    setTimeout( function() { addClass(path, i+1) }, timeout);
    }.bind(this);
    
    addClass(path, 0);
    this.$graph.find("." + css.start).removeClass(css.start).addClass(css.active);
};


