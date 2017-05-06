export async function getDevices(type = 'videoinput') {

  if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices)
    throw getError();

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter( d => d.kind === type );

}

export async function getVideo(deviceId) {

  if(!navigator.mediaDevices)
    throw getError();

  return navigator.mediaDevices.getUserMedia({ video: { optional: [{ sourceId: deviceId }] }, audio: false });
}

export function videoReady(video) {
  return new Promise((resolve, reject) => {
    video.addEventListener('canplay', resolve);
  });
}

const getError = () => new Error(`Browser not supporting this technologies!`);
