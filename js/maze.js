function MazeGame(canvas, character, background, options) {
	var fixedMaze = [
	[0,0,0,0,0,0,0,0,0,0],
	[0,4,9,0,0,0,0,0,0,0],
	[0,0,6,5,5,9,0,0,0,0],
	[0,0,0,0,0,14,1,0,0,0],
	[0,0,0,0,4,7,5,9,0,0],
	[0,0,0,0,0,12,5,7,1,0],
	[12,5,5,5,5,3,0,0,0,0],
	[6,5,9,0,0,0,0,0,0,0],
	[0,0,6,9,12,5,5,9,0,0],
	[0,0,0,6,3,0,0,6,1,0],
	];

	var default_options = {
		colors: {
		},
		starting_position: { x: 1, y: 1 },
		level_size: [10, 10],
		offset: {x: 0, y: 0},
		scaleX: 26,
		scaleY: 46,
		user_diameter: 4,
		user_path_width: 8,
		onStart: function(){},
		onGameEnd: function(){},
		onMove: function(){}
	}
	
	// todo: don't use jQuery here
	options = $.extend({}, default_options, options);

	$(window).on('resize', center);
	
	var ctx, currentPos, maze, path, gameInProgress;
	var offsets = {
		"left"	:	{ x: -1, y: 0 },
		"up"	:	{ x: 0, y:	-1 },
		"right"	:	{ x: 1, y: 0 },
		"down"	:	{ x: 0, y: 1 }
	};

	var rand = new Rand();
	
	this.init = function() {
		if (canvas.getContext) {
			ctx = canvas.getContext("2d");
			setup(options.level_size[0], options.level_size[1]);
			start();
		}
	}
	
	this.init();
	
	function Cell(x, y) {
		this.visited = false;
		this.up = true;
		this.right = true;
		this.down = true;
		this.left = true;
		this.x = x;
		this.y = y;
	}
	
	function Rand() {
		this.randomInt = function (x) {
			return Math.floor(Math.random() * x);
		};
		this.pickRand = function (al) {
			return al[this.randomInt(al.length)];
		};
	}
	
	function Maze(width, height) {
		this.m = [];
		this.width = width;
		this.height = height;
		this.start = options.starting_position;
		this.end = {
			x: this.width - 1,
			y: this.height - 1
		};
		this.c;
		this.nextC;
		this.stack = [];
		this.initMaze = function () {
			for (y = 0; y < height; y++) {
				this.m.push(new Array());
				for (x = 0; x < width; x++) {
					this.m[y].push(new Cell(x, y));
				}
			}
		};
		this.getNeighbors = function (x, y) {
			var n = [];
			var c = this.getCell(x, y);
			if (y != 0) {
				n.push(this.getCell(x, y - 1));
			}
			if (y != height - 1) {
				n.push(this.getCell(x, y + 1));
			}
			if (x != 0) {
				n.push(this.getCell(x - 1, y));
			}
			if (x != width - 1) {
				n.push(this.getCell(x + 1, y));
			}
			return n;
		};
		this.availableNeighbors = function (x, y) {
			var list = [];
			var neighbors = this.getNeighbors(x, y);
			for (i = 0; i < neighbors.length; i++) {
				if (!neighbors[i].visited) list.push(neighbors[i]);
			}
			return list;
		};
		this.randomNeighbor = function (x, y) {
			return rand.pickRand(this.availableNeighbors(x, y));
		};
		this.breakWall = function (c1, c2) {
			if (c1.x == c2.x) {
				if (c1.y < c2.y) {
					c1.down = false;
					c2.up = false;
				}
				if (c1.y > c2.y) {
					c1.up = false;
					c2.down = false;
				}
			} else if (c1.y == c2.y) {
				if (c1.x < c2.x) {
					c1.right = false;
					c2.left = false;
				}
				if (c1.x > c2.x) {
					c1.left = false;
					c2.right = false;
				}
			}
		};
		this.getCell = function (x, y) {
			return this.m[y][x];
		};
		this.inBounds = function (x, y) {
			if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
				return true;
			}
			return false;
		};
		this.isDeadEnd = function (x, y) {
			var neighbors = this.getNeighbors(x, y);
			for (i = 0; i < neighbors.length; i++) {
				if (!neighbors[i].visited) return false;
			}
			return true;
		};
		this.isStart = function (x, y) {
			if (this.start.x === x && this.start.y === y) return true;
			return false;
		};
		this.isEnd = function (x, y) {
			if (this.end.x === x && this.end.y === y) return true;
			return false;
		};
		this.generateMaze = function () {
			this.c = this.getCell(rand.randomInt(this.width), rand.randomInt(this.height));
			this.c.visited = true;
			this.mazeDo();
			while (this.stack.length !== 0) {
				if (this.isDeadEnd(this.c.x, this.c.y) || this.isEnd(this.c.x, this.c.y) || this.isStart(this.c.x, this.c.y)) {
					this.nextC = this.stack.pop();
					this.c = this.nextC;
				} else {
					this.mazeDo();
				}
			}
		};
		this.mazeDo = function () {
			this.nextC = this.randomNeighbor(this.c.x, this.c.y);
			this.nextC.visited = true;
			this.breakWall(this.c, this.nextC);
			this.stack.push(this.c);
			this.c = this.nextC;
		};
		this.initMaze();
		// this.generateMaze();
		for (var y = 0; y<fixedMaze.length; y++) {
			for (var x = 0; x<fixedMaze[0].length; x++) {
				if ((fixedMaze[y][x] & 1) > 0) this.getCell(x, y).left = false;
				if ((fixedMaze[y][x] & 2) > 0) this.getCell(x, y).up = false;
				if ((fixedMaze[y][x] & 4) > 0) this.getCell(x, y).right = false;
				if ((fixedMaze[y][x] & 8) > 0) this.getCell(x, y).down = false;
			}
		}
		this.end.x = 7;
		this.end.y = 9;
	}
	
	function setup(height, width) {
		maze = new Maze(height, width);
		currentPos = options.starting_position;
		path = [];
		path.push(currentPos);
		center();
	}

	function center() {
		canvas.width = $('body').width();
		canvas.height = $('body').height();
		options.offset.x = Math.floor((canvas.width / 2) - (maze.width * options.scaleX / 2));
		options.offset.y = Math.floor((canvas.height / 2) - (maze.height * options.scaleY / 2));
		$("#a").width(maze.width * options.scaleX + 3).css('padding-top', (canvas.height / 2) - (maze.height * options.scaleY / 2) - $('h1').height());
		$("#time, #steps").css('margin-top', maze.height * options.scaleY);
		console.log('width', canvas.width);
		console.log('height', canvas.height);
		console.log('offsetx', options.offset.x);
		console.log('offsety', options.offset.y);
		draw();
	}
	
	function start() {
		gameInProgress = true;
		options.onStart();
	}
	
	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(background, options.offset.x, options.offset.y);
		image(currentPos.x, currentPos.y, character);
	}
	
	this.move = function(direction) {
		var newPos = {
			x: currentPos.x + offsets[direction].x,
			y: currentPos.y + offsets[direction].y
		};
		if (gameInProgress && maze.inBounds(newPos.x, newPos.y)) {
			if (maze.getCell(currentPos.x, currentPos.y)[direction] === false) {
				path.push(newPos);
				currentPos = newPos;
				draw();
				if (maze.isEnd(newPos.x, newPos.y)) {
					options.onGameEnd(true);
				}
			}
		}
	}
	
	function drawMaze() {
		for (y = 0; y < maze.height; y++) {
			for (x = 0; x < maze.width; x++) {
				drawCell(x, y);
			}
		}
	}
	
	function image(x, y, image) {
		var offsetX = options.offset.x + (x-0.3) * options.scaleX;
		var offsetY = options.offset.y + (y-1.5) * options.scaleY;
		ctx.drawImage(image, offsetX, offsetY);
	}
	
	this.getSteps = function() {
		// subtract one to account for the current positon being part of the path
		return path.length - 1;
	}
}
