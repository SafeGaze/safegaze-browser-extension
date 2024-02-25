/*
 * Created by Mehdi with ♥ / hi@mehssi.com
 * Last modified 2/21/24, 12:21 AM
 */

//this is needed as to check if newer websites are blocked.
// Storage is only cleared on browser restart.

chrome.runtime.onStartup.addListener( () => {
    chrome.storage.local.clear();
});