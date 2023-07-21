
class remoteAnalyzer {

    constructor(data) {
        this.data = data;
    }

    analyze = async () => {
        let annotatedData;

        try{
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
    }
}

export default remoteAnalyzer;