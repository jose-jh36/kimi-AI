// Tu clave de API de NVIDIA
const NVIDIA_KEY = "Nvapi-2x7RYH9AVKbW8vW4wKtQOCuUAaTMPfuf-WsE-S0ONNAEZJeep_NVlJw6QiLfvLCu";

const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const modelSelect = document.getElementById('modelSelect');

// Cargar historial al iniciar
window.onload = () => {
    const historial = JSON.parse(localStorage.getItem('kimi_chat_history')) || [];
    historial.forEach(msg => appendMessage(msg.role, msg.text, false));
    
    if(historial.length === 0) {
        appendMessage('kimi', "🚀 ¡Hola! Soy Kimi. Pídeme que cree una App o hazme cualquier pregunta.", false);
    }
};

// Ajuste automático del área de texto
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
    
    showTypingIndicator();

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
        removeTypingIndicator();

        if (data.choices && data.choices[0]) {
            const aiText = data.choices[0].message.content;
            appendMessage('kimi', aiText);
            await analizarYGenerarZip(aiText, text);
        } else {
            throw new Error("Respuesta vacía");
        }
    } catch (e) {
        removeTypingIndicator();
        appendMessage('kimi', "❌ Error: No se pudo conectar con la API. Verifica tu conexión o saldo en NVIDIA.");
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
        let nombre = `archivo_${Math.floor(Math.random()*1000)}.${lang}`;

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
        btn.innerHTML = "📦 Descargar Archivos (.ZIP)";
        btn.onclick = () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = "Proyecto_Kimi.zip";
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

function showTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'typing';
    div.id = 'loading';
    div.innerHTML = '<span></span><span></span><span></span>';
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeTypingIndicator() {
    const el = document.getElementById('loading');
    if (el) el.remove();
}

function limpiarHistorial() {
    if(confirm("¿Borrar chat?")) {
        localStorage.removeItem('kimi_chat_history');
        location.reload();
    }
}

sendBtn.onclick = sendMessage;
userInput.onkeypress = (e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
