function isInViewport(elm) {
    let bounding = elm.getBoundingClientRect();
    let doc = elm.ownerDocument;
    return (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.bottom <= (doc.defaultView.innerHeight || doc.documentElement.clientHeight) &&
        bounding.right <= (doc.defaultView.innerWidth || doc.documentElement.clientWidth)
    );
}

// Supports FragmentSelector and CssSelector optionally with TextPositionSelector as its refinedBy
function createRange(selector, doc) {
    let sel = selector.type == "FragmentSelector" ? 
        `#${selector.value}` : selector.value;
    let node = doc.querySelector(sel);
    let startOffset = 0;
    let endOffset = 0;
    if (selector.hasOwnProperty('refinedBy')) {
        startOffset = rangeSelector.refinedBy.start;
        endOffset = rangeSelector.refinedBy.end;
        
        return new StaticRange({
            startContainer: node.firstChild,
            startOffset,
            endContainer: node.firstChild,
            endOffset: endOffset + 1
        });
    }
    
    return new StaticRange({
        startContainer: node,
        startOffset: 0,
        endContainer: node.nextSibling,
        endOffset: 0
    });
}
function select(selector, doc) {
    if (selector.type == "FragmentSelector") {
        return doc.querySelector(`#${selector.value}`);
    }
    else if (selector.type == "CssSelector") {
        return doc.querySelector(selector.value);
    }
    else return null;
}




export { createRange, select, isInViewport };