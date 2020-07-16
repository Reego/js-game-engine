'use strict';

/*

RD GAME ENGINE (RDGE)

*/

// Setting up main entrance point

window.onload = main;

// Important global variables

var CANV;
var CONT;
var LOGGER;


// Input handling

function keyInputDown(e) {

	var key = event.key || event.keyCode;

	if(key in Level.keys && Level.keys[key] === false) {

		Level.keys[key] = true

	}
	// if (key === 'A' || key === 'a') {
 //        console.log('a');
 //    }
}

function keyForceUp(key) {
	Level.keys[key] = true;
}

function keyInputUp(e) {

	var key = event.key || event.keyCode;

	if(key in Level.keys && Level.keys[key] === true) {

		Level.keys[key] = false

		function keyForceUp() {

		}

	}
}

function main() {


	CANV = document.getElementById('canvas');
	CONT = CANV.getContext('2d');
	LOGGER = document.getElementById('logger');

	let levelButtons = document.getElementsByClassName('level-button');

	levelButtons[0].onclick = levelButton('level1');



	// Level.generate(levels.level1);

	// document.onkeydown = keyInputDown;
	// document.onkeyup = keyInputUp;

	// window.requestAnimationFrame(Level.mainloop);

}

// I feel like I could've done this simpler, but this works

function levelButton(levelName) {

	var level = levelName;
	function loadLevel() {
		document.getElementById('level-select').style.display = 'none';
		Level.generate(levels[level]);
		document.onkeydown = keyInputDown;
		document.onkeyup = keyInputUp;
		window.requestAnimationFrame(Level.mainloop);
	}
	return loadLevel;
}

// Tacked on -- this could be further integrated into the game engine, but I was lazy...

function gameover() {
	document.getElementById('gameover').style.display = 'block';
	Level.paused = true;
}

function win() {
	document.getElementById('win').style.display = 'block';
	Level.paused = true;
}

// Used for debug purposes

function LOG(text) {

	// For debug purposes

	LOGGER.innerHTML = text + ' at ' + Time.getTime();
}

class Cap {

	// Cap Number values as well as Vector2 objects numerically <--- Never really used

	constructor(constraintVectorMin, constraintVectorMax) {
		this.constraintMin = constraintVectorMin;
		this.constraintMax = constraintVectorMax;
	}

	capVector(input) {
		return new Vector2(
			cap(input.x, this.constraintMin.x, this.constraintMax.x),
			cap(input.y, this.constraintMin.y, this.constraintMax.y)
		);
	}

	static cap(input, min, max) {
		return new Vector2(Math.max(Math.min(input, max), min));
	}

}

function valueCap(min, max, val) {

	// Cap between two Number values

	return Math.max(Math.min(val, max), min);
}

function valueCapUnordered(m1, m2, val) {

	// Cap between two Number values

	let min = m2;
	let max = m1;

	if(m1 < m2) {
		min = m1;
		max = m2;
	}

	return Math.max(Math.min(val, max), min);
}

class Component {

	// Base class for game environmental objects. Any component of a GameObject (including the GameObject itself) inherits from this class

	constructor() {

		// base constructor

		// the property active is never utilized however

		this.active = true;
	}

	preSet(gameObject) {

		// Sign of bad code

		this.gameObject = gameObject;
		this.transform = gameObject.transform;
	}

	set() {

	}

}

// List of events implemented in the engine

var EVENTNAMELIST = [
	'update',
	'physicsUpdate',
	'physicsPostUpdate',
	'physicsPreUpdate',
	'render',
	'gizmosUpdate',
	'collisionEnter',
	'collisionExit',
	'triggerEnter',
	'triggerExit',
	'resetX',
	'resetY',
	'invertConstraints'
];

class GameObject extends Component {

	// Main class responsible for game environment objects

	static test;

	constructor(components) {

		// Instantiates a GameObject, setting its components, event listeners, and setting its components

		super()

		this._name = components[0];
		this.transform = components[1];
		this.transform.gameObject = this; // ugly, I know
		this.eventQueue = [];

		this.components = [];
		this.componentsTypeList = [];

		this.events = {
			'update': {
				delegates:[],
				owners:[]
			},
			'physicsUpdate': { // before update - initial physics
				delegates:[],
				owners:[]
			},
			'physicsPostUpdate': {
				delegates:[],
				owners:[]
			},
			'physicsPreUpdate': {
				delegates:[],
				owners:[]
			},
			'gizmosUpdate': { // after collisionCheck
				delegates:[],
				owners:[]
			},
			'render': {
				delegates:[],
				owners:[]
			},
			'collisionEnter': {
				delegates:[],
				owners:[]
			},
			'collisionExit': {
				delegates:[],
				owners:[]
			},
			'triggerEnter': {
				delegates:[],
				owners:[]
			},
			'triggerExit': {
				delegates:[],
				owners:[]
			},
			'resetX': {
				delegates:[],
				owners:[]
			},
			'resetY': {
				delegates:[],
				owners:[]
			},
			'invertConstraints': {
				delegates:[],
				owners:[]
			}

		}


		for(let i = 2; i < components.length; i++) {
			let new_component = components[i];
			new_component.preSet(this);

			for (let g = 0; g < EVENTNAMELIST.length; g++) {
				let eventName = EVENTNAMELIST[g];
				if(eventName in new_component) {
					this.events[eventName].delegates.push(new_component[eventName])
					this.events[eventName].owners.push(new_component);
				}
			}

			this.components.push(new_component);
			this.componentsTypeList.push(new_component.componentName);
		}

		for(let i = 0; i < this.components.length; i++) {
			this.components[i].set();
		}

	}

