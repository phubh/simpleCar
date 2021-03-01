import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';
export default class Car {
    constructor(scene, keys) {
        this.scene = scene;
        this.keys = keys;
        this.MAX_SPEED = 3;
        this.MAX_REVERSE_SPEED = -3;
        this.MAX_WHEEL_ROTATION = 2;
        this.FRONT_ACCELERATION = 1.25;
        this.BACK_ACCELERATION = 1.5;
        this.WHEEL_ANGULAR_ACCELERATION = 1;
        this.FRONT_DECCELERATION = 0.75;
        this.WHEEL_ANGULAR_DECCELERATION = 1.0;
        this.STEERING_RADIUS_RATIO = 0.0096;
        this.MAX_TILT_SIDES = 0.05;
        this.MAX_TILT_FRONTBACK = 0.015;
        this.speed = 0;
        this.acceleration = 0;
        this.wheelOrientation = 0;
        this.carOrientation = 0;
        this.wheelRotation = 0;

    }
    init() {
        return this.loadCarsAsyncFromIndividualFiles(this.scene);
    }
    async loadCarsAsyncFromIndividualFiles(scene) {
        const gltfLoader = new GLTFLoader();
        const modelURLs = ["car1_truck"].map(name => `./models/${name}.glb`);
        function namedLikeCarOrVan(obj) {
            return obj.name
                && (
                    obj.name.toLowerCase().startsWith("car")
                    || obj.name.toLowerCase().startsWith("van")
                    || obj.name.toLowerCase().startsWith("truck")
                )
        }
        const promises = modelURLs.map((url, ix) =>
            new Promise((resolve, reject) => {
                gltfLoader.load(url, (gltf) => {
                    const root = gltf.scene;
                    //dumpObjectToConsoleAsString(root);
                    const car = root.children.find(namedLikeCarOrVan) || root;
                    //root.getObjectByName('car')
                    const phaseStep = Math.PI * 2 / modelURLs.length;
                    scene.add(car);
                    car.add(new THREE.AxesHelper(10));
                    resolve({ mesh: car, phase: phaseStep * ix });
                });
            })//new promise
        );//map over all models to get a list of promises
        return Promise.all(promises);
    }
    updateWheels(wheeledCar) {
        if (wheeledCar) {
            const wheels = wheeledCar.children.filter(c => c.name && c.name.startsWith("wheel"));
            const wheelsFront = wheeledCar.children.filter(c => c.name && c.name.startsWith("wheel_f"));
            const wheelsBack = wheeledCar.children.filter(c => c.name && c.name.startsWith("wheel_b"));
            
                for (let wheel of wheelsFront) {
                    //we need to rotate the wheels (on steering axis) 
                    // AND then preserve their new spinning axis when spinning them (was on x)

                    let myEuler;
                    if (this.keys[39] || this.keys[68])
                        myEuler = new THREE.Euler(this.wheelRotation, -Math.PI * 0.1, 0, 'YXZ');
                    else if (this.keys[37] || this.keys[65])
                        myEuler = new THREE.Euler(this.wheelRotation, Math.PI * 0.1, 0, 'YXZ');
                    else
                        myEuler = new THREE.Euler(this.wheelRotation, 0, 0, 'YXZ');
                    wheel.setRotationFromEuler(myEuler);
                    // wheel.scale.set(2,2,2)
                }
                for (let wheel of wheelsBack) {
                    wheel.rotation.x = this.wheelRotation;
                }
            }
        

    }
    updateCars(cars) {
        cars.forEach(carObj => {
            if (!carObj.mesh) {
                return;
            }
             const carMesh = carObj.mesh;
            
            let delta = 0.5;
            //right
            if (this.keys[39] || this.keys[68]) {
                this.wheelOrientation = THREE.Math.clamp(this.wheelOrientation - delta * this.WHEEL_ANGULAR_ACCELERATION, - this.MAX_WHEEL_ROTATION, this.MAX_WHEEL_ROTATION);

                // left
            } else if (this.keys[37] || this.keys[65]) {

                this.wheelOrientation = THREE.Math.clamp(this.wheelOrientation + delta * this.WHEEL_ANGULAR_ACCELERATION, - this.MAX_WHEEL_ROTATION, this.MAX_WHEEL_ROTATION);
            }
            //gas
            if (this.keys[38] || this.keys[87]) {
                this.speed = THREE.Math.clamp(this.speed + delta * this.FRONT_ACCELERATION, this.MAX_REVERSE_SPEED, this.MAX_SPEED);
                this.acceleration = THREE.Math.clamp(this.acceleration + delta, -1, 1);
            } else if (this.keys[40] || this.keys[83]) {
                this.speed = THREE.Math.clamp(this.speed - delta * this.BACK_ACCELERATION, this.MAX_REVERSE_SPEED, this.MAX_SPEED);
                this.acceleration = THREE.Math.clamp(this.acceleration - delta, -1, 1);
            } 

            if ( ! ( this.keys[38] || this.keys[87] || this.keys[40] || this.keys[83]) ) {

                if ( this.speed > 0 ) {
    
                    var k = this.exponentialEaseOut( this.speed / this.MAX_SPEED );
    
                    this.speed = THREE.Math.clamp( this.speed - k * delta * this.FRONT_DECCELERATION, 0, this.MAX_SPEED );
                    this.acceleration = THREE.Math.clamp( this.acceleration - k * delta, 0, 1 );
    
                } else {
    
                    var k = this.exponentialEaseOut( this.speed / this.MAX_REVERSE_SPEED );
    
                    this.speed = THREE.Math.clamp( this.speed + k * delta * this.BACK_ACCELERATION, this.MAX_REVERSE_SPEED, 0 );
                    this.acceleration = THREE.Math.clamp( this.acceleration + k * delta, -1, 0 );
    
                }
    
    
            }
    
            // steering decay
    
            if ( ! ( this.keys[39] || this.keys[68] || this.keys[37] || this.keys[65]) ) {
    
                if ( this.wheelOrientation > 0 ) {
    
                    this.wheelOrientation = THREE.Math.clamp( this.wheelOrientation - delta * this.WHEEL_ANGULAR_DECCELERATION, 0, this.MAX_WHEEL_ROTATION );
    
                } else {
    
                    this.wheelOrientation = THREE.Math.clamp( this.wheelOrientation + delta * this.WHEEL_ANGULAR_DECCELERATION, - this.MAX_WHEEL_ROTATION, 0 );
    
                }
    
            }
            let forwardDelta = this.speed * delta;

            this.carOrientation += 0.5 * (forwardDelta * this.STEERING_RADIUS_RATIO) * this.wheelOrientation;

            // displacement
            carMesh.position.x += Math.sin(this.carOrientation) * forwardDelta * 0.05;
            carMesh.position.z += Math.cos(this.carOrientation) * forwardDelta  * 0.05; 

            // steering
            carMesh.rotation.y = this.carOrientation ;
            this.wheelRotation += 0.1 * this.speed;
            this.updateWheels(carMesh);
        })
    }
     exponentialEaseOut( k ) { return k === 1 ? 1 : - Math.pow( 2, - 10 * k ) + 1; }

}