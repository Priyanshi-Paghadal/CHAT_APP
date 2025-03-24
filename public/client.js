const socket = io();

console.log("socket ::::", socket);

// Get DOM elements
const loginContainer = document.getElementById("loginContainer");
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("usernameInput");
const chatContainer = document.getElementById("chatContainer");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const themeToggle = document.getElementById("themeToggle");

// Load saved theme
const savedTheme = localStorage.getItem("theme") || "light";
if (savedTheme === "dark") {
  document.body.classList.add("dark-theme");
}

// Handle login
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (username) {
    socket.emit("login", username);
  }
});

// Show chat on successful login
socket.on("loginSuccess", () => {
  loginContainer.style.display = "none";
  chatContainer.style.display = "block";
});

// Toggle theme
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
  const currentTheme = document.body.classList.contains("dark-theme")
    ? "dark"
    : "light";
  localStorage.setItem("theme", currentTheme);
});

// Handle message form submission
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = messageInput.value.trim();
  if (msg) {
    socket.emit("chatMessage", msg);
    messageInput.value = "";
  }
});

// Receive and display messages
socket.on("chatMessage", (data) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");

  // Add username
  const usernameElement = document.createElement("span");
  usernameElement.classList.add("username");
  usernameElement.textContent = data.username;
  messageElement.appendChild(usernameElement);

  // Add message text
  const textElement = document.createElement("span");
  textElement.textContent = data.text;
  messageElement.appendChild(textElement);

  // Style based on sender
  if (data.id === socket.id) {
    messageElement.classList.add("own");
  } else {
    messageElement.classList.add("other");
  }

  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
});