	fire(eventName, eventData) {

		// Fires event for all attached components

		if(this.active) {
			let delegates = this.events[eventName].delegates;
			for(let i = 0; i < delegates.length; i++) {
				delegates[i](this.events[eventName].owners[i], eventData);
			}
		}
	}

	update() { // OBSOLETE

		throw 'Obsolete';

		for(let i = 0; i < this.events.length; i++) {
			this.events[i]()
		}
	}

	getComponent(componentName) {

		// Returns the component attached to this GameObject

		return this.components[this.componentsTypeList.indexOf(componentName)];

	}


}

class Physical extends Component {

	// Handles Physics of objects in a very superficial way

	static GravityVector;
	static GlobalGravityCoefficient;
	static GlobalVelocityConstraint;

	constructor(gravityCoefficient, velocityConstraint) {
		super();
		this.componentName = 'Physical';

		if(gravityCoefficient === undefined) {
			this.gravityCoefficient = Physical.GlobalGravityCoefficient;
		}
		else {
			this.gravityCoefficient = gravityCoefficient;
		}
		this.velocity = Vector2.zero;

		if(velocityConstraint === undefined) {
			this.velocityConstraint = Vector2.copy(Physical.GlobalVelocityConstraint);
		}
		else {
			this.velocityConstraint = velocityConstraint;
			if(velocityConstraint.x === undefined || velocityConstraint.x === null) {
				this.velocityConstraint.x = GlobalVelocityConstraint.x;
			}
			else if(velocityConstraint.y === undefined || velocityConstraint.x === null) {
				this.velocityConstraint.x = GlobalVelocityConstraint.y;
			}
		}

		this.cap = new Cap(velocityConstraint);
	}

	set() {
		//this.velocity.y = .1;
	}

	resetX(self) {
		self.velocity.x = 0;
	}

	resetY(self) {
		self.velocity.y = 0;
	}

	invertConstraints(self) {
		self.velocityConstraint = self.velocityConstraint.switched();
	}

	physicsUpdate(self) {

		self.accelerate(Physical.GravityVector.multiply(self.gravityCoefficient * Level.time.deltaTime));

		//`.log(self.velocity.y);

		//self.transform.translate(self.velocity.multiply(Level.time.deltaTime));

	}

	physicsPostUpdate(self) {

		self.velocity = new Vector2(
			valueCap(-self.velocityConstraint.x, self.velocityConstraint.x, self.velocity.x),
			valueCap(-self.velocityConstraint.y, self.velocityConstraint.y, self.velocity.y),
			);

		self.transform.translate(self.velocity.multiply(Level.time.deltaTime));
	}

	accelerate(vector) {
		this.accelerateX(vector.x);
		this.accelerateY(vector.y);
	}

	accelerateX(accelX) {
		let tempV = accelX + this.velocity.x;
		//this.velocity.x = valueCap(-this.velocityConstraint.x, this.velocityConstraint.x, tempV);
		this.velocity.x = tempV;
	}

	accelerateY(accelY) {

		let tempV = accelY + this.velocity.y;
		//this.velocity.y = valueCap(-this.velocityConstraint.y, this.velocityConstraint.y, tempV);
		this.velocity.y = tempV;
	}


	/*accelerateX(x) {

		let tempV = Physical.GravityVector.x * this.gravityCoefficient.x + this.velocity.x;

		if(tempV > 0 && tempV > this.velocityConstraint.x) {

			tempV = this.velocityConstraint.x;

		}
		else if(tempV < 0 && tempV < this.velocityConstraint.x) {

			tempV = this.velocityConstraint.x;

		}

		this.velocity.x = tempV;

	}

	accelerateY(y) {

		let tempV = Physical.GravityVector.x * this.gravityCoefficient.x + this.velocity.x;

		if(tempV > 0 && tempV > this.velocityConstraint.x) {

			tempV = this.velocityConstraint.x;

		}
		else if(tempV < 0 && tempV < this.velocityConstraint.x) {

			tempV = this.velocityConstraint.x;

		}

		this.velocity.x = tempV;

	}*/

