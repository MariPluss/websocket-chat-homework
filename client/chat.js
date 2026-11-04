document.addEventListener("DOMContentLoaded", () => {
    let username = null;
    let ws = null;

    const loginContainer = document.getElementById("login-container");
    const chatContainer = document.getElementById("chat-container");
    const usernameInput = document.getElementById("username-input");
    const loginButton = document.getElementById("login-button");

    const chatWindow = document.getElementById("chat-window");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");

    // Входим в чат по клику на кнопку "Войти"
    loginButton.addEventListener("click", () => {
        username = usernameInput.value.trim();
        if (username !== "") {
            // Скрываем форму логина и показываем чат
            loginContainer.style.display = "none";
            chatContainer.style.display = "flex";
            initializeWebSocket();
        }
    });

    // Инициализация WebSocket-подключения
    function initializeWebSocket() {
        ws = new WebSocket("ws://localhost:8765");

        ws.onopen = () => {
            console.log("Подключение к серверу установлено");
        };

        ws.onmessage = (event) => {
            const message = event.data;
            appendMessage(message);
        };

        ws.onclose = () => {
            console.log("Соединение с сервером закрыто");
        };

        ws.onerror = (error) => {
            console.error("Ошибка WebSocket:", error);
        };
    }

    // Отправка сообщения по кнопке "Отправить"
    sendButton.addEventListener("click", sendMessage);

    // Отправка по Enter
    messageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    // Формируем сообщение с именем пользователя и отправляем
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text !== "" && ws && ws.readyState === WebSocket.OPEN) {
            const fullMessage = `${username}: ${text}`;
            ws.send(fullMessage);
            messageInput.value = "";
        }
    }

    // Добавляем новое сообщение в окно чата и прокручиваем вниз
    function appendMessage(message) {
        const messageElem = document.createElement("div");
        messageElem.textContent = message;
        chatWindow.appendChild(messageElem);

        // Прокручиваем окно к последнему сообщению
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
});
