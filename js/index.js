import AR from './aruco/aruco';
import POS from './aruco/posit1';
import THREELib from 'three-js';
import exampleVideo from './video.mp4';

import './style.css';

const THREE = THREELib();

function getDevices(type = 'videoinput') {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        resolve( devices.filter( d => d.kind === type ) );
      })
      .catch(reject)
  });
}

async function getVideo(deviceId) {
  return navigator.mediaDevices.getUserMedia({ video: { optional: [{ sourceId: deviceId }] }, audio: false })
}


/* AR setup */

async function setupAR({ container, height, width, detectedMarkers = () => {} }) {

  const cameras = await getDevices();
  const CAMERA_NUM = cameras.length - 1;

  const videoStream = await getVideo( cameras[CAMERA_NUM].deviceId );
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');

  let videoReady = false;
  video.srcObject = videoStream;
  video.play();

  video.addEventListener('canplay', e => {
    videoReady = true;

    let finalH = height;
    let finalW = width;

    let ratioHeight = (video.videoHeight / video.videoWidth) || 1;
    let ratioWidth = (video.videoWidth / video.videoHeight) || 1;

    ratioHeight = (ratioHeight === 0) ? 1 : ratioHeight;
    ratioWidth = (ratioWidth === 0) ? 1 : ratioWidth;



    if(height === FULL && width === AUTO) {
      finalH = container.offsetHeight;
      finalW = container.offsetHeight * ratioHeight;
      //video.style.marginLeft = (-(window.innerWidth / 2 - video.innerWidth / 2)) + 'px';
    } else if(width === FULL && height === AUTO) {
      finalW = container.offsetWidth;
      finalH = container.offsetWidth * ratioWidth;
    }

    canvas.width = finalW;
    canvas.height = finalH;
    video.height = finalH;
    video.width = finalW;

  });

  const modelSize = 100;

  let imageData;
  let markers;

  const detector = new AR.Detector();
  const posit = new POS.Posit(modelSize, canvas.width);

  const { renderer, sceneVideo, cameraVideo } = createRenderer(canvas, container);
  const texture = await createScene(sceneVideo, video);

  const videos = [];
  const videosAdded = [];

  const tick = () => {
    requestAnimationFrame(tick);

    if(videoReady) {
      imageData = snapshot(canvas, video);
      markers = detector.detect(imageData);

      if(markers.length > 0) {
        detectedMarkers(markers.map(m => {
          return {
            id: m.id,
            setVideo: url => {
              if(videosAdded.filter( v => v === m.id ).length === 0) {

                videosAdded.push(m.id);

                createVideo(url, canvas)
                  .then(three => {
                    videos.push({
                      id: m.id,
                      three
                    });
                  });

              }
            }
          };
        }));
      }

      updateScenes(markers, canvas, posit, texture, modelSize, videos);
      render(renderer, sceneVideo, cameraVideo, videos);
    }
  };

  requestAnimationFrame(tick);
}


function createTexture(video) {
  var texture = new THREE.Texture(video),
      object = new THREE.Object3D(),
      geometry = new THREE.PlaneGeometry(1.0, 1.0, 0.0),
      material = new THREE.MeshBasicMaterial( {map: texture, depthTest: false, depthWrite: false} ),
      mesh = new THREE.Mesh(geometry, material);

  texture.minFilter = THREE.LinearFilter;

  object.position.z = -1;

  object.add(mesh);

  return object;
}

function render(renderer, sceneVideo, cameraVideo, videos) {
  renderer.autoClear = false;
  renderer.clear();

  renderer.render(sceneVideo, cameraVideo);

  videos.forEach(({ three: { scene, camera } }) => {
    renderer.render(scene, camera);
  });

}

function updateScenes(markers, canvas, posit, texture, modelSize, videos) {
  var corners, corner, pose, i;

  markers.forEach(({ id, corners }) => {

    corners.forEach(corner => {
      corner.x = corner.x - (canvas.width / 2);
      corner.y = (canvas.height / 2) - corner.y;
    });

    const pose = posit.pose(corners);

    const video = videos.filter(v => v.id === id)[0];
    if(video) {
      updateObject(video.three.model, pose.bestRotation, pose.bestTranslation, modelSize);
      video.three.model.children[0].material.map.needsUpdate = true;
    }
  });

  // For webcam
  texture.children[0].material.map.needsUpdate = true;
}

function updateObject(object, rotation, translation, modelSize){
  object.scale.x = modelSize;
  object.scale.y = modelSize;
  object.scale.z = modelSize;

  object.rotation.x = -Math.asin(-rotation[1][2]);
  object.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
  object.rotation.z = Math.atan2(rotation[1][0], rotation[1][1]);

  object.position.x = translation[0];
  object.position.y = translation[1];
  object.position.z = -translation[2];
}

function snapshot(canvas, video) {

  const context = canvas.getContext('2d');

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function createRenderer(canvas, appentToContainer) {

  const renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xffffff, 1);
  renderer.setSize(canvas.width, canvas.height);
  appentToContainer.appendChild(renderer.domElement);

  const sceneVideo = new THREE.Scene();
  const cameraVideo = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5);
  sceneVideo.add(cameraVideo);

  return {
    renderer,
    sceneVideo,
    cameraVideo
  };
}

async function createScene(sceneVideo, video) {

  const texture = createTexture(video);
  sceneVideo.add(texture);

  return texture;
}

function createVideo(videoUrl, canvas) {

  return new Promise((resolve, reject) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, canvas.width / canvas.height, 1, 1000);
    scene.add(camera);

    const video = document.createElement('video');
    document.querySelector('#app').appendChild(video);
    video.loop = true;
    video.autoplay = true;
    video.muted = true;
    video.style.visibility = 'hidden';

    video.addEventListener('canplay', e => {

      var texture = new THREE.Texture(video),
          object = new THREE.Object3D(),
          geometry = new THREE.PlaneGeometry(1, 1, 0),
          material = new THREE.MeshBasicMaterial( {map: texture, depthTest: false, depthWrite: false} ),
          mesh = new THREE.Mesh(geometry, material);

      texture.minFilter = THREE.LinearFilter;

      object.add(mesh);

      scene.add(object);



      resolve({ scene, camera, model: object });
    });

    video.src = videoUrl;


  });

}

const FULL = 'full';
const AUTO = 'auto';

window.addEventListener('load', e => {
  setupAR({
    container: document.querySelector('#app'),
    height: FULL,
    width: AUTO,
    detectedMarkers: markers => {
      markers.forEach(({ setVideo, id }) => {
        setVideo(exampleVideo);
      });
    }
  });
});
