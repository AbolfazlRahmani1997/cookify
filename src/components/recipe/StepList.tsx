import { BellRing, Clock } from "lucide-react";
import { formatNumber, formatMinutes } from "@/lib/format";
import { watchPlan } from "@/lib/cookWatch";
import { Button } from "@/components/common/Button";
import type { RecipeStep } from "@/data/types";

export function StepList({
  steps,
  activeStepId,
  onStartWatch,
}: {
  steps: RecipeStep[];
  activeStepId?: string;
  onStartWatch?: (step: RecipeStep) => void;
}) {
  return (
    <div className="card p-4 sm:p-6">
      <h3 className="mb-4 text-base font-extrabold text-ink">طرز تهیه</h3>
      <ol className="space-y-5">
        {steps.map((step, index) => (
          <li key={step.id} className="flex gap-4">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-extrabold text-white"
              aria-hidden
            >
              {formatNumber(step.order || index + 1)}
            </span>
            <div className="flex-1 pt-1">
              {step.title && (
                <h4 className="mb-1 text-sm font-extrabold text-ink">
                  {step.title}
                </h4>
              )}
              <p className="text-sm leading-7 text-muted">{step.description}</p>
              {step.minutes && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary-dark">
                  <Clock className="size-3.5" />
                  حدود {formatMinutes(step.minutes)}
                </span>
              )}
              {onStartWatch && watchPlan(step) && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant={activeStepId === step.id ? "secondary" : "primary"}
                    disabled={activeStepId === step.id}
                    onClick={() => onStartWatch(step)}
                  >
                    <BellRing className="size-4" />
                    {activeStepId === step.id ? "یادآوری روشن است" : "شروع کن، یادم بنداز"}
                  </Button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
