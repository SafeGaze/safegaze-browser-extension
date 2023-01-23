const isInViewport = function (elem) {
  const bounding = elem.getBoundingClientRect();
  return (
    bounding.top <=
    (window.innerHeight || document.documentElement.clientHeight)
  );
};
const isBase64Img = (imgSrc) => {
  return imgSrc.startsWith("data:image/");
};

const replaceImages = () => {
  const getAllImgs = document.getElementsByTagName("img") || [];

  for (const img of getAllImgs) {
    const imgUrl = img.src;
    if (isInViewport(img)) {
      chrome.runtime.sendMessage(
        {
          type: "processImage",
          imgUrl,
          isBase64Img: isBase64Img(imgUrl),
        },
        (response) => {
          img.src = response;
          img.classList.add("added-masking");
        }
      );
    } else {
      break;
    }
  }
};

replaceImages();
