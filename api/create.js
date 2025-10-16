const fetch = require('node-fetch');
// Mengambil konfigurasi dari file config.js yang ada di folder root
const config = require('../config.js'); 

/**
 * Fungsi untuk membuat pengguna baru di Pterodactyl.
 * @param {string} serverName - Nama yang akan digunakan sebagai basis untuk detail pengguna.
 * @returns {Promise<{user: object, password: string}>} - Objek berisi detail pengguna dan password acak.
 */
async function createUser(serverName) {
    const pterodactyl = config.pterodactyl;
    // Membangun URL API yang benar untuk membuat pengguna
    const url = `${pterodactyl.domain}/api/application/users`;
    
    // Membuat detail pengguna yang unik secara acak
    const randomString = Math.random().toString(36).substring(7);
    const email = `${serverName.toLowerCase().replace(/\s+/g, '')}@${randomString}.com`;
    const username = `${serverName.toLowerCase().replace(/\s+/g, '')}_${randomString}`;
    const password = Math.random().toString(36).slice(-10); // Password acak 10 karakter

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
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(userData)
    });

    const data = await response.json();
    if (!response.ok) {
        // Jika gagal, lemparkan error dengan pesan dari Pterodactyl
        throw new Error(data.errors ? data.errors[0].detail : 'Gagal membuat pengguna di panel.');
    }
    return { user: data.attributes, password: password };
}

/**
 * Fungsi untuk membuat server baru di Pterodactyl.
 * @param {string} serverName - Nama untuk server baru.
 * @param {string} memory - Alokasi memori dalam MB.
 * @param {number} pterodactylUserId - ID dari pengguna yang akan menjadi pemilik server.
 * @returns {Promise<object>} - Objek berisi atribut server yang baru dibuat.
 */
async function createServer(serverName, memory, pterodactylUserId) {
    const pterodactyl = config.pterodactyl;
    // Membangun URL API yang benar untuk membuat server
    const url = `${pterodactyl.domain}/api/application/servers`;

    const serverData = {
        name: serverName,
        user: pterodactylUserId,
        egg: pterodactyl.eggId,
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_18", // Anda bisa sesuaikan ini jika perlu
        startup: "if [[ -d .git ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ -f /home/container/package.json ]]; then /usr/local/bin/npm install; fi; node index.js",
        environment: {
            CMD_RUN: "node index.js" // Sesuaikan nama file utama jika bukan index.js
        },
        limits: {
            memory: parseInt(memory, 10),
            swap: 0,
            disk: pterodactyl.disk,
            io: 500,
            cpu: pterodactyl.cpu,
        },
        feature_limits: { 
            databases: 1, 
            allocations: 1, 
            backups: 1 
        },
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
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(serverData)
    });

    const data = await response.json();
    if (!response.ok) {
        // Jika gagal, lemparkan error dengan pesan dari Pterodactyl
        throw new Error(data.errors ? data.errors[0].detail : 'Gagal membuat server di panel.');
    }
    return data.attributes;
}

// Handler utama yang dieksekusi oleh Vercel saat ada request ke /api/create
module.exports = async (req, res) => {
    // Hanya izinkan metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { serverName, ram } = req.body;
    if (!serverName || !ram) {
        return res.status(400).json({ message: 'Nama server dan RAM wajib diisi.' });
    }

    try {
        // Langkah 1: Buat pengguna baru terlebih dahulu
        console.log(`Mencoba membuat pengguna untuk server: ${serverName}`);
        const { user, password } = await createUser(serverName);
        console.log(`Pengguna berhasil dibuat dengan ID: ${user.id}`);

        // Langkah 2: Gunakan ID pengguna baru untuk membuat server
        console.log(`Mencoba membuat server untuk pengguna ID: ${user.id}`);
        const serverInfo = await createServer(serverName, ram, user.id);
        console.log(`Server berhasil dibuat dengan nama: ${serverInfo.name}`);

        // Langkah 3: Kirim respons sukses dalam format JSON yang benar
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
        // Jika terjadi error di salah satu langkah, kirim respons error
        console.error('Terjadi kesalahan pada proses API:', error);
        res.status(500).json({ message: error.message });
    }
};
