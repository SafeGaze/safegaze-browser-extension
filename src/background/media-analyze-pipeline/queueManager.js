import analyzerClass from "./analyzer.js";

const queueManager = {

    isAnalyzing: false,
    dataQueue: [],
    analyzer: null,

    init: async function () {
        this.listenRequest();

        this.analyzer = new analyzerClass();
        await this.analyzer.init();
    },

    addToQueue: function (data) {
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
        this.isAnalyzing = true;

        let data = this.dataQueue.shift();
        let result = await this.analyzer.analyze(data);
        data.baseObject.shouldMask = result.shouldMask;
        data.baseObject.maskedUrl = result.maskedUrl;

        chrome.runtime.sendResponse(data.tabID,
            {
                action: "HVF-MEDIA-ANALYSIS-REPORT",
                payload: data
            }, (result) => {
                if (!chrome.runtime.lastError) {
                    // message processing code goes here
                } else {
                    // error handling code goes here
                }
            })
            .catch((err) => {
                sendResponse("ERROR");
            });

        this.processQueue();
    }
}

export default queueManager;