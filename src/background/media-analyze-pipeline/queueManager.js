import analyzerClass from "./analyzer.js";

const queueManager = {

    isAnalyzing: false,
    dataQueue: [],
    analyzer: null,
    modelLoaded: false,

    init: async function () {
        this.listenRequest();

        this.analyzer = new analyzerClass();
        this.modelLoaded = await this.analyzer.init();
    },

    addToQueue: async function (data) {
        this.dataQueue.push(data);
        if (!this.isAnalyzing) {
            this.processQueue();
        }
    },

    listenRequest: function () {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === "HVF-MEDIA-ANALYSIS-REQUEST") {
                this.addToQueue({ tabID: sender.tab.id, ...request.payload });
            }
        });
    },

    processQueue: async function () {

        if (this.dataQueue.length <= 0) {
            this.isAnalyzing = false;
            return;
        }

        if(!this.modelLoaded) {
            await new Promise(r => setTimeout(r, 2000));
            this.processQueue();
            return;
        }

        this.isAnalyzing = true;

        let data = this.dataQueue.shift();
        let result = await this.analyzer.analyze(data);


        if(result === null) {
            this.processQueue();
            return;
        }

        chrome.tabs.sendMessage(data.tabID,
            {
                action: "HVF-MEDIA-ANALYSIS-REPORT",
                payload: Object.assign(data, result)
            }, (result) => {
                if (!chrome.runtime.lastError) {
                    // message processing code goes here
                } else {
                    // error handling code goes here
                }
            }
        );

        this.processQueue();
    }
}

export default queueManager;