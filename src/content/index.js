import maskingPipeline from "../background/masking-pipeline/maskingPipeline.js";

const maskingPipelineInstance = new maskingPipeline();
maskingPipelineInstance.loadModel();
var n = 0;

const isInViewport = function (elem) {
  const bounding = elem.getBoundingClientRect();
  return (
    bounding.top >= 0 &&
    // bounding.left >= -100 &&
    // bounding.right - 100 <=
    //   (window.innerWidth || document.documentElement.clientWidth) &&
    bounding.bottom <=
    (window.innerHeight || document.documentElement.clientHeight)
  );
};
const isBase64Img = (imgSrc) => {
  return imgSrc.startsWith("data:image/");
};

const replaceImages = async () => {
  let getAllImgs =
    document.querySelectorAll(
      "img:not(.halal-loading):not(.halal-processed):not(.halal-invalid-img), image:not(.halal-loading):not(.halal-processed):not(.halal-invalid-img)"
    ) || [];


  for await (const img of getAllImgs) {
    let imgUrl = img.src;
    const oldImg = img;
    if (img.tagName === "image") {
      imgUrl = img.getAttribute("xlink:href");
    }

    if (!imgUrl || isBase64Img(imgUrl)) {
      continue;
    }

    if (isInViewport(img)) {
      n++;
      img.classList.add("halal-loading");
      console.log(n);
      const data = await maskingPipelineInstance.processImage(imgUrl, isBase64Img(imgUrl), n, img);

      let response = data.response;
      // let img = img;
      console.log("request:response", n + ' ' + data.n);
      if (n !== data.n) {
        // return;
      }
      // let latestImgUrl = img.src;

      // if (img.tagName === "image") {
      //   latestImgUrl = img.getAttribute("xlink:href");
      // }

      if (response) {

        if (img.tagName === "image") {
          img.setAttribute("xlink:href", response);
        } else {
          img.src = response;
        }
        img.classList.add("halal-processed");
        img.classList.remove("halal-invalid-img");
      }
      if (!response) {
        img.classList.add("halal-invalid-img");
      }
      img.classList.remove("halal-loading");

      // chrome.runtime.sendMessage(
      //   {
      //     type: "processImage",
      //     imgUrl,
      //     isBase64Img: isBase64Img(imgUrl),
      //   },
      //   (response) => {
      //     let latestImgUrl = img.src;

      //     if (img.tagName === "image") {
      //       latestImgUrl = img.getAttribute("xlink:href");
      //     }

      //     if (response && latestImgUrl === imgUrl) {
      //       console.log(img, imgUrl);
      //       if (img.tagName === "image") {
      //         img.setAttribute("xlink:href", response);
      //       } else {
      //         img.src = response;
      //       }
      //       img.classList.add("halal-processed");
      //       img.classList.remove("halal-invalid-img");
      //     }
      //     if (!response) {
      //       img.classList.add("halal-invalid-img");
      //     }
      //     img.classList.remove("halal-loading");
      //   }
      // );
    }
  }
};

document.addEventListener("scroll", replaceImages);

let observer = new MutationObserver((mutationList) => {
  for (const mutation of mutationList) {
    let mutationImgUrl = mutation.target.src;

    if (mutation.target.tagName === "image") {
      mutationImgUrl = mutation.target.getAttribute("xlink:href");
    }

    if (
      mutation.type === "attributes" &&
      mutation.target.classList.contains("halal-processed") &&
      !isBase64Img(mutationImgUrl)
    ) {
      mutation.target.classList.remove("halal-processed");
      mutation.target.classList.remove("halal-loading");
    }
  }

  replaceImages();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
});