	gravitate() {

		let tempV = Physical.GravityVector * this.gravityCoefficient + this.velocity.y;

		if(tempV > 0 && tempV > this.velocityConstraint.y) {
		}
		else if(tempV < 0) {

		}



	}
}

var ColliderType = Object.freeze({'box':1,'circle':2}); // This I actually found online as a way to emulate an enum in JavaScript. It just makes an object that replicates the functionality of an enum, as found in other languages, such as C#

var CollisionLayers = { // Never fully explored in this demonstration, meant to serve for exception cases and improve performance of collision checking

	'intel': {
		ignore: ['intel']
	},
	'default': {
		ignore: ['default']
	},
	'spec': {
		ignore: ['spec', 'default']
	}

}

class Collider extends Component {

	// Collision detection, however only implemented for rectangles so far

	static colliderList = []; // set of Collider objects
	static adjustmentList = []; // set of Collider objects that require adjustments

	constructor(scale=null, collisionLayer='default', trigger=false) {
		super();

		if(!scale) {
			scale = Vector2.one;
		}

		this.componentName = 'Collider';

		this.collisionLayer = collisionLayer;
		this.collidingWith = [];
		this.trigger = trigger;
		this.scale = scale;

		Collider.colliderList.push(this);
	}

	static checkIntersectSquare(abl, atr, bbl, btr) {

		return abl.x < btr.x && atr.x > bbl.x && abl.y < btr.y && atr.y > bbl.y;

	}

	static checkIntersect(a, b) {

		// Checks if any two objects are intersecting and then pushes collision-based events

		if(a.colliderType === ColliderType.box && a.colliderType === b.colliderType) {

			let aBottomLeft = new Vector2(a.transform.position.x - a.transform.scale.x / 2, a.transform.position.y - a.transform.scale.y / 2);
			let aTopRight = new Vector2(a.transform.position.x + a.transform.scale.x / 2, a.transform.position.y + a.transform.scale.y / 2);
			let bBottomLeft = new Vector2(b.transform.position.x - b.transform.scale.x / 2, b.transform.position.y - b.transform.scale.y / 2);
			let bTopRight = new Vector2(b.transform.position.x + b.transform.scale.x / 2, b.transform.position.y + b.transform.scale.y / 2);

			if(Collider.checkIntersectSquare(aBottomLeft, aTopRight, bBottomLeft, bTopRight)) {

				if(!a.collidingWith.includes(b)) {
					Level.eventsQueue.push(new Event(a.gameObject, (a.trigger) ? 'triggerEnter' : 'collisionEnter', b.gameObject));
					Level.eventsQueue.push(new Event(b.gameObject, (b.trigger) ? 'triggerEnter' : 'collisionEnter', a.gameObject));
					a.collidingWith.push(b);
					b.collidingWith.push(a);

				}

				if(!a.trigger && !b.trigger) {

						if(a.gameObject.componentsTypeList.includes('Physical')
							&& !Collider.adjustmentList.includes(a)
							) {

							Collider.adjustmentList.push(a);
						}
						if(b.gameObject.componentsTypeList.includes('Physical')
							&& !Collider.adjustmentList.includes(b)
							) {
							Collider.adjustmentList.push(b);
						}
					}
			}
			else {
				if(a.collidingWith.includes(b)) {
					Level.eventsQueue.push(new Event(a.gameObject, (a.trigger) ? 'triggerExit' : 'collisionExit', b.gameObject));
					Level.eventsQueue.push(new Event(b.gameObject, (b.trigger) ? 'triggerExit' : 'collisionExit', a.gameObject));
					a.collidingWith.splice(a.collidingWith.indexOf(b), 1);
					b.collidingWith.splice(b.collidingWith.indexOf(a), 1);
				}
			}

		}

	}

	static collisionsCheck() {

		// Loops through all colliders to check for collisions

		Collider.adjustmentList = [];

		for(let i = 0; i < Collider.colliderList.length; i++) {
			Collider.colliderList[i].setBounds();
		}

		let collidersToCheck = Collider.colliderList.slice();

		while(collidersToCheck.length > 1) {

			let source = collidersToCheck[0];

			for(let g = 1; g < collidersToCheck.length; g++) {
				if(
					!(CollisionLayers[source.collisionLayer].ignore.includes(collidersToCheck[g].collisionLayer))
					&& !(CollisionLayers[collidersToCheck[g].collisionLayer].ignore.includes(source.collisionLayer))) {

					Collider.checkIntersect(source,collidersToCheck[g]);
				}
			}

			collidersToCheck.splice(0,1);

		}

		// for(let i = 0; i < Collider.colliderList.length; i++) {

		// 	collidersToCheck.splice(0,0);

		// 	for(let g = 0; g < collidersToCheck.length; g++) {
		// 		if(
		// 			!(CollisionLayers[Collider.colliderList[i].collisionLayer].ignore.includes(collidersToCheck[g].collisionLayer))
		// 			&& !(CollisionLayers[collidersToCheck[g].collisionLayer].ignore.includes(Collider.colliderList[i].collisionLayer))) {
		// 			Collider.checkIntersect(Collider.colliderList[i],collidersToCheck[g]);
		// 		}
		// 	}

		// }

	}

