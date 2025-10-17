// ==============================
//   Cursos disponibles (JS)
// ==============================
const cursos = {
  "81": "Common Data Environment con Trimble Connect (antiguo)",
  "89": "Componentes Personalizados en Tekla Structures",
  "96": "Optimización de flujos BIM con Trimble Connect",
  "98": "Fundamentos Tekla Structures Hormigón (Antiguo)",
  "113": "Editor de cuadros en Tekla Structures",
  "114": "Gestión de la numeración de Tekla Structures",
  "115": "Macros de Construsoft para Tekla Structures",
  "116": "Detallado de Elementos Prefabricados en Tekla Structures",
  "135": "Análisis y diseño de edificaciones con Tekla Structural Designer",
  "141": "Teoría y cálculo de elementos HA con IDEA STATICA",
  "149": "Fundamentos Tekla Structures Acero",
  "174": "CDE | Gestión y coordinación de proyectos BIM con Trimble Connect",
  "195": "Fundamentos Tekla Structures Hormigón",
  "240": "Curso Modelado de Estructuras con Tekla Structures - EUDE",
  "212": "Dibujos Avanzados en Tekla Structures Acero",
  "161": "Dibujos Avanzados en Tekla Structures Hormigón",
  "144": "Interoperabilidad con Tekla Structures",
  "73": "Calculo de resistencia al fuego y protección pasiva",
  "52": "Curso completo de cálculo de estructuras con Diamonds",
  "53": "Diseño avanzado de acero con consteel ",
  "191": "Cálculo de estructuraas de acero conformado en frio y steelf raming",
  "244": "Optimización y calculo de huella de carbono con TSD y One click",
  "126": "Parametrización del cálculo de estructuras y modelos BIM",
  "29": "Análisis y diseño sísmico de placas base según norma AISC",
  "28": "Dimensionado y detalladode conexiones en acero para proyectistas según AISC",
  "30": "Análisis y diseño de conexiones en porticos a momentosegú norma AISC"
};

// ==============================
//   Helpers UI (botón + spinner)
// ==============================
function disableSendBtn() {
  const btn = document.getElementById("send");
  if (!btn) return;
  btn.disabled = true;
  // agrega spinner si no existe
  if (!btn.querySelector(".button__spinner")) {
    const sp = document.createElement("span");
    sp.className = "button__spinner";
    btn.prepend(sp);
  }
}
function enableSendBtn() {
  const btn = document.getElementById("send");
  if (!btn) return;
  btn.disabled = false;
  const sp = btn.querySelector(".button__spinner");
  if (sp) sp.remove();
}

// ==============================
//   Callbacks reCAPTCHA (global)
// ==============================
function submitExtensionForm() {
  const form = document.getElementById("extendForm");
  if (!form) return;

  // Enviar (ya está bloqueado el botón)
  try { form.submit(); } catch (e) { console.error(e); enableSendBtn(); }
}

function onCaptchaExpired() {
  // Si el captcha expira, reactivar botón
  enableSendBtn();
  try { grecaptcha.reset(); } catch (_) {}
}
function onCaptchaError() {
  // Si el captcha falla, reactivar botón
  enableSendBtn();
  try { grecaptcha.reset(); } catch (_) {}
}

// Si el usuario vuelve con back/forward, asegura estado limpio
window.addEventListener("pageshow", () => enableSendBtn());

// ==============================
//   Lógica de UI/Validación
// ==============================
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("extendForm");
  const sendBtn = document.getElementById("send");
  const selectCursos = document.getElementById("courseid");

  // Poblar dinámicamente el select de cursos
  if (selectCursos) {
    Object.entries(cursos).forEach(([id, nombre]) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = nombre;
      selectCursos.appendChild(opt);
    });
  }

  if (!form || !sendBtn) return;

  sendBtn.addEventListener("click", function (e) {
    e.preventDefault();

    // Validación nativa (incluye checkboxes required)
    if (!form.checkValidity()) {
      form.reportValidity?.();
      return;
    }

    // Bloquear botón y mostrar spinner ANTES del captcha
    disableSendBtn();

    // Ejecutar reCAPTCHA Invisible
    if (typeof grecaptcha !== "undefined" && grecaptcha.execute) {
      try {
        try { grecaptcha.reset(); } catch (_) {}
        grecaptcha.execute();
      } catch (err) {
        console.error("[reCAPTCHA execute error]", err);
        enableSendBtn(); // si falla el execute, reactivamos
        form.submit();   // fallback
      }
    } else {
      // Si el script de Google no cargó, enviar directo
      form.submit();
    }

    // Failsafe: si no hay navegación en 20s, reactivar el botón
    window.__sendFailSafe = window.setTimeout(() => {
      enableSendBtn();
      console.warn("[Send] Timeout sin navegación; revisa red/servidor.");
    }, 20000);
  });
});
