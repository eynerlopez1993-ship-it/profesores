// ==============================================
// JS PRINCIPAL - Deutsche Schule Managua
// ==============================================

/* ===========================
   MENÚ MÓVIL
   - Abre/cierra menú
   - Cambia icono hamburguesa/X
=========================== */
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const iconPath = document.querySelector('#icon-menu path');
const menuLinks = document.querySelectorAll('.menu-link');

if (menuBtn && mobileMenu && iconPath) {
  menuBtn.addEventListener('click', () => {
    const isOpen = !mobileMenu.classList.contains("hidden");

    if (isOpen) {
      // Cerrar menú
      mobileMenu.classList.add("opacity-0");
      setTimeout(() => {
        mobileMenu.classList.add("hidden");
        iconPath.setAttribute("d", "M4 6h16M4 12h16M4 18h16"); // hamburguesa
      }, 300);
    } else {
      // Abrir menú
      mobileMenu.classList.remove("hidden");
      setTimeout(() => mobileMenu.classList.remove("opacity-0"), 10);
      iconPath.setAttribute("d", "M6 18L18 6M6 6l12 12"); // X
    }
  });

  // Cerrar menú al hacer click en un enlace
  menuLinks.forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("opacity-0");
      setTimeout(() => {
        mobileMenu.classList.add("hidden");
        iconPath.setAttribute("d", "M4 6h16M4 12h16M4 18h16"); // hamburguesa
      }, 300);
    });
  });
}

/* ===========================
   FLIP CARDS
   - Tarjetas que giran al hacer click
   - Se cierran automáticamente en 1 minuto
=========================== */
const cards = document.querySelectorAll('.flip-card');
let activeCard = null;
let activeTimer = null;

function flipCard(inner) {
  if (!inner) return;

  // Cerrar tarjeta activa si no es la misma
  if (activeCard && activeCard !== inner) {
    activeCard.classList.remove('flipped');
    if (activeTimer) clearTimeout(activeTimer);
    activeCard = null;
  }

  // Si la tarjeta ya estaba abierta, la cerramos
  if (inner.classList.contains('flipped')) {
    inner.classList.remove('flipped');
    if (activeTimer) clearTimeout(activeTimer);
    activeCard = null;
    return;
  }

  // Abrir la tarjeta
  inner.classList.add('flipped');
  activeCard = inner;

  // Timer de 1 minuto para cerrarla automáticamente
  activeTimer = setTimeout(() => {
    inner.classList.remove('flipped');
    activeCard = null;
    activeTimer = null;
  }, 60000);
}

// Asignar eventos a cada tarjeta
cards.forEach(card => {
  const inner = card.querySelector('.flip-card-inner');
  if (!inner) return;

  card.addEventListener('click', () => flipCard(inner));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flipCard(inner);
    }
  });
});

/* ===========================
   VALIDACIÓN DE CORREO INSTITUCIONAL
   - Solo acepta *@dsm.edu.ni
=========================== */
const correoInput = document.getElementById("correo");
const errorCorreo = document.getElementById("errorCorreo");

function validateCorreo(showMessage = true) {
  if (!correoInput) return true;

  const regex = /^[a-zA-Z0-9._%+-]+@dsm\.edu\.ni$/;
  const value = correoInput.value.trim();

  if (value === "") {
    if (showMessage) errorCorreo?.classList.add("hidden");
    correoInput.setCustomValidity("");
    return true;
  } else if (!regex.test(value)) {
    if (showMessage) errorCorreo?.classList.remove("hidden");
    correoInput.setCustomValidity("El correo debe terminar en @padre.dsm.edu.ni");
    return false;
  } else {
    if (showMessage) errorCorreo?.classList.add("hidden");
    correoInput.setCustomValidity("");
    return true;
  }
}

// Validación en tiempo real
correoInput?.addEventListener("input", () => validateCorreo(true));

