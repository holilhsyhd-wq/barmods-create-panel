const fetch = require('node-fetch');
const config = require('../config.js'); // Mengambil konfigurasi dari file config.js

// --- FUNGSI MEMBUAT PENGGUNA (Sama seperti di bot.js) ---
async function createUser(serverName) {
    const pterodactyl = config.pterodactyl;
    const url = `${pterodactyl.domain}/api/application/users`;
    
    const randomString = Math.random().toString(36).substring(7);
    const email = `${serverName.toLowerCase().replace(/\s+/g, '')}@${randomString}.com`;
    const username = `${serverName.toLowerCase().replace(/\s+/g, '')}_${randomString}`;
    const password = Math.random().toString(36).slice(-10);

    const userData = {
        email: email,
        username: username,
        first_name: serverName,
        last_name: "User",
        password: password,
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${pterodactyl.apiKey}`,
            'Content-Type': 'application/json', 'Accept': 'application/json'
        },
        body: JSON.stringify(userData)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.errors ? data.errors[0].detail : 'Gagal membuat pengguna.');
    }
    return { user: data.attributes, password: password };
}

// --- FUNGSI MEMBUAT SERVER (Sama seperti di bot.js) ---
async function createServer(serverName, memory, pterodactylUserId) {
    const pterodactyl = config.pterodactyl;
    const url = `${pterodactyl.domain}/api/application/servers`;

    const serverData = {
        name: serverName,
        user: pterodactylUserId,
        egg: pterodactyl.eggId,
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
        startup: "if [[ -d .git ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ -f /home/container/package.json ]]; then /usr/local/bin/npm install; fi; node index.js",
        environment: {
            // Variabel lingkungan untuk server baru, bisa Anda sesuaikan
            CMD_RUN: "node index.js"
        },
        limits: {
            memory: parseInt(memory),
            swap: 0,
            disk: pterodactyl.disk,
            io: 500,
            cpu: pterodactyl.cpu,
        },
        feature_limits: { databases: 1, allocations: 1, backups: 1 },
        deploy: {
            locations: [pterodactyl.locationId],
            dedicated_ip: false,
            port_range: []
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${pterodactyl.apiKey}`,
            'Content-Type': 'application/json', 'Accept': 'application/json'
        },
        body: JSON.stringify(serverData)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.errors ? data.errors[0].detail : 'Gagal membuat server.');
    }
    return data.attributes;
}

// --- HANDLER UTAMA UNTUK WEBSITE ---
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { serverName, ram } = req.body;
    if (!serverName || !ram) {
        return res.status(400).json({ message: 'Nama server dan RAM wajib diisi.' });
    }

    try {
        // Langkah 1: Buat pengguna baru
        const { user, password } = await createUser(serverName);

        // Langkah 2: Buat server dengan ID pengguna yang baru
        const serverInfo = await createServer(serverName, ram, user.id);

        // Langkah 3: Kirim semua detail jika berhasil
        res.status(201).json({
            message: 'Server dan akun berhasil dibuat!',
            panelUrl: config.pterodactyl.domain,
            loginDetails: {
                username: user.username,
                email: user.email,
                password: password
            },
            serverDetails: {
                name: serverInfo.name,
                ram: serverInfo.limits.memory
            }
        });

    } catch (error) {
        console.error('Pterodactyl API Error:', error);
        res.status(500).json({ message: error.message });
    }
};
