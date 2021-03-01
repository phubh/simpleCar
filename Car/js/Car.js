import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';
export default class Car {
    constructor(scene, keys) {
        this.scene = scene;
        this.keys = keys;
        this.angle = 0;
        this.speed = 0;
        this.maxSpeed = 0.3;
        this.steering = 0;
        this.rotationWheel = 0;

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
            if (!this.keys[32]) {
                for (let wheel of wheelsFront) {
                    //we need to rotate the wheels (on steering axis) 
                    // AND then preserve their new spinning axis when spinning them (was on x)

                    let myEuler;
                    if (this.keys[39] || this.keys[68])
                        myEuler = new THREE.Euler(this.rotationWheel, -Math.PI * 0.1, 0, 'YXZ');
                    else if (this.keys[37] || this.keys[65])
                        myEuler = new THREE.Euler(this.rotationWheel, Math.PI * 0.1, 0, 'YXZ');
                    else
                        myEuler = new THREE.Euler(this.rotationWheel, 0, 0, 'YXZ');
                    wheel.setRotationFromEuler(myEuler);
                    // wheel.scale.set(2,2,2)
                }
                for (let wheel of wheelsBack) {
                    wheel.rotation.x = this.rotationWheel;
                }
            }
            const brakeLights = wheeledCar.getObjectByName("lights_brakes");
            if (brakeLights) {
                brakeLights.visible = timeS % 2 < 1;

                //changing the colour of the material is not suitable if we've loaded a low-poly pixel-colour texture.
                brakeLights.material.color = new THREE.Color("rgb(0, 255, 0)");
            }
        }

    }
    updateCars(cars) {
        cars.forEach(carObj => {
            if (!carObj.mesh) {
                return;
            }
            const carMesh = carObj.mesh;
            this.updateWheels(carMesh);
            let steerPower = 0.0001;
            //right
            if (this.keys[39] || this.keys[68]) {
                this.steering += (this.steering > -.01) ? steerPower : 0;
                // left
            } else if (this.keys[37] || this.keys[65]) {
                this.steering -= (this.steering < .01) ? steerPower : 0;

            } else {
                this.steering *= 0.92;
            }
            //gas
            if (this.keys[38] || this.keys[87]) {
                this.speed += (this.speed < this.maxSpeed) ? 0.01 : 0;
            } else if (this.keys[40] || this.keys[83]) { // reverse
                this.speed -= (this.speed > -this.maxSpeed / 2) ? 0.01: 0;
            } else {
                this.speed *= 0.96;
            }
            if (this.keys[32]) {
                this.speed *= 0.0001;
            }
            this.speed *= 1 - Math.abs(this.steering);
            this.angle += 1.2 * this.steering * this.speed;
            this.rotationWheel += 0.5 * this.speed;
            let zdir = this.speed * Math.cos(this.angle);
            let xdir = this.speed * Math.sin(this.angle);

            carMesh.position.x += -xdir;
            carMesh.position.z += zdir;
            carMesh.rotation.y = -this.angle;
        })
    }
}