import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

export interface StepConfig<T extends string> {
  id: T;
  label: string;
  description: string;
}

interface StepIndicatorProps<T extends string> {
  steps: StepConfig<T>[];
  currentStep: T;
  completedSteps: Set<T>;
  title?: string;
  description?: string;
}

export function StepIndicator<T extends string>({
  steps,
  currentStep,
  completedSteps,
  title = "Steps",
  description = "Complete each step to prepare your NFT",
}: StepIndicatorProps<T>) {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const isStepComplete = (stepId: T) => completedSteps.has(stepId);
  const isStepActive = (stepId: T) => stepId === currentStep;

  return (
    <div className="w-1/4 border-r bg-card flex flex-col h-full">
      <Card className="h-full rounded-none border-0 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-y-auto flex-1">
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isComplete = isStepComplete(step.id);
              const isActive = isStepActive(step.id);
              const isPast = currentStepIndex > index;

              let stepClassName =
                "bg-muted border-muted-foreground/20 text-muted-foreground";
              if (isComplete) {
                stepClassName = "bg-green-600 border-green-600 text-white";
              } else if (isActive) {
                stepClassName =
                  "bg-primary border-primary text-primary-foreground";
              }

              return (
                <div key={step.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                        stepClassName
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" fill="currentColor" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 h-12 mt-2",
                          isComplete || isPast
                            ? "bg-green-600"
                            : "bg-muted-foreground/20"
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <h3
                      className={cn(
                        "font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
