

export const math = {
    round: (value: number, digits = 2): number => {
        const p = 10 ** digits;
        return Math.round((value + Number.EPSILON) * p) / p;
    }
}