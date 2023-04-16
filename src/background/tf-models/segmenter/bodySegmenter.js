import * as bodySegmentation from '@tensorflow-models/body-segmentation';

export default class Segmenter {

    bodySegmenterConfig = {
        architecture: 'ResNet50',
        outputStride: 32,
        quantBytes: 2,
        // modelUrl: "https://storage.googleapis.com/tfjs-models/savedmodel/bodypix/resnet50/quant2/model-stride32.json",
        modelUrl: "/model-files/resnet50/quant2/model-stride32.json"
    };

    bodySegmentationConfig = {
        multiSegmentation: true,
        segmentBodyParts: true,
        internalResolution: 'high',
        segmentationThreshold: 0.20
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
            console.log("Error body segmenting");
            console.log(error);
        }


        return segmentation;
    }
}
