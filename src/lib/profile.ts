/**
 * All of Abdul Kalam's portfolio content lives here.
 * Edit this file to change copy, links, projects, skills, etc.
 * Content is carried over from the original Vite portfolio and the resume PDF.
 */

export const SITE = {
  name: "Abdul Kalam",
  role: "Software Developer",
  title: "Abdul Kalam — Software Developer",
  description:
    "Abdul Kalam is a Mumbai-based software developer focused on backend engineering, REST APIs, relational databases, and dependable application architecture.",
  shortDescription:
    "Backend engineering, practical systems, and thoughtful software quality from Mumbai.",
  location: "Mumbai, India",
  year: "2026",
} as const;

export const LINKS = {
  resume: "/resume/abdul-kalam-cv.pdf",
  github: "https://github.com/Abdulkalam04",
  githubLabel: "github.com/Abdulkalam04",
  linkedin: "https://www.linkedin.com/in/abdul-kalam-0a8a37232/",
  email: "abdulka0440r@gmail.com",
  phone: "+91 93235 05569",
  phoneHref: "tel:+919323505569",
} as const;

export const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Journey", href: "#journey" },
  { label: "Contact", href: "#contact" },
] as const;

/* ───────────────────────────── Hero ───────────────────────────── */

export const HERO = {
  eyebrow: "SOFTWARE DEVELOPER · BSc IT // ONLINE",
  place: "Mumbai, India · 2026",
  tagline: "Backend Engineering & Software Quality",
  intro:
    "Software developer focused on backend systems, dependable APIs, and data-driven applications built with reliability, clarity, and quality in mind.",
} as const;

export const STATS = [
  { label: "CGPI", value: "9.53", note: "BSc IT — consistent academic record" },
  { label: "BSc IT", value: "2023–2026", note: "Laxmichand Golwala College" },
  { label: "Projects", value: "3+", note: "Two completed, one in progress" },
  { label: "Core Focus", value: "Java · APIs · SQL", note: "Backend & data foundations" },
] as const;

/* ─────────────────────────── About ─────────────────────────── */

export const ABOUT = {
  eyebrow: "01 // Background & Profile",
  title: "Disciplined fundamentals applied to practical software systems.",
  lead: "I build software that is dependable, structured, and grounded in real-world engineering constraints.",
  body: "My work focuses on backend systems, API design, relational data modeling, and testing practices that keep applications stable as they grow. I care about clear contracts, maintainable code, and engineering decisions that hold up under real-world usage.",
  resumeSummary:
    "BSc Information Technology student with a CGPI of 9.53 and a strong foundation in Java, Object-Oriented Programming, SQL, DBMS and REST APIs. Gained practical experience studying, debugging and enhancing software applications and backend systems using Python and PostgreSQL. Comfortable working in teams, discussing problems collaboratively and explaining technical concepts clearly. Interested in beginning a career in Java or backend development and strengthening technical skills through real-world projects.",
  tags: ["Java", "REST APIs", "SQL", "System Design", "Testing", "Backend Architecture"],
  status: "Open to opportunities",
} as const;

export type FocusArea = {
  title: string;
  copy: string;
  /** Short one-liner that used to sit in the About highlights. */
  highlight?: string;
  icon: "server" | "database" | "shield" | "code";
};

export const FOCUS_AREAS: FocusArea[] = [
  {
    title: "Backend Systems",
    copy: "Designing reliable APIs, services, and scalable application flows that support real products.",
    highlight: "REST APIs & server-side architecture",
    icon: "server",
  },
  {
    title: "Database Engineering",
    copy: "Modeling relational data, writing cleaner queries, and protecting data integrity at the foundation.",
    highlight: "Relational schema design, SQL & data integrity",
    icon: "database",
  },
  {
    title: "Software Quality",
    copy: "Testing, debugging, and validation with an emphasis on dependable delivery and maintainability.",
    highlight: "Unit testing, verification & defensive debugging",
    icon: "shield",
  },
  {
    title: "Practical Problem Solving",
    copy: "Translating business needs into efficient systems with clarity, structure, and measurable outcomes.",
    icon: "code",
  },
];

/* ─────────────────────────── Skills ─────────────────────────── */

export type SkillGroup = {
  label: string;
  icon: "terminal" | "server" | "database" | "monitor" | "flask" | "layers" | "sparkles" | "users" | "book";
  items: string[];
};

