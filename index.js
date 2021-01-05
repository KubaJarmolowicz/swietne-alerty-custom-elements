// Import stylesheets
import gsap from "gsap";
import "./style.css";

// Pobieranie referencji

const alertBox = document.querySelector("#alert-box");
const form = document.querySelector("#createAlertForm");
const submitBtn = document.querySelector("#alertBtn");

// Stan aplikacji

const appState = {
  alertQueue: [],
  getFirstAlert() {
    return this.alertQueue.shift();
  },

  addToQueue(alert) {
    this.alertQueue.push(alert);
  },

  isQueueFull() {
    return this.alertQueue.length >= 10;
  },

  shouldStopAlertRender() {
    return alertBox.children.length >= 3;
  }
};

// Obiekt symulujący bazę danych typów i przypisanych im kolorów + funkcje do jej obsługi

const alertDatabase = [
  { type: "Error", color: "red" },
  { type: "Warning", color: "yellow" },
  { type: "Success", color: "green" },
  { type: "Royal", color: "purple" }
];

function getAlert(alertType) {
  const requestedType = alertDatabase.find(obj =>
    alertType === obj.type ? obj : false
  );

  return requestedType;
}

// Głowna klasa Alert

class Alert extends HTMLElement {
  constructor(message, pickedType) {
    super();
    this.color = pickedType.color;
    this.setAttribute("class", "p-2");
    this.innerHTML = `
        <div
          class="inline-flex items-center bg-white leading-none text-${
            pickedType.color
          }-600 rounded-full p-2 shadow text-teal text-sm"
        >
          <span
            class="inline-flex bg-${
              pickedType.color
            }-600 text-white rounded-full h-6 px-3 justify-center items-center"
            >${pickedType.name}</span
          >
          <span class="inline-flex px-2">${message}</span>
        </div>
     `;
  }

  disconnectedCallback() {
    if (appState.alertQueue.length) renderFromQueue();
    if (!appState.isQueueFull()) renderSubmitActive();
  }
}

customElements.define("fancy-alert", Alert);

// Klasa implementujaca kolor na podstawie typu

class AlertStyler {
  constructor({ type, color }) {
    this.name = type;
    this.color = color;
  }
}

// Funkcje związane z widokiem DOM

function createAlert(message, type) {
  const pickedType = getAlert(type);
  const pickedStyle = new AlertStyler(pickedType);
  return new Alert(message, pickedStyle);
}

function wrapForAnimation(createdAlert) {
  const alertWrapper = createAlertWrapper();
  alertWrapper.appendChild(createdAlert);
  return alertWrapper;
}

function createAlertWrapper() {
  const alertWrapper = document.createElement("div");
  alertWrapper.setAttribute("class", "p-2");
  alertWrapper.classList.add("pointer");

  return alertWrapper;
}

function renderAlert(wrappedAlert) {
  addRenderAnimation(wrappedAlert, "slideIn");

  alertBox.appendChild(wrappedAlert);
}

function addRenderAnimation(target, animatedClassName) {
  target.classList.add(animatedClassName);
}

function renderFromQueue() {
  {
    const alertToRender = appState.getFirstAlert();
    renderAlert(alertToRender);
  }
}

function deleteAlert(redundantAlert) {
  alertBox.removeChild(redundantAlert);
}

function renderSubmitInactive() {
  submitBtn.classList.add("inactive");
}

function renderSubmitActive() {
  submitBtn.classList.remove("inactive");
}

// Funkcje związane z obsługą zdarzeń na alercie

function startRemovalSequence(event) {
  const thisAlert = event.currentTarget;

  thisAlert.addEventListener("animationend", callDeleteAlert);

  addRenderAnimation(thisAlert, "shrink");
}

function callDeleteAlert(event) {
  deleteAlert(event.currentTarget);
}

function removeAfter10Sec(wrappedAlert) {
  return setTimeout(() => {
    wrappedAlert.dispatchEvent(new MouseEvent("click"));
  }, 10000);
}

// Wysokopoziomowe wyrenderowanie alertu od zera

function getFormData() {
  const messageAndType = [];
  const data = new FormData(form);
  for (let entry of data) {
    const [, val] = entry;
    messageAndType.push(val);
  }

  return messageAndType;
}

function createCompleteAlert([message, type]) {
  const newAlert = createAlert(message, type);
  const wrappedAlert = wrapForAnimation(newAlert);

  removeAfter10Sec(wrappedAlert);
  wrappedAlert.addEventListener("click", startRemovalSequence, { once: true });

  shouldRenderOrQueue(wrappedAlert);

  appState.isQueueFull() ? renderSubmitInactive() : false;
}

function shouldRenderOrQueue(alert) {
  let alertToEval = alert;

  if (appState.shouldStopAlertRender()) {
    appState.addToQueue(alertToEval);
  } else renderAlert(alertToEval);
}

function handleFormSubmit(event) {
  event.preventDefault();

  if (appState.isQueueFull()) {
    return;
  }

  const alertData = getFormData();
  createCompleteAlert(alertData);
}

//ENTRY POINT?

form.addEventListener("submit", handleFormSubmit);
