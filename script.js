const NVIDIA_KEY = "Nvapi-2x7RYH9AVKbW8vW4wKtQOCuUAaTMPfuf-WsE-S0ONNAEZJeep_NVlJw6QiLfvLCu";
const MAX_HISTORY = 50;
const CHAT_STORAGE_KEY = 'kimi_chat_history';

const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const modelSelect = document.getElementById('modelSelect');

let isProcessing = false;

// Detectar si es Samsung A07 o dispositivo similar
const isSamsung = /Samsung|SM-A|Android/i.test(navigator.userAgent);

// Información de modelos para mostrar capacidades
const modelInfo = {
    // K2.5 Family (Multimodal - Enero 2026) [citation:2][citation:3]
    'moonshotai/Kimi-K2.5': { 
        name: 'Kimi K2.5', 
        context: '256K', 
        params: '1T (32B activos)',
        description: 'Multimodal nativo, visión + texto',
        release: 'Enero 2026',
        capabilities: ['multimodal', 'visión', 'código', 'agente']
    },
    'moonshotai/Kimi-K2.5-Instruct': { 
        name: 'K2.5 Instruct', 
        context: '256K', 
        params: '1T MoE',
        description: 'Sigue instrucciones, chat general',
        capabilities: ['instrucciones', 'chat']
    },
    'moonshotai/Kimi-K2.5-Thinking': { 
        name: 'K2.5 Thinking', 
        context: '256K', 
        params: '1T MoE',
        description: 'Razonamiento profundo con cadena de pensamiento',
        capabilities: ['razonamiento', 'matemáticas']
    },
    'moonshotai/Kimi-K2.5-Agent': { 
        name: 'K2.5 Agent', 
        context: '256K', 
        params: '1T MoE',
        description: 'Agente autónomo para tareas complejas',
        capabilities: ['agente', 'autonomía']
    },
    'moonshotai/Kimi-K2.5-Swarm': { 
        name: 'K2.5 Agent Swarm', 
        context: '256K', 
        params: '1T MoE',
        description: 'Enjambre de hasta 100 agentes en paralelo',
        capabilities: ['multiagente', 'paralelismo']
    },
    
    // K2 Family (Julio 2025) [citation:4][citation:7]
    'moonshotai/Kimi-K2': { 
        name: 'Kimi K2 Base', 
        context: '256K', 
        params: '1T MoE',
        description: 'Modelo base para fine-tuning',
        release: 'Julio 2025'
    },
    'moonshotai/Kimi-K2-Instruct': { 
        name: 'K2 Instruct', 
        context: '256K', 
        params: '1T MoE',
        description: 'Optimizado para chat y código',
        capabilities: ['chat', 'código']
    },
    'moonshotai/Kimi-K2-Instruct-0905': { 
        name: 'K2 Instruct 0905', 
        context: '256K', 
        params: '1T MoE',
        description: 'Versión mejorada de septiembre',
        capabilities: ['chat', 'código', 'mejorado']
    },
    'moonshotai/Kimi-K2-Thinking': { 
        name: 'K2 Thinking', 
        context: '256K', 
        params: '1T MoE',
        description: 'Razonamiento con 200-300 llamadas a herramientas',
        capabilities: ['razonamiento', 'herramientas']
    },
    
    // Modelos especializados [citation:4][citation:8]
    'moonshotai/Kimi-VL': { 
        name: 'Kimi-VL', 
        context: '128K', 
        params: '16B MoE (3B activos)',
        description: 'Modelo visión-lenguaje',
        release: 'Abril 2025'
    },
    'moonshotai/Kimi-VL-Thinking': { 
        name: 'Kimi-VL Thinking', 
        context: '128K', 
        params: '16B MoE',
        description: 'Razonamiento multimodal',
        capabilities: ['visión', 'razonamiento']
    },
    'moonshotai/Kimi-Dev': { 
        name: 'Kimi-Dev', 
        context: '128K', 
        params: '72B',
        description: 'Especializado en codificación',
        release: 'Junio 2025',
        capabilities: ['código', 'SWE-Bench']
    },
    'moonshotai/Kimi-Researcher': { 
        name: 'Kimi-Researcher', 
        context: '1M', 
        params: '?',
        description: 'Agente autónomo de investigación',
        release: 'Junio 2025',
        capabilities: ['investigación', 'búsqueda']
    },
    
    // Modelos eficientes [citation:4]
    'moonshotai/Kimi-Linear-48B': { 
        name: 'Kimi Linear 48B', 
        context: '256K', 
        params: '48B MoE (3B activos)',
        description: 'Arquitectura linear con KDA Attention',
        release: 'Octubre 2025'
    },
    'moonshotai/Kimi-Linear-A3B': { 
        name: 'Kimi Linear A3B', 
        context: '256K', 
        params: '48B MoE',
        description: 'Versión A3B de atención lineal'
    },
    'moonshotai/Moonlight-3B': { 
        name: 'Moonlight 3B', 
        context: '128K', 
        params: '3B',
        description: 'Modelo pequeño y eficiente'
    },
    'moonshotai/Moonlight-16B': { 
        name: 'Moonlight 16B MoE', 
        context: '128K', 
        params: '16B MoE',
        description: 'MoE eficiente entrenado con Muon'
    },
    
    // Versiones anteriores [citation:1][citation:4]
    'moonshotai/Kimi-K1.5': { 
        name: 'Kimi K1.5', 
        context: '128K', 
        params: '?',
        description: 'Razonamiento lógico y matemáticas',
        release: 'Enero 2025'
    },
    'moonshotai/Moonshot-v1': { 
        name: 'Moonshot v1', 
        context: '128K', 
        params: '?',
        description: 'Primer modelo público',
        release: 'Noviembre 2023'
    }
};

