var x;
(function(n) {
  n.assertEqual = (s) => s;
  function e(s) {
  }
  n.assertIs = e;
  function t(s) {
    throw new Error();
  }
  n.assertNever = t, n.arrayToEnum = (s) => {
    const a = {};
    for (const i of s)
      a[i] = i;
    return a;
  }, n.getValidEnumValues = (s) => {
    const a = n.objectKeys(s).filter((o) => typeof s[s[o]] != "number"), i = {};
    for (const o of a)
      i[o] = s[o];
    return n.objectValues(i);
  }, n.objectValues = (s) => n.objectKeys(s).map(function(a) {
    return s[a];
  }), n.objectKeys = typeof Object.keys == "function" ? (s) => Object.keys(s) : (s) => {
    const a = [];
    for (const i in s)
      Object.prototype.hasOwnProperty.call(s, i) && a.push(i);
    return a;
  }, n.find = (s, a) => {
    for (const i of s)
      if (a(i))
        return i;
  }, n.isInteger = typeof Number.isInteger == "function" ? (s) => Number.isInteger(s) : (s) => typeof s == "number" && isFinite(s) && Math.floor(s) === s;
  function r(s, a = " | ") {
    return s.map((i) => typeof i == "string" ? `'${i}'` : i).join(a);
  }
  n.joinValues = r, n.jsonStringifyReplacer = (s, a) => typeof a == "bigint" ? a.toString() : a;
})(x || (x = {}));
var Te;
(function(n) {
  n.mergeShapes = (e, t) => ({
    ...e,
    ...t
    // second overwrites first
  });
})(Te || (Te = {}));
const h = x.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]), j = (n) => {
  switch (typeof n) {
    case "undefined":
      return h.undefined;
    case "string":
      return h.string;
    case "number":
      return isNaN(n) ? h.nan : h.number;
    case "boolean":
      return h.boolean;
    case "function":
      return h.function;
    case "bigint":
      return h.bigint;
    case "symbol":
      return h.symbol;
    case "object":
      return Array.isArray(n) ? h.array : n === null ? h.null : n.then && typeof n.then == "function" && n.catch && typeof n.catch == "function" ? h.promise : typeof Map < "u" && n instanceof Map ? h.map : typeof Set < "u" && n instanceof Set ? h.set : typeof Date < "u" && n instanceof Date ? h.date : h.object;
    default:
      return h.unknown;
  }
}, c = x.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]), We = (n) => JSON.stringify(n, null, 2).replace(/"([^"]+)":/g, "$1:");
class T extends Error {
  get errors() {
    return this.issues;
  }
  constructor(e) {
    super(), this.issues = [], this.addIssue = (r) => {
      this.issues = [...this.issues, r];
    }, this.addIssues = (r = []) => {
      this.issues = [...this.issues, ...r];
    };
    const t = new.target.prototype;
    Object.setPrototypeOf ? Object.setPrototypeOf(this, t) : this.__proto__ = t, this.name = "ZodError", this.issues = e;
  }
  format(e) {
    const t = e || function(a) {
      return a.message;
    }, r = { _errors: [] }, s = (a) => {
      for (const i of a.issues)
        if (i.code === "invalid_union")
          i.unionErrors.map(s);
        else if (i.code === "invalid_return_type")
          s(i.returnTypeError);
        else if (i.code === "invalid_arguments")
          s(i.argumentsError);
        else if (i.path.length === 0)
          r._errors.push(t(i));
        else {
          let o = r, f = 0;
          for (; f < i.path.length; ) {
            const l = i.path[f];
            f === i.path.length - 1 ? (o[l] = o[l] || { _errors: [] }, o[l]._errors.push(t(i))) : o[l] = o[l] || { _errors: [] }, o = o[l], f++;
          }
        }
    };
    return s(this), r;
  }
  static assert(e) {
    if (!(e instanceof T))
      throw new Error(`Not a ZodError: ${e}`);
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, x.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(e = (t) => t.message) {
    const t = {}, r = [];
    for (const s of this.issues)
      s.path.length > 0 ? (t[s.path[0]] = t[s.path[0]] || [], t[s.path[0]].push(e(s))) : r.push(e(s));
    return { formErrors: r, fieldErrors: t };
  }
  get formErrors() {
    return this.flatten();
  }
}
T.create = (n) => new T(n);
const q = (n, e) => {
  let t;
  switch (n.code) {
    case c.invalid_type:
      n.received === h.undefined ? t = "Required" : t = `Expected ${n.expected}, received ${n.received}`;
      break;
    case c.invalid_literal:
      t = `Invalid literal value, expected ${JSON.stringify(n.expected, x.jsonStringifyReplacer)}`;
      break;
    case c.unrecognized_keys:
      t = `Unrecognized key(s) in object: ${x.joinValues(n.keys, ", ")}`;
      break;
    case c.invalid_union:
      t = "Invalid input";
      break;
    case c.invalid_union_discriminator:
      t = `Invalid discriminator value. Expected ${x.joinValues(n.options)}`;
      break;
    case c.invalid_enum_value:
      t = `Invalid enum value. Expected ${x.joinValues(n.options)}, received '${n.received}'`;
      break;
    case c.invalid_arguments:
      t = "Invalid function arguments";
      break;
    case c.invalid_return_type:
      t = "Invalid function return type";
      break;
    case c.invalid_date:
      t = "Invalid date";
      break;
    case c.invalid_string:
      typeof n.validation == "object" ? "includes" in n.validation ? (t = `Invalid input: must include "${n.validation.includes}"`, typeof n.validation.position == "number" && (t = `${t} at one or more positions greater than or equal to ${n.validation.position}`)) : "startsWith" in n.validation ? t = `Invalid input: must start with "${n.validation.startsWith}"` : "endsWith" in n.validation ? t = `Invalid input: must end with "${n.validation.endsWith}"` : x.assertNever(n.validation) : n.validation !== "regex" ? t = `Invalid ${n.validation}` : t = "Invalid";
      break;
    case c.too_small:
      n.type === "array" ? t = `Array must contain ${n.exact ? "exactly" : n.inclusive ? "at least" : "more than"} ${n.minimum} element(s)` : n.type === "string" ? t = `String must contain ${n.exact ? "exactly" : n.inclusive ? "at least" : "over"} ${n.minimum} character(s)` : n.type === "number" ? t = `Number must be ${n.exact ? "exactly equal to " : n.inclusive ? "greater than or equal to " : "greater than "}${n.minimum}` : n.type === "date" ? t = `Date must be ${n.exact ? "exactly equal to " : n.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(n.minimum))}` : t = "Invalid input";
      break;
    case c.too_big:
      n.type === "array" ? t = `Array must contain ${n.exact ? "exactly" : n.inclusive ? "at most" : "less than"} ${n.maximum} element(s)` : n.type === "string" ? t = `String must contain ${n.exact ? "exactly" : n.inclusive ? "at most" : "under"} ${n.maximum} character(s)` : n.type === "number" ? t = `Number must be ${n.exact ? "exactly" : n.inclusive ? "less than or equal to" : "less than"} ${n.maximum}` : n.type === "bigint" ? t = `BigInt must be ${n.exact ? "exactly" : n.inclusive ? "less than or equal to" : "less than"} ${n.maximum}` : n.type === "date" ? t = `Date must be ${n.exact ? "exactly" : n.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(n.maximum))}` : t = "Invalid input";
      break;
    case c.custom:
      t = "Invalid input";
      break;
    case c.invalid_intersection_types:
      t = "Intersection results could not be merged";
      break;
    case c.not_multiple_of:
      t = `Number must be a multiple of ${n.multipleOf}`;
      break;
    case c.not_finite:
      t = "Number must be finite";
      break;
    default:
      t = e.defaultError, x.assertNever(n);
  }
  return { message: t };
};
let je = q;
function qe(n) {
  je = n;
}
function fe() {
  return je;
}
const he = (n) => {
  const { data: e, path: t, errorMaps: r, issueData: s } = n, a = [...t, ...s.path || []], i = {
    ...s,
    path: a
  };
  if (s.message !== void 0)
    return {
      ...s,
      path: a,
      message: s.message
    };
  let o = "";
  const f = r.filter((l) => !!l).slice().reverse();
  for (const l of f)
    o = l(i, { data: e, defaultError: o }).message;
  return {
    ...s,
    path: a,
    message: o
  };
}, Je = [];
function u(n, e) {
  const t = fe(), r = he({
    issueData: e,
    data: n.data,
    path: n.path,
    errorMaps: [
      n.common.contextualErrorMap,
      // contextual error map is first priority
      n.schemaErrorMap,
      // then schema-bound map if available
      t,
      // then global override map
      t === q ? void 0 : q
      // then global default map
    ].filter((s) => !!s)
  });
  n.common.issues.push(r);
}
class k {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    this.value === "valid" && (this.value = "dirty");
  }
  abort() {
    this.value !== "aborted" && (this.value = "aborted");
  }
  static mergeArray(e, t) {
    const r = [];
    for (const s of t) {
      if (s.status === "aborted")
        return y;
      s.status === "dirty" && e.dirty(), r.push(s.value);
    }
    return { status: e.value, value: r };
  }
  static async mergeObjectAsync(e, t) {
    const r = [];
    for (const s of t) {
      const a = await s.key, i = await s.value;
      r.push({
        key: a,
        value: i
      });
    }
    return k.mergeObjectSync(e, r);
  }
  static mergeObjectSync(e, t) {
    const r = {};
    for (const s of t) {
      const { key: a, value: i } = s;
      if (a.status === "aborted" || i.status === "aborted")
        return y;
      a.status === "dirty" && e.dirty(), i.status === "dirty" && e.dirty(), a.value !== "__proto__" && (typeof i.value < "u" || s.alwaysSet) && (r[a.value] = i.value);
    }
    return { status: e.value, value: r };
  }
}
const y = Object.freeze({
  status: "aborted"
}), B = (n) => ({ status: "dirty", value: n }), w = (n) => ({ status: "valid", value: n }), Ze = (n) => n.status === "aborted", Se = (n) => n.status === "dirty", z = (n) => n.status === "valid", Q = (n) => typeof Promise < "u" && n instanceof Promise;
function me(n, e, t, r) {
  if (typeof e == "function" ? n !== e || !0 : !e.has(n)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return e.get(n);
}
function Re(n, e, t, r, s) {
  if (typeof e == "function" ? n !== e || !0 : !e.has(n)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return e.set(n, t), t;
}
var m;
(function(n) {
  n.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, n.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(m || (m = {}));
var H, G;
class I {
  constructor(e, t, r, s) {
    this._cachedPath = [], this.parent = e, this.data = t, this._path = r, this._key = s;
  }
  get path() {
    return this._cachedPath.length || (this._key instanceof Array ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Oe = (n, e) => {
  if (z(e))
    return { success: !0, data: e.value };
  if (!n.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const t = new T(n.common.issues);
      return this._error = t, this._error;
    }
  };
};
function _(n) {
  if (!n)
    return {};
  const { errorMap: e, invalid_type_error: t, required_error: r, description: s } = n;
  if (e && (t || r))
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  return e ? { errorMap: e, description: s } : { errorMap: (i, o) => {
    var f, l;
    const { message: g } = n;
    return i.code === "invalid_enum_value" ? { message: g ?? o.defaultError } : typeof o.data > "u" ? { message: (f = g ?? r) !== null && f !== void 0 ? f : o.defaultError } : i.code !== "invalid_type" ? { message: o.defaultError } : { message: (l = g ?? t) !== null && l !== void 0 ? l : o.defaultError };
  }, description: s };
}
class v {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return j(e.data);
  }
  _getOrReturnCtx(e, t) {
    return t || {
      common: e.parent.common,
      data: e.data,
      parsedType: j(e.data),
      schemaErrorMap: this._def.errorMap,
      path: e.path,
      parent: e.parent
    };
  }
  _processInputParams(e) {
    return {
      status: new k(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: j(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent
      }
    };
  }
  _parseSync(e) {
    const t = this._parse(e);
    if (Q(t))
      throw new Error("Synchronous parse encountered promise.");
    return t;
  }
  _parseAsync(e) {
    const t = this._parse(e);
    return Promise.resolve(t);
  }
  parse(e, t) {
    const r = this.safeParse(e, t);
    if (r.success)
      return r.data;
    throw r.error;
  }
  safeParse(e, t) {
    var r;
    const s = {
      common: {
        issues: [],
        async: (r = t == null ? void 0 : t.async) !== null && r !== void 0 ? r : !1,
        contextualErrorMap: t == null ? void 0 : t.errorMap
      },
      path: (t == null ? void 0 : t.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: j(e)
    }, a = this._parseSync({ data: e, path: s.path, parent: s });
    return Oe(s, a);
  }
  "~validate"(e) {
    var t, r;
    const s = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: j(e)
    };
    if (!this["~standard"].async)
      try {
        const a = this._parseSync({ data: e, path: [], parent: s });
        return z(a) ? {
          value: a.value
        } : {
          issues: s.common.issues
        };
      } catch (a) {
        !((r = (t = a == null ? void 0 : a.message) === null || t === void 0 ? void 0 : t.toLowerCase()) === null || r === void 0) && r.includes("encountered") && (this["~standard"].async = !0), s.common = {
          issues: [],
          async: !0
        };
      }
    return this._parseAsync({ data: e, path: [], parent: s }).then((a) => z(a) ? {
      value: a.value
    } : {
      issues: s.common.issues
    });
  }
  async parseAsync(e, t) {
    const r = await this.safeParseAsync(e, t);
    if (r.success)
      return r.data;
    throw r.error;
  }
  async safeParseAsync(e, t) {
    const r = {
      common: {
        issues: [],
        contextualErrorMap: t == null ? void 0 : t.errorMap,
        async: !0
      },
      path: (t == null ? void 0 : t.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: j(e)
    }, s = this._parse({ data: e, path: r.path, parent: r }), a = await (Q(s) ? s : Promise.resolve(s));
    return Oe(r, a);
  }
  refine(e, t) {
    const r = (s) => typeof t == "string" || typeof t > "u" ? { message: t } : typeof t == "function" ? t(s) : t;
    return this._refinement((s, a) => {
      const i = e(s), o = () => a.addIssue({
        code: c.custom,
        ...r(s)
      });
      return typeof Promise < "u" && i instanceof Promise ? i.then((f) => f ? !0 : (o(), !1)) : i ? !0 : (o(), !1);
    });
  }
  refinement(e, t) {
    return this._refinement((r, s) => e(r) ? !0 : (s.addIssue(typeof t == "function" ? t(r, s) : t), !1));
  }
  _refinement(e) {
    return new N({
      schema: this,
      typeName: p.ZodEffects,
      effect: { type: "refinement", refinement: e }
    });
  }
  superRefine(e) {
    return this._refinement(e);
  }
  constructor(e) {
    this.spa = this.safeParseAsync, this._def = e, this.parse = this.parse.bind(this), this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.brand = this.brand.bind(this), this.default = this.default.bind(this), this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), this.pipe = this.pipe.bind(this), this.readonly = this.readonly.bind(this), this.isNullable = this.isNullable.bind(this), this.isOptional = this.isOptional.bind(this), this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (t) => this["~validate"](t)
    };
  }
  optional() {
    return A.create(this, this._def);
  }
  nullable() {
    return V.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return C.create(this);
  }
  promise() {
    return Y.create(this, this._def);
  }
  or(e) {
    return te.create([this, e], this._def);
  }
  and(e) {
    return ne.create(this, e, this._def);
  }
  transform(e) {
    return new N({
      ..._(this._def),
      schema: this,
      typeName: p.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const t = typeof e == "function" ? e : () => e;
    return new oe({
      ..._(this._def),
      innerType: this,
      defaultValue: t,
      typeName: p.ZodDefault
    });
  }
  brand() {
    return new Ne({
      typeName: p.ZodBranded,
      type: this,
      ..._(this._def)
    });
  }
  catch(e) {
    const t = typeof e == "function" ? e : () => e;
    return new de({
      ..._(this._def),
      innerType: this,
      catchValue: t,
      typeName: p.ZodCatch
    });
  }
  describe(e) {
    const t = this.constructor;
    return new t({
      ...this._def,
      description: e
    });
  }
  pipe(e) {
    return ue.create(this, e);
  }
  readonly() {
    return ce.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const Ye = /^c[^\s-]{8,}$/i, He = /^[0-9a-z]+$/, Ge = /^[0-9A-HJKMNP-TV-Z]{26}$/i, Qe = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, Xe = /^[a-z0-9_-]{21}$/i, Ke = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, et = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, tt = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, nt = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let ke;
const rt = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, st = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, at = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, it = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, ot = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, dt = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, Pe = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", ct = new RegExp(`^${Pe}$`);
function $e(n) {
  let e = "([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d";
  return n.precision ? e = `${e}\\.\\d{${n.precision}}` : n.precision == null && (e = `${e}(\\.\\d+)?`), e;
}
function ut(n) {
  return new RegExp(`^${$e(n)}$`);
}
function Me(n) {
  let e = `${Pe}T${$e(n)}`;
  const t = [];
  return t.push(n.local ? "Z?" : "Z"), n.offset && t.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${t.join("|")})`, new RegExp(`^${e}$`);
}
function lt(n, e) {
  return !!((e === "v4" || !e) && rt.test(n) || (e === "v6" || !e) && at.test(n));
}
function ft(n, e) {
  if (!Ke.test(n))
    return !1;
  try {
    const [t] = n.split("."), r = t.replace(/-/g, "+").replace(/_/g, "/").padEnd(t.length + (4 - t.length % 4) % 4, "="), s = JSON.parse(atob(r));
    return !(typeof s != "object" || s === null || !s.typ || !s.alg || e && s.alg !== e);
  } catch {
    return !1;
  }
}
function ht(n, e) {
  return !!((e === "v4" || !e) && st.test(n) || (e === "v6" || !e) && it.test(n));
}
class S extends v {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== h.string) {
      const a = this._getOrReturnCtx(e);
      return u(a, {
        code: c.invalid_type,
        expected: h.string,
        received: a.parsedType
      }), y;
    }
    const r = new k();
    let s;
    for (const a of this._def.checks)
      if (a.kind === "min")
        e.data.length < a.value && (s = this._getOrReturnCtx(e, s), u(s, {
          code: c.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), r.dirty());
      else if (a.kind === "max")
        e.data.length > a.value && (s = this._getOrReturnCtx(e, s), u(s, {
          code: c.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), r.dirty());
      else if (a.kind === "length") {
        const i = e.data.length > a.value, o = e.data.length < a.value;
        (i || o) && (s = this._getOrReturnCtx(e, s), i ? u(s, {
          code: c.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }) : o && u(s, {
          code: c.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }), r.dirty());
      } else if (a.kind === "email")
        tt.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
          validation: "email",
          code: c.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "emoji")
        ke || (ke = new RegExp(nt, "u")), ke.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
          validation: "emoji",
          code: c.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "uuid")
        Qe.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
          validation: "uuid",
          code: c.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "nanoid")
        Xe.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
          validation: "nanoid",
          code: c.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "cuid")
        Ye.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
          validation: "cuid",
          code: c.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "cuid2")
        He.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
          validation: "cuid2",
          code: c.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "ulid")
        Ge.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
          validation: "ulid",
          code: c.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "url")
        try {
          new URL(e.data);
        } catch {
          s = this._getOrReturnCtx(e, s), u(s, {
            validation: "url",
            code: c.invalid_string,
            message: a.message
          }), r.dirty();
        }
      else a.kind === "regex" ? (a.regex.lastIndex = 0, a.regex.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
        validation: "regex",
        code: c.invalid_string,
        message: a.message
      }), r.dirty())) : a.kind === "trim" ? e.data = e.data.trim() : a.kind === "includes" ? e.data.includes(a.value, a.position) || (s = this._getOrReturnCtx(e, s), u(s, {
        code: c.invalid_string,
        validation: { includes: a.value, position: a.position },
        message: a.message
      }), r.dirty()) : a.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : a.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : a.kind === "startsWith" ? e.data.startsWith(a.value) || (s = this._getOrReturnCtx(e, s), u(s, {
        code: c.invalid_string,
        validation: { startsWith: a.value },
        message: a.message
      }), r.dirty()) : a.kind === "endsWith" ? e.data.endsWith(a.value) || (s = this._getOrReturnCtx(e, s), u(s, {
        code: c.invalid_string,
        validation: { endsWith: a.value },
        message: a.message
      }), r.dirty()) : a.kind === "datetime" ? Me(a).test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
        code: c.invalid_string,
        validation: "datetime",
        message: a.message
      }), r.dirty()) : a.kind === "date" ? ct.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
        code: c.invalid_string,
        validation: "date",
        message: a.message
      }), r.dirty()) : a.kind === "time" ? ut(a).test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
        code: c.invalid_string,
        validation: "time",
        message: a.message
      }), r.dirty()) : a.kind === "duration" ? et.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
        validation: "duration",
        code: c.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "ip" ? lt(e.data, a.version) || (s = this._getOrReturnCtx(e, s), u(s, {
        validation: "ip",
        code: c.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "jwt" ? ft(e.data, a.alg) || (s = this._getOrReturnCtx(e, s), u(s, {
        validation: "jwt",
        code: c.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "cidr" ? ht(e.data, a.version) || (s = this._getOrReturnCtx(e, s), u(s, {
        validation: "cidr",
        code: c.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "base64" ? ot.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
        validation: "base64",
        code: c.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "base64url" ? dt.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
        validation: "base64url",
        code: c.invalid_string,
        message: a.message
      }), r.dirty()) : x.assertNever(a);
    return { status: r.value, value: e.data };
  }
  _regex(e, t, r) {
    return this.refinement((s) => e.test(s), {
      validation: t,
      code: c.invalid_string,
      ...m.errToObj(r)
    });
  }
  _addCheck(e) {
    return new S({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  email(e) {
    return this._addCheck({ kind: "email", ...m.errToObj(e) });
  }
  url(e) {
    return this._addCheck({ kind: "url", ...m.errToObj(e) });
  }
  emoji(e) {
    return this._addCheck({ kind: "emoji", ...m.errToObj(e) });
  }
  uuid(e) {
    return this._addCheck({ kind: "uuid", ...m.errToObj(e) });
  }
  nanoid(e) {
    return this._addCheck({ kind: "nanoid", ...m.errToObj(e) });
  }
  cuid(e) {
    return this._addCheck({ kind: "cuid", ...m.errToObj(e) });
  }
  cuid2(e) {
    return this._addCheck({ kind: "cuid2", ...m.errToObj(e) });
  }
  ulid(e) {
    return this._addCheck({ kind: "ulid", ...m.errToObj(e) });
  }
  base64(e) {
    return this._addCheck({ kind: "base64", ...m.errToObj(e) });
  }
  base64url(e) {
    return this._addCheck({
      kind: "base64url",
      ...m.errToObj(e)
    });
  }
  jwt(e) {
    return this._addCheck({ kind: "jwt", ...m.errToObj(e) });
  }
  ip(e) {
    return this._addCheck({ kind: "ip", ...m.errToObj(e) });
  }
  cidr(e) {
    return this._addCheck({ kind: "cidr", ...m.errToObj(e) });
  }
  datetime(e) {
    var t, r;
    return typeof e == "string" ? this._addCheck({
      kind: "datetime",
      precision: null,
      offset: !1,
      local: !1,
      message: e
    }) : this._addCheck({
      kind: "datetime",
      precision: typeof (e == null ? void 0 : e.precision) > "u" ? null : e == null ? void 0 : e.precision,
      offset: (t = e == null ? void 0 : e.offset) !== null && t !== void 0 ? t : !1,
      local: (r = e == null ? void 0 : e.local) !== null && r !== void 0 ? r : !1,
      ...m.errToObj(e == null ? void 0 : e.message)
    });
  }
  date(e) {
    return this._addCheck({ kind: "date", message: e });
  }
  time(e) {
    return typeof e == "string" ? this._addCheck({
      kind: "time",
      precision: null,
      message: e
    }) : this._addCheck({
      kind: "time",
      precision: typeof (e == null ? void 0 : e.precision) > "u" ? null : e == null ? void 0 : e.precision,
      ...m.errToObj(e == null ? void 0 : e.message)
    });
  }
  duration(e) {
    return this._addCheck({ kind: "duration", ...m.errToObj(e) });
  }
  regex(e, t) {
    return this._addCheck({
      kind: "regex",
      regex: e,
      ...m.errToObj(t)
    });
  }
  includes(e, t) {
    return this._addCheck({
      kind: "includes",
      value: e,
      position: t == null ? void 0 : t.position,
      ...m.errToObj(t == null ? void 0 : t.message)
    });
  }
  startsWith(e, t) {
    return this._addCheck({
      kind: "startsWith",
      value: e,
      ...m.errToObj(t)
    });
  }
  endsWith(e, t) {
    return this._addCheck({
      kind: "endsWith",
      value: e,
      ...m.errToObj(t)
    });
  }
  min(e, t) {
    return this._addCheck({
      kind: "min",
      value: e,
      ...m.errToObj(t)
    });
  }
  max(e, t) {
    return this._addCheck({
      kind: "max",
      value: e,
      ...m.errToObj(t)
    });
  }
  length(e, t) {
    return this._addCheck({
      kind: "length",
      value: e,
      ...m.errToObj(t)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(e) {
    return this.min(1, m.errToObj(e));
  }
  trim() {
    return new S({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new S({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new S({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((e) => e.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((e) => e.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((e) => e.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((e) => e.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((e) => e.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((e) => e.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((e) => e.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((e) => e.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((e) => e.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((e) => e.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((e) => e.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((e) => e.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((e) => e.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((e) => e.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((e) => e.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((e) => e.kind === "base64url");
  }
  get minLength() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === "min" && (e === null || t.value > e) && (e = t.value);
    return e;
  }
  get maxLength() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === "max" && (e === null || t.value < e) && (e = t.value);
    return e;
  }
}
S.create = (n) => {
  var e;
  return new S({
    checks: [],
    typeName: p.ZodString,
    coerce: (e = n == null ? void 0 : n.coerce) !== null && e !== void 0 ? e : !1,
    ..._(n)
  });
};
function mt(n, e) {
  const t = (n.toString().split(".")[1] || "").length, r = (e.toString().split(".")[1] || "").length, s = t > r ? t : r, a = parseInt(n.toFixed(s).replace(".", "")), i = parseInt(e.toFixed(s).replace(".", ""));
  return a % i / Math.pow(10, s);
}
class P extends v {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e) {
    if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== h.number) {
      const a = this._getOrReturnCtx(e);
      return u(a, {
        code: c.invalid_type,
        expected: h.number,
        received: a.parsedType
      }), y;
    }
    let r;
    const s = new k();
    for (const a of this._def.checks)
      a.kind === "int" ? x.isInteger(e.data) || (r = this._getOrReturnCtx(e, r), u(r, {
        code: c.invalid_type,
        expected: "integer",
        received: "float",
        message: a.message
      }), s.dirty()) : a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (r = this._getOrReturnCtx(e, r), u(r, {
        code: c.too_small,
        minimum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (r = this._getOrReturnCtx(e, r), u(r, {
        code: c.too_big,
        maximum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? mt(e.data, a.value) !== 0 && (r = this._getOrReturnCtx(e, r), u(r, {
        code: c.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (r = this._getOrReturnCtx(e, r), u(r, {
        code: c.not_finite,
        message: a.message
      }), s.dirty()) : x.assertNever(a);
    return { status: s.value, value: e.data };
  }
  gte(e, t) {
    return this.setLimit("min", e, !0, m.toString(t));
  }
  gt(e, t) {
    return this.setLimit("min", e, !1, m.toString(t));
  }
  lte(e, t) {
    return this.setLimit("max", e, !0, m.toString(t));
  }
  lt(e, t) {
    return this.setLimit("max", e, !1, m.toString(t));
  }
  setLimit(e, t, r, s) {
    return new P({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: t,
          inclusive: r,
          message: m.toString(s)
        }
      ]
    });
  }
  _addCheck(e) {
    return new P({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  int(e) {
    return this._addCheck({
      kind: "int",
      message: m.toString(e)
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !1,
      message: m.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !1,
      message: m.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !0,
      message: m.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !0,
      message: m.toString(e)
    });
  }
  multipleOf(e, t) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: m.toString(t)
    });
  }
  finite(e) {
    return this._addCheck({
      kind: "finite",
      message: m.toString(e)
    });
  }
  safe(e) {
    return this._addCheck({
      kind: "min",
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: m.toString(e)
    })._addCheck({
      kind: "max",
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: m.toString(e)
    });
  }
  get minValue() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === "min" && (e === null || t.value > e) && (e = t.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === "max" && (e === null || t.value < e) && (e = t.value);
    return e;
  }
  get isInt() {
    return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && x.isInteger(e.value));
  }
  get isFinite() {
    let e = null, t = null;
    for (const r of this._def.checks) {
      if (r.kind === "finite" || r.kind === "int" || r.kind === "multipleOf")
        return !0;
      r.kind === "min" ? (t === null || r.value > t) && (t = r.value) : r.kind === "max" && (e === null || r.value < e) && (e = r.value);
    }
    return Number.isFinite(t) && Number.isFinite(e);
  }
}
P.create = (n) => new P({
  checks: [],
  typeName: p.ZodNumber,
  coerce: (n == null ? void 0 : n.coerce) || !1,
  ..._(n)
});
class $ extends v {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte;
  }
  _parse(e) {
    if (this._def.coerce)
      try {
        e.data = BigInt(e.data);
      } catch {
        return this._getInvalidInput(e);
      }
    if (this._getType(e) !== h.bigint)
      return this._getInvalidInput(e);
    let r;
    const s = new k();
    for (const a of this._def.checks)
      a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (r = this._getOrReturnCtx(e, r), u(r, {
        code: c.too_small,
        type: "bigint",
        minimum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (r = this._getOrReturnCtx(e, r), u(r, {
        code: c.too_big,
        type: "bigint",
        maximum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? e.data % a.value !== BigInt(0) && (r = this._getOrReturnCtx(e, r), u(r, {
        code: c.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : x.assertNever(a);
    return { status: s.value, value: e.data };
  }
  _getInvalidInput(e) {
    const t = this._getOrReturnCtx(e);
    return u(t, {
      code: c.invalid_type,
      expected: h.bigint,
      received: t.parsedType
    }), y;
  }
  gte(e, t) {
    return this.setLimit("min", e, !0, m.toString(t));
  }
  gt(e, t) {
    return this.setLimit("min", e, !1, m.toString(t));
  }
  lte(e, t) {
    return this.setLimit("max", e, !0, m.toString(t));
  }
  lt(e, t) {
    return this.setLimit("max", e, !1, m.toString(t));
  }
  setLimit(e, t, r, s) {
    return new $({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: t,
          inclusive: r,
          message: m.toString(s)
        }
      ]
    });
  }
  _addCheck(e) {
    return new $({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !1,
      message: m.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !1,
      message: m.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !0,
      message: m.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !0,
      message: m.toString(e)
    });
  }
  multipleOf(e, t) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: m.toString(t)
    });
  }
  get minValue() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === "min" && (e === null || t.value > e) && (e = t.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === "max" && (e === null || t.value < e) && (e = t.value);
    return e;
  }
}
$.create = (n) => {
  var e;
  return new $({
    checks: [],
    typeName: p.ZodBigInt,
    coerce: (e = n == null ? void 0 : n.coerce) !== null && e !== void 0 ? e : !1,
    ..._(n)
  });
};
class X extends v {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== h.boolean) {
      const r = this._getOrReturnCtx(e);
      return u(r, {
        code: c.invalid_type,
        expected: h.boolean,
        received: r.parsedType
      }), y;
    }
    return w(e.data);
  }
}
X.create = (n) => new X({
  typeName: p.ZodBoolean,
  coerce: (n == null ? void 0 : n.coerce) || !1,
  ..._(n)
});
class L extends v {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== h.date) {
      const a = this._getOrReturnCtx(e);
      return u(a, {
        code: c.invalid_type,
        expected: h.date,
        received: a.parsedType
      }), y;
    }
    if (isNaN(e.data.getTime())) {
      const a = this._getOrReturnCtx(e);
      return u(a, {
        code: c.invalid_date
      }), y;
    }
    const r = new k();
    let s;
    for (const a of this._def.checks)
      a.kind === "min" ? e.data.getTime() < a.value && (s = this._getOrReturnCtx(e, s), u(s, {
        code: c.too_small,
        message: a.message,
        inclusive: !0,
        exact: !1,
        minimum: a.value,
        type: "date"
      }), r.dirty()) : a.kind === "max" ? e.data.getTime() > a.value && (s = this._getOrReturnCtx(e, s), u(s, {
        code: c.too_big,
        message: a.message,
        inclusive: !0,
        exact: !1,
        maximum: a.value,
        type: "date"
      }), r.dirty()) : x.assertNever(a);
    return {
      status: r.value,
      value: new Date(e.data.getTime())
    };
  }
  _addCheck(e) {
    return new L({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  min(e, t) {
    return this._addCheck({
      kind: "min",
      value: e.getTime(),
      message: m.toString(t)
    });
  }
  max(e, t) {
    return this._addCheck({
      kind: "max",
      value: e.getTime(),
      message: m.toString(t)
    });
  }
  get minDate() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === "min" && (e === null || t.value > e) && (e = t.value);
    return e != null ? new Date(e) : null;
  }
  get maxDate() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === "max" && (e === null || t.value < e) && (e = t.value);
    return e != null ? new Date(e) : null;
  }
}
L.create = (n) => new L({
  checks: [],
  coerce: (n == null ? void 0 : n.coerce) || !1,
  typeName: p.ZodDate,
  ..._(n)
});
class pe extends v {
  _parse(e) {
    if (this._getType(e) !== h.symbol) {
      const r = this._getOrReturnCtx(e);
      return u(r, {
        code: c.invalid_type,
        expected: h.symbol,
        received: r.parsedType
      }), y;
    }
    return w(e.data);
  }
}
pe.create = (n) => new pe({
  typeName: p.ZodSymbol,
  ..._(n)
});
class K extends v {
  _parse(e) {
    if (this._getType(e) !== h.undefined) {
      const r = this._getOrReturnCtx(e);
      return u(r, {
        code: c.invalid_type,
        expected: h.undefined,
        received: r.parsedType
      }), y;
    }
    return w(e.data);
  }
}
K.create = (n) => new K({
  typeName: p.ZodUndefined,
  ..._(n)
});
class ee extends v {
  _parse(e) {
    if (this._getType(e) !== h.null) {
      const r = this._getOrReturnCtx(e);
      return u(r, {
        code: c.invalid_type,
        expected: h.null,
        received: r.parsedType
      }), y;
    }
    return w(e.data);
  }
}
ee.create = (n) => new ee({
  typeName: p.ZodNull,
  ..._(n)
});
class J extends v {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return w(e.data);
  }
}
J.create = (n) => new J({
  typeName: p.ZodAny,
  ..._(n)
});
class D extends v {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return w(e.data);
  }
}
D.create = (n) => new D({
  typeName: p.ZodUnknown,
  ..._(n)
});
class R extends v {
  _parse(e) {
    const t = this._getOrReturnCtx(e);
    return u(t, {
      code: c.invalid_type,
      expected: h.never,
      received: t.parsedType
    }), y;
  }
}
R.create = (n) => new R({
  typeName: p.ZodNever,
  ..._(n)
});
class ye extends v {
  _parse(e) {
    if (this._getType(e) !== h.undefined) {
      const r = this._getOrReturnCtx(e);
      return u(r, {
        code: c.invalid_type,
        expected: h.void,
        received: r.parsedType
      }), y;
    }
    return w(e.data);
  }
}
ye.create = (n) => new ye({
  typeName: p.ZodVoid,
  ..._(n)
});
class C extends v {
  _parse(e) {
    const { ctx: t, status: r } = this._processInputParams(e), s = this._def;
    if (t.parsedType !== h.array)
      return u(t, {
        code: c.invalid_type,
        expected: h.array,
        received: t.parsedType
      }), y;
    if (s.exactLength !== null) {
      const i = t.data.length > s.exactLength.value, o = t.data.length < s.exactLength.value;
      (i || o) && (u(t, {
        code: i ? c.too_big : c.too_small,
        minimum: o ? s.exactLength.value : void 0,
        maximum: i ? s.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: s.exactLength.message
      }), r.dirty());
    }
    if (s.minLength !== null && t.data.length < s.minLength.value && (u(t, {
      code: c.too_small,
      minimum: s.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.minLength.message
    }), r.dirty()), s.maxLength !== null && t.data.length > s.maxLength.value && (u(t, {
      code: c.too_big,
      maximum: s.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.maxLength.message
    }), r.dirty()), t.common.async)
      return Promise.all([...t.data].map((i, o) => s.type._parseAsync(new I(t, i, t.path, o)))).then((i) => k.mergeArray(r, i));
    const a = [...t.data].map((i, o) => s.type._parseSync(new I(t, i, t.path, o)));
    return k.mergeArray(r, a);
  }
  get element() {
    return this._def.type;
  }
  min(e, t) {
    return new C({
      ...this._def,
      minLength: { value: e, message: m.toString(t) }
    });
  }
  max(e, t) {
    return new C({
      ...this._def,
      maxLength: { value: e, message: m.toString(t) }
    });
  }
  length(e, t) {
    return new C({
      ...this._def,
      exactLength: { value: e, message: m.toString(t) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
C.create = (n, e) => new C({
  type: n,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: p.ZodArray,
  ..._(e)
});
function F(n) {
  if (n instanceof b) {
    const e = {};
    for (const t in n.shape) {
      const r = n.shape[t];
      e[t] = A.create(F(r));
    }
    return new b({
      ...n._def,
      shape: () => e
    });
  } else return n instanceof C ? new C({
    ...n._def,
    type: F(n.element)
  }) : n instanceof A ? A.create(F(n.unwrap())) : n instanceof V ? V.create(F(n.unwrap())) : n instanceof O ? O.create(n.items.map((e) => F(e))) : n;
}
class b extends v {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const e = this._def.shape(), t = x.objectKeys(e);
    return this._cached = { shape: e, keys: t };
  }
  _parse(e) {
    if (this._getType(e) !== h.object) {
      const l = this._getOrReturnCtx(e);
      return u(l, {
        code: c.invalid_type,
        expected: h.object,
        received: l.parsedType
      }), y;
    }
    const { status: r, ctx: s } = this._processInputParams(e), { shape: a, keys: i } = this._getCached(), o = [];
    if (!(this._def.catchall instanceof R && this._def.unknownKeys === "strip"))
      for (const l in s.data)
        i.includes(l) || o.push(l);
    const f = [];
    for (const l of i) {
      const g = a[l], Z = s.data[l];
      f.push({
        key: { status: "valid", value: l },
        value: g._parse(new I(s, Z, s.path, l)),
        alwaysSet: l in s.data
      });
    }
    if (this._def.catchall instanceof R) {
      const l = this._def.unknownKeys;
      if (l === "passthrough")
        for (const g of o)
          f.push({
            key: { status: "valid", value: g },
            value: { status: "valid", value: s.data[g] }
          });
      else if (l === "strict")
        o.length > 0 && (u(s, {
          code: c.unrecognized_keys,
          keys: o
        }), r.dirty());
      else if (l !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const l = this._def.catchall;
      for (const g of o) {
        const Z = s.data[g];
        f.push({
          key: { status: "valid", value: g },
          value: l._parse(
            new I(s, Z, s.path, g)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: g in s.data
        });
      }
    }
    return s.common.async ? Promise.resolve().then(async () => {
      const l = [];
      for (const g of f) {
        const Z = await g.key, Ie = await g.value;
        l.push({
          key: Z,
          value: Ie,
          alwaysSet: g.alwaysSet
        });
      }
      return l;
    }).then((l) => k.mergeObjectSync(r, l)) : k.mergeObjectSync(r, f);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return m.errToObj, new b({
      ...this._def,
      unknownKeys: "strict",
      ...e !== void 0 ? {
        errorMap: (t, r) => {
          var s, a, i, o;
          const f = (i = (a = (s = this._def).errorMap) === null || a === void 0 ? void 0 : a.call(s, t, r).message) !== null && i !== void 0 ? i : r.defaultError;
          return t.code === "unrecognized_keys" ? {
            message: (o = m.errToObj(e).message) !== null && o !== void 0 ? o : f
          } : {
            message: f
          };
        }
      } : {}
    });
  }
  strip() {
    return new b({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new b({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(e) {
    return new b({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...e
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(e) {
    return new b({
      unknownKeys: e._def.unknownKeys,
      catchall: e._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...e._def.shape()
      }),
      typeName: p.ZodObject
    });
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(e, t) {
    return this.augment({ [e]: t });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(e) {
    return new b({
      ...this._def,
      catchall: e
    });
  }
  pick(e) {
    const t = {};
    return x.objectKeys(e).forEach((r) => {
      e[r] && this.shape[r] && (t[r] = this.shape[r]);
    }), new b({
      ...this._def,
      shape: () => t
    });
  }
  omit(e) {
    const t = {};
    return x.objectKeys(this.shape).forEach((r) => {
      e[r] || (t[r] = this.shape[r]);
    }), new b({
      ...this._def,
      shape: () => t
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return F(this);
  }
  partial(e) {
    const t = {};
    return x.objectKeys(this.shape).forEach((r) => {
      const s = this.shape[r];
      e && !e[r] ? t[r] = s : t[r] = s.optional();
    }), new b({
      ...this._def,
      shape: () => t
    });
  }
  required(e) {
    const t = {};
    return x.objectKeys(this.shape).forEach((r) => {
      if (e && !e[r])
        t[r] = this.shape[r];
      else {
        let a = this.shape[r];
        for (; a instanceof A; )
          a = a._def.innerType;
        t[r] = a;
      }
    }), new b({
      ...this._def,
      shape: () => t
    });
  }
  keyof() {
    return Ve(x.objectKeys(this.shape));
  }
}
b.create = (n, e) => new b({
  shape: () => n,
  unknownKeys: "strip",
  catchall: R.create(),
  typeName: p.ZodObject,
  ..._(e)
});
b.strictCreate = (n, e) => new b({
  shape: () => n,
  unknownKeys: "strict",
  catchall: R.create(),
  typeName: p.ZodObject,
  ..._(e)
});
b.lazycreate = (n, e) => new b({
  shape: n,
  unknownKeys: "strip",
  catchall: R.create(),
  typeName: p.ZodObject,
  ..._(e)
});
class te extends v {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e), r = this._def.options;
    function s(a) {
      for (const o of a)
        if (o.result.status === "valid")
          return o.result;
      for (const o of a)
        if (o.result.status === "dirty")
          return t.common.issues.push(...o.ctx.common.issues), o.result;
      const i = a.map((o) => new T(o.ctx.common.issues));
      return u(t, {
        code: c.invalid_union,
        unionErrors: i
      }), y;
    }
    if (t.common.async)
      return Promise.all(r.map(async (a) => {
        const i = {
          ...t,
          common: {
            ...t.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await a._parseAsync({
            data: t.data,
            path: t.path,
            parent: i
          }),
          ctx: i
        };
      })).then(s);
    {
      let a;
      const i = [];
      for (const f of r) {
        const l = {
          ...t,
          common: {
            ...t.common,
            issues: []
          },
          parent: null
        }, g = f._parseSync({
          data: t.data,
          path: t.path,
          parent: l
        });
        if (g.status === "valid")
          return g;
        g.status === "dirty" && !a && (a = { result: g, ctx: l }), l.common.issues.length && i.push(l.common.issues);
      }
      if (a)
        return t.common.issues.push(...a.ctx.common.issues), a.result;
      const o = i.map((f) => new T(f));
      return u(t, {
        code: c.invalid_union,
        unionErrors: o
      }), y;
    }
  }
  get options() {
    return this._def.options;
  }
}
te.create = (n, e) => new te({
  options: n,
  typeName: p.ZodUnion,
  ..._(e)
});
const E = (n) => n instanceof se ? E(n.schema) : n instanceof N ? E(n.innerType()) : n instanceof ae ? [n.value] : n instanceof M ? n.options : n instanceof ie ? x.objectValues(n.enum) : n instanceof oe ? E(n._def.innerType) : n instanceof K ? [void 0] : n instanceof ee ? [null] : n instanceof A ? [void 0, ...E(n.unwrap())] : n instanceof V ? [null, ...E(n.unwrap())] : n instanceof Ne || n instanceof ce ? E(n.unwrap()) : n instanceof de ? E(n._def.innerType) : [];
class ve extends v {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.object)
      return u(t, {
        code: c.invalid_type,
        expected: h.object,
        received: t.parsedType
      }), y;
    const r = this.discriminator, s = t.data[r], a = this.optionsMap.get(s);
    return a ? t.common.async ? a._parseAsync({
      data: t.data,
      path: t.path,
      parent: t
    }) : a._parseSync({
      data: t.data,
      path: t.path,
      parent: t
    }) : (u(t, {
      code: c.invalid_union_discriminator,
      options: Array.from(this.optionsMap.keys()),
      path: [r]
    }), y);
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(e, t, r) {
    const s = /* @__PURE__ */ new Map();
    for (const a of t) {
      const i = E(a.shape[e]);
      if (!i.length)
        throw new Error(`A discriminator value for key \`${e}\` could not be extracted from all schema options`);
      for (const o of i) {
        if (s.has(o))
          throw new Error(`Discriminator property ${String(e)} has duplicate value ${String(o)}`);
        s.set(o, a);
      }
    }
    return new ve({
      typeName: p.ZodDiscriminatedUnion,
      discriminator: e,
      options: t,
      optionsMap: s,
      ..._(r)
    });
  }
}
function Ce(n, e) {
  const t = j(n), r = j(e);
  if (n === e)
    return { valid: !0, data: n };
  if (t === h.object && r === h.object) {
    const s = x.objectKeys(e), a = x.objectKeys(n).filter((o) => s.indexOf(o) !== -1), i = { ...n, ...e };
    for (const o of a) {
      const f = Ce(n[o], e[o]);
      if (!f.valid)
        return { valid: !1 };
      i[o] = f.data;
    }
    return { valid: !0, data: i };
  } else if (t === h.array && r === h.array) {
    if (n.length !== e.length)
      return { valid: !1 };
    const s = [];
    for (let a = 0; a < n.length; a++) {
      const i = n[a], o = e[a], f = Ce(i, o);
      if (!f.valid)
        return { valid: !1 };
      s.push(f.data);
    }
    return { valid: !0, data: s };
  } else return t === h.date && r === h.date && +n == +e ? { valid: !0, data: n } : { valid: !1 };
}
class ne extends v {
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e), s = (a, i) => {
      if (Ze(a) || Ze(i))
        return y;
      const o = Ce(a.value, i.value);
      return o.valid ? ((Se(a) || Se(i)) && t.dirty(), { status: t.value, value: o.data }) : (u(r, {
        code: c.invalid_intersection_types
      }), y);
    };
    return r.common.async ? Promise.all([
      this._def.left._parseAsync({
        data: r.data,
        path: r.path,
        parent: r
      }),
      this._def.right._parseAsync({
        data: r.data,
        path: r.path,
        parent: r
      })
    ]).then(([a, i]) => s(a, i)) : s(this._def.left._parseSync({
      data: r.data,
      path: r.path,
      parent: r
    }), this._def.right._parseSync({
      data: r.data,
      path: r.path,
      parent: r
    }));
  }
}
ne.create = (n, e, t) => new ne({
  left: n,
  right: e,
  typeName: p.ZodIntersection,
  ..._(t)
});
class O extends v {
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e);
    if (r.parsedType !== h.array)
      return u(r, {
        code: c.invalid_type,
        expected: h.array,
        received: r.parsedType
      }), y;
    if (r.data.length < this._def.items.length)
      return u(r, {
        code: c.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), y;
    !this._def.rest && r.data.length > this._def.items.length && (u(r, {
      code: c.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), t.dirty());
    const a = [...r.data].map((i, o) => {
      const f = this._def.items[o] || this._def.rest;
      return f ? f._parse(new I(r, i, r.path, o)) : null;
    }).filter((i) => !!i);
    return r.common.async ? Promise.all(a).then((i) => k.mergeArray(t, i)) : k.mergeArray(t, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new O({
      ...this._def,
      rest: e
    });
  }
}
O.create = (n, e) => {
  if (!Array.isArray(n))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new O({
    items: n,
    typeName: p.ZodTuple,
    rest: null,
    ..._(e)
  });
};
class re extends v {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e);
    if (r.parsedType !== h.object)
      return u(r, {
        code: c.invalid_type,
        expected: h.object,
        received: r.parsedType
      }), y;
    const s = [], a = this._def.keyType, i = this._def.valueType;
    for (const o in r.data)
      s.push({
        key: a._parse(new I(r, o, r.path, o)),
        value: i._parse(new I(r, r.data[o], r.path, o)),
        alwaysSet: o in r.data
      });
    return r.common.async ? k.mergeObjectAsync(t, s) : k.mergeObjectSync(t, s);
  }
  get element() {
    return this._def.valueType;
  }
  static create(e, t, r) {
    return t instanceof v ? new re({
      keyType: e,
      valueType: t,
      typeName: p.ZodRecord,
      ..._(r)
    }) : new re({
      keyType: S.create(),
      valueType: e,
      typeName: p.ZodRecord,
      ..._(t)
    });
  }
}
class ge extends v {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e);
    if (r.parsedType !== h.map)
      return u(r, {
        code: c.invalid_type,
        expected: h.map,
        received: r.parsedType
      }), y;
    const s = this._def.keyType, a = this._def.valueType, i = [...r.data.entries()].map(([o, f], l) => ({
      key: s._parse(new I(r, o, r.path, [l, "key"])),
      value: a._parse(new I(r, f, r.path, [l, "value"]))
    }));
    if (r.common.async) {
      const o = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const f of i) {
          const l = await f.key, g = await f.value;
          if (l.status === "aborted" || g.status === "aborted")
            return y;
          (l.status === "dirty" || g.status === "dirty") && t.dirty(), o.set(l.value, g.value);
        }
        return { status: t.value, value: o };
      });
    } else {
      const o = /* @__PURE__ */ new Map();
      for (const f of i) {
        const l = f.key, g = f.value;
        if (l.status === "aborted" || g.status === "aborted")
          return y;
        (l.status === "dirty" || g.status === "dirty") && t.dirty(), o.set(l.value, g.value);
      }
      return { status: t.value, value: o };
    }
  }
}
ge.create = (n, e, t) => new ge({
  valueType: e,
  keyType: n,
  typeName: p.ZodMap,
  ..._(t)
});
class U extends v {
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e);
    if (r.parsedType !== h.set)
      return u(r, {
        code: c.invalid_type,
        expected: h.set,
        received: r.parsedType
      }), y;
    const s = this._def;
    s.minSize !== null && r.data.size < s.minSize.value && (u(r, {
      code: c.too_small,
      minimum: s.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.minSize.message
    }), t.dirty()), s.maxSize !== null && r.data.size > s.maxSize.value && (u(r, {
      code: c.too_big,
      maximum: s.maxSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.maxSize.message
    }), t.dirty());
    const a = this._def.valueType;
    function i(f) {
      const l = /* @__PURE__ */ new Set();
      for (const g of f) {
        if (g.status === "aborted")
          return y;
        g.status === "dirty" && t.dirty(), l.add(g.value);
      }
      return { status: t.value, value: l };
    }
    const o = [...r.data.values()].map((f, l) => a._parse(new I(r, f, r.path, l)));
    return r.common.async ? Promise.all(o).then((f) => i(f)) : i(o);
  }
  min(e, t) {
    return new U({
      ...this._def,
      minSize: { value: e, message: m.toString(t) }
    });
  }
  max(e, t) {
    return new U({
      ...this._def,
      maxSize: { value: e, message: m.toString(t) }
    });
  }
  size(e, t) {
    return this.min(e, t).max(e, t);
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
U.create = (n, e) => new U({
  valueType: n,
  minSize: null,
  maxSize: null,
  typeName: p.ZodSet,
  ..._(e)
});
class W extends v {
  constructor() {
    super(...arguments), this.validate = this.implement;
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.function)
      return u(t, {
        code: c.invalid_type,
        expected: h.function,
        received: t.parsedType
      }), y;
    function r(o, f) {
      return he({
        data: o,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          fe(),
          q
        ].filter((l) => !!l),
        issueData: {
          code: c.invalid_arguments,
          argumentsError: f
        }
      });
    }
    function s(o, f) {
      return he({
        data: o,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          fe(),
          q
        ].filter((l) => !!l),
        issueData: {
          code: c.invalid_return_type,
          returnTypeError: f
        }
      });
    }
    const a = { errorMap: t.common.contextualErrorMap }, i = t.data;
    if (this._def.returns instanceof Y) {
      const o = this;
      return w(async function(...f) {
        const l = new T([]), g = await o._def.args.parseAsync(f, a).catch((be) => {
          throw l.addIssue(r(f, be)), l;
        }), Z = await Reflect.apply(i, this, g);
        return await o._def.returns._def.type.parseAsync(Z, a).catch((be) => {
          throw l.addIssue(s(Z, be)), l;
        });
      });
    } else {
      const o = this;
      return w(function(...f) {
        const l = o._def.args.safeParse(f, a);
        if (!l.success)
          throw new T([r(f, l.error)]);
        const g = Reflect.apply(i, this, l.data), Z = o._def.returns.safeParse(g, a);
        if (!Z.success)
          throw new T([s(g, Z.error)]);
        return Z.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...e) {
    return new W({
      ...this._def,
      args: O.create(e).rest(D.create())
    });
  }
  returns(e) {
    return new W({
      ...this._def,
      returns: e
    });
  }
  implement(e) {
    return this.parse(e);
  }
  strictImplement(e) {
    return this.parse(e);
  }
  static create(e, t, r) {
    return new W({
      args: e || O.create([]).rest(D.create()),
      returns: t || D.create(),
      typeName: p.ZodFunction,
      ..._(r)
    });
  }
}
class se extends v {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    return this._def.getter()._parse({ data: t.data, path: t.path, parent: t });
  }
}
se.create = (n, e) => new se({
  getter: n,
  typeName: p.ZodLazy,
  ..._(e)
});
class ae extends v {
  _parse(e) {
    if (e.data !== this._def.value) {
      const t = this._getOrReturnCtx(e);
      return u(t, {
        received: t.data,
        code: c.invalid_literal,
        expected: this._def.value
      }), y;
    }
    return { status: "valid", value: e.data };
  }
  get value() {
    return this._def.value;
  }
}
ae.create = (n, e) => new ae({
  value: n,
  typeName: p.ZodLiteral,
  ..._(e)
});
function Ve(n, e) {
  return new M({
    values: n,
    typeName: p.ZodEnum,
    ..._(e)
  });
}
class M extends v {
  constructor() {
    super(...arguments), H.set(this, void 0);
  }
  _parse(e) {
    if (typeof e.data != "string") {
      const t = this._getOrReturnCtx(e), r = this._def.values;
      return u(t, {
        expected: x.joinValues(r),
        received: t.parsedType,
        code: c.invalid_type
      }), y;
    }
    if (me(this, H) || Re(this, H, new Set(this._def.values)), !me(this, H).has(e.data)) {
      const t = this._getOrReturnCtx(e), r = this._def.values;
      return u(t, {
        received: t.data,
        code: c.invalid_enum_value,
        options: r
      }), y;
    }
    return w(e.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const e = {};
    for (const t of this._def.values)
      e[t] = t;
    return e;
  }
  get Values() {
    const e = {};
    for (const t of this._def.values)
      e[t] = t;
    return e;
  }
  get Enum() {
    const e = {};
    for (const t of this._def.values)
      e[t] = t;
    return e;
  }
  extract(e, t = this._def) {
    return M.create(e, {
      ...this._def,
      ...t
    });
  }
  exclude(e, t = this._def) {
    return M.create(this.options.filter((r) => !e.includes(r)), {
      ...this._def,
      ...t
    });
  }
}
H = /* @__PURE__ */ new WeakMap();
M.create = Ve;
class ie extends v {
  constructor() {
    super(...arguments), G.set(this, void 0);
  }
  _parse(e) {
    const t = x.getValidEnumValues(this._def.values), r = this._getOrReturnCtx(e);
    if (r.parsedType !== h.string && r.parsedType !== h.number) {
      const s = x.objectValues(t);
      return u(r, {
        expected: x.joinValues(s),
        received: r.parsedType,
        code: c.invalid_type
      }), y;
    }
    if (me(this, G) || Re(this, G, new Set(x.getValidEnumValues(this._def.values))), !me(this, G).has(e.data)) {
      const s = x.objectValues(t);
      return u(r, {
        received: r.data,
        code: c.invalid_enum_value,
        options: s
      }), y;
    }
    return w(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
G = /* @__PURE__ */ new WeakMap();
ie.create = (n, e) => new ie({
  values: n,
  typeName: p.ZodNativeEnum,
  ..._(e)
});
class Y extends v {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.promise && t.common.async === !1)
      return u(t, {
        code: c.invalid_type,
        expected: h.promise,
        received: t.parsedType
      }), y;
    const r = t.parsedType === h.promise ? t.data : Promise.resolve(t.data);
    return w(r.then((s) => this._def.type.parseAsync(s, {
      path: t.path,
      errorMap: t.common.contextualErrorMap
    })));
  }
}
Y.create = (n, e) => new Y({
  type: n,
  typeName: p.ZodPromise,
  ..._(e)
});
class N extends v {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === p.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e), s = this._def.effect || null, a = {
      addIssue: (i) => {
        u(r, i), i.fatal ? t.abort() : t.dirty();
      },
      get path() {
        return r.path;
      }
    };
    if (a.addIssue = a.addIssue.bind(a), s.type === "preprocess") {
      const i = s.transform(r.data, a);
      if (r.common.async)
        return Promise.resolve(i).then(async (o) => {
          if (t.value === "aborted")
            return y;
          const f = await this._def.schema._parseAsync({
            data: o,
            path: r.path,
            parent: r
          });
          return f.status === "aborted" ? y : f.status === "dirty" || t.value === "dirty" ? B(f.value) : f;
        });
      {
        if (t.value === "aborted")
          return y;
        const o = this._def.schema._parseSync({
          data: i,
          path: r.path,
          parent: r
        });
        return o.status === "aborted" ? y : o.status === "dirty" || t.value === "dirty" ? B(o.value) : o;
      }
    }
    if (s.type === "refinement") {
      const i = (o) => {
        const f = s.refinement(o, a);
        if (r.common.async)
          return Promise.resolve(f);
        if (f instanceof Promise)
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return o;
      };
      if (r.common.async === !1) {
        const o = this._def.schema._parseSync({
          data: r.data,
          path: r.path,
          parent: r
        });
        return o.status === "aborted" ? y : (o.status === "dirty" && t.dirty(), i(o.value), { status: t.value, value: o.value });
      } else
        return this._def.schema._parseAsync({ data: r.data, path: r.path, parent: r }).then((o) => o.status === "aborted" ? y : (o.status === "dirty" && t.dirty(), i(o.value).then(() => ({ status: t.value, value: o.value }))));
    }
    if (s.type === "transform")
      if (r.common.async === !1) {
        const i = this._def.schema._parseSync({
          data: r.data,
          path: r.path,
          parent: r
        });
        if (!z(i))
          return i;
        const o = s.transform(i.value, a);
        if (o instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: t.value, value: o };
      } else
        return this._def.schema._parseAsync({ data: r.data, path: r.path, parent: r }).then((i) => z(i) ? Promise.resolve(s.transform(i.value, a)).then((o) => ({ status: t.value, value: o })) : i);
    x.assertNever(s);
  }
}
N.create = (n, e, t) => new N({
  schema: n,
  typeName: p.ZodEffects,
  effect: e,
  ..._(t)
});
N.createWithPreprocess = (n, e, t) => new N({
  schema: e,
  effect: { type: "preprocess", transform: n },
  typeName: p.ZodEffects,
  ..._(t)
});
class A extends v {
  _parse(e) {
    return this._getType(e) === h.undefined ? w(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
A.create = (n, e) => new A({
  innerType: n,
  typeName: p.ZodOptional,
  ..._(e)
});
class V extends v {
  _parse(e) {
    return this._getType(e) === h.null ? w(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
V.create = (n, e) => new V({
  innerType: n,
  typeName: p.ZodNullable,
  ..._(e)
});
class oe extends v {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    let r = t.data;
    return t.parsedType === h.undefined && (r = this._def.defaultValue()), this._def.innerType._parse({
      data: r,
      path: t.path,
      parent: t
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
oe.create = (n, e) => new oe({
  innerType: n,
  typeName: p.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ..._(e)
});
class de extends v {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e), r = {
      ...t,
      common: {
        ...t.common,
        issues: []
      }
    }, s = this._def.innerType._parse({
      data: r.data,
      path: r.path,
      parent: {
        ...r
      }
    });
    return Q(s) ? s.then((a) => ({
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new T(r.common.issues);
        },
        input: r.data
      })
    })) : {
      status: "valid",
      value: s.status === "valid" ? s.value : this._def.catchValue({
        get error() {
          return new T(r.common.issues);
        },
        input: r.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
de.create = (n, e) => new de({
  innerType: n,
  typeName: p.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ..._(e)
});
class _e extends v {
  _parse(e) {
    if (this._getType(e) !== h.nan) {
      const r = this._getOrReturnCtx(e);
      return u(r, {
        code: c.invalid_type,
        expected: h.nan,
        received: r.parsedType
      }), y;
    }
    return { status: "valid", value: e.data };
  }
}
_e.create = (n) => new _e({
  typeName: p.ZodNaN,
  ..._(n)
});
const pt = Symbol("zod_brand");
class Ne extends v {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e), r = t.data;
    return this._def.type._parse({
      data: r,
      path: t.path,
      parent: t
    });
  }
  unwrap() {
    return this._def.type;
  }
}
class ue extends v {
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e);
    if (r.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: r.data,
          path: r.path,
          parent: r
        });
        return a.status === "aborted" ? y : a.status === "dirty" ? (t.dirty(), B(a.value)) : this._def.out._parseAsync({
          data: a.value,
          path: r.path,
          parent: r
        });
      })();
    {
      const s = this._def.in._parseSync({
        data: r.data,
        path: r.path,
        parent: r
      });
      return s.status === "aborted" ? y : s.status === "dirty" ? (t.dirty(), {
        status: "dirty",
        value: s.value
      }) : this._def.out._parseSync({
        data: s.value,
        path: r.path,
        parent: r
      });
    }
  }
  static create(e, t) {
    return new ue({
      in: e,
      out: t,
      typeName: p.ZodPipeline
    });
  }
}
class ce extends v {
  _parse(e) {
    const t = this._def.innerType._parse(e), r = (s) => (z(s) && (s.value = Object.freeze(s.value)), s);
    return Q(t) ? t.then((s) => r(s)) : r(t);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ce.create = (n, e) => new ce({
  innerType: n,
  typeName: p.ZodReadonly,
  ..._(e)
});
function De(n, e = {}, t) {
  return n ? J.create().superRefine((r, s) => {
    var a, i;
    if (!n(r)) {
      const o = typeof e == "function" ? e(r) : typeof e == "string" ? { message: e } : e, f = (i = (a = o.fatal) !== null && a !== void 0 ? a : t) !== null && i !== void 0 ? i : !0, l = typeof o == "string" ? { message: o } : o;
      s.addIssue({ code: "custom", ...l, fatal: f });
    }
  }) : J.create();
}
const yt = {
  object: b.lazycreate
};
var p;
(function(n) {
  n.ZodString = "ZodString", n.ZodNumber = "ZodNumber", n.ZodNaN = "ZodNaN", n.ZodBigInt = "ZodBigInt", n.ZodBoolean = "ZodBoolean", n.ZodDate = "ZodDate", n.ZodSymbol = "ZodSymbol", n.ZodUndefined = "ZodUndefined", n.ZodNull = "ZodNull", n.ZodAny = "ZodAny", n.ZodUnknown = "ZodUnknown", n.ZodNever = "ZodNever", n.ZodVoid = "ZodVoid", n.ZodArray = "ZodArray", n.ZodObject = "ZodObject", n.ZodUnion = "ZodUnion", n.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", n.ZodIntersection = "ZodIntersection", n.ZodTuple = "ZodTuple", n.ZodRecord = "ZodRecord", n.ZodMap = "ZodMap", n.ZodSet = "ZodSet", n.ZodFunction = "ZodFunction", n.ZodLazy = "ZodLazy", n.ZodLiteral = "ZodLiteral", n.ZodEnum = "ZodEnum", n.ZodEffects = "ZodEffects", n.ZodNativeEnum = "ZodNativeEnum", n.ZodOptional = "ZodOptional", n.ZodNullable = "ZodNullable", n.ZodDefault = "ZodDefault", n.ZodCatch = "ZodCatch", n.ZodPromise = "ZodPromise", n.ZodBranded = "ZodBranded", n.ZodPipeline = "ZodPipeline", n.ZodReadonly = "ZodReadonly";
})(p || (p = {}));
const gt = (n, e = {
  message: `Input not instance of ${n.name}`
}) => De((t) => t instanceof n, e), ze = S.create, Le = P.create, _t = _e.create, vt = $.create, Ue = X.create, xt = L.create, bt = pe.create, kt = K.create, wt = ee.create, Tt = J.create, Zt = D.create, St = R.create, Ct = ye.create, Nt = C.create, At = b.create, It = b.strictCreate, Ot = te.create, Et = ve.create, jt = ne.create, Rt = O.create, Pt = re.create, $t = ge.create, Mt = U.create, Vt = W.create, Dt = se.create, zt = ae.create, Lt = M.create, Ut = ie.create, Ft = Y.create, Ee = N.create, Bt = A.create, Wt = V.create, qt = N.createWithPreprocess, Jt = ue.create, Yt = () => ze().optional(), Ht = () => Le().optional(), Gt = () => Ue().optional(), Qt = {
  string: (n) => S.create({ ...n, coerce: !0 }),
  number: (n) => P.create({ ...n, coerce: !0 }),
  boolean: (n) => X.create({
    ...n,
    coerce: !0
  }),
  bigint: (n) => $.create({ ...n, coerce: !0 }),
  date: (n) => L.create({ ...n, coerce: !0 })
}, Xt = y;
var d = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  defaultErrorMap: q,
  setErrorMap: qe,
  getErrorMap: fe,
  makeIssue: he,
  EMPTY_PATH: Je,
  addIssueToContext: u,
  ParseStatus: k,
  INVALID: y,
  DIRTY: B,
  OK: w,
  isAborted: Ze,
  isDirty: Se,
  isValid: z,
  isAsync: Q,
  get util() {
    return x;
  },
  get objectUtil() {
    return Te;
  },
  ZodParsedType: h,
  getParsedType: j,
  ZodType: v,
  datetimeRegex: Me,
  ZodString: S,
  ZodNumber: P,
  ZodBigInt: $,
  ZodBoolean: X,
  ZodDate: L,
  ZodSymbol: pe,
  ZodUndefined: K,
  ZodNull: ee,
  ZodAny: J,
  ZodUnknown: D,
  ZodNever: R,
  ZodVoid: ye,
  ZodArray: C,
  ZodObject: b,
  ZodUnion: te,
  ZodDiscriminatedUnion: ve,
  ZodIntersection: ne,
  ZodTuple: O,
  ZodRecord: re,
  ZodMap: ge,
  ZodSet: U,
  ZodFunction: W,
  ZodLazy: se,
  ZodLiteral: ae,
  ZodEnum: M,
  ZodNativeEnum: ie,
  ZodPromise: Y,
  ZodEffects: N,
  ZodTransformer: N,
  ZodOptional: A,
  ZodNullable: V,
  ZodDefault: oe,
  ZodCatch: de,
  ZodNaN: _e,
  BRAND: pt,
  ZodBranded: Ne,
  ZodPipeline: ue,
  ZodReadonly: ce,
  custom: De,
  Schema: v,
  ZodSchema: v,
  late: yt,
  get ZodFirstPartyTypeKind() {
    return p;
  },
  coerce: Qt,
  any: Tt,
  array: Nt,
  bigint: vt,
  boolean: Ue,
  date: xt,
  discriminatedUnion: Et,
  effect: Ee,
  enum: Lt,
  function: Vt,
  instanceof: gt,
  intersection: jt,
  lazy: Dt,
  literal: zt,
  map: $t,
  nan: _t,
  nativeEnum: Ut,
  never: St,
  null: wt,
  nullable: Wt,
  number: Le,
  object: At,
  oboolean: Gt,
  onumber: Ht,
  optional: Bt,
  ostring: Yt,
  pipeline: Jt,
  preprocess: qt,
  promise: Ft,
  record: Pt,
  set: Mt,
  strictObject: It,
  string: ze,
  symbol: bt,
  transformer: Ee,
  tuple: Rt,
  undefined: kt,
  union: Ot,
  unknown: Zt,
  void: Ct,
  NEVER: Xt,
  ZodIssueCode: c,
  quotelessJson: We,
  ZodError: T
});
const Kt = d.object({
  country: d.string(),
  city: d.string(),
  street: d.string(),
  streetNumber: d.string(),
  floor: d.string(),
  apartmentEnterNumber: d.string(),
  apartmentNumber: d.string()
}), en = d.object({
  type: d.literal("Profile"),
  id: d.string(),
  companyId: d.string(),
  storeId: d.string(),
  tenantId: d.string(),
  clientType: d.enum(["user", "company"]),
  displayName: d.string().min(1),
  email: d.string().email(),
  phoneNumber: d.object({
    code: d.string(),
    number: d.string()
  }),
  address: Kt,
  isAnonymous: d.boolean(),
  createdDate: d.number(),
  lastActivityDate: d.number()
});
function nn() {
  return {
    type: "Profile",
    id: "",
    companyId: "",
    storeId: "",
    tenantId: "",
    clientType: "user",
    displayName: "",
    email: "",
    phoneNumber: { code: "+972", number: "" },
    address: {
      country: "",
      city: "",
      street: "",
      streetNumber: "",
      floor: "",
      apartmentEnterNumber: "",
      apartmentNumber: ""
    },
    createdDate: 0,
    lastActivityDate: 0,
    isAnonymous: !0
  };
}
const le = d.object({
  lang: d.string().min(1),
  value: d.string().min(1)
}), Fe = d.object({
  id: d.string().min(1),
  companyId: d.string().min(1),
  storeId: d.string().min(1),
  parentId: d.string().nullish(),
  tag: d.string().min(1),
  locales: d.array(le),
  depth: d.number()
}), Ae = Fe.extend({
  children: d.lazy(() => Ae.array())
}), rn = Fe.extend({
  index: d.number(),
  depth: d.number(),
  collapsed: d.boolean().optional(),
  children: d.array(Ae)
}), we = d.string(), xe = d.object({
  type: d.literal("Product"),
  storeId: we,
  companyId: we,
  id: d.string(),
  objectID: d.string(),
  sku: d.string().min(1),
  name: d.array(le),
  description: d.array(le),
  isPublished: d.boolean(),
  vat: d.boolean(),
  priceType: d.object({
    type: d.enum(["unit", "kg", "gram", "liter", "ml"]),
    value: d.number()
  }),
  price: d.number().positive(),
  purchasePrice: d.number().optional(),
  profitPercentage: d.number().optional(),
  currency: d.literal("ILS"),
  discount: d.object({
    type: d.enum(["number", "percent", "none"]),
    value: d.number()
  }),
  weight: d.object({
    value: d.number(),
    unit: d.enum(["kg", "gram", "none"])
  }),
  volume: d.object({
    value: d.number(),
    unit: d.enum(["liter", "ml", "none"])
  }),
  images: d.array(d.object({ url: d.string().url(), id: d.string() })),
  manufacturer: we,
  brand: d.string(),
  importer: d.string(),
  supplier: d.string(),
  ingredients: d.array(le),
  created_at: d.number(),
  updated_at: d.number(),
  categoryList: d.array(Ae),
  // generated
  categories: d.object({
    lvl0: d.array(d.string()),
    lvl1: d.array(d.string()),
    lvl2: d.array(d.string()),
    lvl3: d.array(d.string()),
    lvl4: d.array(d.string())
  }),
  categoryNames: d.array(d.string())
}), sn = xe.omit({
  id: !0,
  categories: !0,
  images: !0
}).extend({
  image: d.instanceof(File).optional()
}), an = xe.extend({
  image: d.instanceof(File).optional()
}), on = d.object({
  type: d.literal("Order"),
  id: d.string(),
  companyId: d.string(),
  storeId: d.string(),
  userId: d.string(),
  status: d.enum([
    "pending",
    "processing",
    "in_delivery",
    "delivered",
    "canceled",
    "completed",
    "refunded"
  ]),
  paymentStatus: d.enum(["pending", "completed", "failed", "refunded"]),
  cart: d.object({
    id: d.string(),
    items: d.array(d.object({ product: xe, amount: d.number() })),
    cartTotal: d.number(),
    cartDiscount: d.number(),
    cartVat: d.number()
  }),
  date: d.number(),
  deliveryDate: d.number().optional(),
  client: en
}), dn = d.object({
  type: d.literal("FavoriteProduct"),
  id: d.string().uuid(),
  companyId: d.string().uuid(),
  storeId: d.string().uuid(),
  userId: d.string().uuid(),
  productId: d.string().uuid()
}), cn = d.object({
  type: d.literal("Cart"),
  id: d.string().uuid(),
  companyId: d.string().uuid(),
  storeId: d.string().uuid(),
  userId: d.string().uuid(),
  status: d.enum(["active", "draft", "completed"]),
  items: d.array(
    d.object({
      product: xe,
      amount: d.number().int().positive({ message: "Quantity must be a positive integer." })
    })
  )
}), tn = {
  products: "products"
}, Be = {
  getPath: ({
    companyId: n,
    storeId: e,
    collectionName: t
  }) => `${n}/${e}/${t}`,
  getProductsPath: ({ companyId: n, storeId: e }) => Be.getPath({ companyId: n, storeId: e, collectionName: tn.products })
}, un = {
  firestore: Be
};
export {
  Fe as BaseCategorySchema,
  cn as CartSchema,
  Ae as CategorySchema,
  an as EditProductSchema,
  dn as FavoriteProductSchema,
  un as FirebaseAPI,
  sn as NewProductSchema,
  on as OrderSchema,
  xe as ProductSchema,
  en as ProfileSchema,
  rn as TFlattenCategorySchema,
  nn as createEmptyProfile
};
//# sourceMappingURL=core.es.js.map
