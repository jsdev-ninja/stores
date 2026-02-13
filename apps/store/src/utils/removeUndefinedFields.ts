// remove all undefined fields from object (recursively handles nested objects)
export function removeUndefinedFields(obj: any): any {
    if (obj === null || obj === undefined || obj instanceof File) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(removeUndefinedFields);
    }

    if (typeof obj === "object") {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                result[key] = removeUndefinedFields(value);
            }
        }
        return result;
    }

    return obj;
}