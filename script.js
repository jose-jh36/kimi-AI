const NVIDIA_KEY = "Nvapi-2x7RYH9AVKbW8vW4wKtQOCuUAaTMPfuf-WsE-S0ONNAEZJeep_NVlJw6QiLfvLCu";
const MAX_HISTORY = 50;
const CHAT_STORAGE_KEY = 'kimi_chat_history';

const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const modelSelect = document.getElementById('modelSelect');

let isProcessing = false;
const isSamsung = /Samsung|SM-A|Android/i.test(navigator.userAgent);

const modelInfo = {
    'moonshotai/Kimi-K2.5': { name: 'Kimi K2.5', context: '256K', params: '1T', desc: 'Multimodal' },
    'moonshotai/Kimi-K2.5-Instruct': { name: 'K2.5 Instruct', context: '256K', params: '1T', desc: 'Chat' },
    'moonshotai/Kimi-K2.5-Thinking': { name: 'K2.5 Thinking', context: '256K', params: '1T', desc: 'Razonamiento' },
    'moonshotai/Kimi-K2.5-Agent': { name: 'K2.5 Agent', context: '256K', params: '1T', desc: 'Agente' },
    'moonshotai/Kimi-K2.5-Swarm': { name: 'K2.5 Swarm', context: '256K', params: '1T', desc: 'Multiagente' },
    'moonshotai/Kimi-K2': { name: 'Kimi K2', context: '256K', params: '1T', desc: 'Base' },
    'moonshotai/Kimi-K2-Instruct': { name: 'K2 Instruct', context: '256K', params: '1T', desc: 'Chat' },
    'moonshotai/Kimi-K2-Instruct-0905': { name: 'K2 Instruct 0905', context: '256K', params: '1T', desc: 'Chat+' },
    'moonshotai/Kimi-K2-Thinking': { name: 'K2 Thinking', context: '256K', params: '1T', desc: 'Razonamiento' },
    'moonshotai/Kimi-VL': { name: 'Kimi-VL', context: '128K', params: '16B', desc: 'Visión' },
    'moonshotai/Kimi-VL-Thinking': { name: 'Kimi-VL Thinking', context: '128K', params: '16B', desc: 'Visión+' },
    'moonshotai/Kimi-Dev': { name: 'Kimi-Dev', context: '128K', params: '72B', desc: 'Código' },
    'moonshotai/Kimi-Researcher': { name: 'Kimi-Researcher', context: '1M', params: '?', desc: 'Investigación' },
    'moonshotai/Kimi-Linear-48B': { name: 'Linear 48B', context: '256K', params: '48B', desc: 'Eficiente' },
    'moonshotai/Kimi-Linear-A3B': { name: 'Linear A3B', context: '256K', params: '48B', desc: 'Eficiente+' },
    'moonshotai/Moonlight-3B': { name: 'Moonlight 3B', context: '128K', params: '3B', desc: 'Pequeño' },
    'moonshotai/Moonlight-16B': { name: 'Moonlight 16B', context: '128K', params: '16B', desc: 'MoE' }
};

const modelMapping = {
    'moonshotai/Kimi-K2.5': 'meta/llama-3.1-405b-instruct',
    'moonshotai/Kimi-K2.5-Instruct': 'meta/llama-3.1-70b-instruct',
    'moonshotai/Kimi-K2.5-Thinking': 'meta/llama-3.1-70b-instruct',
    'moonshotai/Kimi-K2.5-Agent': 'meta/llama-3.1-70b-instruct',
    'moonshotai/Kimi-K2.5-Swarm': 'meta/llama-3.1-405b-instruct',
    'moonshotai/Kimi-K2': 'meta/llama-3.1-70b-instruct',
    'moonshotai/Kimi-K2-Instruct': 'meta/llama-3.1-70b-instruct',
    'moonshotai/Kimi-K2-Instruct-0905': 'meta/llama-3.1-70b-instruct',
    'moonshotai/Kimi-K2-Thinking': 'meta/llama-3.1-70b-instruct',
    'moonshotai/Kimi-VL': 'meta/llama-3.1-70b-instruct',
    'moonshotai/Kimi-VL-Thinking': 'meta/llama-3.1-70b-instruct',
    'moonshotai/Kimi-Dev': 'meta/llama-3.1-405b-instruct',
    'moonshotai/Kimi-Researcher': 'meta/llama-3.1-405b-instruct',
    'moonshotai/Kimi-Linear-48B': 'meta/llama-3.1-8b-instruct',
    'moonshotai/Kimi-Linear-A3B': 'meta/llama-3.1-8b-instruct',
    'moonshotai/Moonlight-3B': 'meta/llama-3.1-8b-instruct',
    'moonshotai/Moonlight-16B': 'meta/llama-3.1-8b-instruct'
};

document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
    setupEventListeners();
});

function setupEventListeners() {
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);
}

