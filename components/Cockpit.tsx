"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Rajdhani } from "next/font/google";
import { useLang, type Lang } from "../context/LangContext";

const ASSET_V = "v5";
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["500", "600", "700"] });

const MANAGER_PHONE = process.env.NEXT_PUBLIC_MANAGER_PHONE || "";

// ========================
// Session alignment (IMPORTANT)
// Cockpit now uses the SAME session ID as ConciergeBar (uab_concierge_session_id),
// so handoffs + Firestore + notify all stay in one universe.
// ========================
const SID_KEY = "uab_concierge_session_id";

function randomUabCode(len = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function newUabSessionId() {
  return `UAB-${randomUabCode(4)}`;
}

function getOrCreateUabSessionId() {
  if (typeof window === "undefined") return newUabSessionId();
  const existing = window.localStorage.getItem(SID_KEY);
  if (existing && /^UAB-[A-Z0-9]{4,}$/i.test(existing)) return existing.toUpperCase();
  const sid = newUabSessionId();
  window.localStorage.setItem(SID_KEY, sid);
  return sid;
}

function createFreshUabSessionId() {
  const sid = newUabSessionId();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SID_KEY, sid);
    try {
      window.localStorage.removeItem(BOOT_KEY);
      window.localStorage.removeItem("uab_cockpit_upload_status");
    } catch {}
  }
  return sid;
}


function cockpitUiText(lang: Lang, text: string) {
  if (lang !== "es") return text;
  const map: Record<string, string> = {
    "Continue:": "Continuar:",
    "Select one:": "Seleccione una:",
    "Session": "Sesión",
    "Saved": "Guardado",
    "Change option": "Cambiar opción",
    "Back": "Atrás",
    "Continue": "Continuar",
    "Start over": "Empezar de nuevo",
    "Open uploader": "Abrir cargador",
    "Skip": "Saltar",
    "Yes": "Sí",
    "No": "No",
    "Not sure": "No estoy seguro",
    "Not right now": "Ahora no",
    "Actions": "Acciones",
    "Phone number": "Número de teléfono",
    "Enter info": "Ingrese información",
    "Enter info (optional)": "Ingrese información (opcional)",
    "Vehicle": "Vehículo",
    "Description": "Descripción",
    "Contact info": "Información de contacto",
    "Manager call": "Llamada de Guardian",
    "What we saved": "Lo que guardamos",
    "Request sent": "Solicitud enviada",
    "Finish intake": "Finalizar ingreso",
    "Special services": "Servicios especiales",
    "Tell us what you need": "Díganos lo que necesita",
    "Vehicle information": "Información del vehículo",
    "Tow details": "Detalles del remolque",
    "Safety check": "Revisión de seguridad",
    "Call right away": "Llamar de inmediato",
    "Vehicle movement": "Movimiento del vehículo",
    "Quick safety check": "Revisión rápida de seguridad",
    "Vehicle location": "Ubicación del vehículo",
    "Next question": "Siguiente pregunta",
    "Insurance info": "Información del seguro",
    "Upload police report (optional)": "Subir reporte policial (opcional)",
    "Upload photos (optional)": "Subir fotos (opcional)",
    "Photos": "Fotos",
    "Coverage": "Cobertura",
    "Payment path": "Ruta de pago",
    "Insurance": "Seguro",
    "Payment help": "Ayuda con pago",
    "Please select one:": "Seleccione una:",
    "Tint": "Tintado",
    "Rim repair": "Reparación de rin",
    "Detailing": "Detallado",
    "More": "Más",
    "Submit": "Enviar",
    "Back to topics": "Volver a temas",
    "Open Concierge PLUS": "Abrir Concierge PLUS",
    "Concierge PLUS is open": "Concierge PLUS está abierto",
    "Concierge PLUS": "Concierge PLUS",
    "Your full name": "Su nombre completo",
    "Best phone number": "Mejor número de teléfono",
    "Ask a question": "Hacer una pregunta",
    "Your question": "Su pregunta",
    "History of the labor rate": "Historia de la tarifa de mano de obra",
    "Your policy and A/M parts": "Su póliza y piezas A/M",
    "First party vs third party": "Primera parte vs tercera parte",
    "Total losses in NY": "Pérdidas totales en NY",
    "Appraisal clause": "Cláusula de tasación",
    "Designated representative": "Representante designado",
    "Collision Claims & Insurance Education": "Educación sobre reclamos y seguros de colisión",
    "I was in an accident": "Tuve un accidente",
    "I need help with vehicle damage": "Necesito ayuda con daños del vehículo",
    "Collision claims & insurance education": "Educación sobre reclamos y seguros de colisión",
    "Tow company, phone, address (optional)": "Empresa de remolque, teléfono, dirección (opcional)",
    "Current vehicle location": "Ubicación actual del vehículo",
    "Claim number (optional)": "Número de reclamo (opcional)",
    "Describe the damage you want fixed": "Describa el daño que desea reparar",
    "Year, make, model, and VIN if available": "Año, marca, modelo y VIN si está disponible",
    "Describe the special service you want": "Describa el servicio especial que desea",
    "Year, make, model": "Año, marca, modelo",
    "Full name": "Nombre completo",
    "Sending...": "Enviando...",
    "Select accident type:": "Seleccione el tipo de accidente:",
    "I hit someone": "Yo choqué a alguien",
    "Someone hit me": "Alguien me chocó",
    "No other vehicle involved": "No hubo otro vehículo involucrado",
    "My vehicle was parked": "Mi vehículo estaba estacionado",
    "Something else happened": "Pasó otra cosa",
    "Vehicle status": "Estado del vehículo",
    "Got it.": "Entendido.",
    "Was your vehicle safe to drive, towed away, or not sure?": "¿Su vehículo era seguro para conducir, fue remolcado o no está seguro?",
    "It’s safe to drive": "Se puede conducir",
    "It was towed": "Fue remolcado",
    "If your vehicle was towed, do you know who towed it?": "Si su vehículo fue remolcado, ¿sabe quién lo remolcó?",
    "Name and phone number are helpful. Address if you have it.": "Nombre y teléfono ayudan. Dirección también, si la tiene.",
    "Since you are not sure whether the vehicle is safe to drive, we just need a couple quick questions.": "Como no está seguro de si el vehículo se puede conducir, solo necesitamos un par de preguntas rápidas.",
    "Are you still at the scene of the accident?": "¿Todavía está en la escena del accidente?",
    "Please give us the best number to reach you right now.": "Indíquenos el mejor número para comunicarnos con usted ahora mismo.",
    "A Guardian representative will call you as soon as possible.": "Un representante de Guardian le llamará lo antes posible.",
    "Were you able to drive away from the accident?": "¿Pudo conducir el vehículo después del accidente?",
    "Where is the vehicle now?": "¿Dónde está el vehículo ahora?",
    "If you know the tow yard, shop, street, or parking lot, add it here.": "Si sabe el depósito, taller, calle o estacionamiento, escríbalo aquí.",
    "Did you exchange insurance information?": "¿Intercambiaron información del seguro?",
    "Do you have your own insurance information available?": "¿Tiene disponible la información de su propio seguro?",
    "Do you have photos of the vehicles / damage?": "¿Tiene fotos de los vehículos o los daños?",
    "Out of pocket": "De su bolsillo",
    "Next step": "Siguiente paso",
    "Continue to estimate (photos + details)": "Continuar al estimado (fotos + detalles)",
    "Have you contacted your insurance company yet?": "¿Ya se comunicó con su compañía de seguros?",
    "Claim # (optional)": "Núm. de reclamo (opcional)",
    "Claim #": "Núm. de reclamo",
    "Designated Representative": "Representante designado",
    "Would you like Guardian to act as your Designated Representative and help guide your insurance claim?": "¿Quiere que Guardian actúe como su representante designado y le ayude con su reclamo de seguro?",
    "Connect with Guardian": "Conectarse con Guardian",
    "Next steps": "Próximos pasos",
    "For now, here’s what Guardian saved:": "Por ahora, esto es lo que Guardian guardó:",
    "Saved intake summary": "Resumen del ingreso guardado",
    "Scenario:": "Escenario:",
    "Vehicle:": "Vehículo:",
    "Tow details:": "Detalles del remolque:",
    "At scene:": "En la escena:",
    "Drove away:": "Pudo conducir:",
    "Warning signs:": "Señales de advertencia:",
    "Vehicle now:": "Vehículo ahora:",
    "Own insurance:": "Su seguro:",
    "Exchanged info:": "Intercambió información:",
    "Police report:": "Reporte policial:",
    "Full coverage:": "Cobertura completa:",
    "Contacted insurer:": "Contactó a la aseguradora:",
    "Designated rep:": "Representante designado:",
    "Close": "Cerrar",
    "Guardian call": "Llamada de Guardian",
    "Need claim guidance?": "¿Necesita orientación sobre su reclamo?",
    "Need help deciding how to handle the damage?": "¿Necesita ayuda para decidir cómo manejar el daño?",
  };
  if (text in map) return map[text];
  return text
    .replace(/^Vehicle info saved\.$/, "Información del vehículo guardada.")
    .replace(/^Vehicle info saved: /, "Información del vehículo guardada: ")
    .replace(/^Damage: /, "Daño: ")
    .replace(/^Vehicle info: /, "Información del vehículo: ")
    .replace(/^Insurance paying: /, "Pago del seguro: ")
    .replace(/^Requested service: /, "Servicio solicitado: ")
    .replace(/^Session: /, "Sesión: ");
}

type OptionCopy = {
  title: string;
  lines?: string[];
  leftLines?: string[];
  rightLines?: string[];
  leftTitle?: string;
  rightTitle?: string;
};

type AccidentScenario =
  | "I hit someone"
  | "Someone hit me"
  | "No other vehicle involved"
  | "My vehicle was parked"
  | "Something else happened";

type VehicleStatus = "It’s safe to drive" | "It was towed" | "Not sure";

type YesNo = "yes" | "no";
type YesNotNowSkip = "yes" | "not_now" | "skip";
type YesNoNotSure = "yes" | "no" | "not_sure";

type AccidentStep =
  | "scenario"
  | "vehicle"
  | "towDetails"
  | "notSureScene"
  | "notSureScenePhone"
  | "notSureDriveAway"
  | "notSureWarningSigns"
  | "notSureVehicleNow"
  | "exchangeInsurance"
  | "ownInsurance"
  | "policeReport"
  | "policeUpload"
  | "photosTaken"
  | "fullCoverage"
  | "contactedInsurance"
  | "claimNumber"
  | "designatedRep"
  | "handoff"
  | "oopIntro"
  | "genericNext";


type DamageStep =
  | "describe"
  | "vehicleInfo"
  | "payingOutOfPocket"
  | "insurancePaying"
  | "handoff"
  | "placeholder";


type EducationTopic =
  | "History of the labor rate"
  | "Your policy and A/M parts"
  | "First party vs third party"
  | "Total losses in NY"
  | "Appraisal clause"
  | "Designated representative";

type EducationStep = "intro" | "topics" | "question" | "contact" | "done";

type ConciergeStep = "name" | "method" | "phone" | "done";

type ServiceKey = "tint" | "rim_repair" | "detailing" | "more";
type ServiceStep = "menu" | "details" | "moreText" | "vehicleInfo" | "contactInfo" | "done";

type RightChoice = {
  label: string;
  onClick: () => void;
  selected?: boolean;
  variant?: "alt";
};