export const SKILLS = {
  eyebrow: "02 // Technical Skills",
  title: "Core technologies and engineering proficiencies.",
  avatarCaption: "Java · DSA · Web Development · System Design",
  groups: [
    { label: "Languages", icon: "terminal", items: ["Java", "Python", "JavaScript", "SQL", "HTML", "CSS"] },
    { label: "Backend", icon: "server", items: ["REST APIs", "Flask", "Node.js", "Express.js", "MVC", "Client-server"] },
    { label: "Databases", icon: "database", items: ["MySQL", "PostgreSQL", "SQLite", "Supabase", "DBMS", "Data modeling"] },
    {
      label: "Tools",
      icon: "monitor",
      items: ["Git", "GitHub", "Postman", "VS Code", "IntelliJ IDEA", "Eclipse", "PyCharm", "Android Studio"],
    },
    {
      label: "Testing / Development",
      icon: "flask",
      items: ["Selenium", "Software Testing", "SDLC", "Agile", "Scrum", "Debugging"],
    },
    {
      label: "Core Concepts",
      icon: "book",
      items: [
        "Object-Oriented Programming",
        "DBMS",
        "MVC Architecture",
        "Client-Server Architecture",
        "Software Engineering",
        "SDLC",
        "Agile Methodology",
        "Waterfall Model",
        "Scrum Basics",
      ],
    },
    {
      label: "Data Structures",
      icon: "layers",
      items: ["Arrays", "Stacks", "Queues", "Linked Lists", "ArrayList", "Strings", "Searching", "Sorting"],
    },
    { label: "AI Tools", icon: "sparkles", items: ["ChatGPT", "Claude"] },
    {
      label: "Soft Skills",
      icon: "users",
      items: ["Team Collaboration", "Active Discussion & Problem-Solving", "Explaining Technical Concepts Clearly"],
    },
  ] as SkillGroup[],
  applied: {
    eyebrow: "Applied Engineering Stack",
    title: "Direct implementation across active systems.",
    path: "/ skills → production",
    items: [
      {
        title: "Face Attendance",
        stack: "Python · Flask · SQLite · face_recognition · TensorFlow.js",
        copy: "Computer vision and verification workflows",
      },
      {
        title: "ElderCare Connect",
        stack: "React · TypeScript · TanStack · Supabase · PostgreSQL · Gemini",
        copy: "Realtime care coordination and safety workflows",
      },
      {
        title: "Abdullah Motors",
        stack: "React · TypeScript · TanStack · React Query · Supabase",
        copy: "Currently building inventory and conversion flows",
      },
    ],
  },
  practices: ["Agile", "Scrum", "Test-Driven Thinking", "Clean Code Standards"],
} as const;

/* ────────────────────────── Projects ────────────────────────── */

export type ProjectStatus = "COMPLETED" | "IN PROGRESS";
export type ProjectFilter = "All" | "Backend" | "Web Apps" | "Computer Vision" | "In Progress";
export const PROJECT_FILTERS: ProjectFilter[] = ["All", "Backend", "Web Apps", "Computer Vision", "In Progress"];

export type ProjectImage = { src: string; alt: string; label: string };

export type Project = {
  id: string;
  number: string;
  year: string;
  title: string;
  status: ProjectStatus;
  categories: Exclude<ProjectFilter, "All">[];
  summary: string;
  problem: string;
  description: string;
  solution: string;
  architecture: string;
  technology: string[];
  learned: string;
  tags: string[];
  tone: "cyan" | "gold";
  icon: "monitor" | "message" | "car";
  features: string[];
  highlights: string[];
  flow: string[];
  screenshots: ProjectImage[];
  video?: string;
  current?: { completed: string[]; inProgress: string[]; planned: string[] };
  /** Extra detail from the resume. */
  resumeNotes?: string[];
};

export const PROJECTS_COPY = {
  eyebrow: "03 // Featured work",
  title: "Real systems, explained clearly.",
  path: "/ projects.log",
  footnote: "Each case study is based on supplied source code and project assets.",
  noDemo: "No public demo link supplied",
  noRepo: "Public repository link not included in the supplied project files.",
} as const;

