import * as bodySegmentation from '@tensorflow-models/body-segmentation';

export default class Segmenter {

    bodySegmenterConfig = {
        architecture: 'ResNet50',
        // architecture: 'MobileNetV1',
        outputStride: 32,
        quantBytes: 2,
        // multiplier: 1,
    };

    bodySegmentationConfig = {
        multiSegmentation: true,
        segmentBodyParts: true,
        internalResolution: 'high',
        segmentationThreshold: 0.30
    };

    load = async () => {
        const bodyPixModel = bodySegmentation.SupportedModels.BodyPix;
        this.bodySegmenter = await bodySegmentation.createSegmenter(
            bodyPixModel,
            this.bodySegmenterConfig
        );
    }

    segment = async (canvas) => {
        const segmentation = await this.bodySegmenter.segmentPeople(
            canvas,
            this.bodySegmentationConfig
        );

        const coloredPartImage = await bodySegmentation.toBinaryMask(segmentation);

        return segmentation;
    }
}
