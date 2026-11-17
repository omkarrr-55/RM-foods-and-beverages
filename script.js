const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const currentYear = document.querySelector("#current-year");
const enquiryForm = document.querySelector("#enquiry-form");
const brandTiles = document.querySelectorAll(".brand-tile");
const mapDetail = document.querySelector("#map-detail");
const mapContainer = document.querySelector("#india-leaflet-map");
const footerTopLinks = document.querySelectorAll(".footer-top");
const sectionLinks = document.querySelectorAll('.hero-actions a[href^="#"]');
const siteHeader = document.querySelector(".site-header");
const scrollProgressBar = document.querySelector("#scroll-progress");
const heroSection = document.querySelector(".hero");
const heroShowcase = document.querySelector(".hero-showcase");

/* --------------------------------------------------------------------------
   Top Scroll Progress & Sticky Glass Header Animation
   -------------------------------------------------------------------------- */
const updateScrollState = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;

  if (docHeight > 0 && scrollProgressBar) {
    const progress = Math.min(Math.max((scrollTop / docHeight) * 100, 0), 100);
    scrollProgressBar.style.width = `${progress}%`;
  }

  if (siteHeader) {
    siteHeader.classList.toggle("is-scrolled", scrollTop > 30);
  }
};

let isScrollTicking = false;
window.addEventListener(
  "scroll",
  () => {
    if (!isScrollTicking) {
      window.requestAnimationFrame(() => {
        updateScrollState();
        isScrollTicking = false;
      });
      isScrollTicking = true;
    }
  },
  { passive: true }
);

updateScrollState();

/* --------------------------------------------------------------------------
   Scroll-Driven Reveal System (IntersectionObserver)
   -------------------------------------------------------------------------- */
const revealElements = document.querySelectorAll("[data-scroll-reveal]");
if ("IntersectionObserver" in window && revealElements.length) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.12,
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));
} else {
  revealElements.forEach((el) => el.classList.add("is-revealed"));
}

/* --------------------------------------------------------------------------
   Live Metric Number Counters on Scroll
   -------------------------------------------------------------------------- */
const metricBand = document.querySelector(".metric-band");
const counterElements = document.querySelectorAll(".counter-val");

