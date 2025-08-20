// Debe existir global para el callback del captcha
function submitExtensionForm() {
  const form = document.getElementById("extendForm");
  if (!form) return;
  // Usar requestSubmit para NO saltarse validaciones nativas si se dispara manualmente
  if (typeof form.requestSubmit === "function") {
    form.requestSubmit();
  } else {
    form.submit();
  }
}

function onCaptchaExpired() { try { grecaptcha.reset(); } catch (_) {} }
function onCaptchaError()   { try { grecaptcha.reset(); } catch (_) {} }

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("extendForm");
  const sendBtn = document.getElementById("send");
  if (!form || !sendBtn) return;

  sendBtn.addEventListener("click", function (e) {
    e.preventDefault();

    // ✅ Valida TODOS los required (incluye privacy y commitment)
    if (!form.checkValidity()) {
      // muestra los mensajes nativos del navegador
      form.reportValidity?.();
      return;
    }

    // Si pasa la validación, ejecuta reCAPTCHA Invisible
    if (typeof grecaptcha !== "undefined" && grecaptcha.execute) {
      try {
        try { grecaptcha.reset(); } catch (_) {}
        grecaptcha.execute();
      } catch (err) {
        console.error("[reCAPTCHA execute error]", err);
        // Fallback si algo falla
        if (typeof form.requestSubmit === "function") {
          form.requestSubmit();
        } else {
          form.submit();
        }
      }
    } else {
      // Fallback si reCAPTCHA no cargó
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.submit();
      }
    }
  });
});