export const PROJECTS: Project[] = [
  {
    id: "face-recognition-showcase",
    number: "01",
    year: "Completed · 2025 — 2026",
    title: "Face Recognition Attendance & Security System",
    status: "COMPLETED",
    categories: ["Computer Vision", "Backend"],
    summary:
      "A web-based attendance and security platform that verifies identity before an attendance request reaches the classroom workflow.",
    problem: "Manual attendance is slow to verify and can be recorded inconsistently across classes and sessions.",
    description:
      "Built a teacher and student system around face enrollment, biometric verification, liveness checks, location capture, and attendance reporting.",
    solution:
      "A staged verification flow: credentials establish the account, the camera checks the enrolled face, head movement supports liveness, and the Flask API records the attendance workflow.",
    architecture:
      "React + Vite client → Axios → Flask REST API → face_recognition + SQLite → teacher/student dashboards",
    technology: [
      "React",
      "JavaScript",
      "Vite",
      "Flask",
      "Python",
      "SQLite",
      "face_recognition",
      "TensorFlow.js",
      "BlazeFace",
    ],
    learned:
      "How computer vision, API contracts, validation, role-aware flows, and persistent records need to work together in a real workflow.",
    tags: ["Computer vision", "Biometrics", "Flask", "SQLite"],
    tone: "cyan",
    icon: "monitor",
    features: [
      "Face enrollment and face-based login",
      "Head-movement liveness check",
      "Geolocation capture for attendance",
      "Teacher and student dashboards",
      "Class and student management",
      "Attendance reports and Excel export",
    ],
    highlights: [
      "Role-aware teacher and student portals",
      "Password hashing with stored face encodings",
      "Attendance requests can be approved or rejected by a teacher",
      "Timetable uploads, class messaging, and low-attendance email alerts",
    ],
    flow: [
      "Student",
      "Camera + face detection",
      "Head movement liveness",
      "Face recognition",
      "Location passed to API",
      "Attendance request",
      "Teacher approval + report",
    ],
    screenshots: [
      {
        src: "/project-assets/face-attendance/face.png",
        alt: "Face recognition project asset from the attendance system",
        label: "Face verification asset",
      },
    ],
    video: "/videos/face-recognition.mp4",
    resumeNotes: [
      "Worked on teacher and student registration, multiple-class enrolment, attendance sessions, face verification, liveness checks and location validation.",
      "Managed relational data for users, classes, lecture sessions and attendance records.",
      "Connected the user interface with REST APIs for registration, authentication, face verification and attendance reporting.",
      "Debugged and improved existing modules while studying the complete application workflow from user interaction to database storage.",
    ],
  },
  {
    id: "eldercare-showcase",
    number: "02",
    year: "Completed · 2026",
    title: "ElderCare Connect",
    status: "COMPLETED",
    categories: ["Web Apps"],
    summary:
      "A full-stack care coordination platform for health tracking, family support, emergency response, and everyday wellbeing.",
    problem:
      "Families need a dependable way to coordinate care for older relatives when they are not always in the same place.",
    description:
      "Built a role-aware application for care recipients and family members with health records, medication routines, wellbeing checks, alerts, bookings, and AI-assisted support.",
    solution:
      "A shared care workspace backed by Supabase Auth, PostgreSQL data relationships, realtime updates, storage, and server-side functions for care workflows.",
    architecture:
      "React + TanStack Start → server functions → Supabase Auth / PostgreSQL / Realtime / Storage → Gemini support",
    technology: [
      "React 19",
      "TypeScript",
      "TanStack Router",
      "TanStack Start",
      "Supabase",
      "PostgreSQL",
      "Gemini",
      "Recharts",
      "Web Push",
    ],
    learned:
      "How authentication, data modeling, realtime updates, private files, notifications, and safety-minded product details shape software for people who depend on it.",
    tags: ["Care workflows", "Supabase", "PostgreSQL"],
    tone: "gold",
    icon: "message",
    features: [
      "Parent and child authentication with linked care profiles",
      "Medicine schedules, logs, voice and push reminders",
      "Vitals, health records, appointments, and risk assessment",
      "SOS alerts with live location and realtime status",
      "Caregiver booking, medical transport, and video consultation",
      "AI companion and emergency detection workflows",
    ],
    highlights: [
      "Supabase Realtime subscriptions keep care status current",
      "Private medical files use Supabase Storage access controls",
      "Database migrations cover health, alerts, bookings, transport, and notification workflows",
      "Tests cover contracts, security rules, health risk logic, geolocation, and workflows",
    ],
    flow: [
      "Care recipient or family member",
      "Supabase Auth",
      "Care dashboard",
      "Medicines + vitals + wellbeing",
      "Alerts and realtime updates",
      "PostgreSQL + Storage",
    ],
    screenshots: [
      {
        src: "/project-assets/eldercare/logo.png",
        alt: "ElderCare Connect project logo from the supplied application",
        label: "Application identity",
      },
    ],
    video: "/videos/eldercare.mp4",
    resumeNotes: [
      "Contributing to an existing elder-care web application designed to help family members remotely support elderly parents.",
      "Studied and improved modules related to Supabase Authentication, parent-child linking, medicine management, wellbeing checks and SOS alerts.",
      "Worked with Supabase PostgreSQL, Realtime and database-access policies to understand how health-related data is stored and shared with linked users.",
      "Analysed Gemini API integration for general health explanations and an AI-companion feature without treating the output as a medical diagnosis.",
      "Currently improving database consistency, permission handling, error handling, notification reliability and project documentation.",
    ],
  },
  {
    id: "abdullah-motors-showcase",
    number: "03",
    year: "In progress · 2026",
    title: "Abdullah Motors",
    status: "IN PROGRESS",
    categories: ["In Progress", "Web Apps"],
    summary:
      "An automotive marketplace currently being built around inventory discovery, comparison, enquiries, bookings, and staff operations.",
    problem:
      "Car buyers need a clearer way to browse inventory, compare options, and start a conversation without a fragmented buying journey.",
    description:
      "An active React and Supabase application with inventory browsing, car detail pages, comparison, customer enquiries, test-drive bookings, blogs, testimonials, and an admin workspace.",
    solution:
      "A data-backed automotive platform with public discovery flows and role-aware staff tools connected to Supabase Auth, PostgreSQL, and Storage.",
    architecture:
      "React + TanStack Start → React Query → Supabase Auth / PostgreSQL / Storage → customer and admin routes",
    technology: [
      "React 19",
      "TypeScript",
      "TanStack Start",
      "TanStack Router",
      "React Query",
      "Tailwind CSS",
      "Supabase",
      "PostgreSQL",
    ],
    learned:
      "How a product grows beyond a landing page: public search, relational inventory data, customer conversion flows, and staff operations all need one consistent model.",
    tags: ["Automotive platform", "Supabase", "Currently building"],
    tone: "cyan",
    icon: "car",
    features: [
      "Inventory browsing with filters and pagination",
      "Car detail pages with galleries and specifications",
      "Compare up to four cars side by side",
      "Customer enquiries and test-drive booking",
      "Customer authentication and staff/admin routes",
      "Car, booking, enquiry, testimonial, and blog management",
    ],
    highlights: [
      "Relational schema for brands, models, categories, cars, images, and customer actions",
      "Supabase Storage is used for car and blog image uploads",
      "RLS policies distinguish public discovery, customer submissions, and staff operations",
      "Large visual assets and admin workflows are still being brought together into a complete product",
    ],
    flow: [
      "Visitor",
      "Inventory filters",
      "Car detail + gallery",
      "Compare or enquire",
      "Test-drive booking",
      "Staff follow-up",
    ],
    screenshots: [
      { src: "/project-assets/abdullah-motors/hero-car.jpg", alt: "Automotive hero image from Abdullah Motors", label: "Hero preview" },
      { src: "/project-assets/abdullah-motors/car-1.jpg", alt: "Vehicle listing image from Abdullah Motors", label: "Inventory image 01" },
      { src: "/project-assets/abdullah-motors/car-2.jpg", alt: "Vehicle listing image from Abdullah Motors", label: "Inventory image 02" },
      { src: "/project-assets/abdullah-motors/car-3.jpg", alt: "Vehicle listing image from Abdullah Motors", label: "Inventory image 03" },
      { src: "/project-assets/abdullah-motors/car-4.jpg", alt: "Vehicle listing image from Abdullah Motors", label: "Inventory image 04" },
      { src: "/project-assets/abdullah-motors/car-5.jpg", alt: "Vehicle listing image from Abdullah Motors", label: "Inventory image 05" },
      { src: "/project-assets/abdullah-motors/car-6.jpg", alt: "Vehicle listing image from Abdullah Motors", label: "Inventory image 06" },
    ],
    video: "/videos/car.mp4",
    current: {
      completed: [
        "Inventory, detail, compare, enquiry, and test-drive flows exist in source",
        "Supabase schema, authentication, storage, and staff routes are defined",
      ],
      inProgress: [
        "Finishing and validating the full product experience across public and admin routes",
        "Continuing integration and polish of the automotive workflow",
      ],
      planned: ["Additional work will be based on the project’s next implementation priorities"],
    },
  },
];

