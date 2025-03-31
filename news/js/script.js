// Elements
BottomBar = document.getElementById("bottom-bar");
CurrentVideo = document.getElementById("current-video");
FullscreenButton = document.getElementById("fullscreen-button");
NextVideo = document.getElementById("next-video");
PlayButtonIcon = document.getElementById("play-button-icon");
VideoBarFill = document.getElementById("video-bar-fill");
VideoBarTextLeft = document.getElementById("video-bar-text-left");
VideoBarTextRight = document.getElementById("video-bar-text-right");
VideoWrapper = document.getElementById("video-wrapper");
VolumeButton = document.getElementById("volume-button");
VolumeSlider = document.getElementById("volume-slider");
VolumeSliderInput = document.getElementById("volume-slider-input");

// Variables
BottomBarAutoHideDuration = 3000;
BottomBarHideTime = Number.MAX_SAFE_INTEGER;
ForceBarVisibility = false;
SegmentNumber = 0;
VideoBarDragging = false;
VideoDuration = parseInt(VideoWrapper.dataset.duration);
VideoID = VideoWrapper.dataset.videoid;

// Load video
if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    CurrentVideo.autoplay = true;
}
VideoBarTextLeft.innerHTML = ToMMSS(0);
VideoBarTextRight.innerHTML = ToMMSS(0 - VideoDuration);
PreloadVideo("video/" + VideoID + "-0.webm");
LoadVideo();
PreloadVideo("video/" + VideoID + "-1.webm");


// FREAK SAFARI
if (navigator.userAgent.indexOf("Safari") != -1) {
    document.getElementById("freak-safari").style = "";
}


// Video bar
setInterval(() => {
    if (!CurrentVideo.paused) {
        VideoBarFill.animate({
            width: (100 * (((120 * SegmentNumber) + CurrentVideo.currentTime) / VideoDuration)) + "%"
        }, {duration: 100, fill: "forwards"});
        VideoBarTextLeft.innerHTML = ToMMSS((120 * SegmentNumber) + CurrentVideo.currentTime);
        VideoBarTextRight.innerHTML = ToMMSS((120 * SegmentNumber) + CurrentVideo.currentTime - VideoDuration);
        if ((CurrentVideo.duration - CurrentVideo.currentTime) < 0.1) {
            PlayNextSegment();
        }
    }
    if (BottomBarHideTime < new Date().getTime() && !ForceBarVisibility) {
        BottomBar.classList.remove("active");
    }
}, 100);
VideoBarFill.parentNode.addEventListener("mousedown", (event) => {
    VideoBarSeek(event.clientX);
    VideoBarDragging = true
})
document.addEventListener("mousemove", (event) => {
    if (VideoBarDragging) {
        VideoBarSeek(event.clientX);
    }
})
document.addEventListener("mouseup", (event) => {
    VideoBarDragging = false
    if (!PlayButtonIcon.classList.contains("paused")) {
        CurrentVideo.play();
    }
})
VideoBarFill.parentNode.addEventListener("touchstart", (event) => {
    VideoBarSeek(event.touches[0].clientX);
})
VideoBarFill.parentNode.addEventListener("touchmove", (event) => {
    VideoBarSeek(event.touches[0].clientX);
})
VideoBarFill.parentNode.addEventListener("touchend", (event) => {
    if (!PlayButtonIcon.classList.contains("paused")) {
        CurrentVideo.play();
    }
})
VolumeSliderInput.value = CurrentVideo.volume;
VolumeSliderInput.oninput = () => {
    CurrentVideo.volume = VolumeSliderInput.value;
    BottomBarHideTime = new Date().getTime() + BottomBarAutoHideDuration;
}
VolumeButton.onclick = () => {
    if (VolumeSlider.classList.contains("active")) {
        VolumeSlider.classList.remove("active");
    }
    else {
        VolumeSlider.classList.add("active");
    }
    BottomBarHideTime = new Date().getTime() + BottomBarAutoHideDuration;
}
document.onclick = (event) => {
    BottomBarHideTime = new Date().getTime() + BottomBarAutoHideDuration;
    ToggleBottomBar(event);
}
BottomBar.onclick = (event) => {
    event.stopPropagation();
}
BottomBar.onmouseover = () => {
    ForceBarVisibility = true;
}
BottomBar.onmouseleave = () => {
    ForceBarVisibility = false;
}


// Keybinds
document.onkeydown = (event) => {
    if (event.key == "ArrowRight") {
        VideoJump(10);
    }
    else if (event.key == "ArrowLeft") {
        VideoJump(-10);
    }
    else if (event.key == " " || event.key.toLowerCase() == "p") {
        VideoPlayPause();
    }
}


