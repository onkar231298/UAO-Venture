import { useState, type CSSProperties } from "react";
import { Award, BadgeCheck, Building2, Globe, Leaf, Pause, Play, Shield, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Certification = {
  id: string;
  name: string;
  mark: string;
  descriptor: string;
  color: string;
  icon: typeof Leaf;
};

const certifications: Certification[] = [
  { id: "halal", name: "Halal", mark: "HALAL", descriptor: "Certification standard", color: "#17614b", icon: Star },
  { id: "star-k", name: "Star-K Kosher", mark: "STAR-K", descriptor: "Kosher certification", color: "#123f72", icon: Star },
  { id: "usda-nop", name: "USDA NOP", mark: "USDA", descriptor: "National Organic Program", color: "#315e32", icon: Leaf },
  { id: "eu-organic", name: "EU Organic", mark: "EU", descriptor: "Organic standard", color: "#2d683d", icon: Leaf },
  { id: "jas", name: "JAS Organic", mark: "JAS", descriptor: "Japanese Agricultural Standard", color: "#a24b32", icon: Leaf },
  { id: "canada-organic", name: "Canada Organic", mark: "CANADA", descriptor: "Organic standard", color: "#a83a3c", icon: Leaf },
  { id: "brcgs", name: "BRCGS", mark: "BRCGS", descriptor: "Global standard", color: "#214d6a", icon: Shield },
  { id: "gmp", name: "GMP", mark: "GMP", descriptor: "Good manufacturing practices", color: "#14756c", icon: BadgeCheck },
  { id: "fairtrade", name: "Fairtrade", mark: "FAIRTRADE", descriptor: "Trade standard", color: "#28734d", icon: Globe },
  { id: "fssai", name: "FSSAI", mark: "FSSAI", descriptor: "Food safety authority", color: "#b96b27", icon: Award },
  { id: "msme", name: "MSME", mark: "MSME", descriptor: "Enterprise registration", color: "#4e6173", icon: Building2 },
];

function Mark({ certification, expanded = false }: { certification: Certification; expanded?: boolean }) {
  const Icon = certification.icon;

  return (
    <span
      className={`certification-mark ${expanded ? "certification-mark-expanded" : ""}`}
      style={{ "--cert-mark-color": certification.color } as CSSProperties}
      aria-hidden="true"
    >
      <Icon className="certification-mark-icon" strokeWidth={1.8} />
      <span className="certification-mark-name">{certification.mark}</span>
      <span className="certification-mark-descriptor">{certification.descriptor}</span>
    </span>
  );
}

export default function CertificationTicker() {
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const durationSeconds = certifications.length * 6;

  return (
    <section className="mt-5 border-t border-[#e5e9df] pt-5" aria-label="Certifications and standards">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.17em] text-[#385a42] sm:text-sm">
            Certifications &amp; standards
          </h2>
          <p className="mt-1 text-[11px] text-gray-500">Select a mark to enlarge · one mark advances every 6 seconds</p>
        </div>
        <button
          type="button"
          onClick={() => setIsPaused((paused) => !paused)}
          aria-label={isPaused ? "Resume certification marks" : "Pause certification marks"}
          aria-pressed={isPaused}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d9e1d5] text-[#315d42] transition-colors hover:bg-[#edf3e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315d42]"
        >
          {isPaused ? <Play className="h-3.5 w-3.5" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
      </div>

      <div
        className={`certification-marquee-viewport ${isPaused ? "certification-marquee-paused" : ""}`}
        aria-label="Scrolling certification marks"
      >
        <div
          className="certification-marquee-track"
          style={{ "--certification-marquee-duration": `${durationSeconds}s` } as CSSProperties}
          aria-live="off"
        >
          <div className="certification-marquee-group" role="list">
            {certifications.map((certification) => (
              <button
                type="button"
                role="listitem"
                key={certification.id}
                className="certification-ticker-card"
                onClick={() => setSelectedCertification(certification)}
                aria-label={`Enlarge ${certification.name} mark`}
              >
                <Mark certification={certification} />
                <span className="certification-ticker-name">{certification.name}</span>
              </button>
            ))}
          </div>
          <div className="certification-marquee-group" aria-hidden="true">
            {certifications.map((certification) => (
              <div className="certification-ticker-card certification-ticker-card-copy" key={`copy-${certification.id}`}>
                <Mark certification={certification} />
                <span className="certification-ticker-name">{certification.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedCertification} onOpenChange={(open) => !open && setSelectedCertification(null)}>
        <DialogContent className="max-w-md border-[#e1e8dd] bg-[#fbfcf9]">
          {selectedCertification && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-xl text-[#183c2b]">{selectedCertification.name}</DialogTitle>
                <DialogDescription className="text-center">
                  Certification and standards mark
                </DialogDescription>
              </DialogHeader>
              <div className="flex min-h-52 items-center justify-center rounded-xl border border-[#e4e9df] bg-white p-8">
                <Mark certification={selectedCertification} expanded />
              </div>
              <p className="text-center text-sm leading-relaxed text-gray-600">
                Certificate scans are not available yet. This enlarged mark can be replaced with the current Atlas-issued document when it is ready.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
