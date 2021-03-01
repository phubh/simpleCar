import * as THREE from './three.module.js';
import Car from './Car.js'
import { OrbitControls } from './OrbitControls.js';

const keys = [];
document.body.addEventListener("keydown", function (e) {
  keys[e.keyCode] = true;
  //console.log(e.keyCode);
  e.preventDefault();
});

document.body.addEventListener("keyup", function (e) {
  keys[e.keyCode] = false;
  e.preventDefault();
});
function setupCamera() {
  // The camera
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  // Make the camera further from the models so we can see them better
  return camera;
}
function setupGround(scene) {
  let groundGeo = new THREE.PlaneBufferGeometry(100000, 100000);
  let groundMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  groundMat.color.setHSL(1, 0, 0.25);
  let ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = 0;
  ground.rotation.x = - Math.PI / 2;
  ground.receiveShadow = true;
  ground.add(new THREE.AxesHelper(10000));
  scene.add(ground);
  return ground;
}

function setupLights(scene) {
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.color.setHSL(0.1, 1.0, 0.85);
  dirLight.position.set(-0.4, 0.4, 0.4);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 1);
  dirLight2.color.setHSL(0.7, 1.0, 0.85);
  dirLight2.position.set(0.4, 0.4, -0.4);
  dirLight2.castShadow = true;
  scene.add(dirLight2);
}

function setupRoad(scene) {


}

async function main() {
  const canvas = document.querySelector("#canvas");
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xaaaaaa, 1);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("hsl(90, 30%, 75%)");

  setupLights(scene);
  let ground = setupGround(scene);
  setupRoad(ground);
  const camera = setupCamera();
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, false);
  
  let cars = new Car(scene, keys);
  let car = await cars.init();
  camera.position.set(car[0].mesh.position.x , car[0].mesh.position.y + 2, car[0].mesh.position.z - 10);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();
  {
  for(let i = 0;i < 1000; i++){
  
   const geometry = new THREE.BoxGeometry( 0.1, 0.001, 1 );
   const material = new THREE.MeshBasicMaterial( {color: 0xcccddd} );
   const cube = new THREE.Mesh( geometry, material );
   scene.add( cube );
   cube.position.set(0.2*Math.sin(i* Math.PI/10) + 6,0.01,i);

  }
  for(let i = 0;i < 1000; i++){
  
    const geometry = new THREE.BoxGeometry( 0.1, 0.001, 1 );
    const material = new THREE.MeshBasicMaterial( {color: 0xcccddd} );
    const cube = new THREE.Mesh( geometry, material );
    scene.add( cube );
    cube.position.set(-0.4*Math.sin(i * Math.PI/10) - 2,0.01,i);
 
   }
   
  }
  function render() {

    cars.updateCars(car);
    {
      // camera.position.set(car[0].mesh.position.x , car[0].mesh.position.y + 2, car[0].mesh.position.z - 10);
      // camera.lookAt(car[0].mesh.position.x, car[0].mesh.position.y, car[0].mesh.position.z);
      
    }

    renderer.render(scene, camera);

    // Make it call the render() function about every 1/60 second
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

}
main();