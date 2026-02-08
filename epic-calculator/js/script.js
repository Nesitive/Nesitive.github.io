CurrentExpression = document.getElementById("current-expression");
History = document.getElementById("history");

function Calculate() {
  HistoryItem = document.createElement("div");
  HistoryItem.classList.add("history-item");

  HistoryInput = document.createElement("div");
  HistoryInput.classList.add("history-input");
  HistoryInput.innerHTML = CurrentExpression.value;

  HistoryOutput = document.createElement("div");
  HistoryOutput.classList.add("history-output");
  HistoryOutput.innerHTML = "=" + eval(CurrentExpression.value);

  InputClear();
  HistoryItem.appendChild(HistoryInput);
  HistoryItem.appendChild(HistoryOutput);
  History.appendChild(HistoryItem);
}

function InputAppend(text) {
  CurrentExpression.value += text;
}

function InputClear() {
  CurrentExpression.value = "";
}
