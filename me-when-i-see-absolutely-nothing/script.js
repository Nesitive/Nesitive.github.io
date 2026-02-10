function GenerateImage() {
  input = document.querySelector("input");
  canvas = document.querySelector("canvas");
  ctx = canvas.getContext("2d");

  image = document.createElement("img");
  image.style.display = "none";
  document.body.appendChild(image);
  image.addEventListener("load", (event) => {
    canvas.width = image.width;
    canvas.height = image.height * 1.2;
    ctx.filter = "blur(" + (image.height * 0.1) + "px) brightness(40%)";
    ctx.drawImage(image, image.width * -0.2, image.height * -0.2, image.width * 1.4, image.height * 1.4);
    ctx.filter = "none";
    if (image.height * (16 / 9) < image.width) {
      ctx.font = (image.height * 0.08) + "px 'Open Sans'";
    }
    else {
      ctx.font = (image.width * 0.06) + "px 'Open Sans'";
    }
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.fillText("Me when I see absolutely nothing", image.width * 0.5, image.height * 0.1);
    ctx.drawImage(image, 0, image.height * 0.2);
  });
  image.src = URL.createObjectURL(input.files[0]);
  document.getElementById("background-image").src = image.src;
}
