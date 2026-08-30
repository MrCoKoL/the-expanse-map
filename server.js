const START_DATE = Date.UTC(2350, 0, 1);
let timeScale = 60;
let simTimeDays = 0;
let lastUpdate = Date.now();

function updateTime() {
    const now = Date.now();
    const deltaSeconds = (now - lastUpdate) / 1000;
    simTimeDays += (deltaSeconds * timeScale) / 86400;
    lastUpdate = now;
}

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
        return new Response(JSON.stringify(data), { headers });
    }

    if (req.method === "POST" && url.pathname === "/set-speed") {
        const adminKey = req.headers.get("X-Admin-Key");
        if (adminKey !== "твой_секретный_ключ") {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
        }

        return req.json().then((body) => {
            const newScale = Number(body.timeScale);
            if (newScale > 0 && newScale < 1000000) {
                timeScale = newScale;
                updateTime();
                return new Response(JSON.stringify({ ok: true, timeScale }), { headers });
            }
            return new Response(JSON.stringify({ error: "Invalid speed" }), { status: 400, headers });
        });
    }

    return new Response("Not found", { status: 404, headers });
}

export default { fetch: handleRequest };
