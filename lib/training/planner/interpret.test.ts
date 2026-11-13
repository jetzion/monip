import { describe, expect, it } from "vitest";

import { type InterpretContext, interpretPrompt, readInterpretation } from "./interpret";
import { NO_RULES } from "./types";

const context: InterpretContext = {
  today: "2026-11-20",
  trainers: [
    { id: 3, name: "Nicola Walsh" },
    { id: 4, name: "Declan Bailey" },
  ],
  ports: ["Miami, Florida", "Barcelona, Spain"],
  ships: ["Icon of the Seas", "Wonder of the Seas"],
  current: {
    from: "2026-12-01",
    to: "2026-12-31",
    preset: "balanced",
    ships: [],
    ports: [],
    trainers: [],
    priorityShips: [],
    onlineHours: 2,
    maxOnboardingNights: 7,
    rules: { ...NO_RULES, excludeShips: ["Wonder of the Seas"] },
  },
};

describe("interpretPrompt", () => {
  it("lists trainers with ids, ports, ships, and the current settings", () => {
    const prompt = interpretPrompt(context);
    expect(prompt).toContain("today is 2026-11-20");
    expect(prompt).toContain("Trainers (id: name): 3: Nicola Walsh; 4: Declan Bailey");
    expect(prompt).toContain("Ports: Miami, Florida; Barcelona, Spain");
    expect(prompt).toContain('"excludeShips":["Wonder of the Seas"]');
  });
});

describe("readInterpretation", () => {
  it("applies a reply wrapped in a code fence", () => {
    const reply = `\`\`\`json
{"understood": "Nicola is away over Christmas; no onboarding then; Declan preferred in Miami.",
 "notApplied": [],
 "settings": {"preset": "moreInPerson", "priorityShips": ["icon of the seas"],
  "rules": {"unavailable": [{"trainerId": 3, "from": "2026-12-20", "to": "2026-12-27"}],
            "blockedTypes": [{"type": "onboarding", "from": "2026-12-20", "to": "2026-12-31"}],
            "trainerPorts": [{"trainerId": 4, "port": "miami, florida", "mode": "prefer"}],
            "excludeShips": []}}}
\`\`\``;
    expect(readInterpretation(reply, context)).toEqual({
      understood: "Nicola is away over Christmas; no onboarding then; Declan preferred in Miami.",
      notApplied: [],
      settings: {
        ...context.current,
        preset: "moreInPerson",
        priorityShips: ["Icon of the Seas"],
        rules: {
          unavailable: [{ trainerId: 3, from: "2026-12-20", to: "2026-12-27" }],
          blockedTypes: [{ type: "onboarding", from: "2026-12-20", to: "2026-12-31" }],
          trainerPorts: [{ trainerId: 4, port: "Miami, Florida", mode: "prefer" }],
          excludeShips: [],
        },
      },
    });
  });

  it("keeps settings the reply does not mention", () => {
    const result = readInterpretation('{"understood": "Lower cost.", "settings": {"preset": "lowerCost"}}', context);
    expect(result?.settings).toEqual({ ...context.current, preset: "lowerCost" });
  });

  it("lists unknown trainers, ships, ports, and bad values instead of guessing", () => {
    const reply = JSON.stringify({
      understood: "x",
      notApplied: ["Book flights"],
      settings: {
        onlineHours: 3,
        ships: ["Icon of the Seas", "Queen Mary"],
        rules: {
          unavailable: [{ trainerId: 99, from: "2026-12-20", to: "2026-12-27" }],
          trainerPorts: [{ trainerId: 3, port: "Atlantis", mode: "avoid" }],
          blockedTypes: [{ type: "cooking" }],
        },
      },
    });
    const result = readInterpretation(reply, context);
    expect(result?.settings.ships).toEqual(["Icon of the Seas"]);
    expect(result?.settings.onlineHours).toBe(2);
    expect(result?.settings.rules).toEqual(NO_RULES);
    expect(result?.notApplied).toEqual([
      "Book flights",
      'Unknown ship "Queen Mary".',
      "Online sessions can only be 2, 4, or 8 hours.",
      'Unknown trainer in "unavailable".',
      "A training type rule could not be read.",
      'Unknown port "Atlantis".',
    ]);
  });

  it("limits the plan to named ports and trainers, checking both", () => {
    const reply = JSON.stringify({ understood: "x", settings: { ports: ["miami, florida", "Atlantis"], trainers: [3, 4, 99] } });
    const result = readInterpretation(reply, context);
    expect(result?.settings).toMatchObject({ ports: ["Miami, Florida"], trainers: [3, 4] });
    expect(result?.notApplied).toEqual(['Unknown port "Atlantis".', 'Unknown trainer in "trainers".']);
  });

  it("returns null for a reply that is not JSON", () => {
    expect(readInterpretation("Sorry, I cannot help with that.", context)).toBeNull();
  });
});
