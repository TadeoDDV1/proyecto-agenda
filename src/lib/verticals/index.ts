/**
 * Registro de giros de Pauta.
 *
 * Un giro define el vocabulario, el catálogo inicial, el acento y la plantilla
 * de portal. La estructura de agenda es compartida: no hay lógica por giro
 * fuera de este registro.
 */

export const VERTICAL_IDS = [
  "BARBERSHOP",
  "HAIR_SALON",
  "NAILS",
  "SPA",
  "MASSAGE",
  "DENTAL",
  "MEDICAL",
  "PHYSIO",
  "PSYCHOLOGY",
  "NUTRITION",
  "OPTOMETRY",
  "TATTOO",
  "VETERINARY",
  "OTHER",
] as const;

export type VerticalId = (typeof VERTICAL_IDS)[number];

export type PortalTemplate = "studio" | "clinic";

export interface VerticalTerms {
  service: string;
  services: string;
  professional: string;
  professionals: string;
  customer: string;
  customers: string;
  resource: string;
  appointment: string;
  appointments: string;
}

export interface VerticalPresetService {
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  description: string;
}

export interface VerticalConfig {
  id: VerticalId;
  label: string;
  shortLabel: string;
  group: "Belleza" | "Salud" | "Bienestar" | "Otros";
  accent: string;
  accentSoft: string;
  terms: VerticalTerms;
  portal: {
    template: PortalTemplate;
    sections: Array<
      "services" | "team" | "reviews" | "space" | "insurance" | "firstVisit"
    >;
  };
  presets: {
    categories: string[];
    services: VerticalPresetService[];
    staffRoles: string[];
  };
}

const beautyTerms: VerticalTerms = {
  service: "Servicio",
  services: "Servicios",
  professional: "Profesional",
  professionals: "Equipo",
  customer: "Cliente",
  customers: "Clientes",
  resource: "Silla",
  appointment: "Cita",
  appointments: "Citas",
};

const healthTerms: VerticalTerms = {
  service: "Tratamiento",
  services: "Tratamientos",
  professional: "Doctor",
  professionals: "Doctores",
  customer: "Paciente",
  customers: "Pacientes",
  resource: "Consultorio",
  appointment: "Consulta",
  appointments: "Consultas",
};

