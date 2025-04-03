import * as utils from './utils.js';

let highlightName = '';
// initialize the player
export function initMediaOverlay(spineItem, highlight, onAudioEnded) {
    let vtt = spineItem.mediaOverlays.find(mo => mo.mediaType == 'text/vtt');
    let audio = spineItem.mediaOverlays.find(mo => mo.mediaType == 'audio/mp4');
    let audioBegin = audio.url.split("t=")[1]?.split(",")[0];
    let audioEnd = audio.url.split("t=")[1]?.split(",")[1];
    highlightName = highlight;
    clearOldAudios();
    let audioElm = createAudio(audio, vtt);
    // listen for the end of the clip
    audioElm.addEventListener("timeupdate", e => {     
        if (e.target.currentTime >= parseInt(audioEnd)) {
            audioElm.pause();
            onAudioEnded();
        }
    });
}
export function repositionPlayback(targetElement) {
    let id = targetElement.id;
    let trackElm = document.querySelector('track');
    let cue = Array.from(trackElm.track.cues).find(c => {
        let cueMetadata = JSON.parse(c.text);
        return cueMetadata.selector.value == id;
    });
    if (cue) {
        let audioElm = document.querySelector('audio');
        // this is a very simple way of matching from document to cues list
        audioElm.currentTime = cue.startTime;
        audioElm.play();
    }
}
function clearOldAudios() {
    let audioElms = document.querySelectorAll('audio');
    for (let audioElm of audioElms) {
        audioElm.remove();
    }
}

// create an audio element with a vtt track attached to it
function createAudio(audio, vtt) {
    let audioElm = document.createElement('audio');
    audioElm.src = audio.url;
    audioElm.controls = false;

    let trackElm = document.createElement('track');
    trackElm.src = vtt.url;
    trackElm.kind = 'metadata';
    trackElm.default = true;
    // listen for cues from the track, this is how we control the highlight
    trackElm.track.addEventListener("cuechange", onCueChange);
    audioElm.appendChild(trackElm);
    
    document.querySelector('body').appendChild(audioElm);
    return audioElm;
}

// handle a cue change by moving the highlight to a new range
function onCueChange(e) {
    let activeCues = Array.from(e.target.activeCues);
    if (activeCues.length > 0) {
        // for simplicity in this example, we are just working with one cue at a time, and it's the last one
        let activeCue = activeCues[activeCues.length - 1];
        let cueMetadata = JSON.parse(activeCue.text);
        let iframe = document.querySelector('iframe');
        let elm = utils.select(cueMetadata.selector, iframe.contentDocument);
        if (elm) {
            // make a highlight
            let range = utils.createRange(cueMetadata.selector, iframe.contentDocument);
            let highlight = new Highlight(range);
            iframe.contentWindow.CSS.highlights.set(highlightName, highlight);
            if (!utils.isInViewport(elm, iframe.contentDocument)) {
                elm.scrollIntoView();
            }
        }
    }
}
