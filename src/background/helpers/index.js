import maskingPipeline from '../masking-pipeline/body-masking.js';

export const processImage = (url, is_base64) => {

  return new Promise((resolve, reject) => {
    if (is_base64 === true) {
      resolve(url);
    }

    let xhRequest = new XMLHttpRequest();
    xhRequest.onload = () => {
      let reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(xhRequest.response);
    };
    xhRequest.open("GET", url);
    xhRequest.responseType = "blob";
    xhRequest.send();
  });
};

function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export const getBase64FromUrl = async (url, is_base64) => {
  const redMark = false;
  // console.log("getBase64FromUrl", url, is_base64);

  var response = await fetch(url);
  var fileBlob = await response.blob();
  var bitmap = await createImageBitmap(fileBlob);
  var canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  var context = canvas.getContext('2d');
  context.drawImage(bitmap, 0, 0);

  if(redMark === true){
    context.fillStyle = "#FF0000";
    context.fillRect(20, 20, 150, 100);
    var myData = context.getImageData(0, 0, bitmap.width, bitmap.height);  
  }else{
    await maskingPipeline(context, bitmap, canvas);
  }


  // const context = canvas.getContext('webgl');
  var blob = await canvas[
    canvas.convertToBlob 
      ? 'convertToBlob' // specs
      : 'toBlob'        // current Firefox
   ]();

  var dataUrl = await blobToBase64(blob);
  // console.log("dataUrl", dataUrl);

  return dataUrl;
};
