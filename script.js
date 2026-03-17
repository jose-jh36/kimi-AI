const NVIDIA_KEY = "Nvapi-2x7RYH9AVKbW8vW4wKtQOCuUAaTMPfuf-WsE-S0ONNAEZJeep_NVlJw6QiLfvLCu";

const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const modelSelect = document.getElementById('modelSelect');

window.onload = () => {
    const historial = JSON.parse(localStorage.getItem('kimi_chat_history')) || [];
    historial.forEach(msg => appendMessage(msg.role, msg.text, false));
    if(historial.length === 0) {
        appendMessage('kimi', "🚀 ¡Hola! Soy Kimi. ¿Qué vamos a crear hoy?", false);
    }
};

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    userInput.value = '';
    userInput.style.height = 'auto';
    
    const loadingId = showTyping();

    try {
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${NVIDIA_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": modelSelect.value,
                "messages": [{"role": "user", "content": text}],
                "temperature": 0.5,
                "max_tokens": 1024
            })
        });

        const data = await response.json();
        document.getElementById(loadingId).remove();

        if (data.choices && data.choices[0]) {
            const aiText = data.choices[0].message.content;
            appendMessage('kimi', aiText);
            await analizarYGenerarZip(aiText, text);
        }
    } catch (e) {
        if(document.getElementById(loadingId)) document.getElementById(loadingId).remove();
        appendMessage('kimi', "❌ Hubo un problema al conectar con la IA.");
    }
}

async function analizarYGenerarZip(textoIA, promptUser) {
    const zip = new JSZip();
    const regex = /```(?<lang>[\w]*)\n(?<code>[\s\S]*?)\n```/g;
    let match;
    let tieneCodigo = false;

    while ((match = regex.exec(textoIA)) !== null) {
        tieneCodigo = true;
        const lang = match.groups.lang || 'txt';
        const code = match.groups.code;
        let nombre = `codigo_${Math.floor(Math.random()*1000)}.${lang}`;
        if (lang === 'html') nombre = "index.html";
        else if (lang === 'css') nombre = "style.css";
        else if (lang === 'js' || lang === 'javascript') nombre = "script.js";
        zip.file(nombre, code);
    }

    if (tieneCodigo) {
        const content = await zip.generateAsync({type:"blob"});
        const url = URL.createObjectURL(content);
        const btn = document.createElement('button');
        btn.className = "btn-zip";
        btn.innerHTML = "📦 Descargar Proyecto .ZIP";
        btn.onclick = () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = "Kimi_Project.zip";
            a.click();
        };
        chatContainer.appendChild(btn);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

function appendMessage(role, text, guardar = true) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.innerText = text;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    if (guardar) {
        let historial = JSON.parse(localStorage.getItem('kimi_chat_history')) || [];
        historial.push({ role, text });
        localStorage.setItem('kimi_chat_history', JSON.stringify(historial.slice(-50)));
    }
}

function showTyping() {
    const id = 'type-' + Date.now();
    const div = document.createElement('div');
    div.className = 'typing';
    div.id = id;
    div.innerText = "Kimi está pensando...";
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return id;
}

function limpiarHistorial() {
    if(confirm("¿Borrar todo?")) {
        localStorage.removeItem('kimi_chat_history');
        location.reload();
    }
}

sendBtn.onclick = sendMessage;
userInput.onkeydown = (e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
