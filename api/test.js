const fetch = require('node-fetch');
const config = require('../config.js');

module.exports = async (req, res) => {
    const pterodactyl = config.pterodactyl;
    const url = `${pterodactyl.domain}/api/application/users`; // Endpoint API paling sederhana

    try {
        console.log(`Mencoba menghubungi: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET', // Hanya meminta data, tidak membuat apa-apa
            headers: {
                'Authorization': `Bearer ${pterodactyl.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // PENTING: Kita ambil respons sebagai TEKS MENTAH, bukan JSON
        const rawText = await response.text();

        console.log("Mendapat respons mentah dari server:", rawText);

        // Kirimkan teks mentah itu ke browser agar bisa kita lihat
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(`
Status Kode dari Server Anda: ${response.status} (${response.statusText})

--- JAWABAN MENTAH DARI SERVER ANDA ---

${rawText}
        `);

    } catch (error) {
        console.error("Gagal menghubungi server:", error);
        res.status(500).send("Gagal total saat mencoba menghubungi server Anda. Error: " + error.message);
    }
};