function loadChatHistory() {
    try {
        const historial = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY)) || [];
        
        if (historial.length === 0) {
            appendMessage('kimi', "🚀 **¡Bienvenido a Kimi AI Completo!**\n\nTengo **TODOS los modelos**:\n\n🔥 **K2.5**: Multimodal, Agent Swarm\n⚡ **K2**: Texto y código\n🧠 **Kimi-VL**: Visión\n⚡ **Linear/Moonlight**: Eficientes\n\nSelecciona cualquier modelo y empieza a chatear.", false);
        } else {
            historial.forEach(msg => appendMessage(msg.role, msg.text, false));
        }
    } catch (error) {
        appendMessage('kimi', "👋 ¡Bienvenido a Kimi AI!", false);
    }
    scrollToBottom();
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || isProcessing) return;

    userInput.value = '';
    userInput.style.height = 'auto';
    
    appendMessage('user', text);
    
    isProcessing = true;
    sendBtn.disabled = true;
    
    const loadingId = showTyping();

    try {
        const response = await fetchWithRetry(text);
        removeElement(loadingId);

        if (response && response.choices && response.choices[0]) {
            const aiText = response.choices[0].message.content;
            appendMessage('kimi', aiText);
            await analizarYGenerarZip(aiText, text);
        }
    } catch (error) {
        removeElement(loadingId);
        const selectedModel = modelSelect.value;
        const modelName = modelInfo[selectedModel]?.name || selectedModel;
        
        appendMessage('kimi', 
            `❌ Error con ${modelName}.\n\n` +
            `**Nota**: Uso API de NVIDIA como fallback. Los modelos reales requieren key de Moonshot AI.\n\n` +
            `Por ahora funcionará con modelos LLaMA equivalentes.`);
    } finally {
        isProcessing = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

async function fetchWithRetry(text, retries = 2) {
    const selectedModel = modelSelect.value;
    const nvidiaModel = modelMapping[selectedModel] || 'meta/llama-3.1-70b-instruct';

    for (let i = 0; i <= retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${NVIDIA_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": nvidiaModel,
                    "messages": [
                        {
                            "role": "system",
                            "content": `Eres Kimi AI, modelo ${modelInfo[selectedModel]?.name || selectedModel}. ${modelInfo[selectedModel]?.desc || ''}. Responde en español.`
                        },
                        { "role": "user", "content": text }
                    ],
                    "temperature": 0.5,
                    "max_tokens": 2048,
                    "top_p": 0.9
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            if (i === retries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

async function analizarYGenerarZip(textoIA, promptUser) {
    const zip = new JSZip();
    const regex = /```(?<lang>[\w]*)\n(?<code>[\s\S]*?)\n```/g;
    let match;
    let tieneCodigo = false;
    const files = [];

    while ((match = regex.exec(textoIA)) !== null) {
        tieneCodigo = true;
        const lang = (match.groups.lang || 'txt').toLowerCase();
        const code = match.groups.code.trim();
        
        let filename;
        if (lang.includes('html')) filename = 'index.html';
        else if (lang.includes('css')) filename = 'style.css';
        else if (lang.includes('javascript') || lang.includes('js')) filename = 'script.js';
        else if (lang.includes('python') || lang.includes('py')) filename = 'main.py';
        else if (lang.includes('json')) filename = 'data.json';
        else filename = `archivo.${lang}`;
        
        if (files.includes(filename)) {
            const ext = filename.split('.').pop();
            filename = `${filename.split('.')[0]}_${Date.now()}.${ext}`;
        }
        
        files.push(filename);
        zip.file(filename, code);
    }

    if (tieneCodigo) {
        try {
            const content = await zip.generateAsync({ 
                type: "blob",
                compression: "DEFLATE"
            });
            
            const url = URL.createObjectURL(content);
            
            const btn = document.createElement('button');
            btn.className = "btn-zip";
            btn.innerHTML = '📦 Descargar Proyecto ZIP';
            
            btn.onclick = () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = `Kimi_Project_${Date.now()}.zip`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            };
            
            chatContainer.appendChild(btn);
            scrollToBottom();
        } catch (error) {
            console.error('Error ZIP:', error);
        }
    }
}

function appendMessage(role, text, guardar = true) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    
    const formattedText = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    div.innerHTML = formattedText.replace(/\n/g, '<br>');
    chatContainer.appendChild(div);
    
    scrollToBottom();

    if (guardar) {
        try {
            let historial = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY)) || [];
            historial.push({ role, text, timestamp: Date.now() });
            if (historial.length > MAX_HISTORY) historial = historial.slice(-MAX_HISTORY);
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(historial));
        } catch (error) {}
    }
}

function showTyping() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.className = 'typing';
    div.id = id;
    
    const selectedModel = modelSelect.value;
    const modelName = modelInfo[selectedModel]?.name || 'Kimi';
    
    div.innerText = `✍️ ${modelName} está escribiendo...`;
    chatContainer.appendChild(div);
    scrollToBottom();
    return id;
}

function removeElement(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

function scrollToBottom() {
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
}

function limpiarHistorial() {
    if (confirm("¿Borrar toda la conversación?")) {
        localStorage.removeItem(CHAT_STORAGE_KEY);
        while (chatContainer.firstChild) chatContainer.removeChild(chatContainer.firstChild);
        appendMessage('kimi', "🧹 Conversación borrada. ¿En qué puedo ayudarte?", false);
    }
}

if ('serviceWorker' in navigator && isSamsung) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
}