/* ─────────────────────────── Journey ─────────────────────────── */

export type JourneyItem = { date: string; title: string; copy: string };

export const JOURNEY = {
  eyebrow: "04 // Milestones & Progression",
  title: "Technical progression and academic background.",
  intro:
    "A structured trajectory centered on core computer science foundations, backend architecture, and hands-on system development.",
  items: [
    {
      date: "2023",
      title: "BSc Information Technology Commenced",
      copy: "Established academic and practical foundations in object-oriented programming, data structures, relational DBMS, and SDLC methodologies.",
    },
    {
      date: "2025",
      title: "Applied Systems Development",
      copy: "Progressed from academic coursework to end-to-end applications, designing against concrete user flows, system constraints, and edge cases.",
    },
    {
      date: "2025–2026",
      title: "Face Recognition Attendance & Security System",
      copy: "Engineered an automated biometric attendance platform integrating OpenCV face recognition, liveness checks, and backend verification.",
    },
    {
      date: "2026",
      title: "Backend Architecture & Data Modeling",
      copy: "Deepening focus on Java backend services, RESTful API design, database integrity, and quality assurance.",
    },
    {
      date: "Present",
      title: "Active Development & Opportunities",
      copy: "Building production-ready software systems; open to software development and QA engineering roles.",
    },
  ] as JourneyItem[],
} as const;

