const fetch = require('node-fetch');

// --- Pengambilan Konfigurasi dari Environment Variables ---
const PTERO_URL = process.env.PTERO_URL;
const PTERO_API_KEY = process.env.PTERO_API_KEY;
const PTERO_EGG_ID = parseInt(process.env.PTERO_EGG_ID, 10);
const PTERO_LOCATION_ID = parseInt(process.env.PTERO_LOCATION_ID, 10);
const PTERO_DISK_MB = parseInt(process.env.PTERO_DISK_MB, 10);
const PTERO_CPU_PERCENT = parseInt(process.env.PTERO_CPU_PERCENT, 10);

// Fungsi untuk membuat pengguna baru di Pterodactyl
async function createUser(serverName) {
    const url = `${PTERO_URL}/api/application/users`;

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
            'Authorization': `Bearer ${PTERO_API_KEY}`,
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

// Fungsi untuk membuat server
async function createServer(serverName, memory, pterodactylUserId) {
    const url = `${PTERO_URL}/api/application/servers`;
    const serverData = {
        name: serverName,
        user: pterodactylUserId,
        egg: PTERO_EGG_ID,
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_18", // Sesuaikan jika perlu
        startup: "if [[ -d .git ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ -f /home/container/package.json ]]; then /usr/local/bin/npm install; fi; node index.js",
        limits: {
            memory: parseInt(memory, 10),
            swap: 0,
            disk: PTERO_DISK_MB,
            io: 500,
            cpu: PTERO_CPU_PERCENT,
        },
        feature_limits: { databases: 1, allocations: 1, backups: 1 },
        deploy: {
            locations: [PTERO_LOCATION_ID],
            dedicated_ip: false,
            port_range: []
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PTERO_API_KEY}`,
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

// Handler utama untuk request API
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { serverName, ram } = req.body;
    if (!serverName || !ram) {
        return res.status(400).json({ message: 'Nama server dan RAM wajib diisi.' });
    }

    try {
        // Langkah 1: Buat pengguna
        const { user, password } = await createUser(serverName);

        // Langkah 2: Buat server dengan ID pengguna yang baru
        const serverInfo = await createServer(serverName, ram, user.id);

        // Langkah 3: Kirim kembali semua detail jika berhasil
        res.status(201).json({
            message: 'Server dan akun berhasil dibuat!',
            panelUrl: PTERO_URL,
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
