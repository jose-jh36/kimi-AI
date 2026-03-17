const API_KEY = "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";

const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const modelSelect = document.getElementById('modelSelect');

async function enviar() {
    const prompt = userInput.value.trim();
    if (!prompt) return;

    // Mostrar mensaje del usuario
    agregarMsg('user', prompt);
    userInput.value = '';

    // Mensaje de carga
    const loading = agregarMsg('kimi', "Pensando...");

    try {
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                "model": modelSelect.value,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.5
            })
        });

        const data = await response.json();
        loading.remove();

        if (data.choices && data.choices[0]) {
            agregarMsg('kimi', data.choices[0].message.content);
        } else {
            agregarMsg('kimi', "❌ Error: La API no respondió correctamente.");
        }
    } catch (error) {
        loading.remove();
        agregarMsg('kimi', "❌ Error de conexión. Revisa tu internet.");
    }
}

function agregarMsg(role, text) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
}

sendBtn.onclick = enviar;
userInput.onkeypress = (e) => { if(e.key === 'Enter') enviar(); };
