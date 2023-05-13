import * as bodySegmentation from '@tensorflow-models/body-segmentation';

export default class BodySegmenter {

    bodySegmenterConfig = {
        architecture: 'MobileNetV1',
        outputStride: 16,
        quantBytes: 2,
        multiplier: 1,
        modelUrl: "/model-files/mobilenet/float/100/model-stride16.json"
    };

    bodySegmentationConfig = {
        multiSegmentation: true,
        segmentBodyParts: true,
        internalResolution: 'high',
        segmentationThreshold: 0.25
    };

    load = async () => {
        const bodyPixModel = bodySegmentation.SupportedModels.BodyPix;
        this.bodySegmenter = await bodySegmentation.createSegmenter(
            bodyPixModel,
            this.bodySegmenterConfig
        );
    }

    segment = async (canvas) => {

        let segmentation = null 
        
        try {
            segmentation = await this.bodySegmenter.segmentPeople(
                canvas,
                this.bodySegmentationConfig
            );    
        } catch (error) {
            
        }


        return segmentation;
    }
}