/* ────────────────────────── Education ────────────────────────── */

export type Certificate = { src: string; alt: string; label: string; pdf: string };

export const EDUCATION = {
  eyebrow: "05 // Education & Certifications",
  degree: "Bachelor of Science in Information Technology",
  college: "Laxmichand Golwala College of Commerce and Economics",
  collegePlace: "Mumbai, Maharashtra · 2023 — 2026",
  cgpi: "9.53",
  cgpiLabel: "CGPI",
  school: [
    {
      title: "HSC · M.H. Saboo Siddik Technical High School",
      detail: "57.33% · 2021 — 2022",
      note: "Higher Secondary Certificate (12th) — Science, Maharashtra State Board, Mumbai",
    },
    {
      title: "SSC · City of Los Angeles Municipal Secondary English School",
      detail: "71.20% · 2019 — 2020",
      note: "Secondary School Certificate (10th) — Maharashtra State Board, Mumbai",
    },
  ],
  certifications: [
    "Tata — GenAI Powered Data Analytics Job Simulation",
    "Deloitte Technology Job Simulation",
    "Java Fundamentals — Infosys Springboard",
    "Java Programming — Scaler · SQL Intermediate — HackerRank",
  ],
  certificates: [
    {
      src: "/images/tata.png",
      alt: "Tata GenAI Powered Data Analytics Job Simulation certificate",
      label: "TATA — GenAI Analytics",
      pdf: "/certificates/tata.pdf",
    },
    {
      src: "/images/deloitte.png",
      alt: "Deloitte Technology Job Simulation certificate",
      label: "Deloitte — Tech Simulation",
      pdf: "/certificates/deloitte.pdf",
    },
    {
      src: "/images/java-fundamentals.png",
      alt: "Java Fundamentals certificate from Infosys Springboard",
      label: "Java Fundamentals",
      pdf: "/certificates/java-fundamentals.pdf",
    },
    {
      src: "/images/java-concepts.png",
      alt: "Java Concepts certificate",
      label: "Java Concepts",
      pdf: "/certificates/java-concepts.pdf",
    },
    {
      src: "/images/sql-basic.png",
      alt: "SQL Basic certificate from HackerRank",
      label: "SQL Basic — HackerRank",
      pdf: "/certificates/sql-basic.pdf",
    },
  ] as Certificate[],
} as const;

/* ─────────────────── Opportunities + Contact ─────────────────── */

export const OPPORTUNITY = {
  eyebrow: "Opportunities",
  title: "Ready to contribute to dependable software systems.",
  copy: "Open to software development and quality assurance roles where backend reliability, solid fundamentals, and attention to detail matter.",
} as const;

export const CONTACT = {
  eyebrow: "06 // Start a conversation",
  title: "Let's build something useful.",
  copy: "Have an opportunity, a project idea, or a thoughtful question? I’d be glad to connect. This form opens your email app so you can review the message before sending.",
} as const;