type IntakeState = {
  sessionId: string;
  selectedOption: number | null;
  accidentScenario: AccidentScenario | null;
  vehicleStatus: VehicleStatus | null;
  towDetails: string;
  notSureAtScene: YesNo | null;
  notSureDriveAway: YesNo | null;
  notSureWarningSigns: YesNo | null;
  notSureVehicleNow: string;
  exchangedInsurance: YesNo | null;
  ownInsuranceInfo: YesNotNowSkip | null;
  policeReport: YesNotNowSkip | null;
  claimNumber: string;
  photosTaken: YesNotNowSkip | null;
  fullCoverage: YesNoNotSure | null;
  contactedInsurance: YesNo | null;
  designatedRep: YesNoNotSure | null;
  damageStep: DamageStep;
  damageDescription: string;
  damageVehicleInfo: string;
  damagePayingOutOfPocket: YesNo | null;
  damageInsurancePaying: YesNoNotSure | null;
  conciergeName: string;
  conciergeMethod: "phone" | "text" | null;
  conciergePhone: string;
  accidentStep: AccidentStep;
  updatedAt: string;
};

const STORAGE_KEY = "uab_cockpit_intake_v1";

const BOOT_KEY = "uab_concierge_boot";

function setConciergeBoot(sessionId: string, kind: "police" | "photos" | "vin") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BOOT_KEY, JSON.stringify({ mode: "upload", kind, sessionId, ts: Date.now() }));
}


function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function formatYN(v: any) {
  if (v === "yes") return "Yes";
  if (v === "no") return "No";
  if (v === "not_now") return "Not right now";
  if (v === "skip") return "Skipped";
  if (v === "not_sure") return "Not sure";
  return "—";
}



function GuardianLogoPanel() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.32),transparent_42%),linear-gradient(180deg,#020617_0%,#07111f_52%,#020617_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_55%)]" />
      <div className="absolute inset-0 border border-sky-400/10 rounded-3xl shadow-[inset_0_0_50px_rgba(56,189,248,0.07)]" />
      <div className="relative h-[76%] w-[84%] overflow-hidden">
        <Image
          src="/gcnlogo.png"
          alt="Guardian Collision Network"
          fill
          priority
          className="object-contain object-center drop-shadow-[0_0_24px_rgba(125,211,252,0.22)]"
          sizes="(max-width: 768px) 70vw, 520px"
        />
      </div>
    </div>
  );
}

export default function Cockpit() {
  const { lang } = useLang();
  const ctext = (text: string) => cockpitUiText(lang, text);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [accidentStep, setAccidentStep] = useState<AccidentStep>("scenario");
  const [accidentScenario, setAccidentScenario] = useState<AccidentScenario | null>(null);
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus | null>(null);
  const [towDetails, setTowDetails] = useState<string>("");

  const [uploadKind, setUploadKind] = useState<"police" | "photos" | "vin" | null>(null);
  const [claimDraft, setClaimDraft] = useState<string>("");
  const [notSureVehicleNowDraft, setNotSureVehicleNowDraft] = useState<string>("");

  const [notSureAtScene, setNotSureAtScene] = useState<YesNo | null>(null);
  const [notSureDriveAway, setNotSureDriveAway] = useState<YesNo | null>(null);
  const [notSureWarningSigns, setNotSureWarningSigns] = useState<YesNo | null>(null);
  const [notSureVehicleNow, setNotSureVehicleNow] = useState<string>("");

  const [exchangedInsurance, setExchangedInsurance] = useState<YesNo | null>(null);
  const [ownInsuranceInfo, setOwnInsuranceInfo] = useState<YesNotNowSkip | null>(null);
  const [policeReport, setPoliceReport] = useState<YesNotNowSkip | null>(null);
  const [claimNumber, setClaimNumber] = useState<string>("");
  const [photosTaken, setPhotosTaken] = useState<YesNotNowSkip | null>(null);
  const [fullCoverage, setFullCoverage] = useState<YesNoNotSure | null>(null);
  const [contactedInsurance, setContactedInsurance] = useState<YesNo | null>(null);
  const [designatedRep, setDesignatedRep] = useState<YesNoNotSure | null>(null);

  const [damageStep, setDamageStep] = useState<DamageStep>("describe");
  const [damageDescription, setDamageDescription] = useState("");
  const [damageDescriptionDraft, setDamageDescriptionDraft] = useState("");
  const [damageVehicleInfo, setDamageVehicleInfo] = useState("");
  const [damageVehicleInfoDraft, setDamageVehicleInfoDraft] = useState("");
  const [damagePayingOutOfPocket, setDamagePayingOutOfPocket] = useState<YesNo | null>(null);
  const [damageInsurancePaying, setDamageInsurancePaying] = useState<YesNoNotSure | null>(null);

  const [serviceStep, setServiceStep] = useState<ServiceStep>("menu");
  const [serviceSelected, setServiceSelected] = useState<ServiceKey | null>(null);
  const [serviceScheduleRequested, setServiceScheduleRequested] = useState<YesNo | null>(null);
  const [serviceMoreText, setServiceMoreText] = useState("");
  const [serviceVehicleInfo, setServiceVehicleInfo] = useState("");

  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [conciergeStep, setConciergeStep] = useState<ConciergeStep>("name");
  const [conciergeName, setConciergeName] = useState("");
  const [conciergeMethod, setConciergeMethod] = useState<"phone" | "text" | null>(null);
  const [conciergePhone, setConciergePhone] = useState("");

  const [educationStep, setEducationStep] = useState<EducationStep>("topics");
  const [educationTopic, setEducationTopic] = useState<EducationTopic | null>(null);
  const [educationQuestion, setEducationQuestion] = useState("");
  const [educationName, setEducationName] = useState("");
  const [educationPhone, setEducationPhone] = useState("");
  const [educationBusy, setEducationBusy] = useState(false);
  const [educationError, setEducationError] = useState<string | null>(null);

  // ✅ NEW: handoff progress + error
  const [handoffBusy, setHandoffBusy] = useState(false);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    console.log("[Cockpit] uploader-boot 2026-03-07");
    if (typeof window === "undefined") return;

    const saved = safeJsonParse<IntakeState>(localStorage.getItem(STORAGE_KEY));

    // ✅ Use the same session ID as ConciergeBar.
    const nextSessionId = getOrCreateUabSessionId();
    setSessionId(nextSessionId);

    setSelectedOption(saved?.selectedOption ?? null);

    setAccidentScenario(saved?.accidentScenario ?? null);
    setVehicleStatus(saved?.vehicleStatus ?? null);
    setTowDetails(saved?.towDetails ?? "");
    setNotSureAtScene(saved?.notSureAtScene ?? null);
    setNotSureDriveAway(saved?.notSureDriveAway ?? null);
    setNotSureWarningSigns(saved?.notSureWarningSigns ?? null);
    setNotSureVehicleNow(saved?.notSureVehicleNow ?? "");
    setNotSureVehicleNowDraft(saved?.notSureVehicleNow ?? "");

    setExchangedInsurance(saved?.exchangedInsurance ?? null);
    setOwnInsuranceInfo(saved?.ownInsuranceInfo ?? null);
    setPoliceReport(saved?.policeReport ?? null);
    setClaimNumber(saved?.claimNumber ?? "");
    setPhotosTaken(saved?.photosTaken ?? null);
    setFullCoverage(saved?.fullCoverage ?? null);
    setContactedInsurance(saved?.contactedInsurance ?? null);
    setDesignatedRep(saved?.designatedRep ?? null);

    setDamageDescription(saved?.damageDescription ?? "");
    setDamageDescriptionDraft(saved?.damageDescription ?? "");
    setDamageVehicleInfo(saved?.damageVehicleInfo ?? "");
    setDamageVehicleInfoDraft(saved?.damageVehicleInfo ?? "");
    setDamagePayingOutOfPocket(saved?.damagePayingOutOfPocket ?? null);
    setDamageInsurancePaying(saved?.damageInsurancePaying ?? null);

    setConciergeName(saved?.conciergeName ?? "");
    setConciergeMethod(saved?.conciergeMethod ?? null);
    setConciergePhone(saved?.conciergePhone ?? "");

    {
      const allowed: AccidentStep[] = ["scenario","vehicle","towDetails","notSureScene","notSureScenePhone","notSureDriveAway","notSureWarningSigns","notSureVehicleNow","exchangeInsurance","ownInsurance","policeReport","policeUpload","photosTaken","fullCoverage","contactedInsurance","claimNumber","designatedRep","handoff","oopIntro","genericNext"];
      const next = (saved?.accidentStep as AccidentStep) || "scenario";
      setAccidentStep(allowed.includes(next) ? next : "scenario");
    }

    {
      const allowedDamage: DamageStep[] = ["describe", "vehicleInfo", "payingOutOfPocket", "insurancePaying", "handoff", "placeholder"];
      const nextDamage = (saved?.damageStep as DamageStep) || "describe";
      setDamageStep(allowedDamage.includes(nextDamage) ? nextDamage : "describe");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionId) return;

    const payload: IntakeState = {
      sessionId,
      selectedOption,
      accidentScenario,
      vehicleStatus,
      towDetails,
      notSureAtScene,
      notSureDriveAway,
      notSureWarningSigns,
      notSureVehicleNow,
      exchangedInsurance,
      ownInsuranceInfo,
      policeReport,
      claimNumber,
      photosTaken,
      fullCoverage,
      contactedInsurance,
      designatedRep,
      damageStep,
      damageDescription,
      damageVehicleInfo,
      damagePayingOutOfPocket,
      damageInsurancePaying,
      conciergeName,
      conciergeMethod,
      conciergePhone,
      accidentStep,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    sessionId,
    selectedOption,
    accidentScenario,
    vehicleStatus,
    towDetails,
    notSureAtScene,
    notSureDriveAway,
    notSureWarningSigns,
    notSureVehicleNow,
    exchangedInsurance,
    ownInsuranceInfo,
    policeReport,
    claimNumber,
    photosTaken,
    fullCoverage,
    contactedInsurance,
    designatedRep,
    damageStep,
    damageDescription,
    damageVehicleInfo,
    damagePayingOutOfPocket,
    damageInsurancePaying,
    conciergeName,
    conciergeMethod,
    conciergePhone,
    accidentStep,
  ]);

  useEffect(() => {
    if (selectedOption !== 1 && selectedOption !== 2) {
      setConciergeOpen(false);
      setConciergeStep("name");
    }
  }, [selectedOption]);

  function pinOption1() {
    if (selectedOption !== 1) setSelectedOption(1);
  }

  function pinOption2() {
    if (selectedOption !== 2) setSelectedOption(2);
  }

  function pinOption3() {
    if (selectedOption !== 3) setSelectedOption(3);
  }

  function pinOption4() {
    if (selectedOption !== 4) setSelectedOption(4);
  }

  function resetEducationFlow(clearContact = true) {
    setEducationStep("topics");
    setEducationTopic(null);
    setEducationQuestion("");
    setEducationName("");
    setEducationPhone("");
    setEducationBusy(false);
    setEducationError(null);
    if (clearContact) {
      setHandoffBusy(false);
      setHandoffError(null);
    }
  }

  function resetOption3State(clearContact = true) {
    setServiceStep("menu");
    setServiceSelected(null);
    setServiceScheduleRequested(null);
    setServiceMoreText("");
    setServiceVehicleInfo("");
    if (clearContact) {
      setConciergeName("");
      setConciergePhone("");
      setConciergeMethod(null);
      setHandoffBusy(false);
      setHandoffError(null);
    }
  }

  function resetOption2State(clearContact = true) {
    setDamageStep("describe");
    setDamageDescription("");
    setDamageDescriptionDraft("");
    setDamageVehicleInfo("");
    setDamageVehicleInfoDraft("");
    setDamagePayingOutOfPocket(null);
    setDamageInsurancePaying(null);

    if (clearContact) {
      setConciergeOpen(false);
      setConciergeStep("name");
      setConciergeName("");
      setConciergeMethod(null);
      setConciergePhone("");
      setHandoffBusy(false);
      setHandoffError(null);
    }
  }

  function beginTopLevelFlow(nextOption: number) {
    const nextSessionId = createFreshUabSessionId();
    setSessionId(nextSessionId);
    setSelectedOption(nextOption);
    setAccidentStep("scenario");
    resetOption2State(false);
    resetOption3State(false);
    setUploadKind(null);
    setConciergeOpen(false);
    setConciergeStep("name");
    setHandoffBusy(false);
    setHandoffError(null);
    resetEducationFlow();
  }

  function resetOption1() {
    pinOption1();
    const nextSessionId = createFreshUabSessionId();
    setSessionId(nextSessionId);
    setAccidentStep("scenario");
    setAccidentScenario(null);
    setVehicleStatus(null);
    setTowDetails("");
    setNotSureAtScene(null);
    setNotSureDriveAway(null);
    setNotSureWarningSigns(null);
    setNotSureVehicleNow("");
    setNotSureVehicleNowDraft("");

    setExchangedInsurance(null);
    setOwnInsuranceInfo(null);
    setPoliceReport(null);
    setClaimNumber("");
    setPhotosTaken(null);
    setFullCoverage(null);
    setContactedInsurance(null);
    setDesignatedRep(null);

    setConciergeOpen(false);
    setConciergeStep("name");
    setConciergeName("");
    setConciergeMethod(null);
    setConciergePhone("");
  }

  function resetOption2() {
    pinOption2();
    const nextSessionId = createFreshUabSessionId();
    setSessionId(nextSessionId);
    resetOption2State(true);
  }

  function resetOption3() {
    pinOption3();
    const nextSessionId = createFreshUabSessionId();
    setSessionId(nextSessionId);
    resetOption3State(true);
  }

  function resetOption4() {
    pinOption4();
    const nextSessionId = createFreshUabSessionId();
    setSessionId(nextSessionId);
    resetEducationFlow(true);
  }

  function selectScenario(s: AccidentScenario) {
    pinOption1();
    setAccidentScenario(s);
    setAccidentStep("vehicle");

    setVehicleStatus(null);
    setTowDetails("");
    setNotSureAtScene(null);
    setNotSureDriveAway(null);
    setNotSureWarningSigns(null);
    setNotSureVehicleNow("");
    setNotSureVehicleNowDraft("");
    setExchangedInsurance(null);
    setOwnInsuranceInfo(null);
    setPoliceReport(null);
    setClaimNumber("");
    setPhotosTaken(null);
    setFullCoverage(null);
    setContactedInsurance(null);
    setDesignatedRep(null);
  }

  function selectVehicleStatus(v: VehicleStatus) {
    pinOption1();
    setVehicleStatus(v);

    if (v === "It was towed") setAccidentStep("towDetails");
    else if (v === "It’s safe to drive") setAccidentStep("exchangeInsurance");
    else setAccidentStep("notSureScene");

    setTowDetails("");
    setNotSureAtScene(null);
    setNotSureDriveAway(null);
    setNotSureWarningSigns(null);
    setNotSureVehicleNow("");
    setNotSureVehicleNowDraft("");
    setExchangedInsurance(null);
    setOwnInsuranceInfo(null);
    setPoliceReport(null);
    setClaimNumber("");
    setPhotosTaken(null);
    setFullCoverage(null);
    setContactedInsurance(null);
    setDesignatedRep(null);
  }

  
