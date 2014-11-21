/**
 * UI widget for initializing a canvas element with search grid.
 * @constructor
 * @param {JQuery} $graph - Base canvas element wrapped by jQuery.
 * @param {function} implementation - The graph search implementation.
 * @param {object} opts - Options object for extending the widget's behavior.
 */
function GraphCanvas($graph, implementation, opts) {
  this.$graph = $graph;
  this.search = implementation;
  
  this.opts = $.extend({ boxSize: 10 }, opts);
  this.grid = [];
  this.boxes = [];
  this.walls = {};
  
  this.initialize();
}

/**
 * Initializes the canvas element with best-fit width and height,
 * creates empty grid for use with provided graph search algorithm,
 * binds event handlers for touch and mouse input.
 * Importantly, divides the canvas into a grid of boxes on which we
 * will draw lines.
 */
GraphCanvas.prototype.initialize = function() {
  this.screenDimension = Math.min($('body').width(), $('body').height());
  var $graph = this.$graph;
  $graph.attr('width', this.screenDimension);
  $graph.attr('height', this.screenDimension);
  $graph.css({
    width: this.screenDimension,
    height: this.screenDimension
  });
  
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

/**
 * Updates search grid on each new line drawn.
 */
GraphCanvas.prototype.updateGrid = function () {
  this.boxes.forEach(function (box) {
    if (this.isWall(box)) {
      var node = this.nodeFromBox(box);
      this.grid[node.x][node.y] = GraphNodeType.WALL;
    }
  }.bind(this));
  this.graph = new Graph(this.grid);
};

/**
 * Click (or touch) handler that:
 * - identifies its box
 * - validates the click
 * - searches `grid` for a path to join two boxes clicked in succession
 * - starts animating the path
 */
GraphCanvas.prototype.clicked = function(ev) {
  var offset = this.$graph.offset();
  var box = this.boxAt({
    x: ev.clientX - offset.left,
    y: ev.clientY - offset.top
  });
  assert(box, 'no box found for', ev.clientX, ev.clientY);
  var endNode = this.nodeFromBox(box);
  if (this.isWall(box) || this.isStartBox(box)) {
 		alert('Clicked a line, try again.');
 		this.startBox = null;
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

/**
 * Whether a particular box is a wall
 * By wall, we mean that it has been part of a line already,
 * so it cannot be traversed again
 */
GraphCanvas.prototype.isWall = function (box) {
  return this.walls[box.toString()];
};

/**
 * Sets the passed box as a wall
 * @param {Box} box - box to mark as a wall
 */
GraphCanvas.prototype.setWall = function (box) {
  this.walls[box.toString()] = true;
};

/**
 * Whether the passed box equates the starting box for the current line
 * @param {Box} box - box to check for'
 */
GraphCanvas.prototype.isStartBox = function (box) {
  return this.startBox && this.startBox.equals(box);
};

/**
 * Finds the box at the specified coordinates on the canvas
 * @param {object} coords - `x`, `y` relative to the canvas'
 */
GraphCanvas.prototype.boxAt = function (coords) {
  var x = Math.floor(coords.x / this.boxSize),
    y = Math.floor(coords.y / this.boxSize);
  return this.boxes[(x * this.gridSize) + y];
};

/**
 * Gets the `GraphNode` in `grid` corresponding to the specified box
 * @param {Box} box
 */
GraphCanvas.prototype.nodeFromBox = function (box) {
  var xIndex = Math.floor(box.x / this.boxSize),
    yIndex = Math.floor(box.y / this.boxSize);
  return this.graph.nodes[xIndex][yIndex];
};

/**
 * Gets the corresponding box in `GraphCanvas` for a `GraphNode`
 * @param {GraphNode} node
 */
GraphCanvas.prototype.boxFromNode = function (node) {
  return this.boxes[node.x * this.gridSize + node.y];
};

/**
 * Animates the line through its path,
 * marking each box as a wall on the way
 * @param {GraphNode[]} path - The path to traverse in order to draw the line
 */
GraphCanvas.prototype.animateLine = function (path) {
  var timeout = 100/this.graph.nodes.length;
  var startNode = this.nodeFromBox(this.startBox);
  var step = function (path, i) {
    if (i >= path.length) return this.updateGrid();
    var box = this.boxFromNode(path[i]),
      prevBox = this.boxFromNode(path[i - 1] || startNode);
    this.setWall(box);
    this.drawLine(prevBox, box);
    setTimeout(function () {
      step(path, i + 1);
    }, timeout);
  }.bind(this);
  step(path, 0);
};

/**
 * Draws a line between the centers of two provided boxes
 * @param {Box} b1
 * @param {Box} b2
 */
GraphCanvas.prototype.drawLine = function (b1, b2) {
  var b1Center = b1.center(),
    b2Center = b2.center();
  var ctx = this.ctx;
  ctx.beginPath();
  ctx.moveTo(b1Center.x, b1Center.y);
  ctx.lineTo(b2Center.x, b2Center.y);
  ctx.lineWidth = 1;
  ctx.stroke();
};

/**
 * Helper method to draw a grid on the canvas showing all the boxes
 */
GraphCanvas.prototype.drawGrid = function () {
  var ctx = this.ctx;
  var i;
  for (i = 1; i <= this.gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * this.boxSize);
    ctx.lineTo(this.gridSize * this.boxSize, i * this.boxSize);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  for (i = 1; i <= this.gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * this.boxSize, 0);
    ctx.lineTo(i * this.boxSize, this.gridSize * this.boxSize);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
};

/**
 * Represents a Box
 * @constructor
 * @param {number} x - x-coordinate of the box canvas left
 * @param {number} y - y-coordinate of box from canvas top
 * @param {number} size - Size of the box (side of square)
 */
function Box(x, y, size) {
  this.x = x;
  this.y = y;
  this.size = size;
}

/**
 * Finds the center of the box
 */
Box.prototype.center = function () {
  return {
    x: Math.floor(this.x + (this.size / 2)),
    y: Math.floor(this.y + (this.size / 2))
  };
};

/**
 * Whether the box contains a point whose coordinates are given
 * @param {number} x - x-coordinate of point
 * @param {number} y - y-coordinate of point
 */
Box.prototype.contains = function (x, y) {
  return this.x < x && this.y < y &&
      (this.x + this.size) >= x && (this.y + this.size) >= y;
};

/**
 * String representation of Box
 */
Box.prototype.toString = function () {
  return '[' + this.x + ',' + this.y + ']';
};

/**
 * Whether this box is equal to another box
 * @param {Box} box - The box to compare this box with
 */
Box.prototype.equals = function (box) {
  return box && this.x === box.x && this.y === box.y;
};

/**
 * Helper function runtime validations and coding sanity
 * @param {truthy|falsy} condition - To Throw Or Not To Throw
 */
function assert(condition) {
  if (!condition) {
    console.log.apply(console, [].slice.call(arguments, 1));
    throw new Error(arguments[1]);
  }
}
