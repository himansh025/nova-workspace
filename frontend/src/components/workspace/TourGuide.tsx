"use client";

import React, { useState, useEffect } from "react";
import { Joyride, EventData, STATUS, Step } from "react-joyride";

export default function TourGuide() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const handleStartTour = () => {
      setRun(true);
    };

    window.addEventListener("start-demo-tour", handleStartTour);
    return () => {
      window.removeEventListener("start-demo-tour", handleStartTour);
    };
  }, []);

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
    }
  };

  const steps: Step[] = [
    {
      target: "#demo-tour-button",
      content: "Welcome to the Demo! This tour will show you the main modules of Nova.",
      skipBeacon: true,
    },
    {
      target: "a[href='/app']",
      content: "This is the Overview Dashboard, giving you a high-level view of your project's health and activity.",
    },
    {
      target: "a[href='/app/tasks']",
      content: "The Tasks & Board module lets you manage all issues, bugs, and features in a kanban view.",
    },
    {
      target: "a[href='/app/sprints']",
      content: "Plan your Sprints here to organize work into focused timeboxes.",
    },
    {
      target: "a[href='/app/specs']",
      content: "Architecture Specs let you write technical documentation that lives alongside your code.",
    },
    {
      target: "a[href='/app/ai']",
      content: "The AI Copilot gives you an intelligent assistant embedded directly into your workflow.",
    },
    {
      target: "#new-issue-button",
      content: "Click here anytime to create a new task or issue.",
    },
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      options={{
        primaryColor: "var(--nova-accent, #6366f1)",
        backgroundColor: "var(--nova-surface, #ffffff)",
        textColor: "var(--nova-text-primary, #1e293b)",
        zIndex: 10000,
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip']
      }}
      onEvent={handleJoyrideCallback}
    />
  );
}