/* ===========================
   FORMULARIO AYUDA
   - Envío via Google Apps Script
   - Modal de carga
   - Autoguardado en localStorage (1 min)
=========================== */
const form = document.getElementById('formAyuda');
const loadingModal = document.getElementById('loadingModal');
const STORAGE_KEY = "formAyudaData";
const EXPIRATION_MINUTES = 1;

if (form) {
  // Restaurar datos de localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const ageMs = Date.now() - (data.timestamp || 0);
      if (data.timestamp && ageMs <= EXPIRATION_MINUTES * 60 * 1000) {
        ["nombre","correo","destinatario","mensaje"].forEach(name => {
          if (form.elements[name] && data[name] !== undefined) {
            form.elements[name].value = data[name];
          }
        });
        validateCorreo(false);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch(e) { console.error(e); }

  // Guardar en localStorage con debounce
  let timer;
  form.addEventListener("input", (ev) => {
    if (ev.target === correoInput) validateCorreo(true);
    clearTimeout(timer);
    timer = setTimeout(() => {
      const payload = { timestamp: Date.now() };
      ["nombre","correo","destinatario","mensaje"].forEach(name => {
        payload[name] = form.elements[name]?.value || "";
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, 300);
  });

  // Envío del formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateCorreo(true)) return correoInput.focus();

    loadingModal?.classList.remove("hidden");
    document.body.classList.add("modal-open");

    const payload = {
      nombre: form.nombre.value,
      correo: form.correo.value,
      destinatario: form.destinatario.value,
      mensaje: form.mensaje.value
    };

    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbyrIn_ZpzHcokGIa37RsJFvPTGA66I1y367RK8PFCZSf0JOPQuyMRxMxfBzAeW1WnP9/exec", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.status === "ok") {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "gracias.html";
      } else {
        loadingModal?.classList.add("hidden");
        document.body.classList.remove("modal-open");
        alert("❌ Hubo un error: " + result.message);
      }
    } catch(err) {
      loadingModal?.classList.add("hidden");
      document.body.classList.remove("modal-open");
      alert("⚠️ No se pudo conectar con el servidor");
      console.error(err);
    }
  });
}

/* ===========================
   INTERSECCIÓN Y ANIMACIONES
   - Fade, slide y animación secuencial
=========================== */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      const target = entry.target;

      if(target.id === 'cards-container'){
        target.querySelectorAll('a').forEach((el, i) => {
          el.style.animation = `fadeInUp 0.6s forwards`;
          el.style.animationDelay = `${i*0.15}s`;
        });
      } else if(target.id === 'avisos-container'){
        target.querySelectorAll('div').forEach((el, i) => {
          el.style.animation = `fadeInUp 0.6s forwards`;
          el.style.animationDelay = `${i*0.2}s`;
        });
      } else if(target.closest('#maps-container')){
        const delay = target.dataset.delay || 0;
        target.style.animation = `fadeInUp 0.8s forwards`;
        target.style.animationDelay = `${delay}s`;
      } else {
        if(target.classList.contains('fade-in-up')) target.style.animation='fadeInUp 0.8s forwards';
        if(target.classList.contains('slide-left')) target.style.animation='slideInLeft 0.8s forwards';
        if(target.classList.contains('slide-right')) target.style.animation='slideInRight 0.8s forwards';
      }

      observer.unobserve(target);
    }
  });
},{threshold:0.2});

// Selecciona todos los elementos a observar
document.querySelectorAll('.fade-in-up,.slide-left,.slide-right,#cards-container,#avisos-container,#maps-container .fade-in-up')
  .forEach(el => observer.observe(el));

