import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { FRAME, GATE, formatC } from "@/lib/simulation";
import {
  ADDED_GUESTS,
  ARTOTEL_LINES,
  CHILL_RULES,
  DISHES,
  ELENA_QUESTION,
  FRIDGE_UNITS,
  MEASURED_DEPTHS_MM,
  ORDER_LINES,
  SHORT_LINE_ID,
  WASTE_BINS,
  CLOSE_LINES,
} from "@/content/activities";
import { useProgress } from "@/lib/progress-store";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/artotel-logo.png";
import { ExperienceSizeControl } from "@/components/experience-size-control";

export default function Close() {
  const { progress, reset, dayComplete, currentTaskId } = useProgress();
  const [, setLocation] = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!dayComplete) setLocation(currentTaskId ? `/task/${currentTaskId}` : "/");
  }, [dayComplete, currentTaskId, setLocation]);

  if (!dayComplete) return null;

  const handleStartAgain = () => {
    reset();
    setLocation("/");
  };

  // The recap is drawn from what the student actually wrote during the day.
  const handover = progress.tasks["take-the-handover"];
  const warmUnit = FRIDGE_UNITS.find((u) => u.id === "larder-2")!;
  const warmRow = handover.rows[warmUnit.id];

  const delivery = progress.tasks["check-the-delivery-in"];
  const shortLine = ORDER_LINES.find((l) => l.id === SHORT_LINE_ID)!;

  const chill = progress.tasks["chill-the-event-batch"];
  const finalReading = chill.readings[CHILL_RULES.extraInterval];

  const dietary = progress.tasks["check-the-dietary-list"];
  const priya = ADDED_GUESTS.find((g) => g.id === "priya")!;
  const priyaDessert = DISHES.find((d) => d.id === dietary.guests[priya.id]?.dessert);

  const close = progress.tasks["hand-the-kitchen-on"];
  const totalWaste = WASTE_BINS.reduce((acc, b) => acc + (parseFloat(close.weights[b.id] ?? "") || 0), 0);
  const elenaAnswer = ELENA_QUESTION.options.find((o) => o.id === close.elenaAnswer);

  const recap = [
    `Walked the fridges at ${warmRow?.time || "06:50"} and found ${warmUnit.name} at ${formatC(warmUnit.actualC)}. Your note: "${(warmRow?.note?.trim() || "door found ajar overnight").replace(/[.\s]+$/, "")}".`,
    `Took in the delivery and signed for ${delivery.noteAmendedTo || shortLine.arrived} kg of salmon, not the ${shortLine.onDeliveryNote} kg on the supplier's note. The missing ${shortLine.ordered - shortLine.arrived} kg is on Terence's list.`,
    `Chilled 27 kg of beef for the product launch. Your tray was ${MEASURED_DEPTHS_MM.yours} mm deep against Terence's ${MEASURED_DEPTHS_MM.marcus} mm tray. It needed longer after the ninety-minute check and came under the ${CHILL_RULES.holdLineC}°C line at ${finalReading?.time || "12:45"}.`,
    `Checked five dishes against fourteen allergens and put ${priya.name} on table ${priya.table} down for the ${priyaDessert?.name.toLowerCase() || "alternative dessert"}.`,
    `Weighed ${totalWaste.toFixed(1)} kg of waste across three bins, handed the kitchen on, and signed the chill record with Terence.`,
  ];

  const fade = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="max-w-5xl mx-auto w-full px-6 md:px-10 pt-8 flex items-center justify-between">
        <div className="bg-foreground px-4 py-2 border border-border/20 shadow-xl">
          <img src={logoImg} alt="art'otel" className="h-6 md:h-8 object-contain" />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-foreground">{FRAME.shift.end}</span>
          <ExperienceSizeControl />
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 md:px-10 pt-12 md:pt-16 pb-14">
          <motion.p {...fade(0)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Close of day
          </motion.p>
          <motion.h1 {...fade(0.05)} className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
            That's a shift, {progress.studentName.split(" ")[0]}.
          </motion.h1>
          <motion.p {...fade(0.1)} className="mt-8 text-lg md:text-xl leading-relaxed text-foreground/85 max-w-3xl">
            {FRAME.closeOfDay}
          </motion.p>
        </section>

        <section className="bg-secondary text-secondary-foreground">
          <div className="max-w-5xl mx-auto px-6 md:px-10 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7">
              <h2 className="text-2xl md:text-3xl font-bold">What you did today</h2>
              <ul className="mt-8 space-y-5">
                {recap.map((line, i) => (
                  <motion.li key={i} {...fade(0.15 + i * 0.08)} className="flex gap-4">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-1" aria-hidden />
                    <span className="leading-relaxed text-secondary-foreground/90">{line}</span>
                  </motion.li>
                ))}
              </ul>
              {elenaAnswer && (
                <div className="mt-10 border-l-2 border-primary pl-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-secondary-foreground/60">Terence, at the pass</p>
                  <p className="mt-2 leading-relaxed">"{elenaAnswer.response}"</p>
                </div>
              )}
              <div className="mt-8 border-l-2 border-primary pl-5">
                <p className="text-xs font-bold uppercase tracking-widest text-secondary-foreground/60">Terence</p>
                <p className="mt-2 leading-relaxed">"{CLOSE_LINES.marcusDone.text}"</p>
              </div>
            </div>
            <div className="lg:col-span-5 lg:pl-8 flex flex-col justify-between gap-12">
              <div className="space-y-2">
                {ARTOTEL_LINES.map((line, i) => (
                  <motion.p
                    key={line}
                    {...fade(0.5 + i * 0.15)}
                    className={i === ARTOTEL_LINES.length - 1 ? "text-4xl md:text-5xl font-bold tracking-tight text-primary" : "text-4xl md:text-5xl font-bold tracking-tight"}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>
              <div className="bg-white/10 border border-white/20 rounded-sm p-6 space-y-4">
                <p className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden /> Section complete
                </p>
                <p className="text-sm text-secondary-foreground/75">{GATE.label}. You have.</p>
                <Button
                  variant="outline"
                  className="bg-transparent border-white/40 text-white hover:bg-white/10 w-full"
                  onClick={handleStartAgain}
                >
                  Start the day again
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
