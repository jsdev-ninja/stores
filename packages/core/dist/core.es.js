var b;
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
    for (const o of s)
      a[o] = o;
    return a;
  }, n.getValidEnumValues = (s) => {
    const a = n.objectKeys(s).filter((d) => typeof s[s[d]] != "number"), o = {};
    for (const d of a)
      o[d] = s[d];
    return n.objectValues(o);
  }, n.objectValues = (s) => n.objectKeys(s).map(function(a) {
    return s[a];
  }), n.objectKeys = typeof Object.keys == "function" ? (s) => Object.keys(s) : (s) => {
    const a = [];
    for (const o in s)
      Object.prototype.hasOwnProperty.call(s, o) && a.push(o);
    return a;
  }, n.find = (s, a) => {
    for (const o of s)
      if (a(o))
        return o;
  }, n.isInteger = typeof Number.isInteger == "function" ? (s) => Number.isInteger(s) : (s) => typeof s == "number" && isFinite(s) && Math.floor(s) === s;
  function r(s, a = " | ") {
    return s.map((o) => typeof o == "string" ? `'${o}'` : o).join(a);
  }
  n.joinValues = r, n.jsonStringifyReplacer = (s, a) => typeof a == "bigint" ? a.toString() : a;
})(b || (b = {}));
var Ze;
(function(n) {
  n.mergeShapes = (e, t) => ({
    ...e,
    ...t
    // second overwrites first
  });
})(Ze || (Ze = {}));
const h = b.arrayToEnum([
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
]), P = (n) => {
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
}, c = b.arrayToEnum([
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
]), Ge = (n) => JSON.stringify(n, null, 2).replace(/"([^"]+)":/g, "$1:");
class S extends Error {
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
      for (const o of a.issues)
        if (o.code === "invalid_union")
          o.unionErrors.map(s);
        else if (o.code === "invalid_return_type")
          s(o.returnTypeError);
        else if (o.code === "invalid_arguments")
          s(o.argumentsError);
        else if (o.path.length === 0)
          r._errors.push(t(o));
        else {
          let d = r, f = 0;
          for (; f < o.path.length; ) {
            const l = o.path[f];
            f === o.path.length - 1 ? (d[l] = d[l] || { _errors: [] }, d[l]._errors.push(t(o))) : d[l] = d[l] || { _errors: [] }, d = d[l], f++;
          }
        }
    };
    return s(this), r;
  }
  static assert(e) {
    if (!(e instanceof S))
      throw new Error(`Not a ZodError: ${e}`);
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, b.jsonStringifyReplacer, 2);
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
S.create = (n) => new S(n);
const H = (n, e) => {
  let t;
  switch (n.code) {
    case c.invalid_type:
      n.received === h.undefined ? t = "Required" : t = `Expected ${n.expected}, received ${n.received}`;
      break;
    case c.invalid_literal:
      t = `Invalid literal value, expected ${JSON.stringify(n.expected, b.jsonStringifyReplacer)}`;
      break;
    case c.unrecognized_keys:
      t = `Unrecognized key(s) in object: ${b.joinValues(n.keys, ", ")}`;
      break;
    case c.invalid_union:
      t = "Invalid input";
      break;
    case c.invalid_union_discriminator:
      t = `Invalid discriminator value. Expected ${b.joinValues(n.options)}`;
      break;
    case c.invalid_enum_value:
      t = `Invalid enum value. Expected ${b.joinValues(n.options)}, received '${n.received}'`;
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
      typeof n.validation == "object" ? "includes" in n.validation ? (t = `Invalid input: must include "${n.validation.includes}"`, typeof n.validation.position == "number" && (t = `${t} at one or more positions greater than or equal to ${n.validation.position}`)) : "startsWith" in n.validation ? t = `Invalid input: must start with "${n.validation.startsWith}"` : "endsWith" in n.validation ? t = `Invalid input: must end with "${n.validation.endsWith}"` : b.assertNever(n.validation) : n.validation !== "regex" ? t = `Invalid ${n.validation}` : t = "Invalid";
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
      t = e.defaultError, b.assertNever(n);
  }
  return { message: t };
};
let Me = H;
function Qe(n) {
  Me = n;
}
function pe() {
  return Me;
}
const me = (n) => {
  const { data: e, path: t, errorMaps: r, issueData: s } = n, a = [...t, ...s.path || []], o = {
    ...s,
    path: a
  };
  if (s.message !== void 0)
    return {
      ...s,
      path: a,
      message: s.message
    };
  let d = "";
  const f = r.filter((l) => !!l).slice().reverse();
  for (const l of f)
    d = l(o, { data: e, defaultError: d }).message;
  return {
    ...s,
    path: a,
    message: d
  };
}, Xe = [];
function u(n, e) {
  const t = pe(), r = me({
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
      t === H ? void 0 : H
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
        return g;
      s.status === "dirty" && e.dirty(), r.push(s.value);
    }
    return { status: e.value, value: r };
  }
  static async mergeObjectAsync(e, t) {
    const r = [];
    for (const s of t) {
      const a = await s.key, o = await s.value;
      r.push({
        key: a,
        value: o
      });
    }
    return k.mergeObjectSync(e, r);
  }
  static mergeObjectSync(e, t) {
    const r = {};
    for (const s of t) {
      const { key: a, value: o } = s;
      if (a.status === "aborted" || o.status === "aborted")
        return g;
      a.status === "dirty" && e.dirty(), o.status === "dirty" && e.dirty(), a.value !== "__proto__" && (typeof o.value < "u" || s.alwaysSet) && (r[a.value] = o.value);
    }
    return { status: e.value, value: r };
  }
}
const g = Object.freeze({
  status: "aborted"
}), q = (n) => ({ status: "dirty", value: n }), T = (n) => ({ status: "valid", value: n }), Ce = (n) => n.status === "aborted", Ie = (n) => n.status === "dirty", U = (n) => n.status === "valid", ee = (n) => typeof Promise < "u" && n instanceof Promise;
function ge(n, e, t, r) {
  if (typeof e == "function" ? n !== e || !0 : !e.has(n)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return e.get(n);
}
function De(n, e, t, r, s) {
  if (typeof e == "function" ? n !== e || !0 : !e.has(n)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return e.set(n, t), t;
}
var p;
(function(n) {
  n.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, n.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(p || (p = {}));
var Q, X;
class O {
  constructor(e, t, r, s) {
    this._cachedPath = [], this.parent = e, this.data = t, this._path = r, this._key = s;
  }
  get path() {
    return this._cachedPath.length || (this._key instanceof Array ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Re = (n, e) => {
  if (U(e))
    return { success: !0, data: e.value };
  if (!n.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const t = new S(n.common.issues);
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
  return e ? { errorMap: e, description: s } : { errorMap: (o, d) => {
    var f, l;
    const { message: y } = n;
    return o.code === "invalid_enum_value" ? { message: y ?? d.defaultError } : typeof d.data > "u" ? { message: (f = y ?? r) !== null && f !== void 0 ? f : d.defaultError } : o.code !== "invalid_type" ? { message: d.defaultError } : { message: (l = y ?? t) !== null && l !== void 0 ? l : d.defaultError };
  }, description: s };
}
class v {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return P(e.data);
  }
  _getOrReturnCtx(e, t) {
    return t || {
      common: e.parent.common,
      data: e.data,
      parsedType: P(e.data),
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
        parsedType: P(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent
      }
    };
  }
  _parseSync(e) {
    const t = this._parse(e);
    if (ee(t))
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
      parsedType: P(e)
    }, a = this._parseSync({ data: e, path: s.path, parent: s });
    return Re(s, a);
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
      parsedType: P(e)
    };
    if (!this["~standard"].async)
      try {
        const a = this._parseSync({ data: e, path: [], parent: s });
        return U(a) ? {
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
    return this._parseAsync({ data: e, path: [], parent: s }).then((a) => U(a) ? {
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
      parsedType: P(e)
    }, s = this._parse({ data: e, path: r.path, parent: r }), a = await (ee(s) ? s : Promise.resolve(s));
    return Re(r, a);
  }
  refine(e, t) {
    const r = (s) => typeof t == "string" || typeof t > "u" ? { message: t } : typeof t == "function" ? t(s) : t;
    return this._refinement((s, a) => {
      const o = e(s), d = () => a.addIssue({
        code: c.custom,
        ...r(s)
      });
      return typeof Promise < "u" && o instanceof Promise ? o.then((f) => f ? !0 : (d(), !1)) : o ? !0 : (d(), !1);
    });
  }
  refinement(e, t) {
    return this._refinement((r, s) => e(r) ? !0 : (s.addIssue(typeof t == "function" ? t(r, s) : t), !1));
  }
  _refinement(e) {
    return new N({
      schema: this,
      typeName: m.ZodEffects,
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
    return j.create(this, this._def);
  }
  nullable() {
    return L.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return I.create(this);
  }
  promise() {
    return G.create(this, this._def);
  }
  or(e) {
    return se.create([this, e], this._def);
  }
  and(e) {
    return ae.create(this, e, this._def);
  }
  transform(e) {
    return new N({
      ..._(this._def),
      schema: this,
      typeName: m.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const t = typeof e == "function" ? e : () => e;
    return new ue({
      ..._(this._def),
      innerType: this,
      defaultValue: t,
      typeName: m.ZodDefault
    });
  }
  brand() {
    return new je({
      typeName: m.ZodBranded,
      type: this,
      ..._(this._def)
    });
  }
  catch(e) {
    const t = typeof e == "function" ? e : () => e;
    return new le({
      ..._(this._def),
      innerType: this,
      catchValue: t,
      typeName: m.ZodCatch
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
    return he.create(this, e);
  }
  readonly() {
    return fe.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const Ke = /^c[^\s-]{8,}$/i, et = /^[0-9a-z]+$/, tt = /^[0-9A-HJKMNP-TV-Z]{26}$/i, nt = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, rt = /^[a-z0-9_-]{21}$/i, st = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, at = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, it = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, ot = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let Te;
const dt = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, ct = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, ut = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, lt = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, ft = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, ht = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, Ve = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", pt = new RegExp(`^${Ve}$`);
function Le(n) {
  let e = "([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d";
  return n.precision ? e = `${e}\\.\\d{${n.precision}}` : n.precision == null && (e = `${e}(\\.\\d+)?`), e;
}
function mt(n) {
  return new RegExp(`^${Le(n)}$`);
}
function ze(n) {
  let e = `${Ve}T${Le(n)}`;
  const t = [];
  return t.push(n.local ? "Z?" : "Z"), n.offset && t.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${t.join("|")})`, new RegExp(`^${e}$`);
}
function gt(n, e) {
  return !!((e === "v4" || !e) && dt.test(n) || (e === "v6" || !e) && ut.test(n));
}
function yt(n, e) {
  if (!st.test(n))
    return !1;
  try {
    const [t] = n.split("."), r = t.replace(/-/g, "+").replace(/_/g, "/").padEnd(t.length + (4 - t.length % 4) % 4, "="), s = JSON.parse(atob(r));
    return !(typeof s != "object" || s === null || !s.typ || !s.alg || e && s.alg !== e);
  } catch {
    return !1;
  }
}
function _t(n, e) {
  return !!((e === "v4" || !e) && ct.test(n) || (e === "v6" || !e) && lt.test(n));
}
class C extends v {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== h.string) {
      const a = this._getOrReturnCtx(e);
      return u(a, {
        code: c.invalid_type,
        expected: h.string,
        received: a.parsedType
      }), g;
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
        const o = e.data.length > a.value, d = e.data.length < a.value;
        (o || d) && (s = this._getOrReturnCtx(e, s), o ? u(s, {
          code: c.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }) : d && u(s, {
          code: c.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }), r.dirty());
      } else if (a.kind === "email")
        it.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
          validation: "email",
          code: c.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "emoji")
        Te || (Te = new RegExp(ot, "u")), Te.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
          validation: "emoji",
          code: c.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "uuid")
        nt.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
          validation: "uuid",
          code: c.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "nanoid")
        rt.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
          validation: "nanoid",
          code: c.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "cuid")
        Ke.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
          validation: "cuid",
          code: c.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "cuid2")
        et.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
          validation: "cuid2",
          code: c.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "ulid")
        tt.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
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
      }), r.dirty()) : a.kind === "datetime" ? ze(a).test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
        code: c.invalid_string,
        validation: "datetime",
        message: a.message
      }), r.dirty()) : a.kind === "date" ? pt.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
        code: c.invalid_string,
        validation: "date",
        message: a.message
      }), r.dirty()) : a.kind === "time" ? mt(a).test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
        code: c.invalid_string,
        validation: "time",
        message: a.message
      }), r.dirty()) : a.kind === "duration" ? at.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
        validation: "duration",
        code: c.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "ip" ? gt(e.data, a.version) || (s = this._getOrReturnCtx(e, s), u(s, {
        validation: "ip",
        code: c.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "jwt" ? yt(e.data, a.alg) || (s = this._getOrReturnCtx(e, s), u(s, {
        validation: "jwt",
        code: c.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "cidr" ? _t(e.data, a.version) || (s = this._getOrReturnCtx(e, s), u(s, {
        validation: "cidr",
        code: c.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "base64" ? ft.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
        validation: "base64",
        code: c.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "base64url" ? ht.test(e.data) || (s = this._getOrReturnCtx(e, s), u(s, {
        validation: "base64url",
        code: c.invalid_string,
        message: a.message
      }), r.dirty()) : b.assertNever(a);
    return { status: r.value, value: e.data };
  }
  _regex(e, t, r) {
    return this.refinement((s) => e.test(s), {
      validation: t,
      code: c.invalid_string,
      ...p.errToObj(r)
    });
  }
  _addCheck(e) {
    return new C({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  email(e) {
    return this._addCheck({ kind: "email", ...p.errToObj(e) });
  }
  url(e) {
    return this._addCheck({ kind: "url", ...p.errToObj(e) });
  }
  emoji(e) {
    return this._addCheck({ kind: "emoji", ...p.errToObj(e) });
  }
  uuid(e) {
    return this._addCheck({ kind: "uuid", ...p.errToObj(e) });
  }
  nanoid(e) {
    return this._addCheck({ kind: "nanoid", ...p.errToObj(e) });
  }
  cuid(e) {
    return this._addCheck({ kind: "cuid", ...p.errToObj(e) });
  }
  cuid2(e) {
    return this._addCheck({ kind: "cuid2", ...p.errToObj(e) });
  }
  ulid(e) {
    return this._addCheck({ kind: "ulid", ...p.errToObj(e) });
  }
  base64(e) {
    return this._addCheck({ kind: "base64", ...p.errToObj(e) });
  }
  base64url(e) {
    return this._addCheck({
      kind: "base64url",
      ...p.errToObj(e)
    });
  }
  jwt(e) {
    return this._addCheck({ kind: "jwt", ...p.errToObj(e) });
  }
  ip(e) {
    return this._addCheck({ kind: "ip", ...p.errToObj(e) });
  }
  cidr(e) {
    return this._addCheck({ kind: "cidr", ...p.errToObj(e) });
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
      ...p.errToObj(e == null ? void 0 : e.message)
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
      ...p.errToObj(e == null ? void 0 : e.message)
    });
  }
  duration(e) {
    return this._addCheck({ kind: "duration", ...p.errToObj(e) });
  }
  regex(e, t) {
    return this._addCheck({
      kind: "regex",
      regex: e,
      ...p.errToObj(t)
    });
  }
  includes(e, t) {
    return this._addCheck({
      kind: "includes",
      value: e,
      position: t == null ? void 0 : t.position,
      ...p.errToObj(t == null ? void 0 : t.message)
    });
  }
  startsWith(e, t) {
    return this._addCheck({
      kind: "startsWith",
      value: e,
      ...p.errToObj(t)
    });
  }
  endsWith(e, t) {
    return this._addCheck({
      kind: "endsWith",
      value: e,
      ...p.errToObj(t)
    });
  }
  min(e, t) {
    return this._addCheck({
      kind: "min",
      value: e,
      ...p.errToObj(t)
    });
  }
  max(e, t) {
    return this._addCheck({
      kind: "max",
      value: e,
      ...p.errToObj(t)
    });
  }
  length(e, t) {
    return this._addCheck({
      kind: "length",
      value: e,
      ...p.errToObj(t)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(e) {
    return this.min(1, p.errToObj(e));
  }
  trim() {
    return new C({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new C({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new C({
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
C.create = (n) => {
  var e;
  return new C({
    checks: [],
    typeName: m.ZodString,
    coerce: (e = n == null ? void 0 : n.coerce) !== null && e !== void 0 ? e : !1,
    ..._(n)
  });
};
function vt(n, e) {
  const t = (n.toString().split(".")[1] || "").length, r = (e.toString().split(".")[1] || "").length, s = t > r ? t : r, a = parseInt(n.toFixed(s).replace(".", "")), o = parseInt(e.toFixed(s).replace(".", ""));
  return a % o / Math.pow(10, s);
}
class M extends v {
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
      }), g;
    }
    let r;
    const s = new k();
    for (const a of this._def.checks)
      a.kind === "int" ? b.isInteger(e.data) || (r = this._getOrReturnCtx(e, r), u(r, {
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
      }), s.dirty()) : a.kind === "multipleOf" ? vt(e.data, a.value) !== 0 && (r = this._getOrReturnCtx(e, r), u(r, {
        code: c.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (r = this._getOrReturnCtx(e, r), u(r, {
        code: c.not_finite,
        message: a.message
      }), s.dirty()) : b.assertNever(a);
    return { status: s.value, value: e.data };
  }
  gte(e, t) {
    return this.setLimit("min", e, !0, p.toString(t));
  }
  gt(e, t) {
    return this.setLimit("min", e, !1, p.toString(t));
  }
  lte(e, t) {
    return this.setLimit("max", e, !0, p.toString(t));
  }
  lt(e, t) {
    return this.setLimit("max", e, !1, p.toString(t));
  }
  setLimit(e, t, r, s) {
    return new M({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: t,
          inclusive: r,
          message: p.toString(s)
        }
      ]
    });
  }
  _addCheck(e) {
    return new M({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  int(e) {
    return this._addCheck({
      kind: "int",
      message: p.toString(e)
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !1,
      message: p.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !1,
      message: p.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !0,
      message: p.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !0,
      message: p.toString(e)
    });
  }
  multipleOf(e, t) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: p.toString(t)
    });
  }
  finite(e) {
    return this._addCheck({
      kind: "finite",
      message: p.toString(e)
    });
  }
  safe(e) {
    return this._addCheck({
      kind: "min",
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: p.toString(e)
    })._addCheck({
      kind: "max",
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: p.toString(e)
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
    return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && b.isInteger(e.value));
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
M.create = (n) => new M({
  checks: [],
  typeName: m.ZodNumber,
  coerce: (n == null ? void 0 : n.coerce) || !1,
  ..._(n)
});
class D extends v {
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
      }), s.dirty()) : b.assertNever(a);
    return { status: s.value, value: e.data };
  }
  _getInvalidInput(e) {
    const t = this._getOrReturnCtx(e);
    return u(t, {
      code: c.invalid_type,
      expected: h.bigint,
      received: t.parsedType
    }), g;
  }
  gte(e, t) {
    return this.setLimit("min", e, !0, p.toString(t));
  }
  gt(e, t) {
    return this.setLimit("min", e, !1, p.toString(t));
  }
  lte(e, t) {
    return this.setLimit("max", e, !0, p.toString(t));
  }
  lt(e, t) {
    return this.setLimit("max", e, !1, p.toString(t));
  }
  setLimit(e, t, r, s) {
    return new D({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: t,
          inclusive: r,
          message: p.toString(s)
        }
      ]
    });
  }
  _addCheck(e) {
    return new D({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !1,
      message: p.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !1,
      message: p.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !0,
      message: p.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !0,
      message: p.toString(e)
    });
  }
  multipleOf(e, t) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: p.toString(t)
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
D.create = (n) => {
  var e;
  return new D({
    checks: [],
    typeName: m.ZodBigInt,
    coerce: (e = n == null ? void 0 : n.coerce) !== null && e !== void 0 ? e : !1,
    ..._(n)
  });
};
class te extends v {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== h.boolean) {
      const r = this._getOrReturnCtx(e);
      return u(r, {
        code: c.invalid_type,
        expected: h.boolean,
        received: r.parsedType
      }), g;
    }
    return T(e.data);
  }
}
te.create = (n) => new te({
  typeName: m.ZodBoolean,
  coerce: (n == null ? void 0 : n.coerce) || !1,
  ..._(n)
});
class F extends v {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== h.date) {
      const a = this._getOrReturnCtx(e);
      return u(a, {
        code: c.invalid_type,
        expected: h.date,
        received: a.parsedType
      }), g;
    }
    if (isNaN(e.data.getTime())) {
      const a = this._getOrReturnCtx(e);
      return u(a, {
        code: c.invalid_date
      }), g;
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
      }), r.dirty()) : b.assertNever(a);
    return {
      status: r.value,
      value: new Date(e.data.getTime())
    };
  }
  _addCheck(e) {
    return new F({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  min(e, t) {
    return this._addCheck({
      kind: "min",
      value: e.getTime(),
      message: p.toString(t)
    });
  }
  max(e, t) {
    return this._addCheck({
      kind: "max",
      value: e.getTime(),
      message: p.toString(t)
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
F.create = (n) => new F({
  checks: [],
  coerce: (n == null ? void 0 : n.coerce) || !1,
  typeName: m.ZodDate,
  ..._(n)
});
class ye extends v {
  _parse(e) {
    if (this._getType(e) !== h.symbol) {
      const r = this._getOrReturnCtx(e);
      return u(r, {
        code: c.invalid_type,
        expected: h.symbol,
        received: r.parsedType
      }), g;
    }
    return T(e.data);
  }
}
ye.create = (n) => new ye({
  typeName: m.ZodSymbol,
  ..._(n)
});
class ne extends v {
  _parse(e) {
    if (this._getType(e) !== h.undefined) {
      const r = this._getOrReturnCtx(e);
      return u(r, {
        code: c.invalid_type,
        expected: h.undefined,
        received: r.parsedType
      }), g;
    }
    return T(e.data);
  }
}
ne.create = (n) => new ne({
  typeName: m.ZodUndefined,
  ..._(n)
});
class re extends v {
  _parse(e) {
    if (this._getType(e) !== h.null) {
      const r = this._getOrReturnCtx(e);
      return u(r, {
        code: c.invalid_type,
        expected: h.null,
        received: r.parsedType
      }), g;
    }
    return T(e.data);
  }
}
re.create = (n) => new re({
  typeName: m.ZodNull,
  ..._(n)
});
class Y extends v {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return T(e.data);
  }
}
Y.create = (n) => new Y({
  typeName: m.ZodAny,
  ..._(n)
});
class z extends v {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return T(e.data);
  }
}
z.create = (n) => new z({
  typeName: m.ZodUnknown,
  ..._(n)
});
class $ extends v {
  _parse(e) {
    const t = this._getOrReturnCtx(e);
    return u(t, {
      code: c.invalid_type,
      expected: h.never,
      received: t.parsedType
    }), g;
  }
}
$.create = (n) => new $({
  typeName: m.ZodNever,
  ..._(n)
});
class _e extends v {
  _parse(e) {
    if (this._getType(e) !== h.undefined) {
      const r = this._getOrReturnCtx(e);
      return u(r, {
        code: c.invalid_type,
        expected: h.void,
        received: r.parsedType
      }), g;
    }
    return T(e.data);
  }
}
_e.create = (n) => new _e({
  typeName: m.ZodVoid,
  ..._(n)
});
class I extends v {
  _parse(e) {
    const { ctx: t, status: r } = this._processInputParams(e), s = this._def;
    if (t.parsedType !== h.array)
      return u(t, {
        code: c.invalid_type,
        expected: h.array,
        received: t.parsedType
      }), g;
    if (s.exactLength !== null) {
      const o = t.data.length > s.exactLength.value, d = t.data.length < s.exactLength.value;
      (o || d) && (u(t, {
        code: o ? c.too_big : c.too_small,
        minimum: d ? s.exactLength.value : void 0,
        maximum: o ? s.exactLength.value : void 0,
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
      return Promise.all([...t.data].map((o, d) => s.type._parseAsync(new O(t, o, t.path, d)))).then((o) => k.mergeArray(r, o));
    const a = [...t.data].map((o, d) => s.type._parseSync(new O(t, o, t.path, d)));
    return k.mergeArray(r, a);
  }
  get element() {
    return this._def.type;
  }
  min(e, t) {
    return new I({
      ...this._def,
      minLength: { value: e, message: p.toString(t) }
    });
  }
  max(e, t) {
    return new I({
      ...this._def,
      maxLength: { value: e, message: p.toString(t) }
    });
  }
  length(e, t) {
    return new I({
      ...this._def,
      exactLength: { value: e, message: p.toString(t) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
I.create = (n, e) => new I({
  type: n,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: m.ZodArray,
  ..._(e)
});
function W(n) {
  if (n instanceof x) {
    const e = {};
    for (const t in n.shape) {
      const r = n.shape[t];
      e[t] = j.create(W(r));
    }
    return new x({
      ...n._def,
      shape: () => e
    });
  } else return n instanceof I ? new I({
    ...n._def,
    type: W(n.element)
  }) : n instanceof j ? j.create(W(n.unwrap())) : n instanceof L ? L.create(W(n.unwrap())) : n instanceof E ? E.create(n.items.map((e) => W(e))) : n;
}
class x extends v {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const e = this._def.shape(), t = b.objectKeys(e);
    return this._cached = { shape: e, keys: t };
  }
  _parse(e) {
    if (this._getType(e) !== h.object) {
      const l = this._getOrReturnCtx(e);
      return u(l, {
        code: c.invalid_type,
        expected: h.object,
        received: l.parsedType
      }), g;
    }
    const { status: r, ctx: s } = this._processInputParams(e), { shape: a, keys: o } = this._getCached(), d = [];
    if (!(this._def.catchall instanceof $ && this._def.unknownKeys === "strip"))
      for (const l in s.data)
        o.includes(l) || d.push(l);
    const f = [];
    for (const l of o) {
      const y = a[l], Z = s.data[l];
      f.push({
        key: { status: "valid", value: l },
        value: y._parse(new O(s, Z, s.path, l)),
        alwaysSet: l in s.data
      });
    }
    if (this._def.catchall instanceof $) {
      const l = this._def.unknownKeys;
      if (l === "passthrough")
        for (const y of d)
          f.push({
            key: { status: "valid", value: y },
            value: { status: "valid", value: s.data[y] }
          });
      else if (l === "strict")
        d.length > 0 && (u(s, {
          code: c.unrecognized_keys,
          keys: d
        }), r.dirty());
      else if (l !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const l = this._def.catchall;
      for (const y of d) {
        const Z = s.data[y];
        f.push({
          key: { status: "valid", value: y },
          value: l._parse(
            new O(s, Z, s.path, y)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: y in s.data
        });
      }
    }
    return s.common.async ? Promise.resolve().then(async () => {
      const l = [];
      for (const y of f) {
        const Z = await y.key, Ee = await y.value;
        l.push({
          key: Z,
          value: Ee,
          alwaysSet: y.alwaysSet
        });
      }
      return l;
    }).then((l) => k.mergeObjectSync(r, l)) : k.mergeObjectSync(r, f);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return p.errToObj, new x({
      ...this._def,
      unknownKeys: "strict",
      ...e !== void 0 ? {
        errorMap: (t, r) => {
          var s, a, o, d;
          const f = (o = (a = (s = this._def).errorMap) === null || a === void 0 ? void 0 : a.call(s, t, r).message) !== null && o !== void 0 ? o : r.defaultError;
          return t.code === "unrecognized_keys" ? {
            message: (d = p.errToObj(e).message) !== null && d !== void 0 ? d : f
          } : {
            message: f
          };
        }
      } : {}
    });
  }
  strip() {
    return new x({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new x({
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
    return new x({
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
    return new x({
      unknownKeys: e._def.unknownKeys,
      catchall: e._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...e._def.shape()
      }),
      typeName: m.ZodObject
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
    return new x({
      ...this._def,
      catchall: e
    });
  }
  pick(e) {
    const t = {};
    return b.objectKeys(e).forEach((r) => {
      e[r] && this.shape[r] && (t[r] = this.shape[r]);
    }), new x({
      ...this._def,
      shape: () => t
    });
  }
  omit(e) {
    const t = {};
    return b.objectKeys(this.shape).forEach((r) => {
      e[r] || (t[r] = this.shape[r]);
    }), new x({
      ...this._def,
      shape: () => t
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return W(this);
  }
  partial(e) {
    const t = {};
    return b.objectKeys(this.shape).forEach((r) => {
      const s = this.shape[r];
      e && !e[r] ? t[r] = s : t[r] = s.optional();
    }), new x({
      ...this._def,
      shape: () => t
    });
  }
  required(e) {
    const t = {};
    return b.objectKeys(this.shape).forEach((r) => {
      if (e && !e[r])
        t[r] = this.shape[r];
      else {
        let a = this.shape[r];
        for (; a instanceof j; )
          a = a._def.innerType;
        t[r] = a;
      }
    }), new x({
      ...this._def,
      shape: () => t
    });
  }
  keyof() {
    return Ue(b.objectKeys(this.shape));
  }
}
x.create = (n, e) => new x({
  shape: () => n,
  unknownKeys: "strip",
  catchall: $.create(),
  typeName: m.ZodObject,
  ..._(e)
});
x.strictCreate = (n, e) => new x({
  shape: () => n,
  unknownKeys: "strict",
  catchall: $.create(),
  typeName: m.ZodObject,
  ..._(e)
});
x.lazycreate = (n, e) => new x({
  shape: n,
  unknownKeys: "strip",
  catchall: $.create(),
  typeName: m.ZodObject,
  ..._(e)
});
class se extends v {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e), r = this._def.options;
    function s(a) {
      for (const d of a)
        if (d.result.status === "valid")
          return d.result;
      for (const d of a)
        if (d.result.status === "dirty")
          return t.common.issues.push(...d.ctx.common.issues), d.result;
      const o = a.map((d) => new S(d.ctx.common.issues));
      return u(t, {
        code: c.invalid_union,
        unionErrors: o
      }), g;
    }
    if (t.common.async)
      return Promise.all(r.map(async (a) => {
        const o = {
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
            parent: o
          }),
          ctx: o
        };
      })).then(s);
    {
      let a;
      const o = [];
      for (const f of r) {
        const l = {
          ...t,
          common: {
            ...t.common,
            issues: []
          },
          parent: null
        }, y = f._parseSync({
          data: t.data,
          path: t.path,
          parent: l
        });
        if (y.status === "valid")
          return y;
        y.status === "dirty" && !a && (a = { result: y, ctx: l }), l.common.issues.length && o.push(l.common.issues);
      }
      if (a)
        return t.common.issues.push(...a.ctx.common.issues), a.result;
      const d = o.map((f) => new S(f));
      return u(t, {
        code: c.invalid_union,
        unionErrors: d
      }), g;
    }
  }
  get options() {
    return this._def.options;
  }
}
se.create = (n, e) => new se({
  options: n,
  typeName: m.ZodUnion,
  ..._(e)
});
const R = (n) => n instanceof oe ? R(n.schema) : n instanceof N ? R(n.innerType()) : n instanceof de ? [n.value] : n instanceof V ? n.options : n instanceof ce ? b.objectValues(n.enum) : n instanceof ue ? R(n._def.innerType) : n instanceof ne ? [void 0] : n instanceof re ? [null] : n instanceof j ? [void 0, ...R(n.unwrap())] : n instanceof L ? [null, ...R(n.unwrap())] : n instanceof je || n instanceof fe ? R(n.unwrap()) : n instanceof le ? R(n._def.innerType) : [];
class xe extends v {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.object)
      return u(t, {
        code: c.invalid_type,
        expected: h.object,
        received: t.parsedType
      }), g;
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
    }), g);
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
      const o = R(a.shape[e]);
      if (!o.length)
        throw new Error(`A discriminator value for key \`${e}\` could not be extracted from all schema options`);
      for (const d of o) {
        if (s.has(d))
          throw new Error(`Discriminator property ${String(e)} has duplicate value ${String(d)}`);
        s.set(d, a);
      }
    }
    return new xe({
      typeName: m.ZodDiscriminatedUnion,
      discriminator: e,
      options: t,
      optionsMap: s,
      ..._(r)
    });
  }
}
function Ne(n, e) {
  const t = P(n), r = P(e);
  if (n === e)
    return { valid: !0, data: n };
  if (t === h.object && r === h.object) {
    const s = b.objectKeys(e), a = b.objectKeys(n).filter((d) => s.indexOf(d) !== -1), o = { ...n, ...e };
    for (const d of a) {
      const f = Ne(n[d], e[d]);
      if (!f.valid)
        return { valid: !1 };
      o[d] = f.data;
    }
    return { valid: !0, data: o };
  } else if (t === h.array && r === h.array) {
    if (n.length !== e.length)
      return { valid: !1 };
    const s = [];
    for (let a = 0; a < n.length; a++) {
      const o = n[a], d = e[a], f = Ne(o, d);
      if (!f.valid)
        return { valid: !1 };
      s.push(f.data);
    }
    return { valid: !0, data: s };
  } else return t === h.date && r === h.date && +n == +e ? { valid: !0, data: n } : { valid: !1 };
}
class ae extends v {
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e), s = (a, o) => {
      if (Ce(a) || Ce(o))
        return g;
      const d = Ne(a.value, o.value);
      return d.valid ? ((Ie(a) || Ie(o)) && t.dirty(), { status: t.value, value: d.data }) : (u(r, {
        code: c.invalid_intersection_types
      }), g);
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
    ]).then(([a, o]) => s(a, o)) : s(this._def.left._parseSync({
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
ae.create = (n, e, t) => new ae({
  left: n,
  right: e,
  typeName: m.ZodIntersection,
  ..._(t)
});
class E extends v {
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e);
    if (r.parsedType !== h.array)
      return u(r, {
        code: c.invalid_type,
        expected: h.array,
        received: r.parsedType
      }), g;
    if (r.data.length < this._def.items.length)
      return u(r, {
        code: c.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), g;
    !this._def.rest && r.data.length > this._def.items.length && (u(r, {
      code: c.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), t.dirty());
    const a = [...r.data].map((o, d) => {
      const f = this._def.items[d] || this._def.rest;
      return f ? f._parse(new O(r, o, r.path, d)) : null;
    }).filter((o) => !!o);
    return r.common.async ? Promise.all(a).then((o) => k.mergeArray(t, o)) : k.mergeArray(t, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new E({
      ...this._def,
      rest: e
    });
  }
}
E.create = (n, e) => {
  if (!Array.isArray(n))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new E({
    items: n,
    typeName: m.ZodTuple,
    rest: null,
    ..._(e)
  });
};
class ie extends v {
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
      }), g;
    const s = [], a = this._def.keyType, o = this._def.valueType;
    for (const d in r.data)
      s.push({
        key: a._parse(new O(r, d, r.path, d)),
        value: o._parse(new O(r, r.data[d], r.path, d)),
        alwaysSet: d in r.data
      });
    return r.common.async ? k.mergeObjectAsync(t, s) : k.mergeObjectSync(t, s);
  }
  get element() {
    return this._def.valueType;
  }
  static create(e, t, r) {
    return t instanceof v ? new ie({
      keyType: e,
      valueType: t,
      typeName: m.ZodRecord,
      ..._(r)
    }) : new ie({
      keyType: C.create(),
      valueType: e,
      typeName: m.ZodRecord,
      ..._(t)
    });
  }
}
class ve extends v {
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
      }), g;
    const s = this._def.keyType, a = this._def.valueType, o = [...r.data.entries()].map(([d, f], l) => ({
      key: s._parse(new O(r, d, r.path, [l, "key"])),
      value: a._parse(new O(r, f, r.path, [l, "value"]))
    }));
    if (r.common.async) {
      const d = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const f of o) {
          const l = await f.key, y = await f.value;
          if (l.status === "aborted" || y.status === "aborted")
            return g;
          (l.status === "dirty" || y.status === "dirty") && t.dirty(), d.set(l.value, y.value);
        }
        return { status: t.value, value: d };
      });
    } else {
      const d = /* @__PURE__ */ new Map();
      for (const f of o) {
        const l = f.key, y = f.value;
        if (l.status === "aborted" || y.status === "aborted")
          return g;
        (l.status === "dirty" || y.status === "dirty") && t.dirty(), d.set(l.value, y.value);
      }
      return { status: t.value, value: d };
    }
  }
}
ve.create = (n, e, t) => new ve({
  valueType: e,
  keyType: n,
  typeName: m.ZodMap,
  ..._(t)
});
class B extends v {
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e);
    if (r.parsedType !== h.set)
      return u(r, {
        code: c.invalid_type,
        expected: h.set,
        received: r.parsedType
      }), g;
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
    function o(f) {
      const l = /* @__PURE__ */ new Set();
      for (const y of f) {
        if (y.status === "aborted")
          return g;
        y.status === "dirty" && t.dirty(), l.add(y.value);
      }
      return { status: t.value, value: l };
    }
    const d = [...r.data.values()].map((f, l) => a._parse(new O(r, f, r.path, l)));
    return r.common.async ? Promise.all(d).then((f) => o(f)) : o(d);
  }
  min(e, t) {
    return new B({
      ...this._def,
      minSize: { value: e, message: p.toString(t) }
    });
  }
  max(e, t) {
    return new B({
      ...this._def,
      maxSize: { value: e, message: p.toString(t) }
    });
  }
  size(e, t) {
    return this.min(e, t).max(e, t);
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
B.create = (n, e) => new B({
  valueType: n,
  minSize: null,
  maxSize: null,
  typeName: m.ZodSet,
  ..._(e)
});
class J extends v {
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
      }), g;
    function r(d, f) {
      return me({
        data: d,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          pe(),
          H
        ].filter((l) => !!l),
        issueData: {
          code: c.invalid_arguments,
          argumentsError: f
        }
      });
    }
    function s(d, f) {
      return me({
        data: d,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          pe(),
          H
        ].filter((l) => !!l),
        issueData: {
          code: c.invalid_return_type,
          returnTypeError: f
        }
      });
    }
    const a = { errorMap: t.common.contextualErrorMap }, o = t.data;
    if (this._def.returns instanceof G) {
      const d = this;
      return T(async function(...f) {
        const l = new S([]), y = await d._def.args.parseAsync(f, a).catch((we) => {
          throw l.addIssue(r(f, we)), l;
        }), Z = await Reflect.apply(o, this, y);
        return await d._def.returns._def.type.parseAsync(Z, a).catch((we) => {
          throw l.addIssue(s(Z, we)), l;
        });
      });
    } else {
      const d = this;
      return T(function(...f) {
        const l = d._def.args.safeParse(f, a);
        if (!l.success)
          throw new S([r(f, l.error)]);
        const y = Reflect.apply(o, this, l.data), Z = d._def.returns.safeParse(y, a);
        if (!Z.success)
          throw new S([s(y, Z.error)]);
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
    return new J({
      ...this._def,
      args: E.create(e).rest(z.create())
    });
  }
  returns(e) {
    return new J({
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
    return new J({
      args: e || E.create([]).rest(z.create()),
      returns: t || z.create(),
      typeName: m.ZodFunction,
      ..._(r)
    });
  }
}
class oe extends v {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    return this._def.getter()._parse({ data: t.data, path: t.path, parent: t });
  }
}
oe.create = (n, e) => new oe({
  getter: n,
  typeName: m.ZodLazy,
  ..._(e)
});
class de extends v {
  _parse(e) {
    if (e.data !== this._def.value) {
      const t = this._getOrReturnCtx(e);
      return u(t, {
        received: t.data,
        code: c.invalid_literal,
        expected: this._def.value
      }), g;
    }
    return { status: "valid", value: e.data };
  }
  get value() {
    return this._def.value;
  }
}
de.create = (n, e) => new de({
  value: n,
  typeName: m.ZodLiteral,
  ..._(e)
});
function Ue(n, e) {
  return new V({
    values: n,
    typeName: m.ZodEnum,
    ..._(e)
  });
}
class V extends v {
  constructor() {
    super(...arguments), Q.set(this, void 0);
  }
  _parse(e) {
    if (typeof e.data != "string") {
      const t = this._getOrReturnCtx(e), r = this._def.values;
      return u(t, {
        expected: b.joinValues(r),
        received: t.parsedType,
        code: c.invalid_type
      }), g;
    }
    if (ge(this, Q) || De(this, Q, new Set(this._def.values)), !ge(this, Q).has(e.data)) {
      const t = this._getOrReturnCtx(e), r = this._def.values;
      return u(t, {
        received: t.data,
        code: c.invalid_enum_value,
        options: r
      }), g;
    }
    return T(e.data);
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
    return V.create(e, {
      ...this._def,
      ...t
    });
  }
  exclude(e, t = this._def) {
    return V.create(this.options.filter((r) => !e.includes(r)), {
      ...this._def,
      ...t
    });
  }
}
Q = /* @__PURE__ */ new WeakMap();
V.create = Ue;
class ce extends v {
  constructor() {
    super(...arguments), X.set(this, void 0);
  }
  _parse(e) {
    const t = b.getValidEnumValues(this._def.values), r = this._getOrReturnCtx(e);
    if (r.parsedType !== h.string && r.parsedType !== h.number) {
      const s = b.objectValues(t);
      return u(r, {
        expected: b.joinValues(s),
        received: r.parsedType,
        code: c.invalid_type
      }), g;
    }
    if (ge(this, X) || De(this, X, new Set(b.getValidEnumValues(this._def.values))), !ge(this, X).has(e.data)) {
      const s = b.objectValues(t);
      return u(r, {
        received: r.data,
        code: c.invalid_enum_value,
        options: s
      }), g;
    }
    return T(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
X = /* @__PURE__ */ new WeakMap();
ce.create = (n, e) => new ce({
  values: n,
  typeName: m.ZodNativeEnum,
  ..._(e)
});
class G extends v {
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
      }), g;
    const r = t.parsedType === h.promise ? t.data : Promise.resolve(t.data);
    return T(r.then((s) => this._def.type.parseAsync(s, {
      path: t.path,
      errorMap: t.common.contextualErrorMap
    })));
  }
}
G.create = (n, e) => new G({
  type: n,
  typeName: m.ZodPromise,
  ..._(e)
});
class N extends v {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === m.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e), s = this._def.effect || null, a = {
      addIssue: (o) => {
        u(r, o), o.fatal ? t.abort() : t.dirty();
      },
      get path() {
        return r.path;
      }
    };
    if (a.addIssue = a.addIssue.bind(a), s.type === "preprocess") {
      const o = s.transform(r.data, a);
      if (r.common.async)
        return Promise.resolve(o).then(async (d) => {
          if (t.value === "aborted")
            return g;
          const f = await this._def.schema._parseAsync({
            data: d,
            path: r.path,
            parent: r
          });
          return f.status === "aborted" ? g : f.status === "dirty" || t.value === "dirty" ? q(f.value) : f;
        });
      {
        if (t.value === "aborted")
          return g;
        const d = this._def.schema._parseSync({
          data: o,
          path: r.path,
          parent: r
        });
        return d.status === "aborted" ? g : d.status === "dirty" || t.value === "dirty" ? q(d.value) : d;
      }
    }
    if (s.type === "refinement") {
      const o = (d) => {
        const f = s.refinement(d, a);
        if (r.common.async)
          return Promise.resolve(f);
        if (f instanceof Promise)
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return d;
      };
      if (r.common.async === !1) {
        const d = this._def.schema._parseSync({
          data: r.data,
          path: r.path,
          parent: r
        });
        return d.status === "aborted" ? g : (d.status === "dirty" && t.dirty(), o(d.value), { status: t.value, value: d.value });
      } else
        return this._def.schema._parseAsync({ data: r.data, path: r.path, parent: r }).then((d) => d.status === "aborted" ? g : (d.status === "dirty" && t.dirty(), o(d.value).then(() => ({ status: t.value, value: d.value }))));
    }
    if (s.type === "transform")
      if (r.common.async === !1) {
        const o = this._def.schema._parseSync({
          data: r.data,
          path: r.path,
          parent: r
        });
        if (!U(o))
          return o;
        const d = s.transform(o.value, a);
        if (d instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: t.value, value: d };
      } else
        return this._def.schema._parseAsync({ data: r.data, path: r.path, parent: r }).then((o) => U(o) ? Promise.resolve(s.transform(o.value, a)).then((d) => ({ status: t.value, value: d })) : o);
    b.assertNever(s);
  }
}
N.create = (n, e, t) => new N({
  schema: n,
  typeName: m.ZodEffects,
  effect: e,
  ..._(t)
});
N.createWithPreprocess = (n, e, t) => new N({
  schema: e,
  effect: { type: "preprocess", transform: n },
  typeName: m.ZodEffects,
  ..._(t)
});
class j extends v {
  _parse(e) {
    return this._getType(e) === h.undefined ? T(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
j.create = (n, e) => new j({
  innerType: n,
  typeName: m.ZodOptional,
  ..._(e)
});
class L extends v {
  _parse(e) {
    return this._getType(e) === h.null ? T(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
L.create = (n, e) => new L({
  innerType: n,
  typeName: m.ZodNullable,
  ..._(e)
});
class ue extends v {
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
ue.create = (n, e) => new ue({
  innerType: n,
  typeName: m.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ..._(e)
});
class le extends v {
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
    return ee(s) ? s.then((a) => ({
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new S(r.common.issues);
        },
        input: r.data
      })
    })) : {
      status: "valid",
      value: s.status === "valid" ? s.value : this._def.catchValue({
        get error() {
          return new S(r.common.issues);
        },
        input: r.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
le.create = (n, e) => new le({
  innerType: n,
  typeName: m.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ..._(e)
});
class be extends v {
  _parse(e) {
    if (this._getType(e) !== h.nan) {
      const r = this._getOrReturnCtx(e);
      return u(r, {
        code: c.invalid_type,
        expected: h.nan,
        received: r.parsedType
      }), g;
    }
    return { status: "valid", value: e.data };
  }
}
be.create = (n) => new be({
  typeName: m.ZodNaN,
  ..._(n)
});
const bt = Symbol("zod_brand");
class je extends v {
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
class he extends v {
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e);
    if (r.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: r.data,
          path: r.path,
          parent: r
        });
        return a.status === "aborted" ? g : a.status === "dirty" ? (t.dirty(), q(a.value)) : this._def.out._parseAsync({
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
      return s.status === "aborted" ? g : s.status === "dirty" ? (t.dirty(), {
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
    return new he({
      in: e,
      out: t,
      typeName: m.ZodPipeline
    });
  }
}
class fe extends v {
  _parse(e) {
    const t = this._def.innerType._parse(e), r = (s) => (U(s) && (s.value = Object.freeze(s.value)), s);
    return ee(t) ? t.then((s) => r(s)) : r(t);
  }
  unwrap() {
    return this._def.innerType;
  }
}
fe.create = (n, e) => new fe({
  innerType: n,
  typeName: m.ZodReadonly,
  ..._(e)
});
function Fe(n, e = {}, t) {
  return n ? Y.create().superRefine((r, s) => {
    var a, o;
    if (!n(r)) {
      const d = typeof e == "function" ? e(r) : typeof e == "string" ? { message: e } : e, f = (o = (a = d.fatal) !== null && a !== void 0 ? a : t) !== null && o !== void 0 ? o : !0, l = typeof d == "string" ? { message: d } : d;
      s.addIssue({ code: "custom", ...l, fatal: f });
    }
  }) : Y.create();
}
const xt = {
  object: x.lazycreate
};
var m;
(function(n) {
  n.ZodString = "ZodString", n.ZodNumber = "ZodNumber", n.ZodNaN = "ZodNaN", n.ZodBigInt = "ZodBigInt", n.ZodBoolean = "ZodBoolean", n.ZodDate = "ZodDate", n.ZodSymbol = "ZodSymbol", n.ZodUndefined = "ZodUndefined", n.ZodNull = "ZodNull", n.ZodAny = "ZodAny", n.ZodUnknown = "ZodUnknown", n.ZodNever = "ZodNever", n.ZodVoid = "ZodVoid", n.ZodArray = "ZodArray", n.ZodObject = "ZodObject", n.ZodUnion = "ZodUnion", n.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", n.ZodIntersection = "ZodIntersection", n.ZodTuple = "ZodTuple", n.ZodRecord = "ZodRecord", n.ZodMap = "ZodMap", n.ZodSet = "ZodSet", n.ZodFunction = "ZodFunction", n.ZodLazy = "ZodLazy", n.ZodLiteral = "ZodLiteral", n.ZodEnum = "ZodEnum", n.ZodEffects = "ZodEffects", n.ZodNativeEnum = "ZodNativeEnum", n.ZodOptional = "ZodOptional", n.ZodNullable = "ZodNullable", n.ZodDefault = "ZodDefault", n.ZodCatch = "ZodCatch", n.ZodPromise = "ZodPromise", n.ZodBranded = "ZodBranded", n.ZodPipeline = "ZodPipeline", n.ZodReadonly = "ZodReadonly";
})(m || (m = {}));
const kt = (n, e = {
  message: `Input not instance of ${n.name}`
}) => Fe((t) => t instanceof n, e), Be = C.create, We = M.create, wt = be.create, Tt = D.create, qe = te.create, St = F.create, Zt = ye.create, Ct = ne.create, It = re.create, Nt = Y.create, At = z.create, jt = $.create, Ot = _e.create, Et = I.create, Rt = x.create, Pt = x.strictCreate, $t = se.create, Mt = xe.create, Dt = ae.create, Vt = E.create, Lt = ie.create, zt = ve.create, Ut = B.create, Ft = J.create, Bt = oe.create, Wt = de.create, qt = V.create, Jt = ce.create, Ht = G.create, Pe = N.create, Yt = j.create, Gt = L.create, Qt = N.createWithPreprocess, Xt = he.create, Kt = () => Be().optional(), en = () => We().optional(), tn = () => qe().optional(), nn = {
  string: (n) => C.create({ ...n, coerce: !0 }),
  number: (n) => M.create({ ...n, coerce: !0 }),
  boolean: (n) => te.create({
    ...n,
    coerce: !0
  }),
  bigint: (n) => D.create({ ...n, coerce: !0 }),
  date: (n) => F.create({ ...n, coerce: !0 })
}, rn = g;
var i = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  defaultErrorMap: H,
  setErrorMap: Qe,
  getErrorMap: pe,
  makeIssue: me,
  EMPTY_PATH: Xe,
  addIssueToContext: u,
  ParseStatus: k,
  INVALID: g,
  DIRTY: q,
  OK: T,
  isAborted: Ce,
  isDirty: Ie,
  isValid: U,
  isAsync: ee,
  get util() {
    return b;
  },
  get objectUtil() {
    return Ze;
  },
  ZodParsedType: h,
  getParsedType: P,
  ZodType: v,
  datetimeRegex: ze,
  ZodString: C,
  ZodNumber: M,
  ZodBigInt: D,
  ZodBoolean: te,
  ZodDate: F,
  ZodSymbol: ye,
  ZodUndefined: ne,
  ZodNull: re,
  ZodAny: Y,
  ZodUnknown: z,
  ZodNever: $,
  ZodVoid: _e,
  ZodArray: I,
  ZodObject: x,
  ZodUnion: se,
  ZodDiscriminatedUnion: xe,
  ZodIntersection: ae,
  ZodTuple: E,
  ZodRecord: ie,
  ZodMap: ve,
  ZodSet: B,
  ZodFunction: J,
  ZodLazy: oe,
  ZodLiteral: de,
  ZodEnum: V,
  ZodNativeEnum: ce,
  ZodPromise: G,
  ZodEffects: N,
  ZodTransformer: N,
  ZodOptional: j,
  ZodNullable: L,
  ZodDefault: ue,
  ZodCatch: le,
  ZodNaN: be,
  BRAND: bt,
  ZodBranded: je,
  ZodPipeline: he,
  ZodReadonly: fe,
  custom: Fe,
  Schema: v,
  ZodSchema: v,
  late: xt,
  get ZodFirstPartyTypeKind() {
    return m;
  },
  coerce: nn,
  any: Nt,
  array: Et,
  bigint: Tt,
  boolean: qe,
  date: St,
  discriminatedUnion: Mt,
  effect: Pe,
  enum: qt,
  function: Ft,
  instanceof: kt,
  intersection: Dt,
  lazy: Bt,
  literal: Wt,
  map: zt,
  nan: wt,
  nativeEnum: Jt,
  never: jt,
  null: It,
  nullable: Gt,
  number: We,
  object: Rt,
  oboolean: tn,
  onumber: en,
  optional: Yt,
  ostring: Kt,
  pipeline: Xt,
  preprocess: Qt,
  promise: Ht,
  record: Lt,
  set: Ut,
  strictObject: Pt,
  string: Be,
  symbol: Zt,
  transformer: Pe,
  tuple: Vt,
  undefined: Ct,
  union: $t,
  unknown: At,
  void: Ot,
  NEVER: rn,
  ZodIssueCode: c,
  quotelessJson: Ge,
  ZodError: S
});
const sn = i.object({
  country: i.string(),
  city: i.string(),
  street: i.string(),
  streetNumber: i.string(),
  floor: i.string(),
  apartmentEnterNumber: i.string(),
  apartmentNumber: i.string()
}), A = i.enum(["True", "False"]), cn = i.string().min(1), un = i.string().regex(/^\d+$/, "Must be a numeric string"), K = i.object({
  lang: i.enum(["he"]),
  value: i.string().min(1)
}), ln = i.array(K), Je = i.object({
  id: i.string().min(1),
  companyId: i.string().min(1),
  storeId: i.string().min(1),
  parentId: i.string().nullish(),
  tag: i.string().min(1),
  locales: i.array(K),
  depth: i.number()
}), Oe = Je.extend({
  children: i.lazy(() => Oe.array())
}), fn = Je.extend({
  index: i.number(),
  depth: i.number(),
  collapsed: i.boolean().optional(),
  children: i.array(Oe)
}), Se = i.string(), ke = i.object({
  type: i.literal("Product"),
  storeId: Se,
  companyId: Se,
  id: i.string(),
  objectID: i.string(),
  sku: i.string().min(1),
  name: i.array(K),
  description: i.array(K),
  isPublished: i.boolean(),
  vat: i.boolean(),
  priceType: i.object({
    type: i.enum(["unit", "kg", "gram", "liter", "ml"]),
    value: i.number()
  }),
  price: i.number().positive(),
  purchasePrice: i.number().optional(),
  profitPercentage: i.number().optional(),
  currency: i.literal("ILS"),
  discount: i.object({
    type: i.enum(["number", "percent", "none"]),
    value: i.number()
  }),
  weight: i.object({
    value: i.number(),
    unit: i.enum(["kg", "gram", "none"])
  }),
  volume: i.object({
    value: i.number(),
    unit: i.enum(["liter", "ml", "none"])
  }),
  images: i.array(i.object({ url: i.string().url(), id: i.string() })),
  manufacturer: Se,
  brand: i.string(),
  importer: i.string(),
  supplier: i.string(),
  ingredients: i.array(K),
  created_at: i.number(),
  updated_at: i.number(),
  categoryList: i.array(Oe),
  // generated
  categories: i.object({
    lvl0: i.array(i.string()),
    lvl1: i.array(i.string()),
    lvl2: i.array(i.string()),
    lvl3: i.array(i.string()),
    lvl4: i.array(i.string())
  }),
  categoryNames: i.array(i.string())
}), hn = ke.omit({
  id: !0,
  categories: !0,
  images: !0
}).extend({
  image: i.instanceof(File).optional()
}), pn = ke.extend({
  image: i.instanceof(File).optional()
}), mn = i.object({
  type: i.literal("Cart"),
  id: i.string().uuid(),
  companyId: i.string().uuid(),
  storeId: i.string().uuid(),
  userId: i.string().uuid(),
  status: i.enum(["active", "draft", "completed"]),
  items: i.array(
    i.object({
      product: ke,
      amount: i.number().int().positive({ message: "Quantity must be a positive integer." })
    })
  )
}), gn = i.object({
  id: i.string(),
  name: i.string(),
  websiteDomains: i.array(i.string()),
  owner: i.object({
    name: i.string(),
    emails: i.object({
      mainEmail: i.string()
    })
  })
}), yn = i.object({
  type: i.literal("FavoriteProduct"),
  id: i.string().uuid(),
  companyId: i.string().uuid(),
  storeId: i.string().uuid(),
  userId: i.string().uuid(),
  productId: i.string().uuid()
}), an = i.object({
  type: i.literal("Profile"),
  id: i.string(),
  companyId: i.string(),
  storeId: i.string(),
  tenantId: i.string(),
  clientType: i.enum(["user", "company"]),
  displayName: i.string().min(1),
  email: i.string().email(),
  phoneNumber: i.object({
    code: i.string(),
    number: i.string()
  }),
  address: sn,
  isAnonymous: i.boolean(),
  createdDate: i.number(),
  lastActivityDate: i.number()
});
function _n() {
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
const vn = i.object({
  type: i.literal("Order"),
  id: i.string(),
  companyId: i.string(),
  storeId: i.string(),
  userId: i.string(),
  status: i.enum([
    "pending",
    "processing",
    "in_delivery",
    "delivered",
    "canceled",
    "completed",
    "refunded"
  ]),
  paymentStatus: i.enum(["pending", "completed", "failed", "refunded"]),
  //todo check if hyp support partial refund
  cart: i.object({
    id: i.string(),
    items: i.array(i.object({ product: ke, amount: i.number() })),
    cartTotal: i.number(),
    cartDiscount: i.number(),
    cartVat: i.number()
  }),
  date: i.number(),
  deliveryDate: i.number().optional(),
  client: an
}), w = i.string().min(1), Ae = i.string().regex(/^\d+$/, "Must be a numeric string"), He = i.object({
  Amount: w,
  Order: w.optional()
  // order id generated by store
}), bn = He.extend({
  Id: w,
  // transaction Id in Hypay
  ACode: Ae,
  // confirmation code from credit card company
  CCode: i.string(),
  // todo,
  Sign: i.string(),
  //
  Fild1: i.string(),
  // client full name
  Fild2: i.string(),
  // client email
  Fild3: i.string(),
  // client phone number
  // if more data equal to True
  Bank: i.string().optional(),
  TransType: i.string().optional(),
  Payments: i.string().optional(),
  // Number of payments charged
  UserId: i.string().optional(),
  Brand: i.string().optional(),
  Issuer: i.string().optional(),
  L4digit: i.string().optional(),
  street: i.string().optional(),
  city: i.string().optional(),
  zip: i.string().optional(),
  cell: i.string().optional(),
  Coin: i.string().optional(),
  Tmonth: i.string().optional(),
  // MM format
  Tyear: i.string().optional(),
  // YYYY format
  Hesh: i.string().optional(),
  // invoice number (if invoice module is not active Hesh would get 0)
  UID: i.string().optional(),
  // UID unique value receive from response after successful transaction from request with action pay/soft
  spType: i.string().optional(),
  bincard: i.string().optional()
}), xn = He.extend({
  Masof: w,
  // store masof number
  PassP: w,
  // store masof password,
  KEY: w,
  // hyp api key
  action: i.literal("APISign"),
  What: i.literal("SIGN"),
  Info: w,
  // text that will be displayed in transaction, report and the management system.
  Sign: A,
  // Sign on sent parameters in answer
  UTF8: A,
  // request is utf8
  UTF8out: A,
  // response is utf8
  Tash: Ae,
  // Max number of payments that can be selected by the customer
  FixTash: A.optional(),
  sendemail: A.optional(),
  MoreData: A.optional(),
  // extra data in response
  J5: i.literal("True").optional(),
  // tashType: - Payment type optional NOT_IN_USE
  // EzCount Invoice parameters - Pay Protocol
  SendHesh: A.optional(),
  // send invoice in email
  heshDesc: A.optional(),
  // [0~Item 1~1~8][0~Item 2~2~1]
  Pritim: A.optional(),
  // The invoice description contains items
  // client data
  UserId: Ae,
  ClientName: w,
  // first name
  ClientLName: w.optional(),
  // last name
  street: w.optional(),
  city: w.optional(),
  zip: w.optional(),
  phone: w.optional(),
  cell: w.optional(),
  email: w.optional()
});
i.object({
  id: i.string(),
  companyId: i.string(),
  name: i.string(),
  urls: i.array(i.string()),
  logoUrl: i.string(),
  tenantId: i.string(),
  // firebase auth tenantId
  hypData: i.object({
    masof: i.string().min(1),
    password: i.string().min(1),
    isJ5: A
  })
});
const kn = i.object({
  storeEmail: i.string().email()
}), on = {
  products: "products"
}, Ye = {
  getPath: ({
    companyId: n,
    storeId: e,
    collectionName: t
  }) => `${n}/${e}/${t}`,
  getProductsPath: ({ companyId: n, storeId: e }) => Ye.getPath({ companyId: n, storeId: e, collectionName: on.products })
}, wn = {
  firestore: Ye
}, $e = "https://pay.hyp.co.il/p/";
function dn(n) {
  return Object.keys(n).map((e) => `${encodeURIComponent(e)}=${encodeURIComponent(n[e])}`).join("&");
}
const Tn = {
  async createPaymentLink(n) {
    try {
      const e = dn(n), t = `${$e}?${e}`;
      console.log("createPaymentLink url", t);
      const s = await (await fetch(t)).text();
      return { success: !0, paymentLink: `${$e}?${s}` };
    } catch (e) {
      return console.log(e), { success: !1, errMessage: e.message };
    }
  }
};
export {
  sn as AddressSchema,
  Je as BaseCategorySchema,
  mn as CartSchema,
  Oe as CategorySchema,
  gn as CompanySchema,
  pn as EditProductSchema,
  yn as FavoriteProductSchema,
  wn as FirebaseAPI,
  xn as HypPaymentLinkRequestSchema,
  K as LocaleSchema,
  ln as LocaleValueSchema,
  hn as NewProductSchema,
  vn as OrderSchema,
  He as PayProtocolGeneralSchema,
  bn as PayProtocolResponseSchema,
  ke as ProductSchema,
  an as ProfileSchema,
  kn as StorePrivateSchema,
  fn as TFlattenCategorySchema,
  _n as createEmptyProfile,
  A as hypBooleanSchema,
  Tn as hypPaymentService,
  cn as notEmptyTextSchema,
  un as numericTextSchema
};
//# sourceMappingURL=core.es.js.map
