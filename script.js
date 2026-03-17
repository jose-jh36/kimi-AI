const API_KEY = "Nvapi-2x7RYH9AVKbW8vW4wKtQOCuUAaTMPfuf-WsE-S0ONNAEZJeep_NVlJw6QiLfvLCu";

const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const modelSelect = document.getElementById('modelSelect');

// Cargar chat
window.onload = () => {
    const history = JSON.parse(localStorage.getItem('chat_log')) || [];
    history.forEach(m => renderMsg(m.role, m.content));
    if(!history.length) renderMsg('kimi', "¡Hola! Soy Kimi. ¿En qué puedo ayudarte hoy?");
};

// Auto-expandir textarea
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = userInput.scrollHeight + 'px';
});

async function handleSend() {
    const text = userInput.value.trim();
    if(!text) return;

    renderMsg('user', text);
    userInput.value = '';
    userInput.style.height = 'auto';

    const tempId = Date.now();
    renderMsg('kimi', "Escribiendo...", tempId);

    try {
        const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                "model": modelSelect.value,
                "messages": [{"role": "user", "content": text}],
                "temperature": 0.5
            })
        });

        const data = await res.json();
        document.getElementById(tempId).remove();

        const reply = data.choices[0].message.content;
        renderMsg('kimi', reply);
        saveChat('kimi', reply);
        checkCode(reply);

    } catch (err) {
        document.getElementById(tempId).innerText = "❌ Error al conectar.";
    }
}

function renderMsg(role, content, id = null) {
    const d = document.createElement('div');
    d.className = `msg ${role}`;
    if(id) d.id = id;
    d.innerText = content;
    chatBox.appendChild(d);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function saveChat(role, content) {
    let history = JSON.parse(localStorage.getItem('chat_log')) || [];
    history.push({role, content});
    localStorage.setItem('chat_log', JSON.stringify(history.slice(-20)));
}

async function checkCode(text) {
    const zip = new JSZip();
    const codes = [...text.matchAll(/```(?<l>\w*)\n(?<c>[\s\S]*?)\n```/g)];
    
    if(codes.length > 0) {
        codes.forEach((m, i) => {
            let ext = m.groups.l || 'txt';
            let name = `file_${i}.${ext}`;
            if(ext === 'html') name = 'index.html';
            if(ext === 'css') name = 'style.css';
            if(ext === 'js') name = 'script.js';
            zip.file(name, m.groups.c);
        });

        const blob = await zip.generateAsync({type:"blob"});
        const url = URL.createObjectURL(blob);
        const b = document.createElement('button');
        b.className = "btn-zip";
        b.innerText = "📦 Descargar Proyecto .ZIP";
        b.onclick = () => { const a = document.createElement('a'); a.href = url; a.download = "Kimi_Code.zip"; a.click(); };
        chatBox.appendChild(b);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function clearChat() { localStorage.removeItem('chat_log'); location.reload(); }
sendBtn.onclick = handleSend;
userInput.onkeydown = (e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
