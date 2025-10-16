// Konfigurasi untuk website creator Pterodactyl

const config = {
    // Pengaturan Pterodactyl Panel Anda
    pterodactyl: {
        // Ganti dengan URL panel Anda
        // SALAH: "https://zeroikdarkonly.jkt48-private.com"
        // BENAR:
        domain: "https://zeroikdarkonly.jkt48-private.com", // Biarkan ini sebagai domain utama
        
        // Ganti dengan Application API Key Anda
        apiKey: "ptla_kZhcIqvgX6NgXkTKdSFnEwUt5aV13Q4Q6kdR9C9OqbN", 
        
        // GANTI DENGAN PENGATURAN SERVER DEFAULT ANDA
        eggId: 15,          // ID dari Egg yang akan digunakan (misal: 15 untuk Node.js)
        locationId: 1,      // ID dari Lokasi (Node) tempat server akan dibuat
        disk: 5120,         // Alokasi disk dalam MB (misal: 5120 untuk 5GB)
        cpu: 100,           // Alokasi CPU dalam persen (misal: 100 untuk 1 core)
    }
};

module.exports = config;
