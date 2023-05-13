import * as bodySegmentation from '@tensorflow-models/body-segmentation';

export default class SelfieSegmenter {

    selfieSegmenterConfig = {
        runtime: 'tfjs', // or 'mediapipe'
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
        // solutionPath: 'base/node_modules/@mediapipe/selfie_segmentation',
        // modelType: 'general'
    }

    load = async () => {
        const selfieModel = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;

        this.selfieSegmenter = await bodySegmentation.createSegmenter(
            selfieModel, 
            this.selfieSegmenterConfig
        );
    }

    segment = async (canvas) => {

        let segmentation = null

        try {
            segmentation = await this.selfieSegmenter.segmentPeople(
                canvas,
                {flipHorizontal: false}
            );
        } catch (error) {

        }

        return segmentation;
    }
}
