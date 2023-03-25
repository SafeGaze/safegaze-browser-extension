import * as tf from `@tensorflow/tfjs`;
import GenderFaceDetection from './face-api/GenderFaceDetection.js';
import Segmenter from './bodypix/Segmenter.js';
import DrawMask from './mask/DrawMask.js';


// canvas
const frameCanvas = document.getElementById('canvas');
const frameCtx = canvas.getContext('2d');

// draws the imsage to the canvas and returns the image data
const drawImage = async (imageUrl) => {

    let img = await fetch(imageUrl);
    img = await img.blob();
    let bitmap = await createImageBitmap(img);

    frameCanvas.width = bitmap.width;
    frameCanvas.height = bitmap.height;
    frameCtx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);

    return frameCtx.getImageData(0, 0, bitmap.width, bitmap.height);
};


const app = async () => {
    // load image
    const image = document.getElementById('people-img');
    console.time('model loading');

    // load tfjs
    await tf.setBackend('webgl');
    await tf.ready();

    // tfjs optimizations
    if (tf?.env().flagRegistry.CANVAS2D_WILL_READ_FREQUENTLY) tf.env().set('CANVAS2D_WILL_READ_FREQUENTLY', true);
    if (tf?.env().flagRegistry.WEBGL_EXP_CONV) tf.env().set('WEBGL_EXP_CONV', true);
    if (tf?.env().flagRegistry.WEBGL_EXP_CONV) tf.env().set('WEBGL_EXP_CONV', true);
    await tf.enableProdMode();
    await tf.ready();

    // faceapi
    const genderFaceDetection = new GenderFaceDetection();
    await genderFaceDetection.load();

    // bodypix
    const segmenter = new Segmenter();
    await segmenter.load();
    console.timeEnd('model loading');
    
    console.time('draw image');
    const imageData = await drawImage(image.src);
    console.timeEnd('draw image');

    // console.time('gender detection');
    // const genderData = await genderFaceDetection.detect(frameCanvas);
    // console.timeEnd('gender detection');


    // console.time('segmentation');
    // const people = await segmenter.segment(imageData);
    // console.timeEnd('segmentation');

  
    console.time('ai processing');
    const [genderData, people] = await Promise.all([
        genderFaceDetection.detect(frameCanvas),
        segmenter.segment(imageData)
    ]);

    console.timeEnd('ai processing');

    console.time('masking');
    // mask
    const drawMask = new DrawMask();
    await drawMask.draw(frameCtx, imageData, people, genderData);
    console.timeEnd('masking');
}

app();