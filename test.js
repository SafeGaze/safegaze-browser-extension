
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

    console.log(result);

        // .then(response => response.text())
        // .then(result => console.log(result))
        // .catch(error => console.log('error', error));

}

getAnnotatedMedia('https://images.prothomalo.com/prothomalo-bangla%2F2023-07%2F02802211-5ac5-4c33-9b58-1cf8a07fd395%2FRam_Rahim_1.jpg?auto=format%2Ccompress&fmt=webp&format=webp&w=640&dpr=2.0')