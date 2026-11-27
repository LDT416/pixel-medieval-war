// Board-action values are game counters and have no physical units.
export const boardActions={
    musket:{points:60,flashTicks:3},
    round:{points:110,flashTicks:1},
    scatter:{points:110,flashTicks:3}
} as const;
export type Token=keyof typeof boardActions;
