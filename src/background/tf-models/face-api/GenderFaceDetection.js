import * as tf from `@tensorflow/tfjs`;
import * as faceapi from './face-api.esm-nobundle.js';

// console.log(faceapi );

export default class GenderFaceDetection {

    modelPath = '/dist/face-api-models';
    minScore = 0.3; // minimum score
    maxResults = 20; // maximum number of results to return    


    load = async () => {

        await faceapi.nets.ssdMobilenetv1.load(this.modelPath);
        await faceapi.nets.ageGenderNet.load(this.modelPath);

        this.optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options(
            {
                minConfidence: this.minScore,
                maxResults: this.maxResults
            });

        const engine = await tf.engine();
    }

    detect = async (input) => {
        const dataSSDMobileNet = await faceapi
            .detectAllFaces(input, this.optionsSSDMobileNet)
            .withAgeAndGender();

        return dataSSDMobileNet;
    }
}