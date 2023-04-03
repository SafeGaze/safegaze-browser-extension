
export const urlToBlob = async(url) => {
  const response = await fetch(url);
  const fileBlob = await response.blob();

  return fileBlob;
};

export const blobToBase64 = (blob) => {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export const urlToBase64 = async (url) => {

  var response = await fetch(url);
  var fileBlob = await response.blob();
  var bitmap = await createImageBitmap(fileBlob);
  var canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  var context = canvas.getContext('2d');
  context.drawImage(bitmap, 0, 0);

  var blob = await canvas[
    canvas.convertToBlob 
      ? 'convertToBlob' // specs
      : 'toBlob'        // current Firefox
   ]();

  var dataUrl = await blobToBase64(blob);

  return dataUrl;
};
