
class remoteAnalyzer {

    constructor(data) {
        this.data = data;
    }

    analyze = async () => {
        let annotatedData;

        try{
            let relativeFilePath = (this.relativeFilePath(this.data.mediaUrl));

            if(await this.urlExists(relativeFilePath)){
                console.log("url exists");

                return {
                    shouldMask: true,
                    maskedUrl: relativeFilePath
                };
            }
        } catch (error) {
            console.log('Error checking if url exists');
            console.log(error);
        }

        try {
            annotatedData = await this.getAnnotatedMedia(this.data.mediaUrl);
        } catch (error) {
            console.log('Error getting annotated media');
            console.log(error);
            annotatedData = {
                success: false,
            }
        }


        console.log(annotatedData);

        if (annotatedData.success === false || annotatedData.media.length <= 0 || annotatedData.media[0].success === false) {
            return {
                shouldMask: false,
                maskedUrl: null,
                invalidMedia: true
            };
        }

        let maskedUrl = annotatedData.media[0].processed_media_url;


        return {
            shouldMask: true,
            maskedUrl: maskedUrl
        };

    };

    getAnnotatedMedia = async (url) => {
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

        return result;
    };

    urlExists = async (url) => {
        const response = await fetch(url, {
            method: 'HEAD',
            cache: 'no-cache'
        }).catch(() => ({ ok: false }));

        return response.ok;
    };


    relativeFilePath = (originalMediaUrl) => {
        let url = decodeURIComponent(originalMediaUrl);
        let urlParts = url.split("?");

        // Handling protocol stripped URL
        let protocolStrippedUrl = urlParts[0].replace(/http:\/\//, "").replace(/https:\/\//, "").replace(/--/g, "__").replace(/%/g, "_");

        // Handling query parameters
        let queryParams = urlParts[1] !== undefined ? urlParts[1].replace(/,/g, '_').replace(/=/g, '_').replace(/&/g, '/') : "";

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

}

export default remoteAnalyzer;