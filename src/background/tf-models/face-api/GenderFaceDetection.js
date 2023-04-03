import * as tf from `@tensorflow/tfjs`;
import * as faceapi from './face-api.esm-nobundle.js';

// console.log(faceapi );

export default class GenderFaceDetection {

    modelPath = 'https://safegaze.sgp1.cdn.digitaloceanspaces.com/face-api-models';
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
        let dataSSDMobileNet = null;
        try {
            dataSSDMobileNet = await faceapi
            .detectAllFaces(input, this.optionsSSDMobileNet)
            .withAgeAndGender();

            return dataSSDMobileNet;
        } catch (error) {
            console.log("Error detecting faces");
            console.log(error);
        }

        return dataSSDMobileNet;
    }
}