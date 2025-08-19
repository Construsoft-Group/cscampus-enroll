// Validación solo en el front con reCAPTCHA invisible (como beca)
(function () {
  const form = document.getElementById('extendForm');
  if (!form) return;

  // En cada submit: resetea y ejecuta para generar token fresco
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (typeof grecaptcha !== 'undefined') {
      try { grecaptcha.reset(); } catch (_) {}
      grecaptcha.execute();
    } else {
      form.submit(); // fallback
    }
  });

  // Google llama este callback cuando el challenge fue OK y hay token
  window.onCaptchaOk = function onCaptchaOk() {
    // En este punto ya existe un g-recaptcha-response válido en el form
    form.submit();
  };

  // Si expira mientras el usuario diligencia, regeneramos
  window.onCaptchaExpired = function onCaptchaExpired() {
    try { grecaptcha.reset(); grecaptcha.execute(); } catch (_) {}
  };

  // Ante error de red u otro, resetea para reintentar
  window.onCaptchaError = function onCaptchaError() {
    try { grecaptcha.reset(); } catch (_) {}
  };
})();