function submitTowDetails() {
  setAccidentStep("exchangeInsurance");
}

function beginHandoff(forcePhone = false) {
  setAccidentStep("handoff");
  setConciergeOpen(true);
  setHandoffError(null);
  setHandoffBusy(false);
  if (forcePhone) {
    setConciergeMethod("phone");
    setConciergeStep("name");
  } else {
    setConciergeMethod(null);
    setConciergeStep("name");
  }
}

function answerNotSureAtScene(v: YesNo) {
  setNotSureAtScene(v);
  if (v === "yes") {
    setConciergeMethod("phone");
    setAccidentStep("notSureScenePhone");
    return;
  }
  setAccidentStep("notSureDriveAway");
}

function submitNotSureScenePhone() {
  const t = conciergePhone.trim();
  setConciergePhone(t);
  beginHandoff(true);
}

function answerNotSureDriveAway(v: YesNo) {
  setNotSureDriveAway(v);
  if (v === "yes") {
    setAccidentStep("notSureWarningSigns");
    return;
  }
  setAccidentStep("notSureVehicleNow");
}

function answerNotSureWarningSigns(v: YesNo) {
  setNotSureWarningSigns(v);
  beginHandoff(false);
}

function submitNotSureVehicleNow(value: string) {
  const t = value.trim();
  setNotSureVehicleNow(t);
  setNotSureVehicleNowDraft(t);
  beginHandoff(false);
}

function answerExchangeInsurance(v: YesNo) {
    setExchangedInsurance(v);
    setAccidentStep("ownInsurance");
  }

function answerOwnInsuranceInfo(v: YesNotNowSkip) {
  setOwnInsuranceInfo(v);
  setAccidentStep("policeReport");
}

function answerFullCoverage(v: YesNoNotSure) {
  setFullCoverage(v);
  if (v === "no") {
    setAccidentStep("oopIntro");
    return;
  }
  setAccidentStep("contactedInsurance");
}

function answerContactedInsurance(v: YesNo) {
  setContactedInsurance(v);
  if (v === "yes") {
    setAccidentStep("claimNumber");
    return;
  }
  setAccidentStep("designatedRep");
}

function answerPoliceReport(v: YesNotNowSkip) {
  setPoliceReport(v);
  if (v === "yes") {
    setUploadKind("police");
    setAccidentStep("policeUpload");
    return;
  }
  setAccidentStep("photosTaken");
}

function answerPhotosTaken(v: YesNotNowSkip) {
  setPhotosTaken(v);
  if (v === "yes") {
    setUploadKind("photos");
    setAccidentStep("policeUpload");
    return;
  }
  setAccidentStep("fullCoverage");
}

function submitClaimNumber(value: string) {
  const t = value.trim();
  setClaimNumber(t);
  setAccidentStep("designatedRep");
}

