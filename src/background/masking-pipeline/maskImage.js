import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';

class maskImage {
    constructor() {
        this._segmenterConfig = {
            architecture: 'MobileNetV1',
            outputStride: 16,
            multiplier: 1,
            quantBytes: 4
        };

        this._segmentationConfig = {
            // flipHorizontal: true,
            internalResolution: 'high',
            segmentationThreshold: 0.3,
            multiSegmentation: false,
            segmentBodyParts: false
        };
    }
    async loadModel() {
        this._model = await bodySegmentation.SupportedModels.BodyPix;
        this._segmenter = await bodySegmentation.createSegmenter(
            this._model,
            this._segmenterConfig
        );
    }
    async processImage(url, is_base64, n, img) {
        this.loadModel();
        
        if (is_base64 === true) {
            console.log("base64 image", n)
            return url;
        }
        const response = await fetch(url);
        const fileBlob = await response.blob();
        this._bitmap = await createImageBitmap(fileBlob);
        this._canvas = await new OffscreenCanvas(this._bitmap.width, this._bitmap.height);
        this._context = await this._canvas.getContext('2d');

        await this._context.drawImage(this._bitmap, 0, 0);
        this._context.fillStyle = "#FF0000";
        this._context.fillRect(10, 10, 30, 20);
        this._context.fillStyle = "#00FF00";
        this._context.font = "40px Arial";
        this._context.fillText(n, 10, 40);

        await this.addMask();
        // await new Promise(r => setTimeout(r, 1000));

        const blob = await this._canvas[
            this._canvas.convertToBlob
                ? 'convertToBlob' // specs
                : 'toBlob'        // current Firefox
        ]();
        const dataUrl = await this.blobToBase64(blob);
        // console.log("data " + n, typeof dataUrl);
        return { dataUrl: dataUrl, img: img, n: n };
    }

    blobToBase64(blob) {
        return new Promise((resolve, _) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }


    async addMask() {
        console.log('segmenter', this._segmenter);

        const imageData = await this._context.getImageData(
            0, 0, this._bitmap.width, this._bitmap.height
        );
        const segmentation = await this._segmenter.segmentPeople(
            imageData, this._segmentationConfig
        );

        const foregroundColor = { r: 0, g: 0, b: 0, a: 255 };
        const backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
        const drawContour = false;
        const foregroundThreshold = .1;
        const backgroundDarkeningMask = await bodySegmentation.toBinaryMask(
            segmentation, foregroundColor, backgroundColor);

        const opacity = 0.9;
        const maskBlurAmount = 1;
        const flipHorizontal = false;
        // Draw the mask onto the image on a canvas.  With opacity set to 0.7 and
        // maskBlurAmount set to 3, this will darken the background and blur the
        // darkened background's edge.
        await bodySegmentation.drawMask(
            this._canvas, imageData, backgroundDarkeningMask, opacity, maskBlurAmount, flipHorizontal);

    }
}

export default maskImage;