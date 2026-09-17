import { useEffect, useRef, useState } from "react";
import { TaskShell } from "@/components/task-shell";
import { 
  WASTE_BINS,
  HANDOVER_FIELDS,
  ELENA_QUESTION,
  CLOSE_LINES,
  ElenaOptionId,
  Line
} from "@/content/activities";
import { useProgress } from "@/lib/progress-store";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Scale, FileText, ChevronRight } from "lucide-react";
import { weightIsRight } from "@/lib/simulation";

export default function HandoverKitchenTask() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks["hand-the-kitchen-on"];
  const chillState = progress.tasks["chill-the-event-batch"];
  
  const [dialogue, setDialogue] = useState<Line>(CLOSE_LINES.eveningTeam);
  const dialogueTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (dialogueTimer.current !== null) window.clearTimeout(dialogueTimer.current);
  }, []);
  
  const handleWeigh = (binId: string, actualKg: number) => {
    updateTask("hand-the-kitchen-on", prev => ({
      ...prev,
      weighed: { ...prev.weighed, [binId]: true }
    }));
    // In a real kitchen you read the scale, we simulate seeing it
  };

  const handleWeightInput = (binId: string, value: string) => {
    updateTask("hand-the-kitchen-on", prev => ({
      ...prev,
      weights: { ...prev.weights, [binId]: value }
    }));
  };

  const handleHandoverInput = (fieldId: string, value: string) => {
    updateTask("hand-the-kitchen-on", prev => ({
      ...prev,
      handover: { ...prev.handover, [fieldId]: value }
    }));
  };

  const insertPrompt = (fieldId: string, promptText: string) => {
    updateTask("hand-the-kitchen-on", prev => {
      const current = prev.handover[fieldId] || "";
      const separator = current.length > 0 && !current.endsWith("\n") ? "\n" : "";
      return {
        ...prev,
        handover: { ...prev.handover, [fieldId]: current + separator + "• " + promptText }
      };
    });
  };

  const handleHandover = () => {
    updateTask("hand-the-kitchen-on", prev => ({ ...prev, handedOver: true }));
    setDialogue(CLOSE_LINES.elenaOpening);
  };

  const handleElenaAnswer = (id: ElenaOptionId) => {
    if (dialogueTimer.current !== null) {
      window.clearTimeout(dialogueTimer.current);
      dialogueTimer.current = null;
    }
    updateTask("hand-the-kitchen-on", prev => ({ ...prev, elenaAnswer: id }));
    
    const opt = ELENA_QUESTION.options.find(o => o.id === id);
    if (opt) {
      setDialogue({ speaker: "Elena", text: opt.response });
      if (opt.correct) {
        dialogueTimer.current = window.setTimeout(() => {
          setDialogue(CLOSE_LINES.marcusDone);
          dialogueTimer.current = null;
        }, 4000);
      }
    }
  };

  const weightsDone = WASTE_BINS.every(b => state.weighed[b.id] && weightIsRight(b.id, state.weights[b.id]));
  const handoverDone = state.handedOver;
  const elenaCorrect = ELENA_QUESTION.options.find(o => o.id === state.elenaAnswer)?.correct === true;

  return (
    <TaskShell 
      id="hand-the-kitchen-on"
      dialogue={
        <div className="flex flex-col gap-1">
          <span className="font-bold text-xs uppercase tracking-widest opacity-60">
            {dialogue.speaker}
          </span>
          <span className="text-lg">"{dialogue.text}"</span>
        </div>
      }
    >
      <div className="space-y-12">

        {/* Waste Sheet */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">1</span>
            Waste Sheet
          </h2>
          
          <div className="paper-sheet p-0 overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-bold text-lg text-center uppercase tracking-widest">Morning Waste Record</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {WASTE_BINS.map(bin => {
                  const isWeighed = state.weighed[bin.id];
                  
                  return (
                    <div key={bin.id} className="flex flex-col md:flex-row gap-6 items-start md:items-center border-b border-border/50 pb-6 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <div className="font-bold text-foreground mb-1">{bin.label}</div>
                        <div className="text-sm text-muted-foreground mb-2">{bin.description}</div>
                        <div className="text-xs font-mono uppercase text-muted-foreground bg-muted/30 inline-block px-2 py-1 rounded-sm">
                          From: {bin.whereFrom}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button
                          variant="outline"
                          onClick={() => handleWeigh(bin.id, bin.actualKg)}
                           aria-label={`Weigh ${bin.label}`}
                          className={cn(
                            "flex-1 md:w-32",
                            isWeighed ? "bg-muted text-muted-foreground border-transparent" : "border-primary text-primary"
                          )}
                        >
                          <Scale className="w-4 h-4 mr-2" /> 
                          {isWeighed ? `${bin.actualKg.toFixed(1)} kg` : "Weigh Bin"}
                        </Button>
                        
                        <div className="flex items-center gap-2">
                          <Input 
                            value={state.weights[bin.id] || ""}
                            onChange={(e) => handleWeightInput(bin.id, e.target.value)}
                             aria-label={`Weight for ${bin.label}`}
                            placeholder="-"
                            disabled={!isWeighed}
                            className="w-20 text-center font-mono text-base border-2"
                          />
                          <span className="text-muted-foreground font-mono">kg</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Handover Sheet */}
        <section className={cn("transition-opacity duration-500", weightsDone ? "opacity-100" : "opacity-30 pointer-events-none")}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">2</span>
            Handover Sheet
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-4 border border-border rounded-sm sticky top-24">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Prompt Memory</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Tap notes from the day to drop them into the handover sheet. You can edit them once they're in.
                </p>
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                  {HANDOVER_FIELDS.map(field => (
                    <div key={field.id}>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{field.label}</div>
                      <div className="space-y-2">
                        {field.prompts.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => insertPrompt(field.id, prompt)}
                             disabled={!weightsDone}
                            className="w-full text-left text-xs p-2 bg-muted/30 hover:bg-primary/10 hover:text-primary transition-colors border border-border rounded-sm leading-relaxed"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="paper-sheet p-8 font-mono text-sm">
                <div className="flex justify-between border-b-2 border-foreground pb-4 mb-8">
                  <div className="font-bold text-lg text-sans tracking-tight">KITCHEN HANDOVER</div>
                  <div className="text-right text-muted-foreground">SHIFT: 15:00 - CLOSE</div>
                </div>

                <div className="space-y-8">
                  {HANDOVER_FIELDS.map(field => (
                    <div key={field.id} className="space-y-2">
                      <label className="font-bold text-foreground uppercase tracking-widest">{field.label}</label>
                      <Textarea 
                        value={state.handover[field.id] || ""}
                        onChange={(e) => handleHandoverInput(field.id, e.target.value)}
                         aria-label={field.label}
                         disabled={!weightsDone}
                        className="bg-transparent border-b border-border border-t-0 border-l-0 border-r-0 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary shadow-none min-h-[60px] resize-none"
                        placeholder="Write or tap prompts..."
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-12 flex justify-end">
                  <Button 
                    size="lg" 
                    onClick={handleHandover}
                    disabled={!weightsDone || state.handedOver}
                    className="w-full md:w-auto"
                  >
                    {state.handedOver ? "Handed to Evening Team" : "Give to Evening Team"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Elena's Close */}
        <section className={cn("transition-opacity duration-500", handoverDone ? "opacity-100" : "opacity-30 pointer-events-none")}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">3</span>
            Close with Elena
          </h2>
          
          <div className="bg-secondary p-8 rounded-sm text-secondary-foreground space-y-6">
            <div className="flex items-start gap-4">
              <FileText className="w-6 h-6 text-white/50 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">The Chill Record</h3>
                <p className="text-white/80 leading-relaxed mb-6">
                  {ELENA_QUESTION.question}
                </p>
                
                <div className="space-y-3">
                  {ELENA_QUESTION.options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleElenaAnswer(opt.id as ElenaOptionId)}
                       disabled={!handoverDone}
                       aria-pressed={state.elenaAnswer === opt.id}
                      className={cn(
                        "w-full text-left p-4 rounded-sm border transition-colors leading-relaxed",
                        state.elenaAnswer === opt.id 
                          ? "bg-white text-secondary font-medium border-white" 
                          : "bg-white/10 border-white/20 text-white/90 hover:bg-white/20"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {elenaCorrect && (
              <div className="pt-6 mt-6 border-t border-white/20 flex items-center justify-between animate-in fade-in">
                <span className="text-sm font-bold uppercase tracking-widest text-white/60">Final Signature</span>
                {state.elenaSigned ? (
                  <div className="text-2xl font-serif italic border-b border-white pb-1 pr-8">
                    E. Voss
                  </div>
                ) : (
                  <Button 
                    onClick={() => updateTask("hand-the-kitchen-on", prev => ({...prev, elenaSigned: true}))}
                     disabled={!handoverDone}
                    variant="outline" 
                    className="bg-transparent border-white text-white hover:bg-white/10"
                  >
                    Elena signs record
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>

      </div>
    </TaskShell>
  );
}