const animateCounters = () => {
  counterElements.forEach((counter) => {
    const target = parseInt(counter.getAttribute("data-target"), 10);
    const start = parseInt(counter.getAttribute("data-start") || "0", 10);
    const suffix = counter.getAttribute("data-suffix") || "";
    const duration = 1600;
    const startTime = performance.now();

    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeProgress);

      counter.textContent = `${current}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        counter.textContent = `${target}${suffix}`;
      }
    };

    requestAnimationFrame(updateCount);
  });
};

if (metricBand && "IntersectionObserver" in window) {
  const metricObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounters();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 }
  );

  metricObserver.observe(metricBand);
}

/* --------------------------------------------------------------------------
   2. "Flying" Entrance Animation (On Page Load)
   Swoop bottle cluster in diagonally from top-right:
   (x: 100, y: -80, scale: 0.85, rotate: 5deg) -> (x: 0, y: 0, scale: 1, rotate: 0deg)
   with crisp spring settle physics (duration: 1.0s, stiffness: 110, damping: 14)
   -------------------------------------------------------------------------- */
const bottleStage = document.querySelector(".hero-visual-reveal");
let flyingEntranceComplete = false;

if (window.gsap && bottleStage && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  gsap.fromTo(
    bottleStage,
    {
      x: 100,
      y: -80,
      scale: 0.85,
      rotation: 5,
      opacity: 0,
    },
    {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
      duration: 1.0,
      delay: 0.35,
      ease: "back.out(1.6)", // Crisp spring settle physics
      onComplete: () => {
        flyingEntranceComplete = true;
      },
    }
  );
} else {
  setTimeout(() => {
    flyingEntranceComplete = true;
  }, 1400);
}

/* --------------------------------------------------------------------------
   4. Interactive 3D Tilt on Mouse Hover & Icy Light Glint Sweep
   - Perspective wrapper: .hero-showcase (perspective: 1000px)
   - Smooth ±8deg rotateX / rotateY tilt tracking cursor across the hero
   - Dynamic specular icy light glint sweep across bottles
   -------------------------------------------------------------------------- */
const bottleTiltStage = document.querySelector(".bottle-tilt-target") || document.querySelector(".product-photo-stage");
const glintSweep = document.querySelector(".bottle-glint-sweep");

if (
  heroSection &&
  bottleTiltStage &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  let tiltRaf = null;

  heroSection.addEventListener("mouseenter", () => {
    if (!flyingEntranceComplete) return;
    if (glintSweep && window.gsap) {
      gsap.fromTo(
        glintSweep,
        { xPercent: -100, yPercent: -20, opacity: 0 },
        { xPercent: 15, yPercent: 0, opacity: 0.88, duration: 0.65, ease: "power2.out" }
      );
    }
  });

  heroSection.addEventListener("mousemove", (event) => {
    if (!flyingEntranceComplete) return; // Never interrupt the flying entrance!
    if (tiltRaf) cancelAnimationFrame(tiltRaf);

    tiltRaf = requestAnimationFrame(() => {
      const rect = heroSection.getBoundingClientRect();
      // xRatio and yRatio: -0.5 (left/top) to +0.5 (right/bottom)
      const xRatio = (event.clientX - rect.left) / rect.width - 0.5;
      const yRatio = (event.clientY - rect.top) / rect.height - 0.5;

      // Smooth tilt up to ±8deg toward the cursor:
      // Cursor right (+x) -> face turns right (+rotateY) up to +8deg
      // Cursor left (-x) -> face turns left (-rotateY) down to -8deg
      // Cursor top (-y) -> face turns up (+rotateX) up to +8deg
      // Cursor bottom (+y) -> face turns down (-rotateX) down to -8deg
      const tiltY = Math.max(-8, Math.min(8, xRatio * 16));
      const tiltX = Math.max(-8, Math.min(8, -yRatio * 16));

      if (window.gsap) {
        gsap.to(bottleTiltStage, {
          rotateY: tiltY,
          rotateX: tiltX,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });

        if (glintSweep) {
          gsap.to(glintSweep, {
            xPercent: xRatio * 80,
            yPercent: yRatio * 50,
            opacity: 0.88,
            duration: 0.4,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      } else {
        bottleTiltStage.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
        bottleTiltStage.style.transition = "transform 0.15s ease-out";
        if (glintSweep) {
          glintSweep.style.transform = `translate3d(${(xRatio * 80).toFixed(1)}%, ${(yRatio * 50).toFixed(1)}%, 30px) rotate(25deg)`;
          glintSweep.style.opacity = "0.88";
        }
      }
    });
  });

  heroSection.addEventListener("mouseleave", () => {
    if (!flyingEntranceComplete) return;
    if (tiltRaf) cancelAnimationFrame(tiltRaf);

    if (window.gsap) {
      gsap.to(bottleTiltStage, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.75,
        ease: "power2.out",
        overwrite: "auto",
      });

      if (glintSweep) {
        gsap.to(glintSweep, {
          xPercent: -60,
          yPercent: -15,
          opacity: 0,
          duration: 0.55,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    } else {
      bottleTiltStage.style.transform = "rotateX(0deg) rotateY(0deg)";
      bottleTiltStage.style.transition = "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
      if (glintSweep) glintSweep.style.opacity = "0";
    }
  });
}

const scrollToSection = (target) => {
  const headerOffset = document.querySelector(".site-header")?.offsetHeight || 0;
  const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
};

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

footerTopLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

sectionLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));

    if (!target) {
      return;
    }

    event.preventDefault();
    scrollToSection(target);
  });
});

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      const target = document.querySelector(event.target.getAttribute("href"));

      if (target) {
        event.preventDefault();
      }

      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");

      if (target) {
        scrollToSection(target);
      }
    }
  });
}

if (enquiryForm) {
  enquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(enquiryForm);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const type = String(formData.get("type") || "General enquiry").trim();
    const message = String(formData.get("message") || "").trim();

    const lines = [
      "Hello RM Foods & Beverages,",
      "",
      name ? `Name: ${name}` : "",
      phone ? `Phone: ${phone}` : "",
      `Enquiry type: ${type}`,
      message ? `Message: ${message}` : "",
    ].filter(Boolean);

    const whatsappUrl = `https://wa.me/919822694556?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  });
}

if (mapDetail && mapContainer) {
  const locations = [
    {
      id: "pune",
      type: "owned",
      label: "Pune",
      kicker: "Owned manufacturing unit",
      title: "Pune Manufacturing Unit",
      address: "Sr. No. 13, Plot No. 6A/1/1B, Nanded Phata, Sinhagad Road, Pune - 411041",
      manufactures: "Packaged drinking water, including Rococo railway-approved brand, and flavoured soft drinks",
      status: "Core RM Foods & Beverages production facility",
      coordinates: [18.4575, 73.7997],
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=Sr.%20No.%2013%2C%20Plot%20No.%206A%2F1%2F1B%2C%20Nanded%20Phata%2C%20Sinhagad%20Road%2C%20Pune%20411041",
    },
    {
      id: "rm-foods-unit-2-pune",
      type: "owned",
      label: "Pune Unit 2",
      kicker: "Owned manufacturing unit",
      title: "RM Foods & Beverages Unit 2",
      address:
        "Sr. No. 24/7, Jadhavrao Industrial Estate, near Nanded City, Sinhagad Road, Pune - 411041, Maharashtra",
      manufactures: "RM Foods & Beverages products",
      status: "Unit 2 manufacturing facility",
      coordinates: [18.4561, 73.7855],
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=SR%20NO%2024%2F7%20Jadhavrao%20Industrial%20Estate%20near%20Nanded%20City%20Sinhagad%20Road%20Pune%20411041%20Maharashtra",
    },
    {
      id: "aashirwad-nandurbar",
      type: "copack",
      label: "Nandurbar",
      kicker: "Manufacturing partner",
      title: "Aashirwad Industries",
      address: "Shiv Park-2, Vaghoda Road, Nandurbar",
      manufactures: "Rococo packaged drinking water, railway-approved brand",
      status: "Partner unit",
      coordinates: [21.3759, 74.2428],
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=Shiv%20Park-2%2C%20Vaghoda%20Road%2C%20Nandurbar",
    },
    {
      id: "rv-beverages-pune",
      type: "dd",
      label: "Pune DD",
      kicker: "Double Dhamaal manufacturing unit",
      title: "R V Beverages",
      address:
        "Gat No. 60, Gorhe Bk., near Dharmaji Maharaj Mandir, Khadakwasla, Sinhgad Road, Tal. Haveli, Dist. Pune - 411025, Maharashtra",
      manufactures: "Double Dhamaal flavoured soft drinks",
      status: "Manufacturing unit",
      coordinates: [18.4258, 73.7538],
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=Gat%20No.%2060%20Gorhe%20Bk%20Near%20Dharmaji%20Maharaj%20Mandir%20Khadakwasla%20Sinhgad%20Road%20Tal%20Haveli%20Dist%20Pune%20411025%20Maharashtra",
    },
    {
      id: "bhavani-surat",
      type: "copack",
      label: "Surat",
      kicker: "Manufacturing partner",
      title: "Bhavani Health Care",
      address: "75 Patel Nagar Society, A.K. Road, Surat, Gujarat - 395006",
      manufactures: "Rococo packaged drinking water, railway-approved brand",
      status: "Partner unit",
      coordinates: [21.2054, 72.8407],
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=75%20Patel%20Nagar%20Society%2C%20A.K.%20Road%2C%20Surat%2C%20Gujarat%20395006",
    },
    {
      id: "gangwal-indore",
      type: "copack",
      label: "Indore",
      kicker: "Manufacturing partner",
      title: "Gangwal Beverages",
      address: "33-34, Pipliya Rao, AB Road, Indore - 452001",
      manufactures: "Rococo packaged drinking water, railway-approved brand",
      status: "Partner unit",
      coordinates: [22.7196, 75.8577],
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=33-34%2C%20Pipliya%20Rao%2C%20AB%20Road%2C%20Indore%20452001",
    },
    {
      id: "millenium-shahapur",
      type: "copack",
      label: "Shahapur",
      kicker: "Manufacturing partner",
      title: "Millenium Aqua",
      address: "Sr. No. 39/1/B, Village Hedvali (Dolkhamb), Shahapur, Thane - 421601",
      manufactures: "Rococo packaged drinking water, railway-approved brand",
      status: "Partner unit",
      coordinates: [19.4559, 73.3273],
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=Hedvali%20Dolkhamb%20Shahapur%20Thane%20421601",
    },
    {
      id: "rewa-rajkot",
      type: "copack",
      label: "Rajkot",
      kicker: "Manufacturing partner",
      title: "Rewa Beverages",
      address: "Plot No. 3, Sr. No. 11, Nani Amreli Khirasara, Sarapdad Road, Rajkot - 360110",
      manufactures: "Rococo packaged drinking water, railway-approved brand",
      status: "Partner unit",
      coordinates: [22.3039, 70.8022],
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=Nani%20Amreli%20Khirasara%20Sarapdad%20Road%20Rajkot%20360110",
    },
    {
      id: "laxmi-vadodara",
      type: "copack",
      label: "Vadodara",
      kicker: "Manufacturing partner",
      title: "Laxmi Enterprises / Aditya Corporation",
      address: "Geet Gunjan, Dayal Baug Society, Near Deep Chamber, Vadodara Manjalpur, Gujarat - 390011",
      manufactures: "Rococo packaged drinking water, railway-approved brand",
      status: "Partner unit",
      coordinates: [22.2734, 73.1887],
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=Geet%20Gunjan%20Dayal%20Baug%20Society%20Near%20Deep%20Chamber%20Vadodara%20Manjalpur%20390011",
    },
    {
      id: "gmg-ratnagiri",
      type: "copack",
      label: "Ratnagiri",
      kicker: "Manufacturing partner",
      title: "GMG Foods and Beverages",
      address: "C-219 MIDC, Mirjole, Dist. Ratnagiri, Maharashtra - 415639",
      manufactures: "Rococo packaged drinking water, railway-approved brand",
      status: "Partner unit",
      coordinates: [16.9902, 73.312],
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=C-219%20MIDC%20Mirjole%20Ratnagiri%20Maharashtra%20415639",
    },
    {
      id: "rc-aurangabad",
      type: "copack",
      label: "Aurangabad",
      kicker: "Manufacturing partner",
      title: "R C Enterprises",
      address: "16A, Ramanand Colony, Kranti Chowk, Aurangabad - 431001",
      manufactures: "Rococo packaged drinking water, railway-approved brand",
      status: "Partner unit",
      coordinates: [19.8762, 75.3433],
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=16A%20Ramanand%20Colony%20Kranti%20Chowk%20Aurangabad%20431001",
    },
  ];

  const locationLookup = Object.fromEntries(locations.map((location) => [location.id, location]));
  const markerLookup = {};

  const updateMapDetail = (locationId) => {
    const location = locationLookup[locationId];

    if (!location) {
      return;
    }

    mapDetail.innerHTML = `
      <p class="map-detail-kicker">${location.kicker}</p>
      <h3>${location.title}</h3>
      <dl>
        <div>
          <dt>Address</dt>
          <dd>${location.address}</dd>
        </div>
        <div>
          <dt>Manufactures / supplies</dt>
          <dd>${location.manufactures}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>${location.status}</dd>
        </div>
      </dl>
      <a class="map-detail-link" href="${location.mapsUrl}" target="_blank" rel="noopener noreferrer">
        Open location in Google Maps
      </a>
    `;

    Object.entries(markerLookup).forEach(([id, marker]) => {
      marker.getElement()?.classList.toggle("is-active", id === locationId);
    });
  };

  if (window.L) {
    const indiaBounds = L.latLngBounds(
      [6.5, 68],
      [35.8, 97.5],
    );
    const map = L.map(mapContainer, {
      maxBounds: indiaBounds.pad(0.18),
      maxBoundsViscosity: 0.85,
      minZoom: 3,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(map);

    const locationBounds = L.latLngBounds(locations.map((location) => location.coordinates));
    const fitIndiaMap = () => {
      const targetBounds = mapContainer.clientWidth < 480
        ? locationBounds.pad(0.32)
        : locationBounds.pad(0.28);

      map.invalidateSize();
      map.fitBounds(targetBounds, {
        animate: false,
        padding: [16, 16],
      });
    };

    fitIndiaMap();

    locations.forEach((location) => {
      const puneMarkerAnchors = {
        "rm-foods-unit-2-pune": [45, 11],
        "rv-beverages-pune": [-23, 11],
      };
      const icon = L.divIcon({
        className: `leaflet-network-pin ${location.type} location-${location.id}`,
        html: `<span>${location.label}</span>`,
        iconSize: [22, 22],
        iconAnchor: puneMarkerAnchors[location.id] || [11, 11],
      });
      const marker = L.marker(location.coordinates, { icon }).addTo(map);

      marker.on("click", () => {
        updateMapDetail(location.id);
        map.panTo(location.coordinates, { animate: true });
      });
      markerLookup[location.id] = marker;
    });

    updateMapDetail("pune");
    requestAnimationFrame(fitIndiaMap);
    window.addEventListener("load", fitIndiaMap, { once: true });
    window.addEventListener("resize", fitIndiaMap);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "map-fallback";
    fallback.innerHTML = `
      <strong>Map loading needs internet access.</strong>
      <span>Select a location below to view details.</span>
    `;

    const fallbackList = document.createElement("div");
    fallbackList.className = "map-fallback-list";
    locations.forEach((location) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = location.label;
      button.addEventListener("click", () => updateMapDetail(location.id));
      fallbackList.append(button);
    });

    fallback.append(fallbackList);
    mapContainer.append(fallback);
    updateMapDetail("pune");
  }
}

if (brandTiles.length) {
  const lightbox = document.createElement("div");
  lightbox.className = "product-lightbox";
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <button class="product-lightbox-close" type="button" aria-label="Close product image">&times;</button>
    <div class="product-lightbox-panel" role="dialog" aria-modal="true" aria-label="Product image preview">
      <img alt="" />
      <p class="product-lightbox-caption"></p>
    </div>
  `;

  document.body.append(lightbox);

  const lightboxImage = lightbox.querySelector("img");
  const lightboxCaption = lightbox.querySelector(".product-lightbox-caption");
  const lightboxClose = lightbox.querySelector(".product-lightbox-close");

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-lightbox-open");
  };

  const openLightbox = (tile) => {
    const image = tile.querySelector("img");
    const title = tile.closest(".brand-card")?.querySelector("h3")?.textContent || image.alt;

    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = title;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-lightbox-open");
    lightboxClose.focus();
  };

  brandTiles.forEach((tile) => {
    const image = tile.querySelector("img");

    if (!image) {
      return;
    }

    tile.setAttribute("role", "button");
    tile.setAttribute("tabindex", "0");
    tile.setAttribute("aria-label", `View larger image: ${image.alt}`);

    tile.addEventListener("click", () => openLightbox(tile));
    tile.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(tile);
      }
    });
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
}
