// game element
var objects = {
	car: null,
	egg: null,
	ground: [],
	backwheel: null,
	frontwheel: null
};
var keystate = {
	left: false,
	right: false
}

var Engine = Matter.Engine,
	Render = Matter.Render,
	World = Matter.World,
	Bodies = Matter.Bodies;
	Body = Matter.Body;
	Composites = Matter.Composites,
	Composite = Matter.Composite,
	Events = Matter.Events,
	Vertices = Matter.Vertices,
	Bounds = Matter.Bounds,
	Mouse = Matter.Mouse,
	Detector = Matter.Detector,
	Pair = Matter.Pair,
	MouseConstraint = Matter.MouseConstraint,
	Constraint = Matter.Constraint;

var engine, render, mouse;
var counter = 0;
var ROTATE_FORCE = 0.3;
var ACCELERATION = 0.01;
var ITEM_WIDTH = 200;
var WIDTH = 800;
var distance = 0;
var MIN_HEIGHT = 14;
var lastHeight = 0;
var gameover = false;

function onkeydown(event){
	if (event.keyCode == 37) // left
		keystate.left = true;
	else if (event.keyCode == 39)
		keystate.right = true;
}

function onkeyup(event){
	if (event.keyCode == 37)
		keystate.left = false;
	else if (event.keyCode == 39) // right
		keystate.right = false;
}

var moveWorld = function(engine, ammount) {
    var bodies = Composite.allBodies(engine.world);

    for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        var cPos = {
        	x: body.position.x + ammount,
        	y: body.position.y,
        }
        Body.setPosition(body, cPos);
    }
};

function logicProcess(event) {
	if (gameover == true) return;
	counter++;
	if (counter >= 60) counter = 0;
	// apply a force
	if (keystate.left) {
		Body.setAngularVelocity(objects.backwheel, -ROTATE_FORCE);
		Body.setAngularVelocity(objects.frontwheel, -ROTATE_FORCE);
	}
	if (keystate.right) {
		Body.setAngularVelocity(objects.backwheel, ROTATE_FORCE);
		Body.setAngularVelocity(objects.frontwheel, ROTATE_FORCE);
	}
	// check car position
	var carX = objects.car.position.x;
	if (carX != WIDTH / 2) {
		moveWorld(engine, WIDTH / 2 - carX);
		distance -= WIDTH / 2 - carX;
	}
	// handle new object, check if last object is coming
	var lastOb = objects.ground[objects.ground.length - 1];
	if (lastOb.position.x <= WIDTH) {
		var firstOb = objects.ground[0];
		World.remove(engine.world, firstOb);
		objects.ground.shift();
		// now create new guy
		// new height
		var newHeight = lastHeight + Math.round(Math.random() * 280 - 140);
		if (newHeight < MIN_HEIGHT) newHeight = MIN_HEIGHT;
		if (newHeight > 300) newHeight = 300; // check max height
		var vert = Vertices.fromPath("0," + -lastHeight + " " + ITEM_WIDTH + "," + -newHeight + " " + ITEM_WIDTH + ",0 0,0");
		var obHeight = newHeight > lastHeight ? newHeight : lastHeight;
		var centre = Vertices.centre(vert);
		var newgr = Bodies.fromVertices(centre.x + WIDTH + 100, centre.y + 400 + 7, vert, {
			isStatic : true,
			render: {
				fillStyle: "#F00",
				// strokeStyle: "#AAA",
				lineWidth: 0
		}
		});
		objects.ground.push(newgr);
		lastHeight = newHeight;
		World.add(engine.world, newgr);
		console.log("Ground size = " + objects.ground.length);
	}
	// handle egg
	var colls = [];
	for(var i = 0; i < objects.ground.length; i++){
		colls.push([objects.egg, objects.ground[i]]);
	}
	colls = Detector.collisions(colls, engine);
	if (colls.length > 0) gameover = true;
	// if (eggpos.y >= 380) gameover = true;
}