// Functions
function LoadVideo() {
    CurrentVideo.id = "next-video";
    NextVideo.id = "current-video";
    CurrentVideo = document.getElementById("current-video");
    NextVideo = document.getElementById("next-video");
    VideoWrapper.querySelector("div").insertBefore(NextVideo, CurrentVideo);
}

function PlayNextSegment() {
    console.log(SegmentNumber, parseInt(VideoWrapper.dataset.segments));
    if (SegmentNumber + 1 >= VideoWrapper.dataset.segments) {
        return;
    }
    LoadVideo();
    if (SegmentNumber + 2 < parseInt(VideoWrapper.dataset.segments)) {
        PreloadVideo(CurrentVideo.src.substring(0, CurrentVideo.src.indexOf("-") + 1) + (parseInt(CurrentVideo.src.substring(CurrentVideo.src.indexOf("-") + 1)) + 1) + ".webm");
    }
    SegmentNumber++;
    CurrentVideo.play();
}

function PreloadVideo(src) {
    NextVideo.src = src;
}

function ToggleBottomBar() {
    if (BottomBar.classList.contains("active")) {
        BottomBar.classList.remove("active");
    }
    else {
        BottomBar.classList.add("active");
    }
}

function ToggleVideoFullscreen() {
    if (FullscreenButton.classList.contains("active")) {
        FullscreenButton.classList.remove("active");
        document.body.requestFullscreen();
        document.exitFullscreen();
    }
    else {
        FullscreenButton.classList.add("active");
        document.body.requestFullscreen();
    }
}

function ToMMSS(n) {
    if (n < 0) {
        n = -n;
        sign = "-";
    }
    else {
        sign = "";
    }
    nmod = Math.round(n);
    mins = Math.floor(nmod / 60);
    nmod -= (mins * 60);
    mins = mins.toString();
    secs = nmod.toString();
    if (secs.length == 1) {
        secs = "0" + secs;
    }
    return(sign + mins + ":" + secs);
}

function VideoBarSeek(clientX) {
    BottomBarHideTime = new Date().getTime() + BottomBarAutoHideDuration;
    rect = VideoBarFill.parentNode.getBoundingClientRect();
    left = rect.left - (parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.125);
    width = rect.width - (parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.25);
    if (clientX < left) {
        clientX = left;
    }
    if (clientX > (left + width)) {
        clientX = (left + width)
    }
    VideoBarFill.animate({
        width: (100 * (clientX - left) / width) + "%"
    }, {duration: 100, fill: "forwards"});
    time = VideoDuration * (clientX - left) / width;
    VideoSeek(time);
}

function VideoJump(sec) {
    BottomBar.classList.add("active");
    BottomBarHideTime = new Date().getTime() + BottomBarAutoHideDuration;
    VideoSeek((120 * SegmentNumber) + CurrentVideo.currentTime + sec);
    if (!PlayButtonIcon.classList.contains("paused")) {
        CurrentVideo.play();
    }
}

function VideoPlayPause() {
    if (CurrentVideo.paused) {
        CurrentVideo.play();
        PlayButtonIcon.classList.remove("paused");
    }
    else {        
        CurrentVideo.pause();
        PlayButtonIcon.classList.add("paused");
    }
    BottomBarHideTime = new Date().getTime() + BottomBarAutoHideDuration;
}

function VideoSeek(time) {
    SegmentNumber = Math.floor(time / 120);
    VideoSource = "video/" + VideoID + "-" + SegmentNumber + ".webm"
    if (!CurrentVideo.src.endsWith(VideoSource)) {
        CurrentVideo.src = VideoSource;
        if (SegmentNumber + 2 < parseInt(VideoWrapper.dataset.segments)) {
            PreloadVideo(CurrentVideo.src.substring(0, CurrentVideo.src.indexOf("-") + 1) + (parseInt(CurrentVideo.src.substring(CurrentVideo.src.indexOf("-") + 1)) + 1) + ".webm");
        }
    }
    CurrentVideo.currentTime = time - (120 * SegmentNumber);
    VideoBarTextLeft.innerHTML = ToMMSS((120 * SegmentNumber) + CurrentVideo.currentTime);
    VideoTimeRemaining = ToMMSS((120 * SegmentNumber) + CurrentVideo.currentTime - VideoDuration);
    if (!VideoTimeRemaining.startsWith("-")) {
        VideoTimeRemaining = "-" + VideoTimeRemaining;
    }
    VideoBarTextRight.innerHTML = VideoTimeRemaining;
}