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

    addToQueue: async function (data) {
        console.log('addToQueue', data.baseObject.domObjectIndex);
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
        // console.log("processQueue", this.dataQueue.length);

        if (this.dataQueue.length <= 0) {
            this.isAnalyzing = false;
            return;
        }
        this.isAnalyzing = true;

        let data = this.dataQueue.shift();
        let result = await this.analyzer.analyze(data);

        console.log('addToQueue', data.baseObject.domObjectIndex, data.mediaUrl, result);

        if(result === null) {

            this.processQueue();
            return;
        }

        data.shouldMask = result.shouldMask;
        data.maskedUrl = result.maskedUrl;

        chrome.tabs.sendMessage(data.tabID,
            {
                action: "HVF-MEDIA-ANALYSIS-REPORT",
                payload: data
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