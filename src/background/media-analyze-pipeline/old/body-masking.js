import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';

export default async (canvasContext, bitmap, canvas) => {

    // An object to configure parameters to set for the bodypix model.
    // See github docs for explanations.
    const bodyPixProperties = {
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 4
    };

    // An object to configure parameters for detection. I have raised
    // the segmentation threshold to 90% confidence to reduce the
    // number of false positives.
    const segmentationProperties = {
        flipHorizontal: true,
        internalResolution: 'high',
        segmentationThreshold: 0.45
    };


    // This array will hold the colours we wish to use to highlight different body parts we find.
    // RGBA (Red, Green, Blue, and Alpha (transparency) channels can be specified).
    const colourMap = [];

    // Left_face
    colourMap.push({ r: 244, g: 67, b: 54, a: 255 });
    // Right_face
    colourMap.push({ r: 183, g: 28, b: 28, a: 255 });
    // left_upper_arm_front
    colourMap.push({ r: 233, g: 30, b: 99, a: 255 });
    // left_upper_arm_back  
    colourMap.push({ r: 136, g: 14, b: 79, a: 255 });
    // right_upper_arm_front
    colourMap.push({ r: 233, g: 30, b: 99, a: 255 });
    // 	right_upper_arm_back
    colourMap.push({ r: 136, g: 14, b: 79, a: 255 });
    // 	left_lower_arm_front
    colourMap.push({ r: 233, g: 30, b: 99, a: 255 });
    // 	left_lower_arm_back
    colourMap.push({ r: 136, g: 14, b: 79, a: 255 });
    // right_lower_arm_front
    colourMap.push({ r: 233, g: 30, b: 99, a: 255 });
    // right_lower_arm_back
    colourMap.push({ r: 136, g: 14, b: 79, a: 255 });
    // left_hand 
    colourMap.push({ r: 156, g: 39, b: 176, a: 255 });
    // right_hand
    colourMap.push({ r: 156, g: 39, b: 176, a: 255 });
    // torso_front
    colourMap.push({ r: 63, g: 81, b: 181, a: 255 });
    // torso_back 
    colourMap.push({ r: 26, g: 35, b: 126, a: 255 });
    // left_upper_leg_front
    colourMap.push({ r: 33, g: 150, b: 243, a: 255 });
    // left_upper_leg_back
    colourMap.push({ r: 13, g: 71, b: 161, a: 255 });
    // right_upper_leg_front
    colourMap.push({ r: 33, g: 150, b: 243, a: 255 });
    // right_upper_leg_back
    colourMap.push({ r: 13, g: 71, b: 161, a: 255 });
    // left_lower_leg_front
    colourMap.push({ r: 0, g: 188, b: 212, a: 255 });
    // left_lower_leg_back
    colourMap.push({ r: 0, g: 96, b: 100, a: 255 });
    // right_lower_leg_front
    colourMap.push({ r: 0, g: 188, b: 212, a: 255 });
    // right_lower_leg_back
    colourMap.push({ r: 0, g: 188, b: 212, a: 255 });
    // left_feet
    colourMap.push({ r: 255, g: 193, b: 7, a: 255 });
    // right_feet
    colourMap.push({ r: 255, g: 193, b: 7, a: 255 });
    colourMap.push({ r: 255, g: 193, b: 7, a: 255 });
    colourMap.push({ r: 255, g: 193, b: 7, a: 255 });
    colourMap.push({ r: 255, g: 193, b: 7, a: 255 });
    colourMap.push({ r: 255, g: 193, b: 7, a: 255 });
    colourMap.push({ r: 255, g: 193, b: 7, a: 255 });

    async function processSegmentation(canvasContext, imageData, segmentation) {
        // console.log(segmentation[0].mask.toImageData());
        if (segmentation.length === 0) {
            return;
        }

        segmentation = await segmentation[0].mask.toImageData();
        console.log(segmentation);

        var data = imageData.data;

        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (segmentation.data[n] !== -1) {
                // console.log(segmentation.data[n]);
                // data[i] = colourMap[segmentation.data[n]].r;     // red
                // data[i + 1] = colourMap[segmentation.data[n]].g; // green
                // data[i + 2] = colourMap[segmentation.data[n]].b; // blue
                // data[i + 3] = colourMap[segmentation.data[n]].a; // alpha
                // console.log(segmentation.data[n]);
                // { r: 156, g: 39, b: 176, a: 255 }
                data[i] = 156;     // red
                data[i + 1] = 39; // green
                data[i + 2] = 176; // blue
                data[i + 3] = 255; // alpha
            } else {
                // data[i] = 0;
                // data[i + 1] = 0;
                // data[i + 2] = 0;
                // data[i + 3] = 0;
            }
            n++;
        }

        console.log(imageData);
        await canvasContext.putImageData(imageData, 0, 0);
    }

    // model = bodySegmentation.SupportedModels.BodyPix.load(bodyPixProperties).then(function (loadedModel) {
    //     model = loadedModel;
    //     modelHasLoaded = true;
    // Show demo section now model is ready to use.
    //     console.log('Model loaded');
    // });


    const model = await bodySegmentation.SupportedModels.BodyPix;
    // const segmenterConfig = {
    //   architecture: 'ResNet50',
    //   outputStride: 32,
    //   quantBytes: 2
    // };

    const segmenterConfig = {
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 4
    };

    // An object to configure parameters for detection. I have raised
    // the segmentation threshold to 90% confidence to reduce the
    // number of false positives.
    // const segmentationProperties = {
    //     flipHorizontal: true,
    //     internalResolution: 'high',
    //     segmentationThreshold: 0.45
    // };
    const segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);
    const segmentationConfig = {
        // flipHorizontal: true,
        internalResolution: 'high',
        segmentationThreshold: 0.9,
        multiSegmentation: false,
        segmentBodyParts: true
    };
    var imageData = await canvasContext.getImageData(0, 0, bitmap.width, bitmap.height);
    const segmentation = await segmenter.segmentPeople(imageData, segmentationConfig);

    // const foregroundThreshold = 0.9;
    // const backgroundBlurAmount = 10;
    // const edgeBlurAmount = 10;
    // const flipHorizontal = false;
    // const faceBodyPartIdsToBlur = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

    // await bodySegmentation.blurBodyPart(
    //     canvas, imageData, segmentation, faceBodyPartIdsToBlur, foregroundThreshold,
    //     backgroundBlurAmount, edgeBlurAmount, flipHorizontal);




    // Convert the segmentation into a mask to darken the background.
    const foregroundColor = { r: 0, g: 0, b: 0, a: 255 };
    const backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const backgroundDarkeningMask = await bodySegmentation.toBinaryMask(
        segmentation, foregroundColor, backgroundColor);

    const opacity = 0.9;
    const maskBlurAmount = 3;
    const flipHorizontal = false;
    // Draw the mask onto the image on a canvas.  With opacity set to 0.7 and
    // maskBlurAmount set to 3, this will darken the background and blur the
    // darkened background's edge.
    await bodySegmentation.drawMask(
        canvas, imageData, backgroundDarkeningMask, opacity, maskBlurAmount, flipHorizontal);



    // We can call model.segmentPerson as many times as we like with
    // different image data each time. This returns a promise
    // which we wait to complete and then call a function to
    // print out the results of the prediction.
    // await processSegmentation(canvasContext, imageData, segmentation);

    // model.segmentPersonParts(imageData, segmentationProperties).then(function (segmentation) {
    //     processSegmentation(canvasContext, segmentation);
    // });


}