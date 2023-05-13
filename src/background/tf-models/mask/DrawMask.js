
export default class DrawMask {
    maskRgb = {
        r: 0,
        g: 134,
        b: 190,
    }

    // constructor() {


    // }

    draw = async (ctx, imageData, genderData, segmentationData, selfieData) => {
        if (segmentationData === null) return;
        if (genderData === null) genderData = [];
        // if (selfieData === null) selfieData = [];

        console.log({genderData, segmentationData, selfieData});
        if(selfieData.length > 0){
            segmentationData = segmentationData.concat(selfieData);
        }

        // console.log(segmentationData);
        if(segmentationData.length <= 0){
            return false;
        }
        
        let data = imageData.data;
        let skipMasking = false;

        for await (const single of segmentationData) {
            let n = 0;
            let segmentPeople = single.mask;
            let maskRData = (segmentPeople?.mask?.dtype === 'float32') ? 0 : 24;
                
            segmentPeople = await segmentPeople.toImageData();

            // console.log(segmentPeople);

            // check if the gender boxed area is in the mask area.
            // if it is, then we will not draw the mask.
            for (let g = 0; g < genderData.length; g++) {

                // if the box score is less than 0.5, will NOT skip the masking.
                if(genderData[g].detection._score < 0.5) continue;

                // if not male, we will NOT skip the mask.
                // if the age is greater than 14, we will NOT skip the mask.
                if(genderData[g].gender !== 'male' && genderData[g].age >= 14) continue;

                // if the probability score is less than 0.5, will not skip the masking.
                if(genderData[g].genderProbability < 0.5) continue;

                let imageDataIndexFromBox = this.getImageDataIndexFromBox(
                    genderData[g],
                    {
                        width: segmentPeople.width,
                        height: segmentPeople.height
                    }
                );

                if (segmentPeople.data[imageDataIndexFromBox] !== maskRData ) {
                    console.log('male found; skip masking');
                    skipMasking = true;
                    continue;
                }
            }

            // if the box is found, we will skip the masking.
            if(skipMasking === true) continue;

            for (let i = 0; i < data.length; i += 4) {

                if (segmentPeople.data[i] !== maskRData) {
                    data[i] = this.maskRgb.r;     // red
                    data[i + 1] = this.maskRgb.g; // green
                    data[i + 2] = this.maskRgb.b; // blue
                    data[i + 3] = 255; // alpha

                } else {
                    // data[i] = 0;
                    // data[i + 1] = 0;
                    // data[i + 2] = 0;
                    // data[i + 3] = 0;
                }
                n++;
            }
        }
        ctx.putImageData(imageData, 0, 0);

        return true;
    }

    getImageDataIndexFromBox = (box, imageSize) => {
        box = box.detection._box;
        box._y = +Number(box._y).toFixed();
        box._x = +Number(box._x).toFixed();

        let widthMiddlePoint = +Number(box.width / 2).toFixed(); // get the middle point of the box's width by dividing the height and width by 2
        let heightMiddlePoint = +Number(box.height / 2).toFixed(); // get the middle point of the box's width by dividing the height and width by 2

        let imageDataArrayIndex = ((box.y + heightMiddlePoint) * imageSize.width) + (box.x + widthMiddlePoint);// making the box into a 1D array

        imageDataArrayIndex *= 4; // multiply by 4 because each pixel has 4 values (RGBA)

        return imageDataArrayIndex;
    }
}