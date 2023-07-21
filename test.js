urlExists = async (url) => {
    const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache'
    }).catch(() => ({ok: false}));

    return response.ok;
}

getAnnotatedMedia = async (url) => {

    let b = (relativeFilePath(url));

    if(await urlExists(b)){
        console.log("url exists");
    }

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    let raw = JSON.stringify({
        "media": [
            {
                "media_url": url,
                "media_type": "image",
                "has_attachment": false
            }
        ]
    });

    let requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    let response = await fetch("https://api.safegaze.com/api/v1/analyze", requestOptions);
    let result = await response.json();

    let a = (result.media[0].processed_media_url);
    

    console.log(a === b);

    console.log(b);
    return result;

}


relativeFilePath = (originalMediaUrl) => {
    let url = decodeURIComponent(originalMediaUrl);
    let urlParts = url.split("?");

    // Handling protocol stripped URL
    let protocolStrippedUrl = urlParts[0].replace(/http:\/\//, "").replace(/https:\/\//, "").replace(/--/g, "__").replace(/%/g, "_");

    // Handling query parameters
    let queryParams = urlParts[1] !== undefined ? urlParts[1].replace(/,/g,'_').replace(/=/g,'_').replace(/&/g,'/') : "";

    let relativeFolder = protocolStrippedUrl.split("/").slice(0, -1).join("/");
    if (queryParams.length) {
        relativeFolder = `${relativeFolder}/${queryParams}`;
    }

    // Handling file and extension
    let filenameWithExtension = protocolStrippedUrl.split("/").pop();
    let filenameParts = filenameWithExtension.split(".");
    let filename, extension;
    if (filenameParts.length >= 2) {
        filename = filenameParts.slice(0, -1).join(".");
        extension = filenameParts.pop();
    } else {
        filename = filenameParts[0].length ? filenameParts[0] : "image";
        extension = "jpg";
    }
  
    return `https://api.safegaze.com/media/annotated_image/${relativeFolder}/${filename}.${extension}`;
}

let url = "https://media.istockphoto.com/id/1289220545/photo/beautiful-woman-smiling-with-crossed-arms.jpg?s=612x612&w=0&k=20&c=qmOTkGstKj1qN0zPVWj-n28oRA6_BHQN8uVLIXg0TF8=&g=sdf";


getAnnotatedMedia(url);
// console.log(relativeFilePath(url));