import AR from './aruco/aruco';
import POS from './aruco/posit1';
import THREELib from 'three-js';

import { getDevices, getVideo, videoReady } from './webcam';

import './style.css';

const THREE = THREELib();

/* AR setup */

async function videoSetup({ height, width, container, cameraIndex = null }) {
  const cameras = await getDevices();
  const CAMERA_NUM = cameraIndex || cameras.length - 1;

  const videoStream = await getVideo( cameras[CAMERA_NUM].deviceId );
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');

  video.srcObject = videoStream;
  video.play();

  const readyEvent = await videoReady(video);

  canvas.height = height;
  canvas.width = width;
  video.height = height;
  video.width = width;

  let finalH = height;
  let finalW = width;

  let ratioHeight = (container.offsetHeight / video.videoHeight);
  let ratioWidth = (container.offsetWidth / video.videoWidth);



  if(height === AUTO && width === AUTO) {
    if(ratioHeight > ratioWidth) {
      const newW = video.videoWidth * ratioHeight;
      finalH = container.offsetHeight;
      finalW = newW;
    } else {
      const newH = video.videoHeight * ratioWidth;
      finalH = newH;
      finalW = container.offsetWidth;
    }
  }

  canvas.width = finalW;
  canvas.height = finalH;
  video.height = finalH;
  video.width = finalW;

  return {
    canvas,
    video
  };
}

export async function setupAR({ container, height, width, detectedMarkers = () => {}, onError = () => {} }) {

  let canvas, video;

  try {
    const { canvas: c, video: v } = await videoSetup({ height, width, container });
    canvas = c;
    video = v;
  } catch(e) {
    onError(`Couldn't gain webcam access`);
    return;
  }


  const modelSize = 35;

  let imageData;
  let markers;

  const detector = new AR.Detector();
  const posit = new POS.Posit(modelSize, canvas.width);

  const { renderer, sceneVideo, cameraVideo } = createRenderer(canvas, container);
  const texture = await createScene(sceneVideo, video);

  let videoCache = [];
  let videos = [];
  let videosAdded = [];

  let customModels = [];

  const tick = () => {
    requestAnimationFrame(tick);

    imageData = snapshot(canvas, video);
    markers = detector.detect(imageData);

    if(markers.length > 0) {

      detectedMarkers(markers.map(m => {
        return {
          id: m.id,
          getVideoObject: url => {
            const filtered = videoCache.filter(v => v.url === url)[0];

            return filtered;
          },
          setVideo: url => {
            if(videosAdded.filter( v => v === m.id ).length === 0) {

              videosAdded.push(m.id);

              createVideo(url, canvas, videoCache)
                .then(three => {
                  videos.push({
                    id: m.id,
                    three
                  });
                });

              }
            },
            setModel: customModel => {
              if(customModels.filter(cm => cm.id === customModel.id).length === 0) {
                customModels.push({
                  id: m.id,
                  three: createCustomModel(customModel, canvas)
                });
              }
            }
          };
        }));
      }

      // Delete videos whose markers aren't visible anymore
      videos.forEach(v => {
        const filtered = markers.filter(m => m.id === v.id);
        if(filtered.length === 0) {
          videos = videos.filter(video => video.id !== v.id);
          videosAdded = videosAdded.filter(videoId => videoId !== v.id);
        }
      });

      // Delete models whose markers aren't visible anymore
      customModels.forEach(cm => {
        const filtered = markers.filter(m => m.id === cm.id);
        if(filtered.length === 0) {
          customModels = customModels.filter(c => c.id !== cm.id);
        }
      });


      updateScenes(markers, canvas, posit, texture, modelSize, videos, customModels);
      render(renderer, sceneVideo, cameraVideo, videos, customModels);
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

function render(renderer, sceneVideo, cameraVideo, videos, customModels) {
  renderer.autoClear = false;
  renderer.clear();

  renderer.render(sceneVideo, cameraVideo);

  videos.forEach(({ three: { scene, camera } }) => {
    renderer.render(scene, camera);
  });

  customModels.forEach(({ three: { scene, camera } }) => {
    renderer.render(scene, camera);
  });

}

function updateScenes(markers, canvas, posit, texture, modelSize, videos, models) {
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

    const model = models.filter(m => m.id === id)[0];
    if(model) {
      updateObject(model.three.model, pose.bestRotation, pose.bestTranslation, modelSize);
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

function createCustomModel(model, canvas) {

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, canvas.width / canvas.height, 1, 1000);
  scene.add(camera);
  scene.add(model);

  return { scene, camera, model };
}

function createVideo(videoUrl, canvas, videoCache) {

  return new Promise((resolve, reject) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, canvas.width / canvas.height, 1, 1000);
    scene.add(camera);

    const getVideoElement = () => {
      const video = document.createElement('video');
      document.querySelector('#app').appendChild(video);
      video.loop = true;
      video.style.visibility = 'hidden';
      return video;
    };

    const return3DObject = video => {
      var texture = new THREE.Texture(video),
          object = new THREE.Object3D(),
          geometry = new THREE.PlaneGeometry(2.5, 2.5, 0),
          material = new THREE.MeshBasicMaterial( {map: texture, depthTest: false, depthWrite: false} ),
          mesh = new THREE.Mesh(geometry, material);

      texture.minFilter = THREE.LinearFilter;

      object.add(mesh);

      scene.add(object);
      resolve({ scene, camera, model: object });
    };

    let video;
    const filtered = videoCache.filter(v => v.url === videoUrl);
    if(filtered.length === 0) {
      video = getVideoElement();
      videoCache.push({
        url: videoUrl,
        videoObject: video
      });

      video.addEventListener('canplay', e => {
        return3DObject(video);
      });

      video.src = videoUrl;
    } else {
      const { videoObject } = filtered[0];
      return3DObject(videoObject);
    }



  });

}

export const AUTO = 'auto';





/*window.addEventListener('load', e => {
  setupAR({
    container: document.querySelector('#app'),
    height: AUTO,
    width: AUTO,
    detectedMarkers: markers => {
      markers.forEach(({ setVideo, setModel, id, getVideoObject }) => {
        //setVideo(exampleVideo);
      });
    },
    onError: e => console.error(e)
  });
});*/
