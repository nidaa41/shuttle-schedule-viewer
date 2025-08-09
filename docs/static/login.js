document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const msg = document.getElementById('redirect-msg');
    const errorMsg = document.getElementById('error-msg');

    // Hide error message on new submit
    errorMsg.style.display = 'none';
    
    try {
        const res = await fetch('/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const result = await res.json();

        if (result.success) {
            msg.style.display = 'block';

            setTimeout(() => {
                window.location.href = '/admin.html';
            }, 1500);

        } else {
            errorMsg.style.display = 'block'; 
        }
    } catch (err) {
        console.error('Login error:', err);
        alert('Something went wrong');
        errorMsg.style.display = 'block';
    }
});
