import Ajv from "ajv";
const ajv = new Ajv(); // singleton

export const compileSchema = (schema: object) => ajv.compile(schema);
export class ValidationError extends Error {}