function answerDesignatedRep(v: YesNoNotSure) {
    setDesignatedRep(v);
    beginHandoff(false);
  }

  function backTo(step: AccidentStep) {
    pinOption1();
    setAccidentStep(step);
  }

  function submitDamageDescription(value: string) {
    pinOption2();
    const t = value.trim();
    setDamageDescription(t);
    setDamageDescriptionDraft(t);
    setDamageStep("vehicleInfo");
  }

  function submitDamageVehicleInfo(value: string) {
    pinOption2();
    const t = value.trim();
    setDamageVehicleInfo(t);
    setDamageVehicleInfoDraft(t);
    setDamageStep("payingOutOfPocket");
  }

  function openDamageVinUploader() {
    pinOption2();
    setUploadKind("vin");
    try {
      localStorage.setItem(
        "uab_concierge_boot",
        JSON.stringify({ mode: "upload", kind: "vin", sessionId })
      );
    } catch {}
    window.dispatchEvent(
      new CustomEvent("concierge:open", {
        detail: {
          mode: "default",
          intent: "other",
          handoff: false,
          handoffMessage: "Please upload a VIN photo using the upload button, then return here.",
        },
      })
    );
  }

  function openDamageEstimate() {
    pinOption2();

    window.dispatchEvent(
      new CustomEvent("concierge:open", {
        detail: {
          mode: "default",
          intent: "estimate",
          prefill: {
            damageDescription: damageDescription.trim(),
            vehicleInfo: damageVehicleInfo.trim(),
          },
        },
      })
    );
  }

  function answerDamageOutOfPocket(v: YesNo) {
    pinOption2();
    setDamagePayingOutOfPocket(v);
    setDamageInsurancePaying(null);

    if (v === "yes") {
      openDamageEstimate();
      return;
    }

    setDamageStep("insurancePaying");
  }

  function answerDamageInsurancePaying(v: YesNoNotSure) {
    pinOption2();
    setDamageInsurancePaying(v);

    if (v === "yes") {
      setConciergeOpen(true);
      setConciergeStep("name");
      setDamageStep("handoff");
      return;
    }

    setDamageStep("placeholder");
  }

  function chooseService(next: ServiceKey) {
    pinOption3();
    setServiceSelected(next);
    setServiceScheduleRequested(null);
    if (next === "more") {
      setServiceStep("moreText");
      return;
    }
    setServiceStep("details");
  }

  function serviceLabel(v: ServiceKey | null) {
    if (v === "tint") return "Window tint";
    if (v === "rim_repair") return "Rim repair";
    if (v === "detailing") return "Detailing";
    if (v === "more") return "Custom service request";
    return "Special service";
  }

  function servicePriceLine(v: ServiceKey | null) {
    if (v === "rim_repair") return "$185 per rim";
    if (v === "detailing") return "$250";
    if (v === "tint") return "Tint pricing and package options available";
    return "";
  }

  function answerServiceSchedule(v: YesNo) {
    setServiceScheduleRequested(v);
    setServiceStep(v === "yes" ? "vehicleInfo" : "contactInfo");
  }

  async function submitSpecialServiceIntake() {
    const nameTrim = conciergeName.trim();
    const phoneTrim = conciergePhone.trim();
    setHandoffBusy(true);
    setHandoffError(null);
    try {
      const res = await fetch("/api/concierge/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          intent: "special_service",
          answers: {
            intent: "special_service",
            customerName: nameTrim || "Customer",
            callbackNumber: phoneTrim || "",
            contactPreference: "call",
            intakeStartedIn: "Special Services",
            customerGoal: serviceLabel(serviceSelected),
            finalRoute: serviceScheduleRequested === "yes" ? "Schedule requested" : "Manager follow-up",
            serviceRequested: serviceLabel(serviceSelected),
            servicePrice: servicePriceLine(serviceSelected),
            scheduleRequested: serviceScheduleRequested === "yes" ? "Yes" : serviceScheduleRequested === "no" ? "No" : "Requested via More",
            serviceMoreText: serviceMoreText.trim(),
            vehicleInfo: serviceVehicleInfo.trim(),
          },
        }),
      });
      if (!res.ok) throw new Error(`notify failed: ${res.status}`);
      setServiceStep("done");
    } catch (e) {
      console.error("special service notify failed", e);
      setHandoffError("We had trouble sending that request. Please try again.");
    } finally {
      setHandoffBusy(false);
    }
  }

  // ✅ Updated: show processing state + auto-close modal for Text so chat is usable immediately
  async function submitConcierge() {
    const nameTrim = conciergeName.trim();
    const phoneTrim = conciergePhone.trim();

    setConciergeName(nameTrim);
    setConciergeMethod(conciergeMethod);
    setConciergePhone(phoneTrim);

    const contactPreference = conciergeMethod === "phone" ? "call" : "text";

    const notifyPayload = {
      sessionId,
      intent: "accident",
      answers: {
        intent: "accident",
        customerName: nameTrim || "Customer",
        callbackNumber: phoneTrim || "",
        contactPreference,

        accidentScenario,
        vehicleStatus,
        towDetails,
        notSureAtScene,
        notSureDriveAway,
        notSureWarningSigns,
        notSureVehicleNow,
        exchangedInsurance,
        ownInsuranceInfo,
        policeReport,
        claimNumber,
        photosTaken,
        fullCoverage,
        contactedInsurance,
        designatedRep,
      },
    };

    setHandoffBusy(true);
    setHandoffError(null);

    try {
      const res = await fetch("/api/concierge/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifyPayload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`notify failed: ${res.status} ${t}`);
      }

      if (contactPreference === "text") {
        window.dispatchEvent(
          new CustomEvent("concierge:open", {
            detail: {
              mode: "default",
              intent: "other",
              handoff: true,
              handoffMessage:
                "Thanks for the information. We sent everything to Guardian. You can message here and we’ll reply shortly.",
            },
          })
        );

        // ✅ don’t force them to close the modal to use the chat
        setConciergeOpen(false);
      }

      setConciergeStep("done");
    } catch (e: any) {
      console.error("cockpit concierge notify failed", e);
      setHandoffError("Give us a minute — we’re having trouble processing your request. Please try again.");
    } finally {
      setHandoffBusy(false);
    }
  }


  const educationTopics: EducationTopic[] = [
    "History of the labor rate",
    "Your policy and A/M parts",
    "First party vs third party",
    "Total losses in NY",
    "Appraisal clause",
    "Designated representative",
  ];

  const educationSummaries: Record<EducationTopic, string[]> = {
    "History of the labor rate": [
      "Learn how collision labor rates evolved and why insurance reimbursement often lags behind the real cost of proper repairs.",
    ],
    "Your policy and A/M parts": [
      "A basic explanation of what your policy may say about aftermarket or alternative parts and how that can affect your repair.",
    ],
    "First party vs third party": [
      "See the difference between using your own insurance and pursuing the other driver’s policy, and why that changes the process.",
    ],
    "Total losses in NY": [
      "A simple overview of how total loss decisions work in New York and what to watch for if the carrier says your car may be totaled.",
    ],
    "Appraisal clause": [
      "Understand what the appraisal clause is, when it can apply, and how it may help in a dispute over value.",
    ],
    "Designated representative": [
      "Find out what a designated representative does and why it can help during parts, repair, and claim negotiations.",
    ],
  };

  async function submitEducationQuestion() {
    const nameTrim = educationName.trim();
    const phoneTrim = educationPhone.trim();
    const questionTrim = educationQuestion.trim();

    setEducationName(nameTrim);
    setEducationPhone(phoneTrim);

    if (!educationTopic || !questionTrim || !nameTrim || phoneTrim.length < 7) {
      setEducationError("Please fill in your question, name, and phone number.");
      return;
    }

    setEducationBusy(true);
    setEducationError(null);

    try {
      const res = await fetch("/api/concierge/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          intent: "education_question",
          answers: {
            intent: "education_question",
            intakeStartedIn: "Collision Claims & Insurance Education",
            customerGoal: "Educational information",
            topicSelected: educationTopic,
            customerQuestion: questionTrim,
            customerName: nameTrim,
            callbackNumber: phoneTrim,
            contactPreference: "call",
            finalRoute: "Question submitted from educational information",
          },
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`notify failed: ${res.status} ${t}`);
      }

      setEducationStep("done");
    } catch (e) {
      console.error("education question notify failed", e);
      setEducationError("Give us a minute — we’re having trouble sending your question. Please try again.");
    } finally {
      setEducationBusy(false);
    }
  }

  const wheelCopy: Record<number, OptionCopy> = {
    1: {
      title: "I was in an accident",
      rightTitle: "Please select which one:",
      rightLines: [
        "I hit someone",
        "Someone hit me",
        "No other vehicle involved",
        "My vehicle was parked",
        "Something else happened",
      ],
    },
    2: { title: "Do you need help with vehicle damage?", lines: ["Scratches, dents, or body damage — we’ve got it."] },
    3: { title: "Looking for special services?", lines: ["Tint, rim repair, detailing, and more."] },
    4: { title: "Collision Claims & Insurance Education", lines: ["Choose a topic to learn more about repairs, claims, and your rights."] },
    5: { title: "Need claim guidance?", lines: ["Get guidance before deciding how to move forward."] },
    6: { title: "Need help deciding how to handle the damage?", lines: ["Insurance, out-of-pocket, or help deciding the best path."] },
  };

  const choiceBase =
    `${rajdhani.className} ` +
    "block w-full text-left text-[16px] md:text-[18px] leading-snug tracking-[0.02em] py-2 transition " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 rounded-md";

  const choiceIdle =
    "text-white/80 hover:text-sky-200 hover:drop-shadow-[0_0_10px_rgba(125,211,252,0.75)]";

  const choiceSelected = "text-sky-200 drop-shadow-[0_0_12px_rgba(125,211,252,0.95)]";

  const choiceAlt =
    "text-white/55 hover:text-sky-200 hover:drop-shadow-[0_0_10px_rgba(125,211,252,0.75)]";

  const optionChosen = selectedOption !== null;
  const activeSideOption = optionChosen ? (selectedOption as number) : null;

  let leftTitleText = "";
  let rightTitleText = "";
  let leftPanelLines: string[] = [];
  let rightPanelLines: string[] = [];
  let leftChoices: RightChoice[] | null = null;
  let rightChoices: RightChoice[] | null = null;
  let rightCustom: ReactNode | null = null;

  if (!optionChosen) {
    leftTitleText = "Select one:";
    leftPanelLines = [];
    rightTitleText = "Select one:";
    rightPanelLines = [];
    rightChoices = null;
  } else {
    const baseCopy = wheelCopy[activeSideOption as number];

    leftTitleText = baseCopy.leftTitle ?? baseCopy.title;
    rightTitleText = baseCopy.rightTitle ?? baseCopy.title;
    leftPanelLines = baseCopy.leftLines ?? baseCopy.lines ?? [];
    rightPanelLines = baseCopy.rightLines ?? baseCopy.lines ?? [];
    leftChoices = null;
    rightChoices = null;

    if (activeSideOption === 1) {
            
if (accidentStep === "scenario") {
              leftTitleText = "Select accident type:";
              rightTitleText = "Select accident type:";
              leftPanelLines = [];
              rightPanelLines = [];

              leftChoices = [
                { label: "I hit someone", onClick: () => selectScenario("I hit someone"), selected: accidentScenario === "I hit someone" },
                { label: "Someone hit me", onClick: () => selectScenario("Someone hit me"), selected: accidentScenario === "Someone hit me" },
                { label: "No other vehicle involved", onClick: () => selectScenario("No other vehicle involved"), selected: accidentScenario === "No other vehicle involved" },
              ];

              rightChoices = [
                { label: "My vehicle was parked", onClick: () => selectScenario("My vehicle was parked"), selected: accidentScenario === "My vehicle was parked" },
                { label: "Something else happened", onClick: () => selectScenario("Something else happened"), selected: accidentScenario === "Something else happened" },
                { label: "Back", onClick: () => setSelectedOption(null), variant: "alt" },
              ];
            }

if (accidentStep === "vehicle") {
        leftTitleText = "Vehicle status";
        leftPanelLines = [
          accidentScenario ? `Got it: ${accidentScenario}.` : "Got it.",
          "Was your vehicle safe to drive, towed away, or not sure?",
        ];
        rightTitleText = "Please select one:";
        rightChoices = [
          { label: "It’s safe to drive", onClick: () => selectVehicleStatus("It’s safe to drive"), selected: vehicleStatus === "It’s safe to drive" },
          { label: "It was towed", onClick: () => selectVehicleStatus("It was towed"), selected: vehicleStatus === "It was towed" },
          { label: "Not sure", onClick: () => selectVehicleStatus("Not sure"), selected: vehicleStatus === "Not sure" },
          { label: "Back", onClick: () => backTo("scenario"), variant: "alt" },
        ];
        rightPanelLines = [];
      }


if (accidentStep === "towDetails") {
  leftTitleText = "Tow details";
  leftPanelLines = [
    "If your vehicle was towed, do you know who towed it?",
    "Name and phone number are helpful. Address if you have it.",
  ];
  rightTitleText = "Enter info (optional)";
  rightPanelLines = [];
  rightChoices = [
    { label: "Skip", onClick: () => { setTowDetails(""); submitTowDetails(); }, variant: "alt" },
    { label: "Back", onClick: () => backTo("vehicle"), variant: "alt" },
  ];

  rightCustom = (
    <div className="mt-3 space-y-2">
      <textarea
        value={towDetails}
        onChange={(e) => setTowDetails(e.target.value)}
        placeholder={ctext("Tow company, phone, address (optional)")}
        className="w-full min-h-[90px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white/90 outline-none focus:border-sky-400/50"
      />
      <button
        type="button"
        onClick={() => submitTowDetails()}
        className="w-full rounded-xl border border-sky-400/40 bg-black/40 px-4 py-2 text-[12px] text-sky-200 hover:border-sky-400/70"
      >
        {ctext("Continue")}
      </button>
    </div>
  );
}


if (accidentStep === "notSureScene") {
  leftTitleText = "Safety check";
  leftPanelLines = [
    "Since you are not sure whether the vehicle is safe to drive, we just need a couple quick questions.",
    "Are you still at the scene of the accident?",
  ];
  rightTitleText = "Select one:";
  rightPanelLines = [];
  rightChoices = [
    { label: "Yes", onClick: () => answerNotSureAtScene("yes"), selected: notSureAtScene === "yes" },
    { label: "No", onClick: () => answerNotSureAtScene("no"), selected: notSureAtScene === "no" },
    { label: "Back", onClick: () => backTo("vehicle"), variant: "alt" },
  ];
}

if (accidentStep === "notSureScenePhone") {
  leftTitleText = "Call right away";
  leftPanelLines = [
    "Please give us the best number to reach you right now.",
    "A Guardian representative will call you as soon as possible.",
  ];
  rightTitleText = "Phone number";
  rightPanelLines = [];
  rightChoices = [
    { label: "Continue", onClick: submitNotSureScenePhone },
    { label: "Back", onClick: () => backTo("notSureScene"), variant: "alt" },
  ];
  rightCustom = (
    <div className="mt-3 space-y-2">
      <input
        value={conciergePhone}
        onChange={(e) => setConciergePhone(e.target.value)}
        placeholder={ctext("(___) ___-____")}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white/90 outline-none focus:border-sky-400/50"
      />
      <button
        type="button"
        onClick={submitNotSureScenePhone}
        disabled={conciergePhone.trim().length < 7}
        className="w-full rounded-xl border border-sky-400/40 bg-black/40 px-4 py-2 text-[12px] text-sky-200 hover:border-sky-400/70 disabled:opacity-40"
      >
        {ctext("Continue")}
      </button>
    </div>
  );
}

if (accidentStep === "notSureDriveAway") {
  leftTitleText = "Vehicle movement";
  leftPanelLines = ["Were you able to drive away from the accident?"];
  rightTitleText = "Select one:";
  rightPanelLines = [];
  rightChoices = [
    { label: "Yes", onClick: () => answerNotSureDriveAway("yes"), selected: notSureDriveAway === "yes" },
    { label: "No", onClick: () => answerNotSureDriveAway("no"), selected: notSureDriveAway === "no" },
    { label: "Back", onClick: () => backTo("notSureScene"), variant: "alt" },
  ];
}

if (accidentStep === "notSureWarningSigns") {
  leftTitleText = "Quick safety check";
  leftPanelLines = [
    "Are any fluids leaking, is the engine overheating, or do you hear any rubbing / scraping / unusual noises from the car?",
  ];
  rightTitleText = "Select one:";
  rightPanelLines = [];
  rightChoices = [
    { label: "Yes", onClick: () => answerNotSureWarningSigns("yes"), selected: notSureWarningSigns === "yes" },
    { label: "No", onClick: () => answerNotSureWarningSigns("no"), selected: notSureWarningSigns === "no" },
    { label: "Back", onClick: () => backTo("notSureDriveAway"), variant: "alt" },
  ];
}

if (accidentStep === "notSureVehicleNow") {
  leftTitleText = "Vehicle location";
  leftPanelLines = [
    "Where is the vehicle now?",
    "If you know the tow yard, shop, street, or parking lot, add it here.",
  ];
  rightTitleText = "Enter info";
  rightPanelLines = [];
  rightChoices = [
    { label: "Continue", onClick: () => submitNotSureVehicleNow(notSureVehicleNowDraft) },
    { label: "Skip", onClick: () => submitNotSureVehicleNow(""), variant: "alt" },
    { label: "Back", onClick: () => backTo("notSureDriveAway"), variant: "alt" },
  ];
  rightCustom = (
    <div className="mt-3 space-y-2">
      <textarea
        value={notSureVehicleNowDraft}
        onChange={(e) => setNotSureVehicleNowDraft(e.target.value)}
        placeholder={ctext("Current vehicle location")}
        className="w-full min-h-[90px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white/90 outline-none focus:border-sky-400/50"
      />
      <button
        type="button"
        onClick={() => submitNotSureVehicleNow(notSureVehicleNowDraft)}
        className="w-full rounded-xl border border-sky-400/40 bg-black/40 px-4 py-2 text-[12px] text-sky-200 hover:border-sky-400/70"
      >
        {ctext("Continue")}
      </button>
    </div>
  );
}


      if (accidentStep === "exchangeInsurance") {
        leftTitleText = "Next question";
        leftPanelLines = ["Did you exchange insurance information?"];
        rightTitleText = "Select one:";
        rightChoices = [
          { label: "Yes", onClick: () => answerExchangeInsurance("yes"), selected: exchangedInsurance === "yes" },
          { label: "No", onClick: () => answerExchangeInsurance("no"), selected: exchangedInsurance === "no" },
          { label: "Back", onClick: () => backTo("vehicle"), variant: "alt" },
        ];
        rightPanelLines = [];
      }


if (accidentStep === "ownInsurance") {
  leftTitleText = "Insurance info";
  leftPanelLines = ["Do you have your own insurance information available?"];
  rightTitleText = "Select one:";
  rightPanelLines = [];
  rightChoices = [
    { label: "Yes", onClick: () => answerOwnInsuranceInfo("yes"), selected: ownInsuranceInfo === "yes" },
    { label: "Not right now", onClick: () => answerOwnInsuranceInfo("not_now"), selected: ownInsuranceInfo === "not_now" },
    { label: "Skip", onClick: () => answerOwnInsuranceInfo("skip"), selected: ownInsuranceInfo === "skip" },
    { label: "Back", onClick: () => backTo("exchangeInsurance"), variant: "alt" },
  ];
}

      
if (accidentStep === "policeReport") {
  leftTitleText = "Next question";
  leftPanelLines = ["Do you have a police report?"];
  rightTitleText = "Select one:";
  rightPanelLines = [];
  rightChoices = [
    { label: "Yes", onClick: () => answerPoliceReport("yes"), selected: policeReport === "yes" },
    { label: "Not right now", onClick: () => answerPoliceReport("not_now"), selected: policeReport === "not_now" },
    { label: "Skip", onClick: () => answerPoliceReport("skip"), selected: policeReport === "skip" },
    { label: "Back", onClick: () => backTo("ownInsurance"), variant: "alt" },
  ];
}

if (accidentStep === "policeUpload") {
  const isPolice = uploadKind === "police";
  leftTitleText = isPolice ? "Upload police report (optional)" : "Upload photos (optional)";
  leftPanelLines = [
    isPolice
      ? "If you have it, you can upload the police report in Concierge PLUS."
      : "If you have them, you can upload photos in Concierge PLUS.",
    "You can also skip and continue.",
  ];
  rightTitleText = "Actions";
  rightPanelLines = [];
  rightChoices = [
    {
      label: "Open uploader",
      onClick: () => {
        try {
          localStorage.setItem(
            "uab_concierge_boot",
            JSON.stringify({ mode: "upload", kind: isPolice ? "police" : "photos", sessionId })
          );
        } catch {}
        window.dispatchEvent(
          new CustomEvent("concierge:open", {
            detail: {
              mode: "default",
              intent: "other",
              source: "cockpit-upload",
              handoff: false,
              handoffMessage: isPolice
                ? "Please upload the police report using the upload button, then return here."
                : "Please upload photos of the damage using the upload button, then return here.",
            },
          })
        );
      },
    },
    {
      label: "Continue",
      onClick: () => {
        const next = isPolice ? "photosTaken" : "fullCoverage";
        setUploadKind(null);
        setAccidentStep(next);
      },
    },
    {
      label: "Back",
      onClick: () => {
        const prev = isPolice ? "policeReport" : "photosTaken";
        setUploadKind(null);
        setAccidentStep(prev);
      },
      variant: "alt",
    },
  ];
}


if (accidentStep === "photosTaken") {
  leftTitleText = "Photos";
  leftPanelLines = ["Do you have photos of the vehicles / damage?"];
  rightTitleText = "Select one:";
  rightPanelLines = [];
  rightChoices = [
    { label: "Yes", onClick: () => answerPhotosTaken("yes"), selected: photosTaken === "yes" },
    { label: "Not right now", onClick: () => answerPhotosTaken("not_now"), selected: photosTaken === "not_now" },
    { label: "Skip", onClick: () => answerPhotosTaken("skip"), selected: photosTaken === "skip" },
    { label: "Back", onClick: () => backTo("policeReport"), variant: "alt" },
  ];
}


if (accidentStep === "fullCoverage") {
  leftTitleText = "Coverage";
  leftPanelLines = ["Do you have full coverage / collision coverage?"];
  rightTitleText = "Select one:";
  rightPanelLines = [];
  rightChoices = [
    { label: "Yes", onClick: () => answerFullCoverage("yes"), selected: fullCoverage === "yes" },
    { label: "No", onClick: () => answerFullCoverage("no"), selected: fullCoverage === "no" },
    { label: "Not sure", onClick: () => answerFullCoverage("not_sure"), selected: fullCoverage === "not_sure" },
    { label: "Back", onClick: () => backTo("photosTaken"), variant: "alt" },
  ];
}


      if (accidentStep === "oopIntro") {
        leftTitleText = "Out of pocket";
        leftPanelLines = [
          "Got it — no full coverage.",
          "Don’t worry — we can still help you document the damage and guide you through an out-of-pocket path.",
          "",
          "Next, we’ll ask for photos and a few details so Guardian can guide you accurately.",
        ];

        rightTitleText = "Next step";
        rightChoices = [
          {
            label: "Continue to estimate (photos + details)",
            onClick: () => {
              const nextSessionId = createFreshUabSessionId();
              setSessionId(nextSessionId);
              window.dispatchEvent(
                new CustomEvent("concierge:open", {
                  detail: { mode: "default", intent: "estimate" },
                })
              );
            },
          },
          { label: "Back", onClick: () => backTo("fullCoverage"), variant: "alt" },
        ];
        rightPanelLines = [];
      }

if (accidentStep === "contactedInsurance") {
  leftTitleText = "Insurance";
  leftPanelLines = ["Have you contacted your insurance company yet?"];
  rightTitleText = "Select one:";
  rightPanelLines = [];
  rightChoices = [
    { label: "Yes", onClick: () => answerContactedInsurance("yes"), selected: contactedInsurance === "yes" },
    { label: "No", onClick: () => answerContactedInsurance("no"), selected: contactedInsurance === "no" },
    { label: "Back", onClick: () => backTo("fullCoverage"), variant: "alt" },
  ];
}



if (accidentStep === "claimNumber") {
  leftTitleText = "Claim # (optional)";
  leftPanelLines = ["If you have a claim number, enter it here. Otherwise you can skip."];
  rightTitleText = "Enter info";
  rightPanelLines = [];
  rightChoices = [
    { label: "Continue", onClick: () => submitClaimNumber(claimDraft) },
    { label: "Skip", onClick: () => submitClaimNumber(""), variant: "alt" },
    { label: "Back", onClick: () => backTo("contactedInsurance"), variant: "alt" },
  ];
  rightCustom = (
    <div className="mt-3 space-y-2">
      <input
        value={claimDraft}
        onChange={(e) => setClaimDraft(e.target.value)}
        placeholder={ctext("Claim #")}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white/90 outline-none focus:border-sky-400/50"
      />
      <button
        type="button"
        onClick={() => submitClaimNumber(claimDraft)}
        className="w-full rounded-xl border border-sky-400/40 bg-black/40 px-4 py-2 text-[12px] text-sky-200 hover:border-sky-400/70"
      >
        {ctext("Continue")}
      </button>
    </div>
  );
}


      if (accidentStep === "designatedRep") {
        leftTitleText = "Designated Representative";
        leftPanelLines = [
          "Would you like Guardian to act as your Designated Representative and help guide your insurance claim?",
        ];
        rightTitleText = "Select one:";
        rightChoices = [
          { label: "Yes", onClick: () => answerDesignatedRep("yes"), selected: designatedRep === "yes" },
          { label: "No", onClick: () => answerDesignatedRep("no"), selected: designatedRep === "no" },
          { label: "Not sure", onClick: () => answerDesignatedRep("not_sure"), selected: designatedRep === "not_sure" },
          { label: "Back", onClick: () => backTo("contactedInsurance"), variant: "alt" },
        ];
        rightPanelLines = [];
      }

      if (accidentStep === "handoff") {
        const urgentNotSure = vehicleStatus === "Not sure" && notSureAtScene === "yes";
        leftTitleText = urgentNotSure ? "Guardian call" : "Connect with Guardian";
        leftPanelLines = urgentNotSure
          ? [
              "Thanks — we have what we need.",
              "A Guardian representative will call you shortly. We just need your name to finish the intake.",
            ]
          : vehicleStatus === "Not sure"
            ? [
                "Thanks — we have enough to get a Guardian representative involved.",
                "A Guardian representative will be in touch shortly. Choose how you’d like to connect:",
              ]
            : [
                "Thanks — we’ll send everything you entered to Guardian now.",
                "Choose how you’d like to connect:",
              ];
        rightTitleText = "Concierge PLUS";
        rightChoices = [
          {
            label: conciergeOpen ? "Concierge PLUS is open" : "Open Concierge PLUS",
            onClick: () => {
              setConciergeOpen(true);
              setConciergeStep("name");
              setHandoffError(null);
              setHandoffBusy(false);
            },
          },
          { label: "Start over", onClick: resetOption1, variant: "alt" },
        ];
        rightPanelLines = [];
      }

      if (accidentStep === "genericNext") {
        leftTitleText = "Next steps";
        const summary = [
  `Scenario: ${accidentScenario ?? "—"}`,
  `Vehicle: ${vehicleStatus ?? "—"}`,
  `Tow details: ${towDetails?.trim() ? towDetails.trim() : "—"}`,
  `At accident scene: ${formatYN(notSureAtScene)}`,
  `Able to drive away: ${formatYN(notSureDriveAway)}`,
  `Warning signs: ${formatYN(notSureWarningSigns)}`,
  `Vehicle location now: ${notSureVehicleNow?.trim() ? notSureVehicleNow.trim() : "—"}`,
  `Exchanged info: ${formatYN(exchangedInsurance)}`,
  `Own insurance: ${formatYN(ownInsuranceInfo)}`,
  `Police report: ${formatYN(policeReport)}`,
  `Photos: ${formatYN(photosTaken)}`,
  `Full coverage: ${formatYN(fullCoverage)}`,
  `Contacted insurer: ${formatYN(contactedInsurance)}`,
  `Claim #: ${claimNumber?.trim() ? claimNumber.trim() : "—"}`,
  `Designated rep: ${formatYN(designatedRep)}`,
];
        leftPanelLines = ["For now, here’s what we saved:", ...summary];
        rightTitleText = "Actions";
        rightChoices = [
          { label: "Start over", onClick: resetOption1 },
          {
            label: "Open Concierge PLUS",
            onClick: () => {
              setConciergeOpen(true);
              setConciergeStep("name");
              setAccidentStep("handoff");
            },
          },
        ];
        rightPanelLines = [];
      }
    }
  }


