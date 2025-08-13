'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

interface OnboardingProgressProps {
  steps: Step[];
}

export function OnboardingProgress({ steps }: OnboardingProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  step.isCompleted
                    ? 'bg-green-600 text-white'
                    : step.isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {step.isCompleted ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step label */}
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    'text-sm font-medium',
                    step.isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div
                  className={cn(
                    'h-0.5 transition-colors',
                    step.isCompleted ? 'bg-green-600' : 'bg-muted'
                  )}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