	static adjustCollisions() {

		// Determines the intersections and adjusts objects' positions according to the these collisions

		for(let i = 0; i < Collider.adjustmentList.length; i++) {

			let a = Collider.adjustmentList[i];

			for(let g = 0; g < a.collidingWith.length; g++) {

				let b = a.collidingWith[g];

				if(b.trigger) continue;

				let intersectX = 0;
				let intersectY = 0;

				// A IS TO THE RIGHT OF B - intersect is to the left so negative value
				if(a.transform.position.x > b.transform.position.x) { // gives positive intersectX
					intersectX = (a.transform.position.x - a.transform.scale.x / 2) - (b.transform.position.x + b.transform.scale.x / 2);
				}
				// A IS TO THE LEFT OF B - intersect is to the right so positive value
				else if(a.transform.position.x < b.transform.position.x) { // gives negative intersectX
					intersectX = (a.transform.position.x + a.transform.scale.x / 2) - (b.transform.position.x - b.transform.scale.x / 2);
				}
				else {
					//throw "Unimplemented";
					intersectX = 9999;
				}

				// A IS BELOW B - negative value
				if(a.transform.position.y > b.transform.position.y) { // gives positive intersectX
					intersectY = (a.transform.position.y - a.transform.scale.y / 2) - (b.transform.position.y + b.transform.scale.y / 2);
				}
				// A IS ABOVE B - positive value
				else if(a.transform.position.y < b.transform.position.y) { // gives negative intersectX
					intersectY = (a.transform.position.y + a.transform.scale.y / 2) - (b.transform.position.y - b.transform.scale.y / 2);
				}
				else {
					intersectY = 9999;
				}


				let adjustmentVector = new Vector2(intersectX, intersectY)._neg();

				adjustmentVector.chooseSmall();

				if(adjustmentVector.y < 0 && Physical.GravityVector.y > 0) {
					Level.eventsQueue.push(new Event(a.gameObject, 'resetY'));
				}
				else if(adjustmentVector.y > 0 && Physical.GravityVector.y < 0) {
					Level.eventsQueue.push(new Event(a.gameObject, 'resetY'));
				}
				if(adjustmentVector.x < 0 && Physical.GravityVector.x > 0) {
					Level.eventsQueue.push(new Event(a.gameObject, 'resetX'));
				}
				else if(adjustmentVector.x > 0 && Physical.GravityVector.x < 0) {
					Level.eventsQueue.push(new Event(a.gameObject, 'resetX'));
				}

				let difference = a.transform.position.subtract(b.transform.position, true);

				// Gizmo.gizmosList.push(
				// 	{
				// 		'pos': new Vector2(difference.x / 2 + b.transform.position.x, difference.y / 2 + b.transform.position.y),
				// 		'scale': new Vector2(adjustmentVector.x / 2, adjustmentVector.y / 2),
				// 		'color':'pink'
				// 	}
				// )

				a.transform.translate(adjustmentVector);

			}

		}

	}

	setBounds(reset=false) { // base method for subclasses
		throw "Unimplemented";
	}

}

class BoxCollider extends Collider {

	// specific type of collider: rectangles

	constructor(scale=null, collisionLayer='default', trigger=false) {
		super(scale, collisionLayer, trigger);

		this.colliderType = ColliderType['box'];

	}

	set() {
		this.setBounds(true);
	}

	setBounds(reset=false) {

		if(reset) {
			this.xMax = null;
			this.xMin = null;
			this.yMax = null;
			this.yMin = null;
		}

		this.xMax = this.transform.position.x + .5 * this.scale.x * this.transform.scale.x;
		this.xMin = this.transform.position.x - .5 * this.scale.x * this.transform.scale.x;
		this.yMax = this.transform.position.y + .5 * this.scale.y * this.transform.scale.y;
		this.yMin = this.transform.position.y - .5 * this.scale.y * this.transform.scale.y;
	}

}

class Transform extends Component {

	// Holds information about a gameObject's position and size

	constructor(position, scale) {
		super();
		this.position = position;
		this.scale = scale;
	}

	translate(offset) {

		this.position = this.position.add(offset, true);
	}
}

class Renderer extends Component {

	// Renders a gameObject

