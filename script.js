const NVIDIA_KEY = "Nvapi-2x7RYH9AVKbW8vW4wKtQOCuUAaTMPfuf-WsE-S0ONNAEZJeep_NVlJw6QiLfvLCu";

const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const modelSelect = document.getElementById('modelSelect');

// Cargar Historial y Bienvenida
window.onload = () => {
    const historial = JSON.parse(localStorage.getItem('kimi_chat_history')) || [];
    historial.forEach(msg => appendMessage(msg.role, msg.text, false));
    
    if(historial.length === 0) {
        const bienvenida = `🚀 ¡Bienvenido a Kimi Chat Mobile!\n\nPuedo ayudarte a chatear, escribir código o generar proyectos completos en .ZIP. Dime "Crea una app de..." para empezar.`;
        appendMessage('kimi', bienvenida, false);
    }
};

// Auto-ajuste del teclado/input
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Enviar Mensaje a NVIDIA
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
        }
    } catch (e) {
        removeTypingIndicator();
        appendMessage('kimi', "❌ Error al conectar. Verifica tu clave de NVIDIA.");
    }
}

// Analizar bloques de código y crear el ZIP
async function analizarYGenerarZip(textoIA, promptUser) {
    const zip = new JSZip();
    const regex = /```(?<lang>[\w]*)\n(?<code>[\s\S]*?)\n```/g;
    let match;
    let tieneCodigo = false;
    const esApp = promptUser.toLowerCase().includes("app") || promptUser.toLowerCase().includes("apk");

    while ((match = regex.exec(textoIA)) !== null) {
        tieneCodigo = true;
        const lang = match.groups.lang || 'txt';
        const code = match.groups.code;
        let ruta = esApp ? "android_project/app/src/main/assets/" : "project_files/";
        let nombre = `file_${Math.floor(Math.random()*1000)}.${lang}`;

        if (lang === 'html') nombre = "index.html";
        else if (lang === 'css') nombre = "style.css";
        else if (lang === 'js' || lang === 'javascript') nombre = "script.js";

        zip.file(ruta + nombre, code);
    }

    if (tieneCodigo) {
        const content = await zip.generateAsync({type:"blob"});
        const url = URL.createObjectURL(content);
        const btn = document.createElement('button');
        btn.className = "btn-zip";
        btn.innerHTML = esApp ? "📦 Descargar Proyecto App (.ZIP)" : "📦 Descargar Archivos (.ZIP)";
        btn.onclick = () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = esApp ? "Kimi_App_Project.zip" : "Kimi_Export.zip";
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
        if (historial.length > 50) historial.shift();
        localStorage.setItem('kimi_chat_history', JSON.stringify(historial));
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
    if(confirm("¿Borrar toda la conversación?")) {
        localStorage.removeItem('kimi_chat_history');
        location.reload();
    }
}

sendBtn.onclick = sendMessage;
userInput.onkeypress = (e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
