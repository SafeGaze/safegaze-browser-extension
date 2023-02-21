// Get browser API
const browser = chrome || browser;

// 
const haram = {

  // Initialize the extension
  init: function () {
    this.updateTimeout = null;
    this.data = {};
    this.addListener();

    // Add style on page
    window.addEventListener('DOMContentLoaded', () => {
      return;
      // Add svg
      let filters = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      filters.setAttribute('style', 'position: absolute; top: -99999px');
      // Red : data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAALAgMAAAAcrnVjAAAACVBMVEUAAAD/AAD///9nGWQeAAAAAWJLR0QAiAUdSAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+MEFhUCN0yQyxkAAAA8SURBVAjXY1gFBgsYpoaCQALDLDA/gWHGooYGpUUgWqtrEYhWaupapASkm1Y0LGgCiTOBxWHqYfqh5gEA5x4oFe15PC8AAAAASUVORK5CYII=
      // Black : data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAALAQMAAABbDg+zAAAABlBMVEUAAAD///+l2Z/dAAAAAWJLR0QAiAUdSAAAAAlwSFlzAAALEwAACxMBAJqcGAAAADRJREFUCNdj+P///wGGBgYGB4b9//87MKztiAUS1XcdGJbOvurAsPLFSSBX+i5UFqwOpAMAyvIZ4LH0uDMAAAAASUVORK5CYII=
      filters.innerHTML = '\
				<filter id="haram-filter-blocked" x="0" y="0">\
					<feGaussianBlur in="SourceGraphic" stdDeviation="25" result="blur"/>\
					<feImage xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAALAgMAAAAcrnVjAAAACVBMVEUAAAD/AAD///9nGWQeAAAAAWJLR0QAiAUdSAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+MEFhUCN0yQyxkAAAA8SURBVAjXY1gFBgsYpoaCQALDLDA/gWHGooYGpUUgWqtrEYhWaupapASkm1Y0LGgCiTOBxWHqYfqh5gEA5x4oFe15PC8AAAAASUVORK5CYII=" x="20" y="20" width="26" height="11" result="logo"/>\
					<feMerge x="0%" y="0%" result="result">\
						<feMergeNode in="blur"/>\
						<feMergeNode in="logo"/>\
					</feMerge>\
				</filter>\
				<filter id="haram-filter-analyzing" x="0" y="0">\
					<feGaussianBlur in="SourceGraphic" stdDeviation="25" result="blur"/>\
					<feImage xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADcAAAALAQMAAADhrYfTAAAABlBMVEUAAAD///+l2Z/dAAAAAWJLR0QAiAUdSAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAENJREFUCNdj+A8G/xgaGECAiWE/mP+LYXPO3Qvdzr8Y1mbHXr8dD6S143bfDP7FsNAjvvZWNEjcuaDbaRVcPUw/1DwAd5swvnCFq9QAAAAASUVORK5CYII=" x="20" y="20" width="55" height="11" result="logo"/>\
					<feMerge x="0%" y="0%" result="result">\
						<feMergeNode in="blur"/>\
						<feMergeNode in="logo"/>\
					</feMerge>\
				</filter>\
			';
      document.head.appendChild(filters);

      let style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = "\
				.haram-filter-blocked  {\
					filter: url(#haram-filter-blocked);\
				}\
				.haram-filter-analyzing  {\
					filter: url(#haram-filter-analyzing);\
				}\
			";
      document.head.appendChild(style);
    }, false);
  },

  addListener: function () {
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