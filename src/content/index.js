import maskImage from "../background/masking-pipeline/maskImage.js";
import maskingPipeline from "../background/masking-pipeline/maskingPipeline.js";

const pipeline = new maskingPipeline();
pipeline.loadModel();
var n = 0;

// Set up the throttler 
const throttle = (fn, delay) => { 
  return fn();
  // Capture the current time 
  let time = Date.now(); 
 
  // Here's our logic 
  return () => { 
    if((time + delay - Date.now()) <= 0) { 
      // Run the function we've passed to our throttler, 
      // and reset the `time` variable (so we can check again). 
      fn(); 
      time = Date.now(); 
    } 
  } 
} 

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
      "img:not(.halal-processing):not(.halal-processed):not(.halal-invalid-img), image:not(.halal-processing):not(.halal-processed):not(.halal-invalid-img)"
    ) || [];


  for await (const img of getAllImgs) {
    n++;

    let imgUrl = img.src;

    if (img.tagName === "image") {
      imgUrl = img.getAttribute("xlink:href");
    }

    if (!imgUrl || isBase64Img(imgUrl)) {
      continue;
    }

    if (isInViewport(img)) {

      img.classList.add("halal-processing");

      // await new Promise(r => setTimeout(r, 1000));
      pipeline.processImage(imgUrl, isBase64Img(imgUrl), n, img).then((response)=>{
        console.log("request:response", n + ' ' + response.n);

        if (img.tagName === "image") {
          img.setAttribute("xlink:href", response.dataUrl);
        } else {
          img.src = response.dataUrl;
        }
        img.classList.add("halal-processed");
        img.classList.remove("halal-processing");
      });
    }
  }
};

document.addEventListener("scroll", throttle(replaceImages, 1000));

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
      mutation.target.classList.remove("halal-processing");
    }
  }

  throttle(replaceImages, 1000);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
});

// initially call the event
// document ready 
replaceImages();