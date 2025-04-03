/* 
Package
    spine = [ContentDocument]
    metadata = [Metadata]

ContentDocument 
    url
    mediaType
    mediaOverlays = [MediaOverlay]

MediaOverlay
    url
    mediaType

Metadata
    name
    value
*/

// given a url, return a Package object
export async function parsePackage(spineUrl) {
    // fetch the package document and parse as xml
    let spine = await fetch(spineUrl);
    let text = await spine.text();
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(text, "application/xml");
    let spineItems = getSpineItems(xmlDoc, spineUrl);
    let metadata = getMetadata(xmlDoc);
    return {
        spineItems,
        metadata
    };
}
function getSpineItems(xmlDoc, spineUrl) {
    let spineItems = [];
    // get the spine itemrefs and iterate through them
    let itemrefResult = xpathQuery("//opf:itemref[@linear='yes']/@idref", xmlDoc);
    let idref = itemrefResult.iterateNext()?.value;
    while (idref) {
        // find the corresponding item and create a ContentDocument object for it
        let itemResult = xpathQuery(`//opf:item[@id="${idref}"]`, xmlDoc);
        let item = itemResult.iterateNext();
        let contentDocument = {
            url: new URL(item.getAttribute('href'), spineUrl).href,
            mediaType: item.getAttribute('media-type')
        };
        // if it has media overlays, look up each one (there could be several formats on one spine item)
        let moIdrefs = item.getAttribute('media-overlay').split(' ');
        let moDocuments = moIdrefs.map (moIdref => {
            let moResult = xpathQuery(`//opf:item[@id="${moIdref}"]`, xmlDoc);
            let moItem = moResult.iterateNext();
            return {
                url: new URL(moItem.getAttribute('href'), spineUrl).href,
                mediaType: moItem.getAttribute('media-type'),
            };
        }).filter(moDoc => moDoc != null);
        contentDocument.mediaOverlays = moDocuments;
        spineItems.push(contentDocument);
        idref = itemrefResult.iterateNext()?.value;
    }
    return spineItems;    
}
function getMetadata(xmlDoc) {
    // get meta element's property, refines, value 
    let metaResult = xpathQuery("//opf:meta", xmlDoc);
    let meta = metaResult.iterateNext();
    let metadata = [];
    while (meta) {
        let property = meta.getAttribute('property');
        let refines = meta.getAttribute('refines');
        let value = meta.textContent;
        metadata.push({property, refines, value});
        meta = metaResult.iterateNext();
    }
    return metadata;
}
function xpathQuery(expression, doc) {
    return doc.evaluate(
        expression,
        doc,
        nsResolver,
        XPathResult.ANY_TYPE,
        null,
    );
}
function nsResolver(prefix) {
    const ns = {
        xhtml: "http://www.w3.org/1999/xhtml",
        mathml: "http://www.w3.org/1998/Math/MathML",
        html: 'http://www.w3.org/1999/xhtml',
        epub: "http://www.idpf.org/2007/ops",
        dc: "http://purl.org/dc/elements/1.1/",
        opf: "http://www.idpf.org/2007/opf",
        smil: "http://www.w3.org/ns/SMIL",
    };
    return ns[prefix] || null;
  }