export const VERTICALS: Record<VerticalId, VerticalConfig> = {
  BARBERSHOP: {
    id: "BARBERSHOP",
    label: "Barbería",
    shortLabel: "Barbería",
    group: "Belleza",
    accent: "#C2410C",
    accentSoft: "#F6E3D8",
    terms: {
      ...beautyTerms,
      professional: "Barbero",
      professionals: "Barberos",
    },
    portal: {
      template: "studio",
      sections: ["services", "team", "reviews", "space"],
    },
    presets: {
      categories: ["Cortes", "Barba", "Paquetes"],
      staffRoles: ["Barbero", "Barbero senior"],
      services: [
        { name: "Corte clásico", category: "Cortes", durationMinutes: 30, price: 250, description: "Tijera y máquina, acabado a navaja." },
        { name: "Fade / degradado", category: "Cortes", durationMinutes: 40, price: 300, description: "Degradado milimétrico y diseño." },
        { name: "Arreglo de barba", category: "Barba", durationMinutes: 25, price: 200, description: "Perfilado, toalla caliente y aceite." },
        { name: "Afeitado tradicional", category: "Barba", durationMinutes: 35, price: 260, description: "Navaja, espuma templada y bálsamo." },
        { name: "Corte + barba", category: "Paquetes", durationMinutes: 60, price: 450, description: "El servicio completo." },
      ],
    },
  },

  HAIR_SALON: {
    id: "HAIR_SALON",
    label: "Salón de belleza",
    shortLabel: "Salón",
    group: "Belleza",
    accent: "#7C3AED",
    accentSoft: "#E9E1FB",
    terms: {
      ...beautyTerms,
      professional: "Estilista",
      professionals: "Estilistas",
    },
    portal: {
      template: "studio",
      sections: ["services", "team", "reviews", "space"],
    },
    presets: {
      categories: ["Corte y peinado", "Color", "Tratamientos"],
      staffRoles: ["Estilista", "Colorista"],
      services: [
        { name: "Corte y peinado", category: "Corte y peinado", durationMinutes: 45, price: 350, description: "Corte personalizado y secado." },
        { name: "Color completo", category: "Color", durationMinutes: 90, price: 1200, description: "Tinte, lavado y peinado." },
        { name: "Mechas / balayage", category: "Color", durationMinutes: 120, price: 1800, description: "Iluminación a medida." },
        { name: "Tratamiento capilar", category: "Tratamientos", durationMinutes: 60, price: 900, description: "Hidratación profunda y masaje." },
        { name: "Peinado de evento", category: "Corte y peinado", durationMinutes: 45, price: 400, description: "Recogido o ondas para ocasión." },
      ],
    },
  },

  NAILS: {
    id: "NAILS",
    label: "Uñas y estética de manos",
    shortLabel: "Uñas",
    group: "Belleza",
    accent: "#BE123C",
    accentSoft: "#F8DDE4",
    terms: {
      ...beautyTerms,
      professional: "Manicurista",
      professionals: "Manicuristas",
    },
    portal: {
      template: "studio",
      sections: ["services", "team", "reviews", "space"],
    },
    presets: {
      categories: ["Manicure", "Pedicure", "Sistemas"],
      staffRoles: ["Manicurista", "Nail artist"],
      services: [
        { name: "Manicure clásico", category: "Manicure", durationMinutes: 45, price: 350, description: "Limpieza, forma y esmalte." },
        { name: "Pedicure", category: "Pedicure", durationMinutes: 50, price: 400, description: "Exfoliación, forma y esmalte." },
        { name: "Gel semipermanente", category: "Sistemas", durationMinutes: 60, price: 550, description: "Esmalte en gel de larga duración." },
        { name: "Uñas acrílicas", category: "Sistemas", durationMinutes: 90, price: 750, description: "Extensión y diseño a elección." },
        { name: "Retiro de producto", category: "Sistemas", durationMinutes: 30, price: 200, description: "Retiro seguro sin dañar la uña." },
      ],
    },
  },

  SPA: {
    id: "SPA",
    label: "Spa y bienestar",
    shortLabel: "Spa",
    group: "Bienestar",
    accent: "#4D7C5F",
    accentSoft: "#E1EBE2",
    terms: {
      ...beautyTerms,
      professional: "Terapeuta",
      professionals: "Terapeutas",
      resource: "Cabina",
    },
    portal: {
      template: "studio",
      sections: ["services", "team", "reviews", "space"],
    },
    presets: {
      categories: ["Masajes", "Faciales", "Rituales"],
      staffRoles: ["Terapeuta", "Esteticista"],
      services: [
        { name: "Masaje relajante", category: "Masajes", durationMinutes: 60, price: 900, description: "Aceites tibios y presión suave." },
        { name: "Facial hidratante", category: "Faciales", durationMinutes: 60, price: 850, description: "Limpieza, exfoliación y mascarilla." },
        { name: "Exfoliación corporal", category: "Rituales", durationMinutes: 45, price: 600, description: "Renovación de piel con sales." },
        { name: "Ritual de spa", category: "Rituales", durationMinutes: 90, price: 1400, description: "Masaje, facial y té de cortesía." },
      ],
    },
  },

  MASSAGE: {
    id: "MASSAGE",
    label: "Masajes y terapia corporal",
    shortLabel: "Masajes",
    group: "Bienestar",
    accent: "#0F766E",
    accentSoft: "#D9EDEA",
    terms: {
      ...beautyTerms,
      professional: "Terapeuta",
      professionals: "Terapeutas",
      resource: "Cabina",
    },
    portal: {
      template: "studio",
      sections: ["services", "team", "reviews", "space"],
    },
    presets: {
      categories: ["Terapéutico", "Relajación", "Deportivo"],
      staffRoles: ["Terapeuta", "Masajista"],
      services: [
        { name: "Masaje descontracturante", category: "Terapéutico", durationMinutes: 60, price: 800, description: "Presión media en nudos y espalda." },
        { name: "Masaje deportivo", category: "Deportivo", durationMinutes: 60, price: 900, description: "Preparación y recuperación muscular." },
        { name: "Drenaje linfático", category: "Terapéutico", durationMinutes: 60, price: 850, description: "Maniobras suaves de drenaje." },
        { name: "Masaje con piedras", category: "Relajación", durationMinutes: 75, price: 1000, description: "Calor y presión para soltar tensión." },
      ],
    },
  },

  DENTAL: {
    id: "DENTAL",
    label: "Clínica dental",
    shortLabel: "Dental",
    group: "Salud",
    accent: "#0F766E",
    accentSoft: "#D9EDEA",
    terms: healthTerms,
    portal: {
      template: "clinic",
      sections: ["services", "team", "firstVisit", "insurance", "space"],
    },
    presets: {
      categories: ["Prevención", "Estética", "Ortodoncia", "Urgencias"],
      staffRoles: ["Odontólogo general", "Ortodoncista", "Endodoncista"],
      services: [
        { name: "Primera visita / diagnóstico", category: "Prevención", durationMinutes: 40, price: 500, description: "Revisión y plan de tratamiento." },
        { name: "Limpieza dental", category: "Prevención", durationMinutes: 45, price: 850, description: "Ultrasonido, pulido y revisión." },
        { name: "Blanqueamiento", category: "Estética", durationMinutes: 60, price: 2400, description: "Sesión en consultorio." },
        { name: "Ortodoncia · control", category: "Ortodoncia", durationMinutes: 30, price: 700, description: "Ajuste de brackets y avance." },
        { name: "Endodoncia", category: "Urgencias", durationMinutes: 90, price: 3800, description: "Tratamiento de conducto." },
      ],
    },
  },

  MEDICAL: {
    id: "MEDICAL",
    label: "Consultorio médico",
    shortLabel: "Médico",
    group: "Salud",
    accent: "#1D4ED8",
    accentSoft: "#DDE5FB",
    terms: {
      ...healthTerms,
      professional: "Médico",
      professionals: "Médicos",
    },
    portal: {
      template: "clinic",
      sections: ["services", "team", "firstVisit", "insurance", "space"],
    },
    presets: {
      categories: ["Consulta", "Seguimiento", "Trámites"],
      staffRoles: ["Médico general", "Especialista"],
      services: [
        { name: "Consulta general", category: "Consulta", durationMinutes: 30, price: 600, description: "Valoración y diagnóstico inicial." },
        { name: "Primera vez", category: "Consulta", durationMinutes: 40, price: 700, description: "Historia clínica completa." },
        { name: "Seguimiento", category: "Seguimiento", durationMinutes: 20, price: 400, description: "Revisión de evolución." },
        { name: "Certificado médico", category: "Trámites", durationMinutes: 15, price: 250, description: "Constancia para escuela o trabajo." },
      ],
    },
  },

  PHYSIO: {
    id: "PHYSIO",
    label: "Fisioterapia",
    shortLabel: "Fisio",
    group: "Salud",
    accent: "#0E7490",
    accentSoft: "#D6EEF3",
    terms: {
      ...healthTerms,
      professional: "Fisioterapeuta",
      professionals: "Fisioterapeutas",
    },
    portal: {
      template: "clinic",
      sections: ["services", "team", "firstVisit", "insurance", "space"],
    },
    presets: {
      categories: ["Evaluación", "Rehabilitación", "Terapia manual"],
      staffRoles: ["Fisioterapeuta", "Rehabilitador"],
      services: [
        { name: "Evaluación inicial", category: "Evaluación", durationMinutes: 40, price: 600, description: "Valoración funcional y plan." },
        { name: "Sesión de fisioterapia", category: "Rehabilitación", durationMinutes: 45, price: 550, description: "Ejercicio terapéutico y agentes físicos." },
        { name: "Rehabilitación deportiva", category: "Rehabilitación", durationMinutes: 60, price: 700, description: "Trabajo específico de lesión." },
        { name: "Terapia manual", category: "Terapia manual", durationMinutes: 45, price: 650, description: "Movilización y liberación miofascial." },
      ],
    },
  },

  PSYCHOLOGY: {
    id: "PSYCHOLOGY",
    label: "Psicología y terapia",
    shortLabel: "Psicología",
    group: "Salud",
    accent: "#6D28D9",
    accentSoft: "#E9E1FB",
    terms: {
      ...healthTerms,
      professional: "Terapeuta",
      professionals: "Terapeutas",
      resource: "Consultorio",
      appointment: "Sesión",
      appointments: "Sesiones",
    },
    portal: {
      template: "clinic",
      sections: ["services", "team", "firstVisit", "space"],
    },
    presets: {
      categories: ["Individual", "Pareja", "Seguimiento"],
      staffRoles: ["Psicólogo clínico", "Terapeuta"],
      services: [
        { name: "Primera sesión", category: "Individual", durationMinutes: 60, price: 800, description: "Entrevista inicial y objetivos." },
        { name: "Sesión individual", category: "Individual", durationMinutes: 50, price: 700, description: "Acompañamiento psicoterapéutico." },
        { name: "Terapia de pareja", category: "Pareja", durationMinutes: 60, price: 1100, description: "Sesión conjunta." },
        { name: "Seguimiento", category: "Seguimiento", durationMinutes: 50, price: 700, description: "Continuidad del proceso." },
      ],
    },
  },

  NUTRITION: {
    id: "NUTRITION",
    label: "Nutrición",
    shortLabel: "Nutrición",
    group: "Salud",
    accent: "#4D7C0F",
    accentSoft: "#E6EED6",
    terms: {
      ...healthTerms,
      professional: "Nutriólogo",
      professionals: "Nutriólogos",
    },
    portal: {
      template: "clinic",
      sections: ["services", "team", "firstVisit", "space"],
    },
    presets: {
      categories: ["Consulta", "Seguimiento", "Estudios"],
      staffRoles: ["Nutriólogo", "Nutricionista"],
      services: [
        { name: "Primera consulta", category: "Consulta", durationMinutes: 60, price: 900, description: "Historia, hábitos y plan inicial." },
        { name: "Seguimiento", category: "Seguimiento", durationMinutes: 30, price: 500, description: "Ajuste de plan y medición." },
        { name: "Plan nutricional", category: "Consulta", durationMinutes: 45, price: 700, description: "Plan personalizado por objetivos." },
        { name: "Composición corporal", category: "Estudios", durationMinutes: 30, price: 400, description: "Medición y análisis." },
      ],
    },
  },

  OPTOMETRY: {
    id: "OPTOMETRY",
    label: "Optometría",
    shortLabel: "Óptica",
    group: "Salud",
    accent: "#0369A1",
    accentSoft: "#D8EBF5",
    terms: {
      ...healthTerms,
      professional: "Optometrista",
      professionals: "Optometristas",
    },
    portal: {
      template: "clinic",
      sections: ["services", "team", "firstVisit", "space"],
    },
    presets: {
      categories: ["Examen", "Lentes", "Contactología"],
      staffRoles: ["Optometrista", "Asesor óptico"],
      services: [
        { name: "Examen visual", category: "Examen", durationMinutes: 30, price: 500, description: "Refracción y salud visual." },
        { name: "Adaptación de lentes", category: "Lentes", durationMinutes: 40, price: 700, description: "Medición y ajuste de armazón." },
        { name: "Revisión", category: "Examen", durationMinutes: 20, price: 350, description: "Control de graduación." },
        { name: "Contactología", category: "Contactología", durationMinutes: 30, price: 600, description: "Prueba y adaptación de lentes de contacto." },
      ],
    },
  },

  TATTOO: {
    id: "TATTOO",
    label: "Tatuaje y piercing",
    shortLabel: "Tattoo",
    group: "Belleza",
    accent: "#B45309",
    accentSoft: "#F5E6D3",
    terms: {
      ...beautyTerms,
      professional: "Tatuador",
      professionals: "Tatuadores",
      resource: "Cabina",
    },
    portal: {
      template: "studio",
      sections: ["services", "team", "reviews", "space"],
    },
    presets: {
      categories: ["Consulta", "Sesión", "Cuidado"],
      staffRoles: ["Tatuador", "Piercer"],
      services: [
        { name: "Consulta de diseño", category: "Consulta", durationMinutes: 30, price: 0, description: "Idea, tamaño y presupuesto." },
        { name: "Sesión de tatuaje", category: "Sesión", durationMinutes: 120, price: 2500, description: "Sesión de dos horas." },
        { name: "Retoque", category: "Sesión", durationMinutes: 60, price: 800, description: "Ajuste de líneas o color." },
        { name: "Piercing", category: "Cuidado", durationMinutes: 30, price: 600, description: "Perforación y joyería básica." },
      ],
    },
  },

  VETERINARY: {
    id: "VETERINARY",
    label: "Veterinaria",
    shortLabel: "Veterinaria",
    group: "Salud",
    accent: "#15803D",
    accentSoft: "#DCEFE2",
    terms: {
      ...healthTerms,
      professional: "Veterinario",
      professionals: "Veterinarios",
      customer: "Tutor",
      customers: "Tutores",
    },
    portal: {
      template: "clinic",
      sections: ["services", "team", "firstVisit", "space"],
    },
    presets: {
      categories: ["Consulta", "Prevención", "Estética"],
      staffRoles: ["Veterinario", "Asistente"],
      services: [
        { name: "Consulta general", category: "Consulta", durationMinutes: 30, price: 500, description: "Revisión y diagnóstico." },
        { name: "Vacunación", category: "Prevención", durationMinutes: 20, price: 400, description: "Aplicación y registro." },
        { name: "Estética canina", category: "Estética", durationMinutes: 60, price: 450, description: "Baño, corte y secado." },
        { name: "Revisión", category: "Consulta", durationMinutes: 20, price: 350, description: "Control post-tratamiento." },
      ],
    },
  },

  OTHER: {
    id: "OTHER",
    label: "Otro negocio con agenda",
    shortLabel: "Otro",
    group: "Otros",
    accent: "#52525B",
    accentSoft: "#E7E7E9",
    terms: {
      ...beautyTerms,
      resource: "Recurso",
    },
    portal: {
      template: "studio",
      sections: ["services", "team", "reviews", "space"],
    },
    presets: {
      categories: ["Servicios"],
      staffRoles: ["Profesional"],
      services: [
        { name: "Consulta inicial", category: "Servicios", durationMinutes: 30, price: 500, description: "Primera atención con tu equipo." },
        { name: "Servicio estándar", category: "Servicios", durationMinutes: 60, price: 800, description: "Servicio principal del negocio." },
        { name: "Seguimiento", category: "Servicios", durationMinutes: 30, price: 400, description: "Revisión o continuidad." },
      ],
    },
  },
};

export const VERTICAL_GROUPS = ["Belleza", "Salud", "Bienestar", "Otros"] as const;

export function isVerticalId(value: string | null | undefined): value is VerticalId {
  return Boolean(value && (VERTICAL_IDS as readonly string[]).includes(value));
}

export function getVertical(value: string | null | undefined): VerticalConfig {
  return isVerticalId(value) ? VERTICALS[value] : VERTICALS.OTHER;
}

export function verticalOptions() {
  return VERTICAL_GROUPS.map((group) => ({
    group,
    items: VERTICAL_IDS.map((id) => VERTICALS[id]).filter(
      (vertical) => vertical.group === group
    ),
  }));
}
