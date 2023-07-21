import analyzerClass from "./remoteAnalyzer.js";

const queueManager = {

    isAnalyzing: false,
    dataQueue: [],
    analyzer: null,
    overloadTimeout: null,

    init: async function () {
        this.listenRequest();
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

    getActiveTabId: async function () {
        let queryOptions = { active: true, currentWindow: true };
        let [tab] = await chrome.tabs.query(queryOptions);
        return tab?.id || 0;
    },

    getAllTabIds: async function () {
        let queryOptions = {  };
        let tabs = await chrome.tabs.query(queryOptions);
        return tabs.map(tab => tab.id);
    },

    processQueue: async function () {

        if (this.dataQueue.length <= 0) {
            this.isAnalyzing = false;
            return;
        }

        // reset the overload timeout
        this.overloadTimeout = 10;

        // wait 500ms to avoid overloading the browser
        await new Promise(r => setTimeout(r, this.overloadTimeout));

        this.isAnalyzing = true;
        let data = this.dataQueue.shift();
        // console.log({data, dataQueue: this.dataQueue});
        
        if(typeof data === "undefined") {
            this.isAnalyzing = false;
            return;
        }
        
        // if the tab is not active and within current window
        const activeTabId = await this.getActiveTabId();

        if(data.tabID !== activeTabId) {
            // console.log("tab is not active", { tabId: data.tabID, activeTabId});
            // if the tab is not active and within current window
            // add this data to the end of the queue
            let allTabIds = await this.getAllTabIds();

            // console.log({allTabIds, tabId: data.tabID});

            if(allTabIds.includes(data.tabID)){
                // console.log("tab is in current window", { tabId: data.tabID, allTabIds});
                this.dataQueue.push(data);
            }

            // decrease the overload timeout
            this.overloadTimeout = 10;

            // skip the analysis
            this.processQueue(); 
            return;
        }

        let analyzer = new analyzerClass(data);
        let result = null;

        analyzer.analyze().then((res) => {
            console.log("Media analysis complete");
            console.log(res);

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
        }).catch((err) => {
            console.log("Error analyzing media");
            console.log(err);
            this.processQueue();
        });
    }
}

export default queueManager;