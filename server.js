// server.js
// Хранение времени в Deno KV для сохранения между перезапусками

const kv = await Deno.openKv(); // Deno KV хранилище
const TIME_KEY = ["simTimeDays"];
const SCALE_KEY = ["timeScale"];

let timeScale = 60; // Значение по умолчанию
let simTimeDays = 0;
let lastUpdate = Date.now();

// Загружаем сохранённые значения при старте
async function loadState() {
    const timeRes = await kv.get(TIME_KEY);
    if (timeRes.value !== null && typeof timeRes.value === "number") {
        simTimeDays = timeRes.value;
    }
    const scaleRes = await kv.get(SCALE_KEY);
    if (scaleRes.value !== null && typeof scaleRes.value === "number") {
        timeScale = scaleRes.value;
    }
    lastUpdate = Date.now();
}

// Сохраняем время каждые 30 секунд (или при изменении скорости)
setInterval(async () => {
    await kv.set(TIME_KEY, simTimeDays);
}, 30000);

// Функция обновления времени
function updateTime() {
    const now = Date.now();
    const deltaSeconds = (now - lastUpdate) / 1000;
    simTimeDays += (deltaSeconds * timeScale) / 86400;
    lastUpdate = now;
}

// Запускаем загрузку состояния перед обработкой запросов
await loadState();

// Регулярное обновление времени
setInterval(updateTime, 1000);

function handleRequest(req) {
    const url = new URL(req.url);
    const headers = new Headers({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    });

    if (req.method === "OPTIONS") {
        return new Response(null, { headers });
    }

    if (req.method === "GET" && url.pathname === "/time") {
        updateTime();
        const data = {
            simTimeDays: simTimeDays,
            timeScale: timeScale,
            serverTime: Date.now(),
        };
        // Немедленно сохраняем при запросе (не обязательно, но для надёжности)
        kv.set(TIME_KEY, simTimeDays);
        return new Response(JSON.stringify(data), { headers });
    }

    if (req.method === "POST" && url.pathname === "/set-speed") {
        const adminKey = req.headers.get("X-Admin-Key");
        if (adminKey !== "твой_секретный_ключ") {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
        }

        return req.json().then(async (body) => {
            const newScale = Number(body.timeScale);
            if (newScale > 0 && newScale < 1000000) {
                timeScale = newScale;
                updateTime();
                await kv.set(SCALE_KEY, timeScale);
                await kv.set(TIME_KEY, simTimeDays);
                return new Response(JSON.stringify({ ok: true, timeScale }), { headers });
            }
            return new Response(JSON.stringify({ error: "Invalid speed" }), { status: 400, headers });
        });
    }

    return new Response("Not found", { status: 404, headers });
}

export default { fetch: handleRequest };