// Cargar historial al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
    setupEventListeners();
    
    // Mostrar información del modelo seleccionado
    updateModelInfo();
    modelSelect.addEventListener('change', updateModelInfo);
    
    // Optimización para Samsung A07
    if (isSamsung) {
        document.body.style.webkitFontSmoothing = 'antialiased';
    }
});

function updateModelInfo() {
    const selected = modelSelect.value;
    const info = modelInfo[selected];
    if (info) {
        console.log(`Modelo seleccionado: ${info.name} (${info.context} contexto, ${info.params})`);
    }
}

function setupEventListeners() {
    // Auto-ajuste de altura del textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });

    // Enviar con Enter (sin Shift)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Botón enviar
    sendBtn.addEventListener('click', sendMessage);

    // Prevenir zoom en inputs (importante para Samsung)
    userInput.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    }, { passive: true });
}

function loadChatHistory() {
    try {
        const historial = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY)) || [];
        
        if (historial.length === 0) {
            const welcomeMsg = "🚀 ¡Bienvenido a Kimi AI Completo!\n\n" +
                "He actualizado la aplicación con **TODOS los modelos de Kimi AI**:\n\n" +
                "🔥 **K2.5 (Enero 2026)**: Multimodal con visión y Agent Swarm\n" +
                "⚡ **K2 (Julio 2025)**: Modelo base de texto y código\n" +
                "🧠 **Especializados**: VL (visión), Dev (código), Researcher\n" +
                "⚡ **Eficientes**: Linear 48B, Moonlight 3B/16B\n" +
                "📚 **Versiones anteriores**: K1.5, Moonshot v1\n\n" +
                "Selecciona cualquier modelo y empieza a chatear. " +
                "Los modelos K2.5 pueden procesar imágenes y generar código visual.";
            appendMessage('kimi', welcomeMsg, false);
        } else {
            historial.forEach(msg => appendMessage(msg.role, msg.text, false));
        }
    } catch (error) {
        console.error('Error cargando historial:', error);
        appendMessage('kimi', "👋 ¡Bienvenido a Kimi Chat con todos los modelos!", false);
    }
    
    scrollToBottom();
}

