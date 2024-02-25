/*
 * Created by Mehdi with ♥ / hi@mehssi.com
 * Last modified 2/23/24, 6:31 PM
 */

/* Fetch list
list format must be like this: (Lines starting with # are considered as comments and will be removed)
#comments.
#comments.
adhost1.com
adhost2.com
adhost3.com
 */

const listUrl = 'https://blocklistproject.github.io/Lists/alt-version/ads-nl.txt';

const separator = "=================="
console.log(`\n\n${separator}\nFetching and processing: ${listUrl}\n${separator}\n`)
console.log(`It will take few minutes, so relax!`)
console.log("\n")

//fetch
fetch(listUrl)
    .then(response => {
        return response.text()
    })
    .then(body => {
        //remove comments
        let list = body.replace(/^#(.*?)$/gm, "")

        //remove empty lines
        list = list.replace(/^\s*$(?:\r\n?|\n)/gm, "")

        const listArray = list.split("\n");

        //remove hostname if the parent hostname already exist. E.g: test.blocked.com, if blocked.com exists then no need for test.blocked.com
        const formattedList = [];
        for (let currentHost of listArray) {
            currentHost = currentHost.trim();
            if (currentHost) {
                const parts = currentHost.split(".");
                const totalParts = parts.length - 1;
                let searchParts = [];
                if (totalParts >= 2) {
                    for (let i = 0; i < totalParts; i++) {
                        if (i !== 0) {
                            searchParts.push(parts.slice(i, totalParts + 1).join('.'));
                        }
                    }
                }

                if (searchParts.length === 0) {
                    console.log(`Adding hostname: ${currentHost}`);
                    formattedList.push(currentHost)
                } else {
                    let foundAnyParentPart = false;
                    for (let i = 0; i < searchParts.length; i++) {
                        if (listArray.includes(searchParts[i])) {
                            foundAnyParentPart = true;
                            break;
                        }
                    }
                    if (!foundAnyParentPart) {
                        console.log(`Adding hostname: ${currentHost}`);
                        formattedList.push(currentHost)
                    } else {
                        console.log(`Parent found, so ignoring: ${currentHost}`)
                    }
                }
            }
        }

        const separator = "=================="
        console.log(`\n\n${separator}\nTotal ad hostnames: ${formattedList.length}.\nCopy this list to: netRequestRules/ad_hosts.json\n${separator}\n`)
        console.log(JSON.stringify(formattedList))
        console.log("\n")
    })
    .catch(err => {
        console.log("Unable to fetch: ", err);
    });