	static shapes = {
		'square': function(obj) {

			CONT.fillStyle = obj.color;
			CONT.beginPath();

			let pos = obj.transform.position;
			let scale = obj.transform.scale;

			//scale.x = side x
			//scale.y = side y

			CONT.moveTo(pos.x - (scale.x/2), pos.y - (scale.y/2));
			CONT.lineTo(pos.x - (scale.x/2), pos.y + (scale.y/2));
			CONT.lineTo(pos.x + (scale.x/2), pos.y + (scale.y/2));
			CONT.lineTo(pos.x + (scale.x/2), pos.y - (scale.y/2));
			CONT.lineTo(pos.x - (scale.x/2), pos.y - (scale.y/2));
			CONT.closePath();
			CONT.fill();

		}
	}

	static count = 0;

	constructor(color, shape_name) {
		super();
		this.componentName = 'Renderer';

		this.number = Renderer.count;
		Renderer.count++;
		this.color = (color) ? color : '#000';
		this.shape = Renderer.shapes[shape_name];
	}

	static clear() {
		CONT.clearRect(0, 0, canvas.width, canvas.height);
	}

	render(self) {
		self.shape(self);
	}
}

class Gizmo {

	// Used for Debugging purposes -- does not require a Renderer object to render images to screen

	static gizmosList = [];

	static DrawSquare(gizmoObject) {
		let scale = gizmoObject.scale;
		let pos = gizmoObject.pos;
		let color = gizmoObject.color;

		CONT.fillStyle = color;
		CONT.beginPath();

		//scale.x = side x
		//scale.y = side y

		CONT.moveTo(pos.x - (scale.x/2), pos.y - (scale.y/2));
		CONT.lineTo(pos.x - (scale.x/2), pos.y + (scale.y/2));
		CONT.lineTo(pos.x + (scale.x/2), pos.y + (scale.y/2));
		CONT.lineTo(pos.x + (scale.x/2), pos.y - (scale.y/2));
		CONT.lineTo(pos.x - (scale.x/2), pos.y - (scale.y/2));
		CONT.closePath();
		CONT.fill();

		// LOG('GIZMOS!');
	}

	static drawGizmosList() {
		for(let i = Gizmo.gizmosList.length-1; i >= 0; i--) {
			Gizmo.DrawSquare(Gizmo.gizmosList[i]);
		}
		Gizmo.gizmosList = [];
	}

}

class Canvas { // deals with displaying objects

	constructor (width, height) {

		this.width = width;
		this.height = height;
		this.canvas = CANV;

		CANV.width = width;
		CANV.height = height;


		// this.canvas.style.width=(CANV.width*2)+'px';
		// this.canvas.style.height=(CANV.height*2)+'px';
	}

}

class Vector2 {

	// Vector with an x and a y component

	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	get magnitude() {
		return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
	}

	toString() {
		return '(' + this.x + ', ' + this.y + ')';
	}

	static Max(a, b) {
		let sqrtA = a.magnitude;
		let sqrtB = b.magnitude;
		if(sqrtA === sqrtB) {
			throw "Not implemented";
		}
		else if(sqrtA > sqrtB) {
			return a;
		}
		return b;
	}

	static Min(a, b) {
		let sqrtA = a.magnitude;
		let sqrtB = b.magnitude;
		if(sqrtA === sqrtB) {
			throw "Not implemented";
		}
		else if(sqrtA < sqrtB) {
			return a;
		}
		return b;
	}

	switched() {
		return new Vector2(this.y, this.x);
	}

	norm() {
		let mag = this.magnitude
		if(mag === 0) {
			return Vector2.zero;
		}
		else {
			return new Vector2(this.x / mag, this.y / mag);
		}
	}

	neg() {
		return new Vector2(-this.x, -this.y);
	}

	_neg() {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	}

	abs() {
		return new Vector2(Math.abs(this.x), this.y);
	}

	_abs() {
		this.x = Math.abs(this.x);
		this.y = Math.abs(this.y);
		return this;
	}

	multiply(multiplier, isVector=false, capper=false) {

		let opX = multiplier;
		let opY = multiplier;

		if(isVector) {
			opX = multiplier.x;
			opY = multiplier.y;
		}

		return (capper)
			? capper.capVector(new Vector2(this.x * opX, this.y * opY))
			: new Vector2(this.x * opX, this.y * opY);
	}

	divide(multiplier, isVector=false, capper=false) {

		let opX = multiplier;
		let opY = multiplier;

		if(isVector) {
			opX = multiplier.x;
			opY = multiplier.y;
		}

		return (capper)
			? capper.capVector(new Vector2(this.x / opX, this.y / opY))
			: new Vector2(this.x / opX, this.y / opY);
	}

	_multiply(multiplier, isVector=false, capper=false) {

		let opX = multiplier;
		let opY = multiplier;

		if(isVector) {
			opX = multiplier.x;
			opY = multiplier.y;
		}

		this.x = this.x * opX;
		this.y = this.y * opY;
		return this;
	}

