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

export const getBase64FromUrl = async (url, is_base64) => {
  const data = await fetch(url);
  const blob = await data.blob();
  return new Promise((resolve) => {
    if (is_base64 === true) {
      resolve(url);
    }

    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result;
      resolve(base64data);
    };
  });
};
