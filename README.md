# The Augmented Web
Augmented Reality on the web. For everyone.

__Note:__ This library is based on aruco, you can see this as an extension of aruco.

## Why augmented-web.js?
#### Because it's easy to use.
I needed to make an augmented reality application under pressure, but I didn't find any easy way to realize it. Therefore I decided to understand aruco to simplify it then for developers.
#### Because everyone can use it
All you need to use the augmented reality applications is a browser (and a cam).

## SO GO AND BUILD SOMETHING GREAT!

## How to use augmented-web.js?

There's only one simple function:
```javascript
setupAR(
  container: DOMElement,
  height: Number || 'FULL',
  width: Number || 'FULL',
  detectedMarkers: Function
)
```

__1. container__
Pass a valid DOM-Element. This element will then be filled with the camera + the augmented content.

__2. height__
The height of the element. This can be 'FULL' (exported by the package as a constant) or a number.

__3. width__
The width of the element. This can be 'FULL' (exported by the package as a constant) or a number.

__4. detectedMarkers__
This must be a function with one parameter: markers.
This function is always called, when aruco-markers were detected. Markers is an array of objects with the following structure:

```javascript
  {
    id: Number,
    setVideo: Function,
    setModel: Function
  }
```

Call the 'setVideo'-function with a valid video url as the first parameter to set an augmented-reality video.
Call the 'setModel'-function with a valid three-js mesh as the first parameter to set an augmented-reality program.