	add(adder, isVector=false, capper=false) {

		var opX = adder;
		var opY = adder;

		if(isVector) {
			opX = adder.x;
			opY = adder.y;
		}

		return (capper)
			? capper.capVector(new Vector2(this.x + opX, this.y + opY))
			: new Vector2(this.x + opX, this.y + opY)
	}

	_add(adder, isVector=false, capper=false) {

		var opX = adder;
		var opY = adder;

		if(isVector) {
			opX = adder.x;
			opY = adder.y;
		}

		this.x = this.x + opX;
		this.y = this.y + opY;
		return this;
	}

	subtract(adder, isVector=false, capper=false) {

		var opX = adder;
		var opY = adder;

		if(isVector) {
			opX = adder.x;
			opY = adder.y;
		}

		return (capper)
			? capper.capVector(new Vector2(this.x - opX, this.y - opY))
			: new Vector2(this.x - opX, this.y - opY)
	}

	_subtract(adder, isVector=false, capper=false) {

		var opX = adder;
		var opY = adder;

		if(isVector) {
			opX = adder.x;
			opY = adder.y;
		}

		this.x = this.x - opX;
		this.y = this.y - opY;
		return this;
	}

	chooseSmall() {

		if(Math.abs(this.x) > Math.abs(this.y)) {
			this.x = 0;
		}
		else if(Math.abs(this.x) < Math.abs(this.y)) {
			this.y = 0;
		}
		return this;

	}

	static copy(vector) {
		return new Vector2(vector.x, vector.y);
	}

	static get zero() {
		return new Vector2(0, 0)
	}

	static get one() {
		return new Vector2(1, 1)
	}

}

class Time {

	// Deals with time. The property deltaTime is particularly useful for physics-based functionality and timing

	constructor() {
		this.deltaTime = 0;
		this.mult = 1;
		this.time = Time.getTime(); // this.time = current time (last update)
	}

	update() {

		let current_time = Time.getTime();
		this.deltaTime = (current_time - this.time) * this.mult;
		this.time = current_time;

	}

	static getTime() {
		return new Date().getTime()
	}

}

class Event {

	// Contains useful information about an event, all in one place

	constructor(gameObject, eventName, eventData) {
		this.gameObject = gameObject;
		this.eventName = eventName;
		this.eventData = eventData;
	}
}

class Level {

	// Singleton (not fully implemented) for levels. Holds all level data and deals with event loop

	static generate(level_object) {

		Level.canvas = new Canvas(level_object.width, level_object.height, this);

		Level.gameObjects = [];

		Level.keys = {
			'a':false,
			'd':false,
			'w':false
		}

		Level.time = new Time();

		Level.paused = false;

		Level.eventsQueue = []; // specific gameobjects
		Level.globalEventsQueue = []; // all gameobjects

		for(let i = 0; i < level_object.objects.length; i++) {
			let newGameObject = new GameObject(level_object.objects[i])
			Level.gameObjects.push(newGameObject);
		}
	}

	static mainloop() {

		Level.time.update();
		Renderer.clear();
		for(let g = 0; g < Level.globalEventsQueue.length; g++) {
			for(let i = 0; i < Level.gameObjects.length; i++) {
				Level.gameObjects[i].fire(Level.globalEventsQueue[g].eventName, Level.globalEventsQueue[g].eventData);
			}
		}
		Level.globalEventsQueue = [];
		for(let i = 0; i < Level.eventsQueue.length; i++) {
			Level.eventsQueue[i].gameObject.fire(Level.eventsQueue[i].eventName, Level.eventsQueue[i].eventData);
		}
		Level.eventsQueue = [];
		for(let i = 0; i < Level.gameObjects.length; i++) {
			Level.gameObjects[i].fire('physicsPreUpdate');
			Level.gameObjects[i].fire('physicsUpdate');
			Level.gameObjects[i].fire('physicsPostUpdate');
			Level.gameObjects[i].fire('update');
			Level.gameObjects[i].fire('render');
			Level.gameObjects[i].fire('gizmosUpdate');
		}
		Collider.collisionsCheck();
		Collider.adjustCollisions();
		for(let i = 0; i < Level.gameObjects.length; i++) {
			Level.gameObjects[i].fire('render');
			Level.gameObjects[i].fire('gizmosUpdate');
		}

		Gizmo.drawGizmosList();


		if(!Level.paused) {
			window.requestAnimationFrame(Level.mainloop);
		}
	}

	static GlobalEvent(eventName) {
		for(let i = 0; i < Level.gameObjects.length; i++) {
			Level.gameObjects[i].fire(eventName);
		}
	}
}

class Controller extends Component {

