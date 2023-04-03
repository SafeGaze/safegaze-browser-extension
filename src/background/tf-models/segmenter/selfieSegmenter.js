import * as bodySegmentation from '@tensorflow-models/body-segmentation';

export default class selfieSegmenter {

    selfieSegmenterConfig = {
        runtime: 'tfjs', // or 'tfjs'
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
        // or 'base/node_modules/@mediapipe/selfie_segmentation' in npm.
        modelType: 'general'
    }

    load = async () => {
        const selfieModel = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;

        this.selfieSegmenter = await bodySegmentation.createSegmenter(selfieModel, this.selfieSegmenterConfig);
    }

    segment = async (canvas) => {

        let segmentation = null

        try {
            segmentation = await this.selfieSegmenter.segmentPeople(
                canvas
            );
        } catch (error) {
            console.log("Error selfie segmenting");
            console.log(error);
        }


        return segmentation;
    }
}
