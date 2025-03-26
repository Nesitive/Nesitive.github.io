// Elements
PlayButtonIcon = document.getElementById("play-button-icon");
BottomBar = document.getElementById("bottom-bar");
FullscreenButton = document.getElementById("fullscreen-button");
CurrentVideo = document.getElementById("current-video");
NextVideo = document.getElementById("next-video");
VideoBarFill = document.getElementById("video-bar-fill");
VideoBarTextLeft = document.getElementById("video-bar-text-left");
VideoBarTextRight = document.getElementById("video-bar-text-right");
VolumeButton = document.getElementById("volume-button");
VolumeSlider = document.getElementById("volume-slider");
VolumeSliderInput = document.getElementById("volume-slider-input");

// Variables
VideoBarDragging = false;

// Load video
src = "video/1-0.webm";
if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    CurrentVideo.autoplay = true;
}
CurrentVideo.addEventListener("loadeddata", () => {
    VideoBarTextLeft.innerHTML = ToMMSS(CurrentVideo.currentTime);
    VideoBarTextRight.innerHTML = ToMMSS(CurrentVideo.currentTime - 864);
})
CurrentVideo.src = src;


// Video player
CurrentVideo.addEventListener("ended", () => {
    CurrentVideo.src = CurrentVideo.src.substring(0, CurrentVideo.src.indexOf("-") + 1) + (parseInt(CurrentVideo.src.substring(CurrentVideo.src.indexOf("-") + 1)) + 1) + ".webm";
    CurrentVideo.play();
});


// Video bar
setInterval(() => {
    if (!CurrentVideo.paused) {
        VideoBarFill.animate({
            width: (100 * (CurrentVideo.currentTime / 864)) + "%"
        }, {duration: 100, fill: "forwards"});
        VideoBarTextLeft.innerHTML = ToMMSS(CurrentVideo.currentTime);
        VideoBarTextRight.innerHTML = ToMMSS(CurrentVideo.currentTime - 864);
    }
}, 100);
VideoBarFill.parentNode.addEventListener("mousedown", (event) => {
    VideoSeek(event.clientX);
    VideoBarDragging = true
})
document.addEventListener("mousemove", (event) => {
    if (VideoBarDragging) {
        VideoSeek(event.clientX);
    }
})
document.addEventListener("mouseup", (event) => {
    VideoBarDragging = false
})
VideoBarFill.parentNode.addEventListener("touchstart", (event) => {
    VideoSeek(event.touches[0].clientX);
})
VideoBarFill.parentNode.addEventListener("touchmove", (event) => {
    VideoSeek(event.touches[0].clientX);
})
VolumeSliderInput.value = CurrentVideo.volume;
VolumeSliderInput.oninput = () => {
    CurrentVideo.volume = VolumeSliderInput.value;
}
VolumeButton.onclick = () => {
    if (VolumeSlider.classList.contains("active")) {
        VolumeSlider.classList.remove("active");
    }
    else {
        VolumeSlider.classList.add("active");
    }
}
document.onclick = (event) => {
    ToggleBottomBar(event);
}
BottomBar.onclick = (event) => {
    event.stopPropagation();
}


// Functions
function PreloadVideo() {
    
}

function ToggleBottomBar(event) {
    if (BottomBar.classList.contains("active")) {
        BottomBar.classList.remove("active");
    }
    else {
        BottomBar.classList.add("active");
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
    nmod = n;
    mins = Math.floor(n / 60);
    nmod -= (mins * 60);
    mins = mins.toString();
    secs = Math.round(nmod).toString();
    if (secs.length == 1) {
        secs = "0" + secs;
    }
    return(sign + mins + ":" + secs);
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
}

function VideoSeek(clientX) {
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
    CurrentVideo.currentTime = 864 * (clientX - left) / width;
    VideoBarTextLeft.innerHTML = ToMMSS(CurrentVideo.currentTime);
    VideoTimeRemaining = ToMMSS(CurrentVideo.currentTime - 864);
    if (!VideoTimeRemaining.startsWith("-")) {
        VideoTimeRemaining = "-" + VideoTimeRemaining;
    }
    VideoBarTextRight.innerHTML = VideoTimeRemaining;
}