	constructor(jumpTime, jumpForce) {
		super();
		this.jumping = false
		this.grounded = false;
		this.jumpTime = jumpTime;
		this.jumpForce = jumpForce || 1;

		this.currentJumpTime = 0;
	}

	set() {
		this.rb = this.gameObject.getComponent('Physical');
	}

	physicsUpdate(self) {


		if(Level.keys['a'] === Level.keys['b']) {
			return;
		}

		if(Level.keys['a']) {
			//self.rb.accelerateX(-.007*Level.time.deltaTime)
			if(Physical.GravityVector.y > 0) {
				self.rb.accelerate(Physical.GravityVector.switched().norm().multiply(-.007 * Level.time.deltaTime));
			}
			else {
				self.rb.accelerate(Physical.GravityVector.switched().norm().multiply(.007 * Level.time.deltaTime));
			}
		}
		else if(Level.keys['d']) {
			if(Physical.GravityVector.y > 0) {
				self.rb.accelerate(Physical.GravityVector.switched().norm().multiply(.007 * Level.time.deltaTime));
			}
			else {
				self.rb.accelerate(Physical.GravityVector.switched().norm().multiply(-.007 * Level.time.deltaTime));
			}
		}
		else {
			if(Physical.GravityVector.x !== 0) {
				self.rb.velocity.y = 0;
			}
			if(Physical.GravityVector.y !== 0) {
				self.rb.velocity.x = 0;
			}
		}

		//`.log(self);
		if(Level.keys['w'] && ((self.jumping && self.currentJumpTime < self.jumpTime) || self.grounded)) {

			if(self.jumping === false) {
				self.jumping = true;
				self.grounded = false;
				self.currentJumpTime = 0;
			}
			//`.log('uh');
			//`.log('up');
			//let preY = self.rb.velocity.y
			//self.rb.accelerateY(self.jumpForce * Level.time.deltaTime);
			let temp = Physical.GravityVector.neg().norm().multiply(self.jumpForce * Level.time.deltaTime);
			//console.log(temp);
			self.rb.accelerate(temp);
			self.currentJumpTime += Level.time.deltaTime;

			//`.log(self.rb.velocity.y);
			/*self.jumping = true;
			self.grounded = false;*/


			//velocity added

			// `.log(preY, self.rb.velocity.y);

			//keyForceUp('w');
		}
		else if(self.jumping) {
			self.jumping = false;
		}

	}

	resetX(self) {

		self.jumping = false;
		self.grounded = true;
	}

	resetY(self) {

		self.jumping = false;
		self.grounded = true;
	}

}

class GravityShift extends Component {

	constructor(altGrav) {
		super();

		this.altGrav = altGrav;
	}

	triggerEnter(self) {
		let inverseX = Physical.GravityVector.x !== 0; // check if changed
		Physical.GravityVector = self.altGrav;
		inverseX = inverseX !== (Physical.GravityVector.x !== 0);
		if(Physical.GravityVector.x !== 0) {
			Level.GlobalEvent('resetY');
		}
		if(Physical.GravityVector.y !== 0) {
			Level.GlobalEvent('resetX');
		}
		if(inverseX) {
			Level.GlobalEvent('invertConstraints');
		}
	}
}

class Untouchable extends Component {

	constructor() {
		super();
	}

	triggerEnter(self, other) {
		if(other._name === 'player') {
			gameover();
		}
	}
}

class Platform extends Component {

	constructor(points, timeToPoints) {
		super();

		this.points = points;
		this.timeToPoints = timeToPoints;
		this.nextPointIndex = 1;
		this.currentStep = 0;
	}

	set() {
		this.transform.position = this.points[0];
		this.calculateStep();
	}

	get difference() {
		return this.points[this.nextPointIndex].subtract(this.transform.position, true);
	}

	calculateStep() {

		// this.nextPointIndex++;
		// if(this.nextPointIndex >= this.points.length) {
		// 	this.nextPointIndex = 0;
		// }

		this.currentStep = this.difference.divide(this.timeToPoints[this.nextPointIndex]);

	}

	physicsPreUpdate(self) {
		//console.log(self.transform.position);

		if(self.difference.magnitude < .005) {
			self.nextPointIndex++;
			if(self.nextPointIndex >= self.points.length) {
				self.nextPointIndex = 0;
			}
			self.calculateStep();
			return;
		}

		let potPos = self.transform.position.add(self.currentStep, true);

		self.transform.position = new Vector2(
			valueCapUnordered(self.transform.position.x, self.points[self.nextPointIndex].x, potPos.x),
			valueCapUnordered(self.transform.position.y, self.points[self.nextPointIndex].y, potPos.y)
			);
	}
}

class Goal extends Component {

	constructor() {
		super();
	}

	triggerEnter(self, other) {
		if(other._name === 'player') {
			win();
		}
	}
}

