document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createServerForm');
    const submitButton = document.getElementById('submitButton');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset state
        submitButton.disabled = true;
        submitButton.textContent = 'Membuat...';
        resultDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');

        const serverName = document.getElementById('serverName').value;
        const ram = document.getElementById('ram').value;

        try {
            const response = await fetch('/api/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverName, ram })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Terjadi kesalahan yang tidak diketahui.');
            }

            // Tampilkan hasil jika sukses
            document.getElementById('panelUrl').href = data.panelUrl;
            document.getElementById('panelUrl').textContent = data.panelUrl;
            document.getElementById('username').textContent = data.loginDetails.username;
            document.getElementById('email').textContent = data.loginDetails.email;
            document.getElementById('password').textContent = data.loginDetails.password;
            resultDiv.classList.remove('hidden');
            form.reset();

        } catch (err) {
            // Tampilkan error
            errorDiv.textContent = `❌ Gagal! ${err.message}`;
            errorDiv.classList.remove('hidden');
        } finally {
            // Kembalikan tombol ke state normal
            submitButton.disabled = false;
            submitButton.textContent = 'Buat Server Sekarang';
        }
    });
});
