export const spreadURL = (option, link) => {

    var urlStart = /.+?:\/\/[^\s]+\/\S+\./;
    var urlEnd = /\w+$/
    var gfycat2 = /gfycat/
    var albumRegex = /[^ht][^/\/\imgur.co][^a\/]\w+(?!\w)/
    var galleryRegex = /[^ht][^/\/\imgur.co][^gallery\/]\w+(?!\w)/


    let regexEnd = link.match(urlEnd);
    let regexStart = link.match(urlStart);
    let gfycat = link.match(gfycat2);
    let album = /imgur.com\/a\//.test(link);
    let gallery = /imgur.com\/gallery\//.test(link);
    let albumLinkParser = link.match(albumRegex);
    let galleryParser = link.match(galleryRegex);

    if (regexEnd === null) {

    }

    switch (option) {
        case "end":
            return regexEnd[0];
        case "start":
            return regexStart[0];
        case "gallery":
            return gallery;
        case "album":
            return album;
        case "gfycat":
            return gfycat;
        case "albumRegex":
            return albumLinkParser;
        case "galleryRegex":
            return galleryParser;
        default:
            break;
    }
}