function drawStatus(events){
	var context = render.context;
	context.font = "20px Tahoma";
	context.fillStyle = "#000"
	if (gameover == true){
		context.fillText("Game over, final length: " + Math.round(distance / 100) + " units", 150, 80);
	}
	else
	{
		context.fillText(Math.round(distance / 100), 150, 80);
	}
}

function game_init() {
	/* init keyboard:
	 * we need only these two: left and right control
	 */
	document.body.addEventListener("keydown", onkeydown);
	document.body.addEventListener("keyup", onkeyup);

	/* init game variable */
	engine = Engine.create();
	render = Render.create({
		element: document.body,
		engine: engine,
		options: {
			wireframes: false,
		}
	});

	Events.on(engine, "beforeUpdate", logicProcess);
	Events.on(render, 'afterRender', drawStatus)
	for (var i = 0; i < 6; i++){
		var ground1 = Bodies.rectangle(ITEM_WIDTH * i, 400, ITEM_WIDTH, 15, {
			isStatic : true,
			render: {
				// fillStyle: "#CCC",
				// strokeStyle: "#AAA",
				lineWidth: 0
		}
		});
		objects.ground.push(ground1);
	}
	console.log(objects.ground[objects.ground.length - 1]);
	lastHeight = MIN_HEIGHT;
	// var vert = Vertices.fromPath("600,300 400,380 600,380")
	//var funcar = Composites.car(400, 0, 100, 30, 30);
	//console.log(funcar);
	// wheels
	objects.backwheel = Bodies.circle(200, 300, 15, {
		friction: 1,
		collisionFilter: {
			mask: 1
		},
		render: {
            sprite: {
                texture: './img/wheel.png'
            }
        }
	});
	objects.frontwheel = Bodies.circle(400, 300, 15, {
		friction: 1,
		collisionFilter: {
			mask: 1
		},
		render: {
            sprite: {
                texture: './img/wheel.png'
            }
        }
	});
	// body parts
	var bodyVert = Vertices.fromPath("1,42 24,13 36,13 36,0 41,0 41,13 96,13 97,0 102,0 102,14 117,13 143,42")
	objects.car = Bodies.fromVertices(300, 320, bodyVert, {
		collisionFilter: {
			category: 2
		},
		render: {
			fillStyle: "#0ff",
			strokeStyle: "#AAA",
			lineWidth: 0
		}
	})
	// Composite.add(objects.car, [bodyrect, bodyCoilA, bodyCoilB, objects.backwheel, objects.frontwheel]);
	// egg
	objects.egg = Bodies.circle(300, 230, 20);
	// create constraint between wheels and body
	var	constraintA = Constraint.create({
		bodyA: objects.frontwheel,
		pointA: { x: 0, y: 0 },
		bodyB: objects.car,
		pointB: { x: 40, y: 15 },
		length: 2,
		stiffness: 0.8,
		render: {
			visible: false
		}
	});
	var	constraintB = Constraint.create({
		bodyA: objects.backwheel,
		pointA: { x: 0, y: 0 },
		bodyB: objects.car,
		pointB: { x: -40, y: 15 },
		length: 0.5,
		stiffness: 1,
		render: {
			visible: false
		}
	});
	// constant for CoilA and CoilB
	World.add(engine.world, objects.ground)
	World.add(engine.world, [objects.car]);
	World.add(engine.world, [objects.egg]);
	World.add(engine.world, [objects.frontwheel, objects.backwheel]);
	World.add(engine.world, [constraintA, constraintB]);

	var carX = objects.car.position.x;
	if (carX != WIDTH / 2) moveWorld(engine, WIDTH / 2 - carX);

	/* start game */
	game_run();
}

function game_run() {
	Engine.run(engine);
	Render.run(render);
}

document.addEventListener("DOMContentLoaded", game_init);