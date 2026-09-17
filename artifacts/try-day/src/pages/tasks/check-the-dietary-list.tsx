import { useState, useMemo, useEffect } from "react";
import { TaskShell } from "@/components/task-shell";
import { 
  ALLERGENS,
  DISHES,
  FUNCTION_SHEET,
  ADDED_GUESTS,
  DIETARY_LINES,
  MAIN_OPTIONS,
  DESSERT_OPTIONS,
  Line
} from "@/content/activities";
import { useProgress } from "@/lib/progress-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { boardNoteIsUseful, wrongChartRows, guestAssignmentIsSafe } from "@/lib/simulation";

export default function DietaryTask() {
  const { progress, updateTask } = useProgress();
  const state = progress.tasks["check-the-dietary-list"];
  const [dialogue, setDialogue] = useState<Line>(DIETARY_LINES.sarahOpening);
  
  const handleToggleAllergen = (dishId: string, allergenId: string) => {
    if (dialogue === DIETARY_LINES.sarahOpening) {
      setDialogue(DIETARY_LINES.marcusOpening);
    }
    
    updateTask("check-the-dietary-list", prev => {
      const current = prev.chart[dishId] || [];
      const next = current.includes(allergenId as any) 
        ? current.filter(a => a !== allergenId)
        : [...current, allergenId as any];
      
      // If we are modifying after a check, clear the check flag so Marcus has to read it again
      return { 
        ...prev, 
        chart: { ...prev.chart, [dishId]: next },
        chartChecked: false
      };
    });
  };

  const handleReadWithMarcus = () => {
    const flagged = wrongChartRows(state.chart);
    updateTask("check-the-dietary-list", prev => ({
      ...prev,
      flaggedDishes: flagged,
      chartChecked: flagged.length === 0
    }));
    
    if (flagged.length > 0) {
      setDialogue(DIETARY_LINES.marcusOnChartErrors);
    } else {
      setDialogue({ speaker: "Marcus", text: "Chart's clean. Now sort the three added guests." });
    }
  };

  const handleAssignGuest = (guestId: string, field: "main" | "dessert", val: string) => {
    updateTask("check-the-dietary-list", prev => {
      const g = prev.guests[guestId] || { main: null, dessert: null };
      return {
        ...prev,
        guests: { ...prev.guests, [guestId]: { ...g, [field]: val } }
      };
    });

    const guest = ADDED_GUESTS.find(g => g.id === guestId);
    if (guest) {
      if (guest.vegetarian && field === "main" && val === "beef") {
        setDialogue(DIETARY_LINES.marcusOnMeatForVegetarian);
      }
      if (guest.mustAvoid.includes("nuts") && field === "dessert" && val === "frangipane") {
        setDialogue(DIETARY_LINES.marcusOnNutDessert);
      }
    }

    // The component will re-render and allGuestsSafe will be true, 
    // dialogue for Sarah's close is handled at the render level below.
  };

  // derived state for checking all guests
  const allGuestsSafe = useMemo(() => {
    return ADDED_GUESTS.every(g => guestAssignmentIsSafe(g.id, state.guests[g.id]));
  }, [state.guests]);

  useEffect(() => {
    if (!allGuestsSafe || !state.chartChecked || state.boardPosted) return;
    setDialogue(DIETARY_LINES.sarahDone);
    const timer = window.setTimeout(() => setDialogue(DIETARY_LINES.marcusDone), 3000);
    return () => window.clearTimeout(timer);
  }, [allGuestsSafe, state.chartChecked, state.boardPosted]);

  return (
    <TaskShell 
      id="check-the-dietary-list"
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

        {/* Function Sheet & Recipe Cards side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">1</span>
              Function Sheet
            </h2>
            <div className="paper-sheet p-6 text-sm">
              <div className="font-bold text-lg border-b border-border pb-2 mb-4 uppercase tracking-widest">
                {FUNCTION_SHEET.event}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="text-muted-foreground block text-xs font-bold uppercase tracking-wider mb-1">Room</span>
                  <span className="font-medium">{FUNCTION_SHEET.room}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs font-bold uppercase tracking-wider mb-1">Covers</span>
                  <span className="font-medium">{FUNCTION_SHEET.covers}</span>
                </div>
              </div>
              
              <div className="mb-6">
                <span className="text-muted-foreground block text-xs font-bold uppercase tracking-wider mb-2">Timings</span>
                <div className="space-y-1">
                  {FUNCTION_SHEET.timings.map(t => (
                    <div key={t.time} className="flex gap-4">
                      <span className="font-mono font-bold w-12">{t.time}</span>
                      <span>{t.what}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block text-xs font-bold uppercase tracking-wider mb-2">Added Guests</span>
                <div className="space-y-3">
                  {ADDED_GUESTS.map(g => (
                    <div key={g.id} className="bg-primary/10 border border-primary/20 p-3 rounded-sm">
                      <div className="font-bold flex items-center justify-between">
                        <span>{g.name} (Table {g.table})</span>
                        {g.mustAvoid.length > 0 && <AlertCircle className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="text-foreground/80 mt-1">{g.requirement}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">2</span>
              Recipe Cards
            </h2>
            <div className="flex flex-col gap-4">
              {DISHES.map(dish => (
                <div key={dish.id} className="bg-white border border-border p-4 rounded-sm shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-l border-border rounded-bl-sm">
                    {dish.course}
                  </div>
                  <div className="font-bold text-foreground mb-2 pr-20">{dish.name}</div>
                  <div className="text-sm text-foreground/80 leading-relaxed">
                    {dish.ingredients.join(" • ")}
                  </div>
                  {dish.note && (
                    <div className="mt-3 text-xs italic text-muted-foreground border-t border-border/50 pt-2">
                      {dish.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Allergen Chart */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">3</span>
            Allergen Chart
          </h2>
          <div className="paper-sheet p-0 overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm border-collapse">
              <thead>
                <tr>
                  <th className="p-4 border-b border-r border-border bg-muted/20 font-bold min-w-[200px]">Dish</th>
                  {ALLERGENS.map(a => (
                    <th key={a.id} className="p-2 border-b border-r border-border bg-muted/20 text-center relative group min-w-[40px] max-w-[40px]">
                      <div className="h-36 flex items-end justify-center pb-1">
                        <span
                          className="whitespace-nowrap text-xs font-medium text-muted-foreground"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                          {a.label}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DISHES.map(dish => {
                  const ticked = state.chart[dish.id] || [];
                  const isFlagged = state.flaggedDishes.includes(dish.id);
                  
                  return (
                    <tr key={dish.id} className={cn("hover:bg-muted/10", isFlagged && "bg-destructive/5")}>
                      <td className="p-4 border-b border-r border-border relative">
                        <div className="font-medium">{dish.name}</div>
                        <div className="text-xs text-muted-foreground">{dish.course}</div>
                        {isFlagged && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive" />
                        )}
                      </td>
                      {ALLERGENS.map(a => {
                        const isTicked = ticked.includes(a.id as any);
                        return (
                          <td key={a.id} className="border-b border-r border-border text-center p-0 align-middle">
                            <button
                              onClick={() => handleToggleAllergen(dish.id, a.id)}
                              disabled={state.chartChecked}
                               aria-label={`${a.label} in ${dish.name}`}
                               aria-pressed={isTicked}
                              className={cn(
                                "w-full h-full min-h-[48px] flex items-center justify-center transition-colors",
                                isTicked ? "bg-primary/20 text-primary" : "hover:bg-muted/30 text-transparent",
                                state.chartChecked && "opacity-50 cursor-default"
                              )}
                            >
                              {isTicked ? "X" : "·"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            <div className="p-4 bg-muted/10 border-t border-border flex justify-end">
              {state.chartChecked ? (
                <div className="text-brand-green font-bold flex items-center gap-2">
                  Allergen chart verified clean
                </div>
              ) : (
                <Button onClick={handleReadWithMarcus}>
                  Read it through with Marcus
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Assignments & Board */}
        <section className={cn("transition-opacity duration-500", state.chartChecked ? "opacity-100" : "opacity-30 pointer-events-none")}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-6 h-6 inline-flex items-center justify-center rounded-full text-xs">4</span>
            Guest Assignments & Evening Board
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {ADDED_GUESTS.map(g => {
                const assign = state.guests[g.id] || { main: null, dessert: null };
                const isSafe = guestAssignmentIsSafe(g.id, assign);
                
                return (
                  <div key={g.id} className={cn(
                    "p-4 border rounded-sm transition-colors",
                    isSafe ? "bg-brand-green/5 border-brand-green/30" : "bg-white border-border"
                  )}>
                    <div className="font-bold mb-1">{g.name} <span className="text-muted-foreground font-normal">(Table {g.table})</span></div>
                    <div className="text-sm text-foreground/80 mb-4">{g.requirement}</div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Main</div>
                        <div className="space-y-2">
                          {MAIN_OPTIONS.map(opt => {
                            const dish = DISHES.find(d => d.id === opt)!;
                            return (
                              <button
                                key={opt}
                                onClick={() => handleAssignGuest(g.id, "main", opt)}
                               disabled={!state.chartChecked}
                               aria-label={`${dish.name} for ${g.name}`}
                               aria-pressed={assign.main === opt}
                                className={cn(
                                  "w-full text-left p-2 text-xs border rounded-sm transition-colors",
                                  assign.main === opt ? "bg-primary text-primary-foreground border-primary" : "bg-white hover:border-primary/30"
                                )}
                              >
                                {dish.name.split(",")[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Dessert</div>
                        <div className="space-y-2">
                          {DESSERT_OPTIONS.map(opt => {
                            const dish = DISHES.find(d => d.id === opt)!;
                            return (
                              <button
                                key={opt}
                                onClick={() => handleAssignGuest(g.id, "dessert", opt)}
                               disabled={!state.chartChecked}
                               aria-label={`${dish.name} for ${g.name}`}
                               aria-pressed={assign.dessert === opt}
                                className={cn(
                                  "w-full text-left p-2 text-xs border rounded-sm transition-colors",
                                  assign.dessert === opt ? "bg-primary text-primary-foreground border-primary" : "bg-white hover:border-primary/30"
                                )}
                              >
                                {dish.name.split(",")[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-secondary p-6 rounded-sm border-4 border-secondary-foreground shadow-xl relative overflow-hidden flex flex-col h-full min-h-[300px]">
              <div className="absolute top-2 right-2 flex gap-1">
                <div className="w-16 h-4 bg-white/20 rounded-full" />
              </div>
              <h3 className="font-bold text-secondary-foreground mb-4 uppercase tracking-widest text-sm">Evening Board</h3>
              
              <Textarea 
                value={state.boardNote}
                 onChange={(e) => updateTask("check-the-dietary-list", prev => ({...prev, boardNote: e.target.value, boardPosted: false}))}
                 aria-label="Evening board changes"
                 disabled={!state.chartChecked}
                placeholder="Write changes for the evening team here..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 text-lg font-medium resize-none focus-visible:ring-white/50"
              />
               <p className="mt-2 text-xs text-white/70">
                 Mention Priya or table 3, and that the dish is poached pear.
               </p>
              
              <div className="pt-4 mt-auto">
                <Button 
                  className="w-full bg-white text-secondary hover:bg-white/90"
                 disabled={!state.chartChecked || !allGuestsSafe || !boardNoteIsUseful(state.boardNote)}
                  onClick={() => updateTask("check-the-dietary-list", prev => ({...prev, boardPosted: true}))}
                >
                   {state.boardPosted ? "Posted to board" : "Post to board"}
                </Button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </TaskShell>
  );
}
