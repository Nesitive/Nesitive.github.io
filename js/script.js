// Elements
RightMenuDiv = document.getElementById("right-menu");

function SummonEyesore() {
    document.getElementById("design-image").classList.remove("hidden");
}

function ToggleMenu() {
    if (RightMenuDiv.classList.contains("active")) {
        RightMenuDiv.classList.remove("active");
    }
    else {
        RightMenuDiv.classList.add("active");
    }
}