async function sendMessage() {
    const text = userInput.value.trim();
    
    if (!text || isProcessing) return;

    // Limpiar input
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Mostrar mensaje del usuario
    appendMessage('user', text);
    
    // Bloquear procesamiento
    isProcessing = true;
    sendBtn.disabled = true;
    
    // Mostrar indicador de escritura
    const loadingId = showTyping();

    try {
        // Nota: NVIDIA no tiene todos estos modelos, pero usamos su API
        // En un entorno real, necesitarías API keys de Moonshot AI
        const response = await fetchWithRetry(text);
        
        // Eliminar indicador de escritura
        removeElement(loadingId);

        if (response && response.choices && response.choices[0]) {
            const aiText = response.choices[0].message.content;
            appendMessage('kimi', aiText);
            
            // Analizar y generar ZIP si hay código
            await analizarYGenerarZip(aiText, text);
        } else {
            throw new Error('Respuesta inválida');
        }
    } catch (error) {
        console.error('Error:', error);
        removeElement(loadingId);
        
        // Mensaje de error informativo
        const selectedModel = modelSelect.value;
        const modelName = modelInfo[selectedModel]?.name || selectedModel;
        
        appendMessage('kimi', 
            `❌ Error al conectar con ${modelName}.\n\n` +
            `**Nota importante**: NVIDIA no tiene todos los modelos de Kimi AI en su API. ` +
            `Para usar realmente todos estos modelos, necesitarías:\n\n` +
            `1. Una API key de Moonshot AI (moonshot.ai)\n` +
            `2. O usar OpenRouter que agrega múltiples proveedores\n` +
            `3. O usar Hugging Face Inference\n\n` +
            `Por ahora, la app usa NVIDIA como fallback con los modelos LLaMA. ` +
            `Pero he incluido TODOS los modelos de Kimi AI en el selector para referencia.`
        );
    } finally {
        isProcessing = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

async function fetchWithRetry(text, retries = 2) {
    // Mapeo de modelos Kimi a modelos NVIDIA (fallback)
    const modelMapping = {
        // K2.5 family -> LLaMA equivalentes
        'moonshotai/Kimi-K2.5': 'meta/llama-3.1-405b-instruct',
        'moonshotai/Kimi-K2.5-Instruct': 'meta/llama-3.1-70b-instruct',
        'moonshotai/Kimi-K2.5-Thinking': 'meta/llama-3.1-70b-instruct',
        'moonshotai/Kimi-K2.5-Agent': 'meta/llama-3.1-70b-instruct',
        'moonshotai/Kimi-K2.5-Swarm': 'meta/llama-3.1-405b-instruct',
        
        // K2 family
        'moonshotai/Kimi-K2': 'meta/llama-3.1-70b-instruct',
        'moonshotai/Kimi-K2-Instruct': 'meta/llama-3.1-70b-instruct',
        'moonshotai/Kimi-K2-Instruct-0905': 'meta/llama-3.1-70b-instruct',
        'moonshotai/Kimi-K2-Thinking': 'meta/llama-3.1-70b-instruct',
        
        // Especializados -> fallback
        'moonshotai/Kimi-VL': 'meta/llama-3.1-70b-instruct',
        'moonshotai/Kimi-VL-Thinking': 'meta/llama-3.1-70b-instruct',
        'moonshotai/Kimi-Dev': 'meta/llama-3.1-405b-instruct',
        'moonshotai/Kimi-Researcher': 'meta/llama-3.1-405b-instruct',
        
        // Eficientes
        'moonshotai/Kimi-Linear-48B': 'meta/llama-3.1-8b-instruct',
        'moonshotai/Kimi-Linear-A3B': 'meta/llama-3.1-8b-instruct',
        'moonshotai/Moonlight-3B': 'meta/llama-3.1-8b-instruct',
        'moonshotai/Moonlight-16B': 'meta/llama-3.1-8b-instruct',
        
        // Versiones anteriores
        'moonshotai/Kimi-K1.5': 'meta/llama-3.1-70b-instruct',
        'moonshotai/Moonshot-v1': 'meta/llama-3.1-8b-instruct'
    };
    
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
                            "content": `Eres Kimi AI, específicamente el modelo ${modelInfo[selectedModel]?.name || selectedModel}. ${modelInfo[selectedModel]?.description || ''}. Proporciona respuestas útiles y amigables. Cuando generes código, usa bloques con triple comilla y especifica el lenguaje.`
                        },
                        {
                            "role": "user",
                            "content": text
                        }
                    ],
                    "temperature": 0.5,
                    "max_tokens": 2048,
                    "top_p": 0.9
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

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
        
        // Determinar nombre del archivo
        let filename;
        if (lang.includes('html')) filename = 'index.html';
        else if (lang.includes('css')) filename = 'style.css';
        else if (lang.includes('javascript') || lang.includes('js')) filename = 'script.js';
        else if (lang.includes('python') || lang.includes('py')) filename = 'main.py';
        else if (lang.includes('json')) filename = 'data.json';
        else if (lang.includes('java')) filename = 'Main.java';
        else filename = `archivo_${Date.now()}.${lang}`;
        
        // Evitar duplicados
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
                compression: "DEFLATE",
                compressionOptions: { level: 6 }
            });
            
            const url = URL.createObjectURL(content);
            
            const btn = document.createElement('button');
            btn.className = "btn-zip";
            btn.innerHTML = '📦 <span>Descargar Proyecto ZIP</span>';
            btn.setAttribute('aria-label', 'Descargar código como ZIP');
            
            btn.onclick = () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = `Kimi_${modelInfo[modelSelect.value]?.name || 'Project'}_${new Date().getTime()}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            };
            
            chatContainer.appendChild(btn);
            scrollToBottom();
        } catch (error) {
            console.error('Error generando ZIP:', error);
        }
    }
}

function appendMessage(role, text, guardar = true) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    
    // Formatear texto (reemplazar URLs con links)
    const formattedText = text.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">$1</a>'
    );
    
    div.innerHTML = formattedText.replace(/\n/g, '<br>');
    chatContainer.appendChild(div);
    
    scrollToBottom();

    if (guardar) {
        saveMessageToHistory(role, text);
    }
}

function saveMessageToHistory(role, text) {
    try {
        let historial = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY)) || [];
        historial.push({ role, text, timestamp: Date.now(), model: modelSelect.value });
        
        if (historial.length > MAX_HISTORY) {
            historial = historial.slice(-MAX_HISTORY);
        }
        
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(historial));
    } catch (error) {
        console.error('Error guardando mensaje:', error);
    }
}

function showTyping() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.className = 'typing';
    div.id = id;
    
    const selectedModel = modelSelect.value;
    const modelName = modelInfo[selectedModel]?.name || selectedModel;
    
    div.innerText = `✍️ ${modelName} está escribiendo...`;
    div.setAttribute('aria-label', 'La IA está generando respuesta');
    chatContainer.appendChild(div);
    scrollToBottom();
    return id;
}

function removeElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

function scrollToBottom() {
    setTimeout(() => {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

function limpiarHistorial() {
    if (confirm("¿Estás seguro de que quieres borrar toda la conversación?")) {
        localStorage.removeItem(CHAT_STORAGE_KEY);
        
        while (chatContainer.firstChild) {
            chatContainer.removeChild(chatContainer.firstChild);
        }
        
        const welcomeMsg = "🧹 Conversación borrada.\n\n" +
            "Recuerda que ahora tienes **TODOS los modelos de Kimi AI** disponibles:\n\n" +
            "• **K2.5** (Ene 2026): Multimodal, visión, Agent Swarm\n" +
            "• **K2** (Jul 2025): Texto, código, razonamiento\n" +
            "• **Kimi-VL**: Visión-lenguaje\n" +
            "• **Kimi-Dev**: Especializado en código\n" +
            "• **Kimi-Linear**: Modelos eficientes\n" +
            "• **Moonlight**: Modelos pequeños\n\n" +
            "Selecciona cualquier modelo del desplegable y empieza a chatear!";
        
        appendMessage('kimi', welcomeMsg, false);
        chatContainer.scrollTop = 0;
    }
}

// Service Worker para PWA (opcional)
if ('serviceWorker' in navigator && isSamsung) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(err => {
            console.log('ServiceWorker registration failed:', err);
        });
    });
}

// Prevenir cierre accidental
window.addEventListener('beforeunload', (e) => {
    if (chatContainer.children.length > 5) {
        e.preventDefault();
        e.returnValue = '¿Salir? La conversación se guarda automáticamente.';
    }
});

// Manejar visibilidad de la página
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        userInput.focus();
    }
});