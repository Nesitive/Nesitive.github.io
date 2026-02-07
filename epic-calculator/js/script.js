CurrentExpression = document.getElementById("current-expression");

function InputAppend(text) {
  CurrentExpression.value += text;
}

function InputClear() {
  CurrentExpression.value = "";
}
