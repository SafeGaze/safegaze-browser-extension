import * as tf from `@tensorflow/tfjs`;
import GenderFaceDetection from '../tf-models/face-api/GenderFaceDetection.js';
import bodySegmenter from '../tf-models/segmenter/bodySegmenter.js';
import selfieSegmenter from '../tf-models/segmenter/selfieSegmenter.js';
import DrawMask from '../tf-models/mask/DrawMask.js';
class analyzer {
    constructor() {
        // canvas
        this.frameCanvas = new OffscreenCanvas(400, 400);
        this.frameCtx = this.frameCanvas.getContext('2d', { willReadFrequently: true });
        this.data = {};
        this.n = 0;
        this.modelLoaded = false;
    }

    init = async () => {

        // load tfjs
        await tf.setBackend('webgl');
        await tf.ready();

        // tfjs optimizations
        await tf.enableProdMode();
        await tf.ready();

        try {
            // faceapi
            this.genderFaceDetection = new GenderFaceDetection();
            await this.genderFaceDetection.load();

            // bodypix
            this.bodySegmenter = new bodySegmenter();
            await this.bodySegmenter.load();

            // selfie           
            this.selfieSegmenter = new selfieSegmenter();
            await this.selfieSegmenter.load();
            this.modelLoaded = true;
        } catch (error) {
            console.log("Error loading models");
            console.log(error);
        }

        return this.modelLoaded;
    };

    // draws the image to the canvas and returns the image data
    drawImage = async (imageUrl) => {

        let img = await fetch(imageUrl);
        img = await img.blob();
        let bitmap = await createImageBitmap(img);

        this.frameCanvas.width = bitmap.width;
        this.frameCanvas.height = bitmap.height;
        this.frameCtx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);

        return this.frameCtx.getImageData(0, 0, bitmap.width, bitmap.height);
    };

    blobToBase64 = (blob) => {
        return new Promise((resolve, _) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    };

    canvasToBlob = async (canvas) => {
        var blob = await canvas[
            canvas.convertToBlob
                ? 'convertToBlob' // specs
                : 'toBlob'        // current Firefox
        ]();
        return blob;
    };

    analyze = async (data) => {
        
        if (this.modelLoaded === false) {
            return {
                shouldMask: false,
                maskedUrl: null,
                invalidMedia: true
            };
        }

        this.data = data;
        let imageData = null;

        try {
            imageData = await this.drawImage(data.mediaUrl);
        } catch (error) {
            return {
                shouldMask: false,
                maskedUrl: null,
                invalidMedia: true
            };
        }

        const [people, selfie] = await Promise.all([
            // this.genderFaceDetection.detect(this.frameCanvas),
            this.bodySegmenter.segment(imageData),
            this.selfieSegmenter.segment(imageData)
        ]);

        const drawMask = new DrawMask();
        let shouldMask = false;
        try {
            shouldMask = await drawMask.draw(this.frameCtx, imageData, null, people, selfie);
        } catch (error) {
            console.log('Error drawing mask');
            console.log(error);
        }

        if (shouldMask === false) {
            return {
                shouldMask: false,
                maskedUrl: null
            }
        }

        // testing
        this.frameCtx.fillStyle = "#FF0000";
        this.frameCtx.fillRect(10, 10, 30, 20);
        this.frameCtx.fillStyle = "#00FF00";
        this.frameCtx.font = "40px Arial";
        this.frameCtx.fillText("filtered" + this.n, 10, 40);
        this.n++;

        let blob = await this.canvasToBlob(this.frameCanvas);
        let base64 = await this.blobToBase64(blob);

        return {
            shouldMask: shouldMask,
            maskedUrl: base64
        };

    };
}

export default analyzer;