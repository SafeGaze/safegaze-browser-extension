/*
 * Created by Mehdi with ♥ / hi@mehssi.com
 * Last modified 2/21/24, 3:28 AM
 */

/**********
 CONFIG
 **********/

const debug = true; //logging

const apiUrls = {
  //we need separate api urls for https/http because if a request is made to http website, we can not send ajax request to https and vice versa.
  hostnamesCheck: {
    forHttpsRequests:
      "https://api.kahfdns.com/checkHosts?hostnames[]=##hostname##", //##hostname## will be replaced by hostname.
    forHttpRequests:
      "http://128.199.74.86/api/checkHosts?hostnames[]=##hostname##", //##hostname## will be replaced by hostname.
  },

  totalBlacklistHosts: {
    forHttpsRequests: "https://api.kahfdns.com/totalBlacklistHosts",
    forHttpRequests: "http://188.166.216.127/api/totalBlacklistHosts", //##hostname## will be replaced by hostname.
  },
};

const logPrefix = "(KahfDNS Extension): ";
const timeoutInSeconds = 5; //page is immediately processed (shown without blocking) after this.
const storageKeyName = "request-##hostname##"; //##hostname## will be replaced by hostname.

const blockedPageIntercept = {
  location: "https://blocked.kahfdns.com/b/##hostname##", //##hostname## will be replaced by hostname.
};

const checkPageIntercept = {
  hostname: "check.kahfdns.com",
  title: "✓ KahfDNS is activated on this Browser.",
  html: "checkSuccessPage/index.html",
  css: "checkSuccessPage/main.css",
  favicon: "checkSuccessPage/favicon.ico",
};

/**********
 END CONFIG
 **********/

const hostname = location.hostname;
const isHttps = location.protocol === "https:";

//intercept check.kahfdns.com.
// since we're not using dns servers directly, check.kahfdns.com will return false, but we can intercept and show `success` page.

chrome.runtime
  .sendMessage({
    type: "getSettings",
    settingsKey: "kafh-dns",
  })
  .then((value) => {
    if (value) {
      if (hostname === checkPageIntercept.hostname) {
        showCheckSuccessPage(isHttps);
      } else {
        logOnlyInDebug(`Starting to check: ${hostname}`);
        document.documentElement.style.visibility = "hidden";

        check(hostname, isHttps)
          .then((result) => {
            logOnlyInDebug(`Check Result: ${result}`);

            if (!result) {
              showUnblockedPage();
            } else {
              showBlockedPage(hostname);
            }
          })
          .catch((e) => {
            console.error(logPrefix);
            console.error(e);

            //show unblocked page if there is an error.
            showUnblockedPage();
          });
      }
    }
  });

async function showCheckSuccessPage(isHttps) {
  logOnlyInDebug(`Showing check page: ${checkPageIntercept.hostname}`);

  //load
  const urls = {
    html: chrome.runtime.getURL(checkPageIntercept.html),
    css: chrome.runtime.getURL(checkPageIntercept.css),
    favicon: chrome.runtime.getURL(checkPageIntercept.favicon),
  };

  document.open();
  document.write(await (await fetch(urls.html)).text());
  document.title = checkPageIntercept.title;
  document.head.innerHTML += `<link rel="stylesheet" href="${urls.css}" type="text/css" />`;
  document.getElementById("favicon").href = urls.favicon;
  document.close();

  document.documentElement.style.visibility = "visible";

  //get total blacklist hosts
  let apiUrl = apiUrls.totalBlacklistHosts.forHttpsRequests;
  if (!isHttps) {
    apiUrl = apiUrls.totalBlacklistHosts.forHttpRequests;
  }

  const response = await fetchWithTimeout(
    apiUrl,
    null,
    timeoutInSeconds * 1000
  );
  const responseJson = await response.json();
  document.getElementById("labelTotalBlacklistHosts").innerHTML =
    responseJson.total;
  document.getElementById("labelBlacklistHostsLastUpdated").innerHTML =
    responseJson.lastUpdated;
  document.getElementById("labelTotalText").style.display = "block";
}

function showUnblockedPage() {
  logOnlyInDebug("Showing unblocked page. (original website)");

  document.documentElement.style.visibility = "visible";
}

async function showBlockedPage(hostname) {
  logOnlyInDebug(`Showing blocked page: ${hostname}`);

  document.write("");
  document.close();

  //redirect
  window.location = blockedPageIntercept.location.replace(
    "##hostname##",
    hostname
  );
}

/**
 * @param {string} hostname
 * @param {boolean} isHttps
 * @returns {Promise<boolean>}
 */
async function check(hostname, isHttps) {
  logOnlyInDebug(`Checking: ${hostname}`);

  //check in storage first for faster responses.
  const storageKeyNameFormatted = storageKeyName.replace(
    "##hostname##",
    hostname
  );
  const cacheResults = await chrome.storage.local.get([
    storageKeyNameFormatted,
  ]);
  const cacheResult = cacheResults?.[storageKeyNameFormatted];
  if (typeof cacheResult !== "undefined") {
    //found in cache, so no need to check again
    logOnlyInDebug(
      `Found in storage: ${cacheResult ? "Blocked" : "Not blocked"}`
    );
    return cacheResult;
  } else {
    //not found in cache, let's check through api.
    logOnlyInDebug(`Not Found in storage. Checking through API.`);

    //prepare api request
    let apiUrl = apiUrls.hostnamesCheck.forHttpsRequests;
    if (!isHttps) {
      apiUrl = apiUrls.hostnamesCheck.forHttpRequests;
    }

    const apiUrlFormatted = apiUrl.replace("##hostname##", hostname);
    logOnlyInDebug(
      `isHttps: ${isHttps ? "Yes" : "No"}, api ${apiUrlFormatted}`
    );

    //send api request
    const response = await fetchWithTimeout(
      apiUrlFormatted,
      null,
      timeoutInSeconds * 1000
    );
    const responseJson = await response.json();

    //check result
    const result = responseJson?.results?.[hostname];

    if (debug) {
      console.log(
        `${logPrefix}Response: ${JSON.stringify(responseJson)}, result: ${
          result ? "Blocked" : "Not blocked"
        }`
      );
    }

    //store in storage, for faster responses.
    try {
      chrome.storage.local.set({ [storageKeyNameFormatted]: result });
    } catch (e) {
      console.log(e);
    }

    return result;
  }
}

function logOnlyInDebug(message) {
  if (debug) {
    console.log(`${logPrefix}${message}`);
  }
}

function fetchWithTimeout(url, options, timeout) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeout)
    ),
  ]);
}
