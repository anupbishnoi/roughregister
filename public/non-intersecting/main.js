function GraphSearch($graph, implementation) {
  this.$graph = $graph;
  this.search = implementation;
  
  this.opts = { boxSize: 10 };
  this.grid = [];
  this.boxes = [];
  this.walls = {};
  
  this.initialize();
}

GraphSearch.prototype.initialize = function() {
  this.screenDimension = Math.min(this.$graph.width(), this.$graph.height());
  this.$graph.attr('width', this.screenDimension);
  this.$graph.attr('height', this.screenDimension);
  
  var boxSize = this.boxSize = this.opts.boxSize;
  this.gridSize = Math.floor(this.screenDimension / this.boxSize);

  for (var x = 0; x < this.gridSize; x++) {
    var row = [];
  	for (var y = 0; y < this.gridSize; y++) {
  		row.push(GraphNodeType.OPEN);
  		this.boxes.push(new Box(x * boxSize, y * boxSize, boxSize));
  	}
  	this.grid.push(row);
  }
  
  this.graph = new Graph(this.grid);
  this.ctx = this.$graph[0].getContext("2d");
  this.$graph.bind('click touchstart', this.clicked.bind(this));
};

GraphSearch.prototype.updateGrid = function () {
  this.boxes.forEach(function (box) {
    if (this.isWall(box)) {
      var node = this.nodeFromBox(box);
      this.grid[node.x][node.y] = GraphNodeType.WALL;
    }
  }.bind(this));
  this.graph = new Graph(this.grid);
};

GraphSearch.prototype.clicked = function(ev) {
  var offset = this.$graph.offset();
  var box = this.boxAt({
    x: ev.clientX - offset.left,
    y: ev.clientY - offset.top
  });
  assert(box, 'no box found for', ev.clientX, ev.clientY);
  console.log('box clicked', box);
  var endNode = this.nodeFromBox(box);
  if (this.isWall(box) || this.isStartBox(box)) {
 		alert('Clicked a line, try again.');
 		return;
 	}
 	if (!this.startBox) {
 	  this.startBox = box;
 	  this.setWall(box);
 	  return;
 	}
 	var startNode = this.nodeFromBox(this.startBox);
  var path = this.search(this.graph.nodes, startNode, endNode);
	if(path && path.length) {
	  this.animateLine(path);
	} else {
    alert('Cannot draw a line connecting those points.');
  }
  this.startBox = null;
};
GraphSearch.prototype.isWall = function (box) {
  return this.walls[box.toString()];
};
GraphSearch.prototype.setWall = function (box) {
  this.walls[box.toString()] = true;
};
GraphSearch.prototype.isStartBox = function (box) {
  return this.startBox && this.startBox.equals(box);
};
GraphSearch.prototype.boxAt = function (coords) {
  var x = Math.floor(coords.x / this.boxSize),
    y = Math.floor(coords.y / this.boxSize);
  // return this.graph.nodes[x][y];
  return this.boxes[(x * this.gridSize) + y];
  // for (var i = 0; i < this.boxes.length; i++) {
  //   var box = this.boxes[i];
  //   if (box.x <= coords.x && box.y < coords.y &&
  //       (box.x + box.size) > coords.x && (box.y + box.size) > coords.y) {
  //     return box;
  //   }
  // }
};
GraphSearch.prototype.nodeFromBox = function (box) {
  var xIndex = Math.floor(box.x / this.boxSize),
    yIndex = Math.floor(box.y / this.boxSize);
  return this.graph.nodes[xIndex][yIndex];
};
GraphSearch.prototype.boxFromNode = function (node) {
  return this.boxes[node.x * this.gridSize + node.y];
};
GraphSearch.prototype.animateLine = function (path) {
  var timeout = 100/this.graph.nodes.length;
  var step = function (path, i) {
    if (i >= path.length) return this.updateGrid();
    var box = this.boxFromNode(path[i]),
      prevBox = this.boxFromNode(path[i - 1]);
    this.setWall(box);
    this.drawLine(prevBox, box);
    setTimeout(function () {
      step(path, i + 1);
    }, timeout);
  }.bind(this);
  step(path, 1);
};
GraphSearch.prototype.drawLine = function (b1, b2) {
  var b1Center = b1.center(),
    b2Center = b2.center();
  var ctx = this.ctx;
  ctx.beginPath();
  ctx.moveTo(b1Center.x, b1Center.y);
  ctx.lineTo(b2Center.x, b2Center.y);
  ctx.lineWidth = 1;
  ctx.stroke();
};

function Box(x, y, size) {
  this.x = x;
  this.y = y;
  this.size = size;
}
Box.prototype.center = function () {
  return {
    x: Math.floor(this.x + (this.size / 2)),
    y: Math.floor(this.y + (this.size / 2))
  };
};
Box.prototype.contains = function (x, y) {
  return this.x < x && this.y < y &&
      (this.x + this.size) >= x && (this.y + this.size) >= y;
};
Box.prototype.toString = function () {
  return '[' + this.x + ',' + this.y + ']';
};
Box.prototype.equals = function (box) {
  return box && this.x === box.x && this.y === box.y;
};

function assert(condition) {
  if (!condition) {
    console.log.apply(console, [].slice.call(arguments, 1));
    throw new Error(arguments[1]);
  }
}