if (activeSideOption === 2) {
  if (damageStep === "describe") {
    leftTitleText = "Tell us what you need fixed";
    leftPanelLines = [
      "Scratches, dents, or body damage — we’ve got you covered.",
      "Tell us what you are looking to get done.",
    ];
    rightTitleText = "Description";
    rightPanelLines = [];
    rightChoices = [
      { label: "Continue", onClick: () => submitDamageDescription(damageDescriptionDraft) },
      { label: "Back", onClick: () => setSelectedOption(null), variant: "alt" },
    ];
    rightCustom = (
      <div className="mt-3 space-y-2">
        <textarea
          value={damageDescriptionDraft}
          onChange={(e) => setDamageDescriptionDraft(e.target.value)}
          placeholder={ctext("Describe the damage you want fixed")}
          className="w-full min-h-[100px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white/90 outline-none focus:border-sky-400/50"
        />
        <button
          type="button"
          onClick={() => submitDamageDescription(damageDescriptionDraft)}
          disabled={damageDescriptionDraft.trim().length === 0}
          className="w-full rounded-xl border border-sky-400/40 bg-black/40 px-4 py-2 text-[12px] text-sky-200 hover:border-sky-400/70 disabled:opacity-40"
        >
          {ctext("Continue")}
        </button>
      </div>
    );
  }

  if (damageStep === "vehicleInfo") {
    leftTitleText = "Vehicle info";
    leftPanelLines = [
      "Enter the year, make, and model of the vehicle.",
      "VIN is preferred if you have it, but year / make / model is enough to keep going.",
      "You can also upload a photo of the VIN.",
    ];
    rightTitleText = "Enter info";
    rightPanelLines = [];
    rightChoices = [
      { label: "Open VIN uploader", onClick: openDamageVinUploader },
      { label: "Continue", onClick: () => submitDamageVehicleInfo(damageVehicleInfoDraft) },
      { label: "Back", onClick: () => setDamageStep("describe"), variant: "alt" },
    ];
    rightCustom = (
      <div className="mt-3 space-y-2">
        <textarea
          value={damageVehicleInfoDraft}
          onChange={(e) => setDamageVehicleInfoDraft(e.target.value)}
          placeholder={ctext("Year, make, model, and VIN if available")}
          className="w-full min-h-[100px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white/90 outline-none focus:border-sky-400/50"
        />
        <button
          type="button"
          onClick={() => submitDamageVehicleInfo(damageVehicleInfoDraft)}
          disabled={damageVehicleInfoDraft.trim().length === 0}
          className="w-full rounded-xl border border-sky-400/40 bg-black/40 px-4 py-2 text-[12px] text-sky-200 hover:border-sky-400/70 disabled:opacity-40"
        >
          {ctext("Continue")}
        </button>
      </div>
    );
  }

  if (damageStep === "payingOutOfPocket") {
    leftTitleText = "Payment path";
    leftPanelLines = [
      "Are you paying out of pocket?",
      damageVehicleInfo.trim() ? `Vehicle info saved: ${damageVehicleInfo.trim()}` : "Vehicle info saved.",
    ];
    rightTitleText = "Select one:";
    rightPanelLines = [];
    rightChoices = [
      { label: "Yes", onClick: () => answerDamageOutOfPocket("yes"), selected: damagePayingOutOfPocket === "yes" },
      { label: "No", onClick: () => answerDamageOutOfPocket("no"), selected: damagePayingOutOfPocket === "no" },
      { label: "Back", onClick: () => setDamageStep("vehicleInfo"), variant: "alt" },
    ];
  }

  if (damageStep === "insurancePaying") {
    leftTitleText = "Insurance";
    leftPanelLines = ["Is insurance paying for the repair?"];
    rightTitleText = "Select one:";
    rightPanelLines = [];
    rightChoices = [
      { label: "Yes", onClick: () => answerDamageInsurancePaying("yes"), selected: damageInsurancePaying === "yes" },
      { label: "No", onClick: () => answerDamageInsurancePaying("no"), selected: damageInsurancePaying === "no" },
      { label: "Not sure", onClick: () => answerDamageInsurancePaying("not_sure"), selected: damageInsurancePaying === "not_sure" },
      { label: "Back", onClick: () => setDamageStep("payingOutOfPocket"), variant: "alt" },
    ];
  }

  if (damageStep === "handoff") {
    leftTitleText = "Manager call";
    leftPanelLines = [
      "Perfect — we’ll send this to Guardian and a representative will call you right away.",
      "Open Concierge PLUS to finish the handoff.",
    ];
    rightTitleText = "Actions";
    rightPanelLines = [];
    rightChoices = [
      {
        label: conciergeOpen ? "Concierge PLUS is open" : "Open Concierge PLUS",
        onClick: () => {
          setConciergeOpen(true);
          setConciergeStep("name");
        },
      },
      { label: "Back", onClick: () => setDamageStep("insurancePaying"), variant: "alt" },
    ];
  }

  if (damageStep === "placeholder") {
    leftTitleText = "Payment help";
    leftPanelLines = [
      "This ‘damage but unsure how to pay’ path is the next branch we’re building.",
      "For now, Guardian saved what you entered so far.",
    ];
    rightTitleText = "What we saved";
    rightPanelLines = [
      `Damage: ${damageDescription.trim() || "—"}`,
      `Vehicle info: ${damageVehicleInfo.trim() || "—"}`,
      `Insurance paying: ${formatYN(damageInsurancePaying)}`,
    ];
    rightChoices = [
      { label: "Back", onClick: () => setDamageStep("insurancePaying"), variant: "alt" },
      { label: "Start over", onClick: resetOption2 },
    ];
  }
}


