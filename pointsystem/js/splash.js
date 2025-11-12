SplashBar = document.getElementById("splash-bar");
SplashBar.dataset.progress = 0;
PageLoaded = false;
sources = ["https://images.pexels.com/photos/212940/pexels-photo-212940.jpeg?w=1920"];
TitleDiv = document.getElementById("title");

function AddProgress(p) {
    SplashBarProgress = parseInt(document.getElementById("splash-prog").innerHTML) + parseInt(p);
    if (SplashBarProgress >= 100) {
        SplashBarProgress = 100;
        PageLoaded = true;
        setTimeout(() => {
            document.body.style.backgroundImage = "url(" + sources[0] + ")";
            FadeSplash();
        }, 200);
    }
    SplashBar.style.width = SplashBarProgress + "%";
    document.getElementById("splash-prog").innerHTML = SplashBarProgress + "%";
}

function FadeSplash() {
    document.getElementById("splash").style.opacity = 0;
    setTimeout(() => {
        document.getElementById("splash").style.display = "none";
        document.getElementById("master").style.opacity = 1;
        document.getElementById("master").style.transform = "scale(1)";
    }, 1500);
}

function UnfadeSplash() {
    SplashBar.dataset.progress = 0;
    AddProgress(0);
    document.getElementById("splash").style.display = "";
    document.getElementById("master").style.opacity = 0;
    document.getElementById("master").style.transform = "scale(1.2)";
    setTimeout(() => {
        document.getElementById("splash").style.opacity = 1;
    }, 1500);
}

// Load background images
images = [];
sources.forEach((item) => {
    images.push(new Image());
})
if (images.length == 0) {
    AddProgress(20);
}
images.forEach((item, i) => {
    item.addEventListener("load", () => {
        AddProgress(1 + Math.floor(20 / images.length));
    })
    item.src = sources[i];
})

// Offline mode
document.getElementById("splash").onkeydown = (event) => {
    if (PageLoaded == false && event.key.toLowerCase() == "o") {
        document.getElementById("s-controls").innerHTML = "Offline mode activated";
        document.getElementById("offline-mode").innerHTML = ".ui { border: 0.125rem solid #fff; }";
        setTimeout(() => {
            FadeSplash();
        }, 600);
    }
}
