// import * as helper from '../..helpers/index.js';

class analyzer {
    constructor() {
        // canvas
        this.frameCanvas = document.getElementById('canvas');
        this.frameCtx = canvas.getContext('2d');
        this.data = {};
    }

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
        let imageData = await this.drawImage(data.mediaUrl);
        
        // testing

        this.frameCtx.fillStyle = "#FF0000";
        this.frameCtx.fillRect(10, 10, 30, 20);
        this.frameCtx.fillStyle = "#00FF00";
        this.frameCtx.font = "40px Arial";
        this.frameCtx.fillText("filtered" + n, 10, 40);

        let blob = await this.canvasToBlob(this.frameCanvas);
        let base64 = await this.blobToBase64(blob);

        return {
            shouldMask: true,
            maskedUrl: base64
        };

    };
}

export default analyzer;