if (activeSideOption === 3) {
  if (serviceStep === "menu") {
    leftTitleText = "Special services";
    leftPanelLines = ["Select the service you are interested in.", "We’ll either help coordinate it or send it to a Guardian representative for follow-up."];
    rightTitleText = "Please select one:";
    rightPanelLines = [];
    rightChoices = [
      { label: "Tint", onClick: () => chooseService("tint"), selected: serviceSelected === "tint" },
      { label: "Rim repair", onClick: () => chooseService("rim_repair"), selected: serviceSelected === "rim_repair" },
      { label: "Detailing", onClick: () => chooseService("detailing"), selected: serviceSelected === "detailing" },
      { label: "More", onClick: () => chooseService("more"), selected: serviceSelected === "more" },
      { label: "Back", onClick: () => setSelectedOption(null), variant: "alt" },
    ];
  }

  if (serviceStep === "details") {
    leftTitleText = serviceLabel(serviceSelected);
    leftPanelLines = [
      serviceSelected === "tint" ? "We offer tint options and pricing based on the vehicle and film choice." : serviceSelected === "rim_repair" ? "Rim repair is $185 per rim." : "Detailing is $250.",
      "Would you like to schedule this service?",
    ];
    rightTitleText = "Select one:";
    rightPanelLines = servicePriceLine(serviceSelected) ? [servicePriceLine(serviceSelected)] : [];
    rightChoices = [
      { label: "Yes", onClick: () => answerServiceSchedule("yes"), selected: serviceScheduleRequested === "yes" },
      { label: "No", onClick: () => answerServiceSchedule("no"), selected: serviceScheduleRequested === "no" },
      { label: "Back", onClick: () => setServiceStep("menu"), variant: "alt" },
    ];
  }

  if (serviceStep === "moreText") {
    leftTitleText = "Tell us what you need";
    leftPanelLines = ["Tell us what special service you are looking for."];
    rightTitleText = "Description";
    rightPanelLines = [];
    rightChoices = [
      { label: "Continue", onClick: () => setServiceStep("contactInfo") },
      { label: "Back", onClick: () => setServiceStep("menu"), variant: "alt" },
    ];
    rightCustom = (
      <div className="mt-3 space-y-2">
        <textarea
          value={serviceMoreText}
          onChange={(e) => setServiceMoreText(e.target.value)}
          placeholder={ctext("Describe the special service you want")}
          className="w-full min-h-[100px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white/90 outline-none focus:border-sky-400/50"
        />
        <button
          type="button"
          onClick={() => setServiceStep("contactInfo")}
          disabled={serviceMoreText.trim().length === 0}
          className="w-full rounded-xl border border-sky-400/40 bg-black/40 px-4 py-2 text-[12px] text-sky-200 hover:border-sky-400/70 disabled:opacity-40"
        >
          {ctext("Continue")}
        </button>
      </div>
    );
  }

  if (serviceStep === "vehicleInfo") {
    leftTitleText = "Vehicle information";
    leftPanelLines = ["Please enter the year, make, and model of the vehicle."];
    rightTitleText = "Vehicle";
    rightPanelLines = [];
    rightChoices = [
      { label: "Continue", onClick: () => setServiceStep("contactInfo") },
      { label: "Back", onClick: () => setServiceStep("details"), variant: "alt" },
    ];
    rightCustom = (
      <div className="mt-3 space-y-2">
        <textarea
          value={serviceVehicleInfo}
          onChange={(e) => setServiceVehicleInfo(e.target.value)}
          placeholder={ctext("Year, make, model")}
          className="w-full min-h-[100px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white/90 outline-none focus:border-sky-400/50"
        />
        <button
          type="button"
          onClick={() => setServiceStep("contactInfo")}
          disabled={serviceVehicleInfo.trim().length === 0}
          className="w-full rounded-xl border border-sky-400/40 bg-black/40 px-4 py-2 text-[12px] text-sky-200 hover:border-sky-400/70 disabled:opacity-40"
        >
          {ctext("Continue")}
        </button>
      </div>
    );
  }

  if (serviceStep === "contactInfo") {
    leftTitleText = "Finish intake";
    leftPanelLines = [
      serviceScheduleRequested === "yes" ? "We just need your name and best callback number to finish scheduling." : "We just need your name and best callback number and a Guardian representative will reach out.",
    ];
    rightTitleText = "Contact info";
    rightPanelLines = [];
    rightChoices = [
      { label: handoffBusy ? "Sending..." : "Submit", onClick: submitSpecialServiceIntake },
      { label: "Back", onClick: () => setServiceStep(serviceScheduleRequested === "yes" ? "vehicleInfo" : serviceSelected === "more" ? "moreText" : "details"), variant: "alt" },
    ];
    rightCustom = (
      <div className="mt-3 space-y-2">
        <input
          value={conciergeName}
          onChange={(e) => setConciergeName(e.target.value)}
          placeholder={ctext("Full name")}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white/90 outline-none focus:border-sky-400/50"
        />
        <input
          value={conciergePhone}
          onChange={(e) => setConciergePhone(e.target.value)}
          placeholder={ctext("Phone number")}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white/90 outline-none focus:border-sky-400/50"
        />
        {handoffError ? <p className="text-[12px] text-red-300">{handoffError}</p> : null}
        <button
          type="button"
          onClick={submitSpecialServiceIntake}
          disabled={handoffBusy || conciergeName.trim().length === 0 || conciergePhone.trim().length < 7}
          className="w-full rounded-xl border border-sky-400/40 bg-black/40 px-4 py-2 text-[12px] text-sky-200 hover:border-sky-400/70 disabled:opacity-40"
        >
          {handoffBusy ? ctext("Sending...") : ctext("Submit")}
        </button>
      </div>
    );
  }

  if (serviceStep === "done") {
    leftTitleText = "Request sent";
    leftPanelLines = [
      serviceScheduleRequested === "yes" ? "Thanks. We sent your scheduling request to Guardian for follow-up." : "Thanks. We sent your request to a Guardian representative.",
      serviceSelected === "more" ? `Requested service: ${serviceMoreText.trim()}` : `Requested service: ${serviceLabel(serviceSelected)}`,
    ];
    rightTitleText = "Actions";
    rightPanelLines = [];
    rightChoices = [
      { label: "Start over", onClick: resetOption3 },
      { label: ctext("Change option"), onClick: () => setSelectedOption(null), variant: "alt" },
    ];
  }
}


