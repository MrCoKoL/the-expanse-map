// server.js
// Сервер времени, который всегда актуален, даже если Deno Deploy "спал"

// Момент реального времени, соответствующий игровому 2350-01-01 00:00 UTC (0 дней)
// Выбери любую дату. Здесь: 1 сентября 2026 года, 00:00 UTC
const REAL_EPOCH_MS = Date.UTC(2026, 8, 1); // 2026-09-01

// Скорость: 60 игровых секунд за 1 реальную секунду (60x)
const TIME_SCALE = 60;

// Вычисление игрового времени в днях на основе текущего реального времени
function getSimTimeDays() {
    const now = Date.now();
    const deltaMs = now - REAL_EPOCH_MS;
    return (deltaMs / 86400000) * TIME_SCALE;
}

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
        const simTimeDays = getSimTimeDays();
        return new Response(JSON.stringify({
            simTimeDays,
            timeScale: TIME_SCALE,
            serverTime: Date.now(),
        }), { headers });
    }

    // Если захочешь менять скорость, можно добавить сюда POST /set-speed
    // Но для простоты сейчас не реализуем

    return new Response("Not found", { status: 404, headers });
}

export default { fetch: handleRequest };
