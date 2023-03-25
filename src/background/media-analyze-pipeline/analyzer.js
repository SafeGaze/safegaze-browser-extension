// import * as helper from '../..helpers/index.js';

class analyzer {
    constructor() {
        // canvas
        this.frameCanvas = new OffscreenCanvas(400, 400);
        this.frameCtx = this.frameCanvas.getContext('2d');
        this.data = {};
        this.n = 0;
    }

    init = async () => {

        return;
        
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
        this.data = data;
        try {
            let imageData = await this.drawImage(data.mediaUrl);
        } catch (error) {
            return {
                shouldMask: false,
                maskedUrl: null,
                invalidMedia: true
            };
        }


        // testing

        this.frameCtx.fillStyle = "#FF0000";
        this.frameCtx.fillRect(10, 10, 30, 20);
        this.frameCtx.fillStyle = "#00FF00";
        this.frameCtx.font = "40px Arial";
        this.frameCtx.fillText("filtered" + this.n, 10, 40);

        let blob = await this.canvasToBlob(this.frameCanvas);
        let base64 = await this.blobToBase64(blob);
        this.n++;

        return {
            shouldMask: true,
            maskedUrl: base64
        };

    };
}

export default analyzer;