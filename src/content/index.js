// Get browser API
const browser = chrome || browser;

// 
const haram = {

  // Initialize the extension
  init: function () {
    setInterval(() => {
      this.sendMedia();
    }, 1000);
    
    this.receiveMedia();
  },

  // Send media to the background script
  sendMedia: function () {
    // Get all media
    // currently supports images only
    let media = document.document.querySelector('img, image');
    for (let i = 0; i < media.length; i++) {
       // looking for new images only
       // matching hvf-analyzing and hvf-analyzed classes
      if(media[i].classList.contains("hvf-analyz")) continue;

      // add class to mark image as being analyzing
      media[i].classList.add("hvf-analyzing");

      // Get image url and src attribute
      let url = media[i].src;
      let srcAttr = 'src';
      if (!url || url.length === 0) {
        url = media[i].getAttribute('xlink:href');
        srcAttr = 'xlink:href';
      }

      if (url && url.length > 0) {
      

        browser.runtime.sendMessage({
          action: 'HVF-MEDIA-ANALYSIS-REQUEST',
          payload: { 
            mediaUrl: url,
            mediaType: 'image',
            returnObject:{
              originalUrl: url,
              domObject: media[i],
              srcAttr: srcAttr,
              shouldMask: false
            }
           },
        }, (result) => {
          if (!chrome.runtime.lastError) {
             // message processing code goes here
          } else {
            // error handling code goes here
          }
        });


      }
    }
  },

  // Receive media from the background script
  receiveMedia: function () {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message && message.action === 'HVF-MEDIA-ANALYSIS-REPORT') {

        let media = message.payload.returnObject.domObject;
        let srcAttr = message.payload.returnObject.srcAttr;
        let originalUrl = message.payload.returnObject.originalUrl;

        if (message.payload.shouldMask && message.payload.maskedUrl) {
          media.classList.add("hvf-masked");
          media.setAttribute(srcAttr, message.payload.maskedUrl);
          media.setAttribute("data-hvf-original-url", originalUrl);
        }

        media.classList.add("hvf-analyzed");
        media.classList.remove("hvf-analyzing");

      }
    });
  },

  addListener__old: function () {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // console.log(message);
      if (message && message.action === 'HARAM-IMAGE-ANALYSIS-REPORT') {
        console.log('message received', message.payload.url);
        let url = message.payload.url;
        if (this.data.hasOwnProperty(url) && this.data[url].analyzed) return;
        this.data[url] = {
          analyzed: true,
          processed: false,
          block: message.payload.block,
          maskedUrl: message.payload.maskedUrl
        };
        // console.log(this.data[url]);
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => { this.updatePageImages(); }, 100);
      }
    });
    window.addEventListener('load', () => {
      setInterval(() => {
        this.updatePageImages();
      }, 1000);
      this.updatePageImages();
    }, false);
  },

  updatePageImages: function () {
    // Get all images
    let images = document.getElementsByTagName('img image');
    // For each image
    for (let i = 0; i < images.length; i++) {
      if(images[i].classList.contains("haram-filter-processed")) continue;

      // Get image url
      let srcAttr = 'src';
      let url = images[i].src;
      if (!url || url.length === 0) {
        url = images[i].getAttribute('xlink:href');
        srcAttr = 'xlink:href';
      }
      // If url not empty
      if (url && url.length > 0) {
        // If we have handled the image
        if (this.data.hasOwnProperty(url) && !this.data[url].processed) {
          console.log(this.data[url])
          // If image should be blocked
          if (this.data[url].block) {
            images[i].classList.add("haram-filter-blocked");
          }
          // If image should be masked
          if (this.data[url].maskedUrl) {
            images[i][srcAttr] = this.data[url].maskedUrl;

            // Reset data for memory freeing
            this.data[url].maskedUrl = null;
            images[i].classList.add("haram-filter-masked");
            console.log('image processed', this.data[url]);
            images[i].classList.remove("haram-filter-analyzing");
            images[i].classList.add("haram-filter-processed");
            this.data[url].processed = true;
          }
        }

        // Send image for analysis
        if(!this.data.hasOwnProperty(url) ) {

          // Log image
          this.data[url] = { analyzed: false, processed: false };
          // Display as analyzing
          images[i].classList.add("haram-filter-analyzing");
          // Send image to the backend
          browser.runtime.sendMessage({
            action: 'HARAM-IMAGE-FOR-ANALYSIS',
            payload: { url: url },
          }, (result) => {
            if (!chrome.runtime.lastError) {
               // message processing code goes here
            } else {
              // error handling code goes here
            }
          });
        }
      }
    }
  }
};

haram.init();