if (activeSideOption === 4) {
  if (educationStep === "topics") {
    leftTitleText = "Collision Claims & Insurance Education";
    leftPanelLines = [
      "Choose a topic to learn more about the repair process, insurance issues, and your rights as a vehicle owner.",
    ];
    rightTitleText = "Topics";
    rightPanelLines = [];
    rightChoices = [
      ...educationTopics.map((topic) => ({
        label: topic,
        onClick: () => {
          setEducationTopic(topic);
          setEducationStep("topics");
          setEducationQuestion("");
          setEducationError(null);
        },
        selected: educationTopic === topic && educationStep === "topics",
      })),
      { label: "Back", onClick: () => setSelectedOption(null), variant: "alt" as const },
    ];
  }

  if (educationStep === "topics") {
    leftTitleText = educationTopic || "Educational information";
    leftPanelLines = educationTopic ? educationSummaries[educationTopic] : ["Choose a topic to continue."];
    rightTitleText = "Actions";
    rightPanelLines = [
      "The center video area can later play the video for this topic.",
    ];
    rightChoices = [
      {
        label: "Ask a question",
        onClick: () => {
          setEducationStep("question");
          setEducationError(null);
        },
      },
      { label: "Back to topics", onClick: () => setEducationStep("topics"), variant: "alt" as const },
    ];
  }

  if (educationStep === "question") {
    leftTitleText = educationTopic || "Ask a question";
    leftPanelLines = [
      "Send us your question and we’ll get back to you.",
      educationTopic ? `Topic selected: ${educationTopic}` : "",
    ].filter(Boolean);
    rightTitleText = "Question";
    rightPanelLines = [];
    rightChoices = [
      { label: educationBusy ? "Sending..." : "Submit", onClick: submitEducationQuestion },
      { label: "Back", onClick: () => setEducationStep("topics"), variant: "alt" as const },
    ];
    rightCustom = (
      <div className="mt-3 space-y-2">
        <textarea
          value={educationQuestion}
          onChange={(e) => setEducationQuestion(e.target.value)}
          placeholder="Type your question"
          className="w-full min-h-[100px] rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white/90 outline-none focus:border-sky-400/50"
        />
        <input
          value={educationName}
          onChange={(e) => setEducationName(e.target.value)}
          placeholder={ctext("Full name")}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white/90 outline-none focus:border-sky-400/50"
        />
        <input
          value={educationPhone}
          onChange={(e) => setEducationPhone(e.target.value)}
          placeholder={ctext("Phone number")}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white/90 outline-none focus:border-sky-400/50"
        />
        {educationError ? <p className="text-[12px] text-red-300">{educationError}</p> : null}
        <button
          type="button"
          onClick={submitEducationQuestion}
          disabled={educationBusy || educationQuestion.trim().length === 0 || educationName.trim().length === 0 || educationPhone.trim().length < 7}
          className="w-full rounded-xl border border-sky-400/40 bg-black/40 px-4 py-2 text-[12px] text-sky-200 hover:border-sky-400/70 disabled:opacity-40"
        >
          {educationBusy ? ctext("Sending...") : ctext("Submit")}
        </button>
      </div>
    );
  }

  if (educationStep === "done") {
    leftTitleText = "Question submitted";
    leftPanelLines = [
      "Thanks. We sent your question to Guardian Collision Network.",
      educationTopic ? `Topic: ${educationTopic}` : "",
    ].filter(Boolean);
    rightTitleText = "Actions";
    rightPanelLines = [];
    rightChoices = [
      { label: "Back to topics", onClick: () => resetEducationFlow(false) },
      { label: "Start over", onClick: resetOption4 },
      { label: ctext("Change option"), onClick: () => setSelectedOption(null), variant: "alt" as const },
    ];
  }
}

  const phoneVal = conciergePhone.trim().toLowerCase();
  const isSkip = phoneVal === "skip";

  const canSubmitConcierge =
    conciergeName.trim().length > 0 &&
    !!conciergeMethod &&
    (conciergeMethod === "text"
      ? isSkip || phoneVal.length === 0 || phoneVal.length >= 7
      : phoneVal.length >= 7);

  const translatedLeftTitleText = ctext(leftTitleText);
  const translatedRightTitleText = ctext(rightTitleText);
  const translatedLeftPanelLines = leftPanelLines.map((line) => ctext(line));
  const translatedRightPanelLines = rightPanelLines.map((line) => ctext(line));
  const translatedLeftChoices = leftChoices?.map((c) => ({ ...c, label: ctext(c.label) })) ?? null;
  const translatedRightChoices = rightChoices?.map((c) => ({ ...c, label: ctext(c.label) })) ?? null;

  return (
    <section className="relative w-full overflow-hidden bg-black">
      {/* Mobile layout */}
      <div className="md:hidden px-4 pt-4 pb-8">
        <div className="mx-auto w-full max-w-md">
          <div
            id="cockpit-video-frame"
            className="relative rounded-3xl border border-white/10 bg-slate-950/55 backdrop-blur-md shadow-[0_0_90px_rgba(2,8,23,0.88)] overflow-hidden h-[210px]"
          >
            <GuardianLogoPanel />
            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-sky-300/5" />
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2 text-[16px] text-sky-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.85)]" />
              {optionChosen ? ctext("Continue:") : ctext("Select one:")}
            </div>

            {!optionChosen ? (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => beginTopLevelFlow(n)}
                    className={`${choiceBase} ${choiceIdle}`}
                  >
                    {ctext(wheelCopy[n].title)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center gap-2 text-[15px] text-sky-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.85)]" />
                    {ctext(leftTitleText)}
                  </div>
                  <div className="mt-3 text-[15px] leading-snug text-white/90">
                    {leftChoices ? (
                      <div className="space-y-1">
                        {(translatedLeftChoices ?? []).map((c) => {
                          const isSelected = !!c.selected;
                          const cls =
                            c.variant === "alt"
                              ? `${choiceBase} ${choiceAlt}`
                              : `${choiceBase} ${isSelected ? choiceSelected : choiceIdle}`;

                          return (
                            <button key={ctext(c.label)} type="button" onClick={c.onClick} className={cls}>
                              {ctext(c.label)}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {translatedLeftPanelLines.map((line, i) => (
                          <p key={i}>{ctext(line)}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {(rightTitleText || rightChoices || (rightPanelLines && rightPanelLines.length > 0)) ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center gap-2 text-[15px] text-sky-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.85)]" />
                    {ctext(rightTitleText)}
                  </div>
                  <div className="mt-3 text-[15px] leading-snug text-white/90">
                    {rightChoices ? (
                      <div className="space-y-1">
                        {(translatedRightChoices ?? []).map((c) => {
                          const isSelected = !!c.selected;
                          const cls =
                            c.variant === "alt"
                              ? `${choiceBase} ${choiceAlt}`
                              : `${choiceBase} ${isSelected ? choiceSelected : choiceIdle}`;

                          return (
                            <button key={ctext(c.label)} type="button" onClick={c.onClick} className={cls}>
                              {ctext(c.label)}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {translatedRightPanelLines.map((line, i) => (
                          <p key={i}>{ctext(line)}</p>
                        ))}
                      </div>
                    )}
                    {rightCustom}
                  </div>

                  <div className="mt-3 text-[11px] text-white/35">
                    {ctext("Session")}: {sessionId ? `${sessionId}` : "…"} • {ctext("Saved")}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOption(null)}
                    className="mt-2 text-[11px] text-white/50 hover:text-sky-200 underline underline-offset-4"
                  >
                    {ctext("Change option")}
                  </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop layout (unchanged) */}
      <div className="hidden md:block">
      <div className="mx-auto w-full max-w-[1800px]">
        <div className="relative flex justify-center pt-12 lg:pt-16">
          <div className="relative h-[446px] w-full max-w-[1615px] lg:h-[532px]">
            <div className="absolute left-[-1.5%] top-[46%] w-[48%] -translate-y-1/2 md:w-[46%] lg:w-[44%]">
              <Image
                src={`/LHC.png?${ASSET_V}`}
                alt="Left cockpit cluster"
                width={1200}
                height={1200}
                priority
                unoptimized
                className="pointer-events-none h-auto w-full select-none saturate-[1.05] brightness-[0.95]"
              />
            </div>

            <div className="absolute right-[-1.5%] top-[46%] w-[48%] -translate-y-1/2 md:w-[46%] lg:w-[44%]">
              <Image
                src={`/RHC.png?${ASSET_V}`}
                alt="Right cockpit cluster"
                width={1200}
                height={1200}
                priority
                unoptimized
                className="pointer-events-none h-auto w-full select-none saturate-[1.05] brightness-[0.95]"
              />
            </div>

            <div className="absolute left-1/2 top-[53%] w-[38%] max-w-[665px] -translate-x-1/2 -translate-y-[56%]">
              <div className="relative">
                <div className="absolute right-full top-1/2 z-10 w-[230px] -translate-y-1/2 text-right md:w-[250px] lg:mr-5 md:mr-4 mr-3">
                  <div className="flex items-center justify-end gap-2 text-[16px] md:text-[18px] text-sky-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.85)]" />
                    {ctext(leftTitleText)}
                  </div>

                  <div className="mt-4 text-[16px] md:text-[18px] leading-snug text-white/90">
                    {!optionChosen ? (
                      <div className="space-y-2.5">
                        {[1, 2, 3].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => beginTopLevelFlow(n)}
                            className={`${choiceBase} ${choiceIdle} text-right`}
                          >
                            {ctext(wheelCopy[n].title)}
                          </button>
                        ))}
                      </div>
                    ) : translatedLeftChoices ? (
                      <div className="space-y-0.5">
                        {(translatedLeftChoices ?? []).map((c) => {
                          const isSelected = !!c.selected;
                          const cls =
                            c.variant === "alt"
                              ? `${choiceBase} ${choiceAlt}`
                              : `${choiceBase} ${isSelected ? choiceSelected : choiceIdle}`;

                          return (
                            <button
                              key={ctext(c.label)}
                              type="button"
                              onClick={c.onClick}
                              className={`${cls} text-right`}
                            >
                              {ctext(c.label)}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      translatedLeftPanelLines.map((line, i) => (
                        <p key={i} className={i === 0 ? "" : "mt-2"}>
                          {ctext(line)}
                        </p>
                      ))
                    )}
                  </div>
                </div>

                <div className="absolute left-full top-1/2 z-10 w-[250px] -translate-y-1/2 text-left md:w-[270px] lg:ml-6 md:ml-5 ml-4">
                  <div className="flex items-center gap-2 text-[16px] md:text-[18px] text-sky-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.85)]" />
                    {ctext(rightTitleText)}
                  </div>

                  <div className="mt-4 text-[16px] md:text-[18px] leading-snug text-white/90">
                    {!optionChosen ? (
                      <div className="space-y-2.5">
                        {[4, 5, 6].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => beginTopLevelFlow(n)}
                            className={`${choiceBase} ${choiceIdle}`}
                          >
                            {ctext(wheelCopy[n].title)}
                          </button>
                        ))}
                      </div>
                    ) : translatedRightChoices ? (
                      <div className="space-y-0.5">
                        {(translatedRightChoices ?? []).map((c) => {
                          const isSelected = !!c.selected;
                          const cls =
                            c.variant === "alt"
                              ? `${choiceBase} ${choiceAlt}`
                              : `${choiceBase} ${isSelected ? choiceSelected : choiceIdle}`;

                          return (
                            <button key={ctext(c.label)} type="button" onClick={c.onClick} className={cls}>
                              {ctext(c.label)}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      translatedRightPanelLines.map((line, i) => (
                        <p key={i} className={i === 0 ? "" : "mt-2"}>
                          {ctext(line)}
                        </p>
                      ))
                    )}
                    {rightCustom}
                  </div>

                  <div className="mt-3 text-[10px] text-white/30">
                    {ctext("Session")}: {sessionId ? `${sessionId}` : "…"} • {ctext("Saved")}
                  </div>

                  {optionChosen && (
                    <button
                      type="button"
                      onClick={() => setSelectedOption(null)}
                      className="mt-2 text-[10px] text-white/35 hover:text-sky-200 underline underline-offset-4"
                    >
                      {ctext("Change option")}
                    </button>
                  )}
                </div>

                <div
                  id="cockpit-video-frame"
                  className="relative rounded-3xl border border-white/10 bg-slate-950/55 backdrop-blur-md shadow-[0_0_90px_rgba(2,8,23,0.88)] overflow-hidden h-[250px] md:h-[290px] lg:h-[330px]"
                >
                  <GuardianLogoPanel />
                  <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-sky-300/5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {conciergeOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-[560px] rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-md shadow-[0_0_90px_rgba(2,8,23,0.92)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className={`${rajdhani.className} text-[14px] tracking-[0.12em] text-sky-200`}>
                CONCIERGE PLUS
              </div>
              <button
                type="button"
                onClick={() => setConciergeOpen(false)}
                className="text-white/60 hover:text-white/90 text-[12px]"
              >
                Close
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="text-[12px] text-white/70 leading-snug">
                We saved your answers. Your Guardian representative will see everything you already entered.
              </div>

              {conciergeStep === "name" && (
                <div className="mt-5">
                  <div className="text-[12px] text-white/85">What is your name?</div>
                  <input
                    value={conciergeName}
                    onChange={(e) => setConciergeName(e.target.value)}
                    placeholder="Your name"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-[13px] text-white/90 outline-none focus:border-sky-400/40"
                  />
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConciergeStep(conciergeMethod ? "phone" : "method")}
                      className="rounded-xl border border-sky-400/40 bg-black/40 px-4 py-2 text-[12px] text-sky-200 hover:border-sky-400/70"
                      disabled={conciergeName.trim().length === 0}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {conciergeStep === "method" && (
                <div className="mt-5">
                  <div className="text-[12px] text-white/85">Would you like to chat over the phone or text?</div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConciergeMethod("phone");
                        setConciergeStep("phone");
                      }}
                      className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-left text-[12px] text-white/85 hover:border-sky-400/40 hover:text-sky-200"
                    >
                      Phone call
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setConciergeMethod("text");
                        setConciergeStep("phone");
                      }}
                      className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-left text-[12px] text-white/85 hover:border-sky-400/40 hover:text-sky-200"
                    >
                      Text chat (on this website)
                    </button>
                  </div>

                  <div className="mt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setConciergeStep("name")}
                      className="text-white/60 hover:text-white/90 text-[12px]"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {conciergeStep === "phone" && (
                <div className="mt-5">
                  <div className="text-[12px] text-white/85">
                    {conciergeMethod === "text"
                      ? "What’s the best number to text you? (or type skip)"
                      : selectedOption === 2
                        ? "What’s the best phone number for a Guardian representative to call you right away?"
                        : vehicleStatus === "Not sure" && notSureAtScene === "yes"
                          ? "What’s the best phone number to call you right now?"
                          : "What’s the best phone number to call you?"}
                  </div>

                  <input
                    value={conciergePhone}
                    onChange={(e) => setConciergePhone(e.target.value)}
                    placeholder={conciergeMethod === "text" ? "(___) ___-____ or skip" : "(___) ___-____"}
                    disabled={handoffBusy}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-[13px] text-white/90 outline-none focus:border-sky-400/40 disabled:opacity-60"
                  />

                  <div className="mt-2 text-[11px] text-white/45">
                    {conciergeMethod === "text"
                      ? "We’ll open the website chat after you submit."
                      : "A Guardian representative will call you (you won’t need to call anyone first)."}
                  </div>

                  {handoffBusy && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-[12px] text-white/80">
                      Give us a minute while we process your request…
                    </div>
                  )}

                  {handoffError && (
                    <div className="mt-3 rounded-xl border border-red-500/30 bg-black/35 px-4 py-3 text-[12px] text-red-200">
                      {handoffError}
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setConciergeStep(conciergeMethod ? "phone" : "method")}
                      disabled={handoffBusy}
                      className="text-white/60 hover:text-white/90 text-[12px] disabled:opacity-40"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={submitConcierge}
                      disabled={!canSubmitConcierge || handoffBusy}
                      className="rounded-xl border border-sky-400/40 bg-black/40 px-4 py-2 text-[12px] text-sky-200 hover:border-sky-400/70 disabled:opacity-40 disabled:hover:border-sky-400/40"
                    >
                      {handoffBusy ? "Processing…" : conciergeMethod === "text" ? "Start chat" : "Request call"}
                    </button>
                  </div>
                </div>
              )}

              {conciergeStep === "done" && (
                <div className="mt-6">
                  <div className={`${rajdhani.className} text-[16px] text-sky-200 tracking-[0.08em]`}>
                    You’re all set.
                  </div>

                  <div className="mt-2 text-[12px] text-white/75 leading-snug">
                    Thanks {conciergeName.trim() || "there"} — we sent your intake to Guardian Collision Network.
                    {conciergeMethod === "phone" && " A Guardian representative will call you shortly."}
                    {conciergeMethod === "text" && " The chat is now open so we can message right away."}
                  </div>

                  {conciergeMethod === "text" && MANAGER_PHONE && (
                    <a
                      className="mt-4 inline-block rounded-xl border border-sky-400/40 bg-black/40 px-4 py-2 text-[12px] text-sky-200 hover:border-sky-400/70"
                      href={`sms:${MANAGER_PHONE}?&body=${encodeURIComponent(
                        `Guardian Collision Network - Concierge PLUS\nSession: ${sessionId || "pending"}\nName: ${conciergeName.trim()}\n`
                      )}`}
                    >
                      Open text chat
                    </a>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setConciergeOpen(false)}
                      className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-[12px] text-white/80 hover:border-white/20"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

<div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-4">
  <div className="text-[11px] text-white/55">{ctext("Saved intake summary")}</div>

  {selectedOption === 2 ? (
    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-white/80">
      <div>{ctext("Damage:")}</div>
      <div className="text-right">{damageDescription?.trim() || "—"}</div>

      <div>{ctext("Vehicle info:")}</div>
      <div className="text-right">{damageVehicleInfo?.trim() || "—"}</div>

      <div>{ctext("Out of pocket:")}</div>
      <div className="text-right">{formatYN(damagePayingOutOfPocket)}</div>

      <div>{ctext("Insurance paying:")}</div>
      <div className="text-right">{formatYN(damageInsurancePaying)}</div>
    </div>
  ) : (
    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-white/80">
      <div>{ctext("Scenario:")}</div>
      <div className="text-right">{accidentScenario ?? "—"}</div>

      <div>{ctext("Vehicle:")}</div>
      <div className="text-right">{vehicleStatus ?? "—"}</div>

      <div>{ctext("Tow details:")}</div>
      <div className="text-right">{vehicleStatus === "It was towed" ? (towDetails?.trim() || "—") : "—"}</div>

      <div>{ctext("At scene:")}</div>
      <div className="text-right">{vehicleStatus === "Not sure" ? formatYN(notSureAtScene) : "—"}</div>

      <div>{ctext("Drove away:")}</div>
      <div className="text-right">{vehicleStatus === "Not sure" ? formatYN(notSureDriveAway) : "—"}</div>

      <div>{ctext("Warning signs:")}</div>
      <div className="text-right">{vehicleStatus === "Not sure" ? formatYN(notSureWarningSigns) : "—"}</div>

      <div>{ctext("Vehicle now:")}</div>
      <div className="text-right">{vehicleStatus === "Not sure" ? (notSureVehicleNow?.trim() || "—") : "—"}</div>

      <div>{ctext("Own insurance:")}</div>
      <div className="text-right">{formatYN(ownInsuranceInfo)}</div>

      <div>{ctext("Exchanged info:")}</div>
      <div className="text-right">{formatYN(exchangedInsurance)}</div>

      <div>{ctext("Police report:")}</div>
      <div className="text-right">{formatYN(policeReport)}</div>

      <div>{ctext("Photos:")}</div>
      <div className="text-right">{formatYN(photosTaken)}</div>

      <div>{ctext("Full coverage:")}</div>
      <div className="text-right">{formatYN(fullCoverage)}</div>

      <div>{ctext("Contacted insurer:")}</div>
      <div className="text-right">{formatYN(contactedInsurance)}</div>

      <div>{ctext("Claim #:")}</div>
      <div className="text-right">{contactedInsurance === "yes" ? (claimNumber?.trim() || "—") : "—"}</div>

      <div>{ctext("Designated rep:")}</div>
      <div className="text-right">{designatedRep ?? "—"}</div>
    </div>
  )}
</div>

              <div className="mt-4 text-[10px] text-white/30">{ctext("Session")}: {sessionId || "…"}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}