/* ===========================
   SLIDESHOW
   - Cambio automático cada 5s
   - Botones prev/next
   - Verifica que la imagen exista
=========================== */
const images = [
  {name:"1.jpg", url:"https://padrescolegio.dsm.edu.ni/images/1.jpg"},
  {name:"2.jpg", url:"https://padrescolegio.dsm.edu.ni/images/2.jpg"},
  {name:"3.jpg", url:"https://padrescolegio.dsm.edu.ni/images/3.jpg"},
  {name:"4.jpg", url:"https://padrescolegio.dsm.edu.ni/images/4.jpg"},
  {name:"5.jpg", url:"https://padrescolegio.dsm.edu.ni/images/5.jpg"},
  {name:"6.jpg", url:"https://padrescolegio.dsm.edu.ni/images/6.jpg"},
  {name:"7.jpg", url:"https://padrescolegio.dsm.edu.ni/images/7.jpg"},
  {name:"8.jpg", url:"https://padrescolegio.dsm.edu.ni/images/8.jpg"},
  {name:"9.jpg", url:"https://padrescolegio.dsm.edu.ni/images/9.jpg"},
  {name:"10.jpg", url:"https://padrescolegio.dsm.edu.ni/images/10.jpg"}
];

let current = 0;

// Cambiamos de id a clase
const img = document.querySelector(".slideshow-img");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

function imageExists(url) {
  return new Promise(resolve => {
    const testImg = new Image();
    testImg.onload = () => resolve(true);
    testImg.onerror = () => resolve(false);
    testImg.src = url;
  });
}

async function showImage(index){
  if(!img) return;
  img.classList.remove('show');

  let validIndex = index;
  let tries = 0;
  while (tries < images.length) {
    if(await imageExists(images[validIndex].url)) break;
    validIndex = (validIndex + 1) % images.length;
    tries++;
  }

  setTimeout(() => {
    img.src = images[validIndex].url;
    img.classList.add('show');
    current = validIndex;
  }, 300);
}

// Botones ahora por clase
prevBtn?.addEventListener('click', () => showImage((current - 1 + images.length) % images.length));
nextBtn?.addEventListener('click', () => showImage((current + 1) % images.length));

// Cambio automático cada 5s
setInterval(() => showImage((current + 1) % images.length), 5000);

// Mostrar primera imagen al cargar
showImage(current);

/* ===========================
   CHAT WHATSAPP
   - Abre burbuja
   - Envía mensaje y limpia input
=========================== */
const bubble = document.getElementById('chatBubble');
const chatWindow = document.getElementById('chatWindow');
const closeBtn = document.getElementById('closeChat');
const sendBtn = document.getElementById('sendMessage');
const userInput = document.getElementById('userMessage');
const chatBody = document.getElementById('chatBody');

bubble?.addEventListener('click', () => {
  chatWindow.style.display = 'flex';
  chatBody.scrollTop = chatBody.scrollHeight;
});

closeBtn?.addEventListener('click', () => chatWindow.style.display = 'none');

sendBtn?.addEventListener('click', () => {
  let text = userInput.value.trim() || "Hola Deutsche Schule Managua, necesito ayuda.";

  const msg = document.createElement('div');
  msg.classList.add('message', 'user');
  msg.textContent = text;
  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;

  const waUrl = `https://api.whatsapp.com/send/?phone=50588565989&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
  window.open(waUrl, '_blank');

  userInput.value = "";
  chatBody.scrollTop = chatBody.scrollHeight;
});


 const iframeWrapper = document.getElementById('iframe-wrapper');
  const alertMessage = document.getElementById('alert-message');
  const url = 'http://190.212.46.18:8080/';

  // Intentamos hacer fetch al recurso
  fetch(url, {mode: 'no-cors'}) // no-cors permite que no se rompa el JS aunque sea interna
    .then(() => {
      // Si la request pasa, insertamos el iframe
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.className = 'w-full h-[50vh] sm:h-[60vh] md:h-[75vh] lg:h-[80vh] border-0';
      iframe.allowFullscreen = true;
      iframeWrapper.appendChild(iframe);
    })
    .catch(() => {
      // Si falla, mostramos el mensaje
      alertMessage.style.display = 'block';
    });


/* ===========================
   MISC
   - Evitar scroll al recargar
=========================== */
window.addEventListener('beforeunload', () => window.scrollTo(0,0));


