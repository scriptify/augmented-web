<<<<<<< HEAD
**js-aruco** is a port to JavaScript of the ArUco library.

[ArUco](http://www.uco.es/investiga/grupos/ava/node/26) is a minimal library for Augmented Reality applications based on OpenCv.

### Demos ###

100% JavaScript (see details bellow):

- [Webcam live demo!](https://jcmellado.github.io/js-aruco/getusermedia/getusermedia.html)

3D Pose Estimation:

- [3D Earth!](https://jcmellado.github.io/js-aruco/debug-posit/debug-posit.html)

Visual Debugging:

- [Debug session jam!](https://jcmellado.github.io/js-aruco/debug/debug.html)

Flash camera access (see details bellow):

- [Webcam live demo!](https://jcmellado.github.io/js-aruco/webcam/webcam.html)

### Videos ###

Webcam video adquisition:

[![js-aruco](http://img.youtube.com/vi/_wzPupbww4I/0.jpg)](http://www.youtube.com/watch?v=_wzPupbww4I)

3D Pose estimation:

[![js-aruco](http://img.youtube.com/vi/9WD4wR3_-JM/0.jpg)](http://www.youtube.com/watch?v=9WD4wR3_-JM)

Visual Debugging:

[![js-aruco](http://img.youtube.com/vi/xvTMRdgySUQ/0.jpg)](http://www.youtube.com/watch?v=xvTMRdgySUQ)

### Markers ###

A 7x7 grid with an external unused black border. Internal 5x5 cells contains id information.

Each row must follow any of the following patterns:

`white - black - black - black - black`

`white - black - white - white - white`

`black - white - black - black - white`

`black - white - white - white - black`

Example:

![Marker](http://www.inmensia.com/files/pictures/external/1001.png)

### Usage ###
Create an `AR.Detector` object:

```
var detector = new AR.Detector();
```

Call `detect` function:

```
var markers = detector.detect(imageData);
```

`markers` result will be an array of `AR.Marker` objects with detected markers.

`AR.Marker` objects have two properties:

 * `id`: Marker id.
 * `corners`: 2D marker corners.

`imageData` argument must be a valid `ImageData` canvas object.

```
var canvas = document.getElementById("canvas");
    
var context = canvas.getContext("2d");

var imageData = context.getImageData(0, 0, width, height);
```

### 3D Pose Estimation ###
Create an `POS.Posit` object:

```
var posit = new POS.Posit(modelSize, canvas.width);
```

`modelSize` argument must be the real marker size (millimeters).

Call `pose` function:

```
var pose = posit.pose(corners);
```

`corners` must be centered on canvas:

```
var corners = marker.corners;

for (var i = 0; i < corners.length; ++ i){
  var corner = corners[i];

  corner.x = corner.x - (canvas.width / 2);
  corner.y = (canvas.height / 2) - corner.y;
}
```

`pose` result will be a `POS.Pose` object with two estimated pose (if any):

 * `bestError`: Error of the best estimated pose.
 * `bestRotation`: 3x3 rotation matrix of the best estimated pose.
 * `bestTranslation`: Translation vector of the best estimated pose.
 * `alternativeError`: Error of the alternative estimated pose.
 * `alternativeRotation`: 3x3 rotation matrix of the alternative estimated pose.
 * `alternativeTranslation`: Translation vector of the alternative estimated pose.

Note: POS namespace can be taken from posit1.js or posit2.js.

### WebCam Access ###

To test 100% JavaScript demos use a modern browser like Chrome or Firefox.

### Flash Demo (deprecated) ###

It uses [Flashcam](https://github.com/jcmellado/flashcam), a minimal Flash library to capture video.
=======
# Recordy
## Recording for browsers - the easy way
This module abstracts away the logic needed to record audio in your browser.
Since it's based on the [Chnl](https://github.com/scriptify/Chnl) module, a lot of effects can be added to the input. For information about this aspect just have a look a the documentation of Chnl.
You can treat any Recordy-instance as a Chnl, because Recordy is extending Chnl.
To record the input, I'm using a fork of the popular recorder.js library from Matt Diamond, [wrecorder](https://github.com/scriptify/Wrecorder), which allows us to record the output of WebAudio-nodes. Big thanks for this awesome work!

__Attention__: Since the [webaudio-effect-unit](https://github.com/scriptify/webaudio-effect-unit) has reached v.1.1.0, the way how the effects work has changed. Have a look at it's repository for more details. Make sure to do this BEFORE you update. If you have difficulties or questions, just open an issue! I am always glad if I can help. :smile:

## Installation
The package is hosted on npm. You can consume it with any package manager supporting npm packages.
```bash
npm i recordy -S
```

## Usage
### Creating an instance
```javascript
new Recordy(audioCtx)
```

To create a Recordy-instance, you have to pass exactly one argument to the constructor: an AudioContext object.
Now, you can request audio input(have a look at the example for more information).

### Getting input
```javascript
.getInput()
```

This method needs to be executed before you can start recording. It asynchronously requests audio input. So the return value is a __Promise__, which returns a __boolean__ value. This value evaluates to true if the request for the microphone/audio-input was successfully and to false if it wasn't.

### Start recording
```javascript
.startRecording()
```

This method is really self-explanatory.
Recody will record until you call the .stopRecording(...) method.

### Stop recording
```javascript
.stopRecording(asAudioObject)
```

This methods stops a previously started recording.
It accepts exactly one parameter: a __boolean__.
If this boolean evaluates to true, this method will return a Promise which returns an Audio-object with the recorded track.
Otherwise, it returns a Promise which returns the plain binary data(blob) of the recorded track.

### Outputting to the speakers
```javascript
.toSpeaker(gainValue)
```

Recordy allows you to directly output the audio-input to the speakers, so you could directly hear the effects you apply etc. The method accepts exactly one parameter: The volume of the output. This can be a number from 0 - 1. If you set a value of 0 it's muted, if you set a value of 1 it's the maximal possible volume.
__ATTENTION:__ Due to the lack of support of advanced and latency-free audio protocols like ASIO(...) in the actual browsers, there's a quite high latency between input and output (it's clearly noticeable).
Therefore, it's muted by default.


# Example

This is a simple example which records an one second long track. The track gets returned as an Audio-object so it can be directly played. Also, the input is directly outputted to the speakers with a gain of 0.4.
In addition, some functionality of the Chnl module was applied: The bitcrusher effect was enabled.

```javascript
const audioCtx = new AudioContext();
const r = new Recordy(audioCtx);

r.getInput()
  .then(val => {
    r.startRecording();

    window.setTimeout(() => {
      r.stopRecording(true)
        .then(audio => {
          audio.play();
        });
    }, 1000);
    r.toSpeaker(0.4);
    r.effects.bitcrusher.enable();
  });
```
>>>>>>> 4583a10ba9209490ff9f5397f02e29cb0e740133
