import { useState, useEffect } from "react";
import { useProgress } from "@shell/lib/progress-store";
import { useExperienceViewport } from "@shell/lib/experience-viewport";
import { LaunchView } from "@shell/welcome/LaunchView";
import { BriefingView } from "@shell/welcome/BriefingView";

export default function Intro() {
  const { expanded } = useExperienceViewport();
  const { progress } = useProgress();
  const [name, setName] = useState(progress.studentName || "");
  const [confirmReset, setConfirmReset] = useState(false);

  // Sync state if progress.studentName changes externally (e.g. after reset)
  useEffect(() => {
    setName(progress.studentName || "");
  }, [progress.studentName]);

  if (!expanded) {
    return <LaunchView />;
  }

  return (
    <BriefingView 
      name={name} 
      setName={setName} 
      confirmReset={confirmReset} 
      setConfirmReset={setConfirmReset} 
    />
  );
}