// Global variables that honestly would be better off in the respective level object

Physical.GravityVector = new Vector2(0, .015);
Physical.GlobalGravityCoefficient = .1;
Physical.GlobalVelocityConstraint = new Vector2(.4, .2);//.5

// Here is where the level data is found for setting up individual levels

var levels = {

	level1: {

		width: 800,
		height:600,

		objects: [ // Array of GameObject components
			[
			'player',
			new Transform(new Vector2(100, 450), new Vector2(25, 25)),
			new Renderer('#00dd66', 'square'),
			new Physical(),
			new BoxCollider(undefined, 'intel'),
			new Controller(100, 70),
			],
			[
			'platform1',
			new Transform(new Vector2(100,550), new Vector2(100, 50)),
			new Renderer('brown', 'square'),
			new BoxCollider()
			],
			[
			'platform2',
			new Transform(new Vector2(250,550), new Vector2(50, 50)),
			new Renderer('brown', 'square'),
			new BoxCollider()
			],
			[
			'platform3',
			new Transform(new Vector2(450,550), new Vector2(200, 50)),
			new Renderer('brown', 'square'),
			new BoxCollider()
			],
			[
			'platform4',
			new Transform(new Vector2(350,350), new Vector2(300, 50)),
			new Renderer('brown', 'square'),
			new BoxCollider()
			],
			[
			'platform5',
			new Transform(new Vector2(0,300), new Vector2(50, 300)),
			new Renderer('brown', 'square'),
			new BoxCollider()
			],
			[
			'platform6',
			new Transform(new Vector2(200,150), new Vector2(400, 25)),
			new Renderer('brown', 'square'),
			new BoxCollider()
			],
			[
			'platform7',
			new Transform(new Vector2(500,254), new Vector2(25, 242)),
			new Renderer('brown', 'square'),
			new BoxCollider()
			],
			[
			'obstacle',
			new Transform(new Vector2(0,300), new Vector2(50, 300)),
			new Renderer('brown', 'square'),
			new BoxCollider()
			],
			[
			'moving_platform',
			new Transform(new Vector2(300,100), new Vector2(25, 50)),
			new Renderer('#ee2222', 'square'),
			new BoxCollider(),
			new Platform([new Vector2(330,400), new Vector2(500, 400)], [50, 50])
			],
			[
			'moving_platform2',
			new Transform(new Vector2(300,102), new Vector2(25, 100)),
			new Renderer('#ee2222', 'square'),
			new BoxCollider(),
			new Platform([new Vector2(500,80), new Vector2(380, 80)], [20, 20])
			],
			[
			'gravityShift1_UP',
			new Transform(new Vector2(500, 500), new Vector2(10, 10)),
			new Renderer('#0000ff', 'square'),
			new BoxCollider(undefined, 'spec', true),
			new GravityShift(new Vector2(0,-.02))
			],
			[
			'gravityShift2_LEFT',
			new Transform(new Vector2(200, 400), new Vector2(10, 10)),
			new Renderer('#0000ff', 'square'),
			new BoxCollider(undefined, 'spec', true),
			new GravityShift(new Vector2(-.02,0))
			],
			[
			'gravityShift3_RIGHT',
			new Transform(new Vector2(75, 200), new Vector2(10, 10)),
			new Renderer('#0000ff', 'square'),
			new BoxCollider(undefined, 'spec', true),
			new GravityShift(new Vector2(.05,0))
			],
			[
			'gravityShift3_LAST',
			new Transform(new Vector2(350, 100), new Vector2(10, 10)),
			new Renderer('#0000ff', 'square'),
			new BoxCollider(undefined, 'spec', true),
			new GravityShift(new Vector2(0,.03))
			],
			[
			'limit_bottom',
			new Transform(new Vector2(400,620), new Vector2(800, 35)),
			new BoxCollider(undefined, 'default', true),
			new Renderer('blue', 'square'),
			new Untouchable()
			],
			[
			'limit_top',
			new Transform(new Vector2(400,-20), new Vector2(800, 35)),
			new BoxCollider(undefined, 'default', true),
			new Renderer('blue', 'square'),
			new Untouchable()
			],
			[
			'limit_right',
			new Transform(new Vector2(820,300), new Vector2(30, 600)),
			new BoxCollider(undefined, 'default', true),
			new Renderer('blue', 'square'),
			new Untouchable()
			],
			[
			'limit_left',
			new Transform(new Vector2(-20,300), new Vector2(30, 600)),
			new BoxCollider(undefined, 'default', true),
			new Renderer('blue', 'square'),
			new Untouchable()
			],
			[
			'goal',
			new Transform(new Vector2(50, 100), new Vector2(25,25)),
			new BoxCollider(undefined, 'default', true),
			new Renderer('gold', 'square'),
			new Goal()
			]
		]
	}
}
