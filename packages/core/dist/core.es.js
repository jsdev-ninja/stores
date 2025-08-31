var nt = Object.defineProperty;
var st = (r, e, t) => e in r ? nt(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var Pe = (r, e, t) => st(r, typeof e != "symbol" ? e + "" : e, t);
var x;
(function(r) {
  r.assertEqual = (s) => s;
  function e(s) {
  }
  r.assertIs = e;
  function t(s) {
    throw new Error();
  }
  r.assertNever = t, r.arrayToEnum = (s) => {
    const a = {};
    for (const o of s)
      a[o] = o;
    return a;
  }, r.getValidEnumValues = (s) => {
    const a = r.objectKeys(s).filter((c) => typeof s[s[c]] != "number"), o = {};
    for (const c of a)
      o[c] = s[c];
    return r.objectValues(o);
  }, r.objectValues = (s) => r.objectKeys(s).map(function(a) {
    return s[a];
  }), r.objectKeys = typeof Object.keys == "function" ? (s) => Object.keys(s) : (s) => {
    const a = [];
    for (const o in s)
      Object.prototype.hasOwnProperty.call(s, o) && a.push(o);
    return a;
  }, r.find = (s, a) => {
    for (const o of s)
      if (a(o))
        return o;
  }, r.isInteger = typeof Number.isInteger == "function" ? (s) => Number.isInteger(s) : (s) => typeof s == "number" && isFinite(s) && Math.floor(s) === s;
  function n(s, a = " | ") {
    return s.map((o) => typeof o == "string" ? `'${o}'` : o).join(a);
  }
  r.joinValues = n, r.jsonStringifyReplacer = (s, a) => typeof a == "bigint" ? a.toString() : a;
})(x || (x = {}));
var Ne;
(function(r) {
  r.mergeShapes = (e, t) => ({
    ...e,
    ...t
    // second overwrites first
  });
})(Ne || (Ne = {}));
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
]), R = (r) => {
  switch (typeof r) {
    case "undefined":
      return h.undefined;
    case "string":
      return h.string;
    case "number":
      return isNaN(r) ? h.nan : h.number;
    case "boolean":
      return h.boolean;
    case "function":
      return h.function;
    case "bigint":
      return h.bigint;
    case "symbol":
      return h.symbol;
    case "object":
      return Array.isArray(r) ? h.array : r === null ? h.null : r.then && typeof r.then == "function" && r.catch && typeof r.catch == "function" ? h.promise : typeof Map < "u" && r instanceof Map ? h.map : typeof Set < "u" && r instanceof Set ? h.set : typeof Date < "u" && r instanceof Date ? h.date : h.object;
    default:
      return h.unknown;
  }
}, u = x.arrayToEnum([
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
]), at = (r) => JSON.stringify(r, null, 2).replace(/"([^"]+)":/g, "$1:");
class C extends Error {
  get errors() {
    return this.issues;
  }
  constructor(e) {
    super(), this.issues = [], this.addIssue = (n) => {
      this.issues = [...this.issues, n];
    }, this.addIssues = (n = []) => {
      this.issues = [...this.issues, ...n];
    };
    const t = new.target.prototype;
    Object.setPrototypeOf ? Object.setPrototypeOf(this, t) : this.__proto__ = t, this.name = "ZodError", this.issues = e;
  }
  format(e) {
    const t = e || function(a) {
      return a.message;
    }, n = { _errors: [] }, s = (a) => {
      for (const o of a.issues)
        if (o.code === "invalid_union")
          o.unionErrors.map(s);
        else if (o.code === "invalid_return_type")
          s(o.returnTypeError);
        else if (o.code === "invalid_arguments")
          s(o.argumentsError);
        else if (o.path.length === 0)
          n._errors.push(t(o));
        else {
          let c = n, d = 0;
          for (; d < o.path.length; ) {
            const l = o.path[d];
            d === o.path.length - 1 ? (c[l] = c[l] || { _errors: [] }, c[l]._errors.push(t(o))) : c[l] = c[l] || { _errors: [] }, c = c[l], d++;
          }
        }
    };
    return s(this), n;
  }
  static assert(e) {
    if (!(e instanceof C))
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
    const t = {}, n = [];
    for (const s of this.issues)
      s.path.length > 0 ? (t[s.path[0]] = t[s.path[0]] || [], t[s.path[0]].push(e(s))) : n.push(e(s));
    return { formErrors: n, fieldErrors: t };
  }
  get formErrors() {
    return this.flatten();
  }
}
C.create = (r) => new C(r);
const X = (r, e) => {
  let t;
  switch (r.code) {
    case u.invalid_type:
      r.received === h.undefined ? t = "Required" : t = `Expected ${r.expected}, received ${r.received}`;
      break;
    case u.invalid_literal:
      t = `Invalid literal value, expected ${JSON.stringify(r.expected, x.jsonStringifyReplacer)}`;
      break;
    case u.unrecognized_keys:
      t = `Unrecognized key(s) in object: ${x.joinValues(r.keys, ", ")}`;
      break;
    case u.invalid_union:
      t = "Invalid input";
      break;
    case u.invalid_union_discriminator:
      t = `Invalid discriminator value. Expected ${x.joinValues(r.options)}`;
      break;
    case u.invalid_enum_value:
      t = `Invalid enum value. Expected ${x.joinValues(r.options)}, received '${r.received}'`;
      break;
    case u.invalid_arguments:
      t = "Invalid function arguments";
      break;
    case u.invalid_return_type:
      t = "Invalid function return type";
      break;
    case u.invalid_date:
      t = "Invalid date";
      break;
    case u.invalid_string:
      typeof r.validation == "object" ? "includes" in r.validation ? (t = `Invalid input: must include "${r.validation.includes}"`, typeof r.validation.position == "number" && (t = `${t} at one or more positions greater than or equal to ${r.validation.position}`)) : "startsWith" in r.validation ? t = `Invalid input: must start with "${r.validation.startsWith}"` : "endsWith" in r.validation ? t = `Invalid input: must end with "${r.validation.endsWith}"` : x.assertNever(r.validation) : r.validation !== "regex" ? t = `Invalid ${r.validation}` : t = "Invalid";
      break;
    case u.too_small:
      r.type === "array" ? t = `Array must contain ${r.exact ? "exactly" : r.inclusive ? "at least" : "more than"} ${r.minimum} element(s)` : r.type === "string" ? t = `String must contain ${r.exact ? "exactly" : r.inclusive ? "at least" : "over"} ${r.minimum} character(s)` : r.type === "number" ? t = `Number must be ${r.exact ? "exactly equal to " : r.inclusive ? "greater than or equal to " : "greater than "}${r.minimum}` : r.type === "date" ? t = `Date must be ${r.exact ? "exactly equal to " : r.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(r.minimum))}` : t = "Invalid input";
      break;
    case u.too_big:
      r.type === "array" ? t = `Array must contain ${r.exact ? "exactly" : r.inclusive ? "at most" : "less than"} ${r.maximum} element(s)` : r.type === "string" ? t = `String must contain ${r.exact ? "exactly" : r.inclusive ? "at most" : "under"} ${r.maximum} character(s)` : r.type === "number" ? t = `Number must be ${r.exact ? "exactly" : r.inclusive ? "less than or equal to" : "less than"} ${r.maximum}` : r.type === "bigint" ? t = `BigInt must be ${r.exact ? "exactly" : r.inclusive ? "less than or equal to" : "less than"} ${r.maximum}` : r.type === "date" ? t = `Date must be ${r.exact ? "exactly" : r.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(r.maximum))}` : t = "Invalid input";
      break;
    case u.custom:
      t = "Invalid input";
      break;
    case u.invalid_intersection_types:
      t = "Intersection results could not be merged";
      break;
    case u.not_multiple_of:
      t = `Number must be a multiple of ${r.multipleOf}`;
      break;
    case u.not_finite:
      t = "Number must be finite";
      break;
    default:
      t = e.defaultError, x.assertNever(r);
  }
  return { message: t };
};
let Ve = X;
function it(r) {
  Ve = r;
}
function ge() {
  return Ve;
}
const ve = (r) => {
  const { data: e, path: t, errorMaps: n, issueData: s } = r, a = [...t, ...s.path || []], o = {
    ...s,
    path: a
  };
  if (s.message !== void 0)
    return {
      ...s,
      path: a,
      message: s.message
    };
  let c = "";
  const d = n.filter((l) => !!l).slice().reverse();
  for (const l of d)
    c = l(o, { data: e, defaultError: c }).message;
  return {
    ...s,
    path: a,
    message: c
  };
}, ot = [];
function f(r, e) {
  const t = ge(), n = ve({
    issueData: e,
    data: r.data,
    path: r.path,
    errorMaps: [
      r.common.contextualErrorMap,
      // contextual error map is first priority
      r.schemaErrorMap,
      // then schema-bound map if available
      t,
      // then global override map
      t === X ? void 0 : X
      // then global default map
    ].filter((s) => !!s)
  });
  r.common.issues.push(n);
}
class T {
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
    const n = [];
    for (const s of t) {
      if (s.status === "aborted")
        return g;
      s.status === "dirty" && e.dirty(), n.push(s.value);
    }
    return { status: e.value, value: n };
  }
  static async mergeObjectAsync(e, t) {
    const n = [];
    for (const s of t) {
      const a = await s.key, o = await s.value;
      n.push({
        key: a,
        value: o
      });
    }
    return T.mergeObjectSync(e, n);
  }
  static mergeObjectSync(e, t) {
    const n = {};
    for (const s of t) {
      const { key: a, value: o } = s;
      if (a.status === "aborted" || o.status === "aborted")
        return g;
      a.status === "dirty" && e.dirty(), o.status === "dirty" && e.dirty(), a.value !== "__proto__" && (typeof o.value < "u" || s.alwaysSet) && (n[a.value] = o.value);
    }
    return { status: e.value, value: n };
  }
}
const g = Object.freeze({
  status: "aborted"
}), Y = (r) => ({ status: "dirty", value: r }), I = (r) => ({ status: "valid", value: r }), Ze = (r) => r.status === "aborted", Oe = (r) => r.status === "dirty", B = (r) => r.status === "valid", ne = (r) => typeof Promise < "u" && r instanceof Promise;
function _e(r, e, t, n) {
  if (typeof e == "function" ? r !== e || !0 : !e.has(r)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return e.get(r);
}
function Fe(r, e, t, n, s) {
  if (typeof e == "function" ? r !== e || !0 : !e.has(r)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return e.set(r, t), t;
}
var p;
(function(r) {
  r.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, r.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(p || (p = {}));
var ee, te;
class E {
  constructor(e, t, n, s) {
    this._cachedPath = [], this.parent = e, this.data = t, this._path = n, this._key = s;
  }
  get path() {
    return this._cachedPath.length || (this._key instanceof Array ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Re = (r, e) => {
  if (B(e))
    return { success: !0, data: e.value };
  if (!r.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const t = new C(r.common.issues);
      return this._error = t, this._error;
    }
  };
};
function v(r) {
  if (!r)
    return {};
  const { errorMap: e, invalid_type_error: t, required_error: n, description: s } = r;
  if (e && (t || n))
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  return e ? { errorMap: e, description: s } : { errorMap: (o, c) => {
    var d, l;
    const { message: m } = r;
    return o.code === "invalid_enum_value" ? { message: m ?? c.defaultError } : typeof c.data > "u" ? { message: (d = m ?? n) !== null && d !== void 0 ? d : c.defaultError } : o.code !== "invalid_type" ? { message: c.defaultError } : { message: (l = m ?? t) !== null && l !== void 0 ? l : c.defaultError };
  }, description: s };
}
class _ {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return R(e.data);
  }
  _getOrReturnCtx(e, t) {
    return t || {
      common: e.parent.common,
      data: e.data,
      parsedType: R(e.data),
      schemaErrorMap: this._def.errorMap,
      path: e.path,
      parent: e.parent
    };
  }
  _processInputParams(e) {
    return {
      status: new T(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: R(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent
      }
    };
  }
  _parseSync(e) {
    const t = this._parse(e);
    if (ne(t))
      throw new Error("Synchronous parse encountered promise.");
    return t;
  }
  _parseAsync(e) {
    const t = this._parse(e);
    return Promise.resolve(t);
  }
  parse(e, t) {
    const n = this.safeParse(e, t);
    if (n.success)
      return n.data;
    throw n.error;
  }
  safeParse(e, t) {
    var n;
    const s = {
      common: {
        issues: [],
        async: (n = t == null ? void 0 : t.async) !== null && n !== void 0 ? n : !1,
        contextualErrorMap: t == null ? void 0 : t.errorMap
      },
      path: (t == null ? void 0 : t.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: R(e)
    }, a = this._parseSync({ data: e, path: s.path, parent: s });
    return Re(s, a);
  }
  "~validate"(e) {
    var t, n;
    const s = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: R(e)
    };
    if (!this["~standard"].async)
      try {
        const a = this._parseSync({ data: e, path: [], parent: s });
        return B(a) ? {
          value: a.value
        } : {
          issues: s.common.issues
        };
      } catch (a) {
        !((n = (t = a == null ? void 0 : a.message) === null || t === void 0 ? void 0 : t.toLowerCase()) === null || n === void 0) && n.includes("encountered") && (this["~standard"].async = !0), s.common = {
          issues: [],
          async: !0
        };
      }
    return this._parseAsync({ data: e, path: [], parent: s }).then((a) => B(a) ? {
      value: a.value
    } : {
      issues: s.common.issues
    });
  }
  async parseAsync(e, t) {
    const n = await this.safeParseAsync(e, t);
    if (n.success)
      return n.data;
    throw n.error;
  }
  async safeParseAsync(e, t) {
    const n = {
      common: {
        issues: [],
        contextualErrorMap: t == null ? void 0 : t.errorMap,
        async: !0
      },
      path: (t == null ? void 0 : t.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: R(e)
    }, s = this._parse({ data: e, path: n.path, parent: n }), a = await (ne(s) ? s : Promise.resolve(s));
    return Re(n, a);
  }
  refine(e, t) {
    const n = (s) => typeof t == "string" || typeof t > "u" ? { message: t } : typeof t == "function" ? t(s) : t;
    return this._refinement((s, a) => {
      const o = e(s), c = () => a.addIssue({
        code: u.custom,
        ...n(s)
      });
      return typeof Promise < "u" && o instanceof Promise ? o.then((d) => d ? !0 : (c(), !1)) : o ? !0 : (c(), !1);
    });
  }
  refinement(e, t) {
    return this._refinement((n, s) => e(n) ? !0 : (s.addIssue(typeof t == "function" ? t(n, s) : t), !1));
  }
  _refinement(e) {
    return new O({
      schema: this,
      typeName: y.ZodEffects,
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
    return Z.create(this);
  }
  promise() {
    return G.create(this, this._def);
  }
  or(e) {
    return oe.create([this, e], this._def);
  }
  and(e) {
    return ce.create(this, e, this._def);
  }
  transform(e) {
    return new O({
      ...v(this._def),
      schema: this,
      typeName: y.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const t = typeof e == "function" ? e : () => e;
    return new he({
      ...v(this._def),
      innerType: this,
      defaultValue: t,
      typeName: y.ZodDefault
    });
  }
  brand() {
    return new Ee({
      typeName: y.ZodBranded,
      type: this,
      ...v(this._def)
    });
  }
  catch(e) {
    const t = typeof e == "function" ? e : () => e;
    return new me({
      ...v(this._def),
      innerType: this,
      catchValue: t,
      typeName: y.ZodCatch
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
    return ye.create(this, e);
  }
  readonly() {
    return pe.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const ct = /^c[^\s-]{8,}$/i, dt = /^[0-9a-z]+$/, ut = /^[0-9A-HJKMNP-TV-Z]{26}$/i, lt = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, ft = /^[a-z0-9_-]{21}$/i, ht = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, mt = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, pt = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, yt = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let Ce;
const gt = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, vt = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, _t = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, bt = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, xt = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, kt = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, ze = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", wt = new RegExp(`^${ze}$`);
function Le(r) {
  let e = "([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d";
  return r.precision ? e = `${e}\\.\\d{${r.precision}}` : r.precision == null && (e = `${e}(\\.\\d+)?`), e;
}
function Tt(r) {
  return new RegExp(`^${Le(r)}$`);
}
function Ue(r) {
  let e = `${ze}T${Le(r)}`;
  const t = [];
  return t.push(r.local ? "Z?" : "Z"), r.offset && t.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${t.join("|")})`, new RegExp(`^${e}$`);
}
function It(r, e) {
  return !!((e === "v4" || !e) && gt.test(r) || (e === "v6" || !e) && _t.test(r));
}
function St(r, e) {
  if (!ht.test(r))
    return !1;
  try {
    const [t] = r.split("."), n = t.replace(/-/g, "+").replace(/_/g, "/").padEnd(t.length + (4 - t.length % 4) % 4, "="), s = JSON.parse(atob(n));
    return !(typeof s != "object" || s === null || !s.typ || !s.alg || e && s.alg !== e);
  } catch {
    return !1;
  }
}
function Ct(r, e) {
  return !!((e === "v4" || !e) && vt.test(r) || (e === "v6" || !e) && bt.test(r));
}
class N extends _ {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== h.string) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: u.invalid_type,
        expected: h.string,
        received: a.parsedType
      }), g;
    }
    const n = new T();
    let s;
    for (const a of this._def.checks)
      if (a.kind === "min")
        e.data.length < a.value && (s = this._getOrReturnCtx(e, s), f(s, {
          code: u.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), n.dirty());
      else if (a.kind === "max")
        e.data.length > a.value && (s = this._getOrReturnCtx(e, s), f(s, {
          code: u.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), n.dirty());
      else if (a.kind === "length") {
        const o = e.data.length > a.value, c = e.data.length < a.value;
        (o || c) && (s = this._getOrReturnCtx(e, s), o ? f(s, {
          code: u.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }) : c && f(s, {
          code: u.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }), n.dirty());
      } else if (a.kind === "email")
        pt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "email",
          code: u.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "emoji")
        Ce || (Ce = new RegExp(yt, "u")), Ce.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "emoji",
          code: u.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "uuid")
        lt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "uuid",
          code: u.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "nanoid")
        ft.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "nanoid",
          code: u.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "cuid")
        ct.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "cuid",
          code: u.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "cuid2")
        dt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "cuid2",
          code: u.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "ulid")
        ut.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "ulid",
          code: u.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "url")
        try {
          new URL(e.data);
        } catch {
          s = this._getOrReturnCtx(e, s), f(s, {
            validation: "url",
            code: u.invalid_string,
            message: a.message
          }), n.dirty();
        }
      else a.kind === "regex" ? (a.regex.lastIndex = 0, a.regex.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        validation: "regex",
        code: u.invalid_string,
        message: a.message
      }), n.dirty())) : a.kind === "trim" ? e.data = e.data.trim() : a.kind === "includes" ? e.data.includes(a.value, a.position) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: u.invalid_string,
        validation: { includes: a.value, position: a.position },
        message: a.message
      }), n.dirty()) : a.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : a.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : a.kind === "startsWith" ? e.data.startsWith(a.value) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: u.invalid_string,
        validation: { startsWith: a.value },
        message: a.message
      }), n.dirty()) : a.kind === "endsWith" ? e.data.endsWith(a.value) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: u.invalid_string,
        validation: { endsWith: a.value },
        message: a.message
      }), n.dirty()) : a.kind === "datetime" ? Ue(a).test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: u.invalid_string,
        validation: "datetime",
        message: a.message
      }), n.dirty()) : a.kind === "date" ? wt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: u.invalid_string,
        validation: "date",
        message: a.message
      }), n.dirty()) : a.kind === "time" ? Tt(a).test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: u.invalid_string,
        validation: "time",
        message: a.message
      }), n.dirty()) : a.kind === "duration" ? mt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        validation: "duration",
        code: u.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "ip" ? It(e.data, a.version) || (s = this._getOrReturnCtx(e, s), f(s, {
        validation: "ip",
        code: u.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "jwt" ? St(e.data, a.alg) || (s = this._getOrReturnCtx(e, s), f(s, {
        validation: "jwt",
        code: u.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "cidr" ? Ct(e.data, a.version) || (s = this._getOrReturnCtx(e, s), f(s, {
        validation: "cidr",
        code: u.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "base64" ? xt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        validation: "base64",
        code: u.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "base64url" ? kt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        validation: "base64url",
        code: u.invalid_string,
        message: a.message
      }), n.dirty()) : x.assertNever(a);
    return { status: n.value, value: e.data };
  }
  _regex(e, t, n) {
    return this.refinement((s) => e.test(s), {
      validation: t,
      code: u.invalid_string,
      ...p.errToObj(n)
    });
  }
  _addCheck(e) {
    return new N({
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
    var t, n;
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
      local: (n = e == null ? void 0 : e.local) !== null && n !== void 0 ? n : !1,
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
    return new N({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new N({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new N({
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
N.create = (r) => {
  var e;
  return new N({
    checks: [],
    typeName: y.ZodString,
    coerce: (e = r == null ? void 0 : r.coerce) !== null && e !== void 0 ? e : !1,
    ...v(r)
  });
};
function At(r, e) {
  const t = (r.toString().split(".")[1] || "").length, n = (e.toString().split(".")[1] || "").length, s = t > n ? t : n, a = parseInt(r.toFixed(s).replace(".", "")), o = parseInt(e.toFixed(s).replace(".", ""));
  return a % o / Math.pow(10, s);
}
class V extends _ {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e) {
    if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== h.number) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: u.invalid_type,
        expected: h.number,
        received: a.parsedType
      }), g;
    }
    let n;
    const s = new T();
    for (const a of this._def.checks)
      a.kind === "int" ? x.isInteger(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: u.invalid_type,
        expected: "integer",
        received: "float",
        message: a.message
      }), s.dirty()) : a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (n = this._getOrReturnCtx(e, n), f(n, {
        code: u.too_small,
        minimum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (n = this._getOrReturnCtx(e, n), f(n, {
        code: u.too_big,
        maximum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? At(e.data, a.value) !== 0 && (n = this._getOrReturnCtx(e, n), f(n, {
        code: u.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: u.not_finite,
        message: a.message
      }), s.dirty()) : x.assertNever(a);
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
  setLimit(e, t, n, s) {
    return new V({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: t,
          inclusive: n,
          message: p.toString(s)
        }
      ]
    });
  }
  _addCheck(e) {
    return new V({
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
    return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && x.isInteger(e.value));
  }
  get isFinite() {
    let e = null, t = null;
    for (const n of this._def.checks) {
      if (n.kind === "finite" || n.kind === "int" || n.kind === "multipleOf")
        return !0;
      n.kind === "min" ? (t === null || n.value > t) && (t = n.value) : n.kind === "max" && (e === null || n.value < e) && (e = n.value);
    }
    return Number.isFinite(t) && Number.isFinite(e);
  }
}
V.create = (r) => new V({
  checks: [],
  typeName: y.ZodNumber,
  coerce: (r == null ? void 0 : r.coerce) || !1,
  ...v(r)
});
class F extends _ {
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
    let n;
    const s = new T();
    for (const a of this._def.checks)
      a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (n = this._getOrReturnCtx(e, n), f(n, {
        code: u.too_small,
        type: "bigint",
        minimum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (n = this._getOrReturnCtx(e, n), f(n, {
        code: u.too_big,
        type: "bigint",
        maximum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? e.data % a.value !== BigInt(0) && (n = this._getOrReturnCtx(e, n), f(n, {
        code: u.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : x.assertNever(a);
    return { status: s.value, value: e.data };
  }
  _getInvalidInput(e) {
    const t = this._getOrReturnCtx(e);
    return f(t, {
      code: u.invalid_type,
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
  setLimit(e, t, n, s) {
    return new F({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: t,
          inclusive: n,
          message: p.toString(s)
        }
      ]
    });
  }
  _addCheck(e) {
    return new F({
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
F.create = (r) => {
  var e;
  return new F({
    checks: [],
    typeName: y.ZodBigInt,
    coerce: (e = r == null ? void 0 : r.coerce) !== null && e !== void 0 ? e : !1,
    ...v(r)
  });
};
class se extends _ {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== h.boolean) {
      const n = this._getOrReturnCtx(e);
      return f(n, {
        code: u.invalid_type,
        expected: h.boolean,
        received: n.parsedType
      }), g;
    }
    return I(e.data);
  }
}
se.create = (r) => new se({
  typeName: y.ZodBoolean,
  coerce: (r == null ? void 0 : r.coerce) || !1,
  ...v(r)
});
class q extends _ {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== h.date) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: u.invalid_type,
        expected: h.date,
        received: a.parsedType
      }), g;
    }
    if (isNaN(e.data.getTime())) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: u.invalid_date
      }), g;
    }
    const n = new T();
    let s;
    for (const a of this._def.checks)
      a.kind === "min" ? e.data.getTime() < a.value && (s = this._getOrReturnCtx(e, s), f(s, {
        code: u.too_small,
        message: a.message,
        inclusive: !0,
        exact: !1,
        minimum: a.value,
        type: "date"
      }), n.dirty()) : a.kind === "max" ? e.data.getTime() > a.value && (s = this._getOrReturnCtx(e, s), f(s, {
        code: u.too_big,
        message: a.message,
        inclusive: !0,
        exact: !1,
        maximum: a.value,
        type: "date"
      }), n.dirty()) : x.assertNever(a);
    return {
      status: n.value,
      value: new Date(e.data.getTime())
    };
  }
  _addCheck(e) {
    return new q({
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
q.create = (r) => new q({
  checks: [],
  coerce: (r == null ? void 0 : r.coerce) || !1,
  typeName: y.ZodDate,
  ...v(r)
});
class be extends _ {
  _parse(e) {
    if (this._getType(e) !== h.symbol) {
      const n = this._getOrReturnCtx(e);
      return f(n, {
        code: u.invalid_type,
        expected: h.symbol,
        received: n.parsedType
      }), g;
    }
    return I(e.data);
  }
}
be.create = (r) => new be({
  typeName: y.ZodSymbol,
  ...v(r)
});
class ae extends _ {
  _parse(e) {
    if (this._getType(e) !== h.undefined) {
      const n = this._getOrReturnCtx(e);
      return f(n, {
        code: u.invalid_type,
        expected: h.undefined,
        received: n.parsedType
      }), g;
    }
    return I(e.data);
  }
}
ae.create = (r) => new ae({
  typeName: y.ZodUndefined,
  ...v(r)
});
class ie extends _ {
  _parse(e) {
    if (this._getType(e) !== h.null) {
      const n = this._getOrReturnCtx(e);
      return f(n, {
        code: u.invalid_type,
        expected: h.null,
        received: n.parsedType
      }), g;
    }
    return I(e.data);
  }
}
ie.create = (r) => new ie({
  typeName: y.ZodNull,
  ...v(r)
});
class H extends _ {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return I(e.data);
  }
}
H.create = (r) => new H({
  typeName: y.ZodAny,
  ...v(r)
});
class U extends _ {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return I(e.data);
  }
}
U.create = (r) => new U({
  typeName: y.ZodUnknown,
  ...v(r)
});
class $ extends _ {
  _parse(e) {
    const t = this._getOrReturnCtx(e);
    return f(t, {
      code: u.invalid_type,
      expected: h.never,
      received: t.parsedType
    }), g;
  }
}
$.create = (r) => new $({
  typeName: y.ZodNever,
  ...v(r)
});
class xe extends _ {
  _parse(e) {
    if (this._getType(e) !== h.undefined) {
      const n = this._getOrReturnCtx(e);
      return f(n, {
        code: u.invalid_type,
        expected: h.void,
        received: n.parsedType
      }), g;
    }
    return I(e.data);
  }
}
xe.create = (r) => new xe({
  typeName: y.ZodVoid,
  ...v(r)
});
class Z extends _ {
  _parse(e) {
    const { ctx: t, status: n } = this._processInputParams(e), s = this._def;
    if (t.parsedType !== h.array)
      return f(t, {
        code: u.invalid_type,
        expected: h.array,
        received: t.parsedType
      }), g;
    if (s.exactLength !== null) {
      const o = t.data.length > s.exactLength.value, c = t.data.length < s.exactLength.value;
      (o || c) && (f(t, {
        code: o ? u.too_big : u.too_small,
        minimum: c ? s.exactLength.value : void 0,
        maximum: o ? s.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: s.exactLength.message
      }), n.dirty());
    }
    if (s.minLength !== null && t.data.length < s.minLength.value && (f(t, {
      code: u.too_small,
      minimum: s.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.minLength.message
    }), n.dirty()), s.maxLength !== null && t.data.length > s.maxLength.value && (f(t, {
      code: u.too_big,
      maximum: s.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.maxLength.message
    }), n.dirty()), t.common.async)
      return Promise.all([...t.data].map((o, c) => s.type._parseAsync(new E(t, o, t.path, c)))).then((o) => T.mergeArray(n, o));
    const a = [...t.data].map((o, c) => s.type._parseSync(new E(t, o, t.path, c)));
    return T.mergeArray(n, a);
  }
  get element() {
    return this._def.type;
  }
  min(e, t) {
    return new Z({
      ...this._def,
      minLength: { value: e, message: p.toString(t) }
    });
  }
  max(e, t) {
    return new Z({
      ...this._def,
      maxLength: { value: e, message: p.toString(t) }
    });
  }
  length(e, t) {
    return new Z({
      ...this._def,
      exactLength: { value: e, message: p.toString(t) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
Z.create = (r, e) => new Z({
  type: r,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: y.ZodArray,
  ...v(e)
});
function Q(r) {
  if (r instanceof k) {
    const e = {};
    for (const t in r.shape) {
      const n = r.shape[t];
      e[t] = j.create(Q(n));
    }
    return new k({
      ...r._def,
      shape: () => e
    });
  } else return r instanceof Z ? new Z({
    ...r._def,
    type: Q(r.element)
  }) : r instanceof j ? j.create(Q(r.unwrap())) : r instanceof L ? L.create(Q(r.unwrap())) : r instanceof D ? D.create(r.items.map((e) => Q(e))) : r;
}
class k extends _ {
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
      return f(l, {
        code: u.invalid_type,
        expected: h.object,
        received: l.parsedType
      }), g;
    }
    const { status: n, ctx: s } = this._processInputParams(e), { shape: a, keys: o } = this._getCached(), c = [];
    if (!(this._def.catchall instanceof $ && this._def.unknownKeys === "strip"))
      for (const l in s.data)
        o.includes(l) || c.push(l);
    const d = [];
    for (const l of o) {
      const m = a[l], b = s.data[l];
      d.push({
        key: { status: "valid", value: l },
        value: m._parse(new E(s, b, s.path, l)),
        alwaysSet: l in s.data
      });
    }
    if (this._def.catchall instanceof $) {
      const l = this._def.unknownKeys;
      if (l === "passthrough")
        for (const m of c)
          d.push({
            key: { status: "valid", value: m },
            value: { status: "valid", value: s.data[m] }
          });
      else if (l === "strict")
        c.length > 0 && (f(s, {
          code: u.unrecognized_keys,
          keys: c
        }), n.dirty());
      else if (l !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const l = this._def.catchall;
      for (const m of c) {
        const b = s.data[m];
        d.push({
          key: { status: "valid", value: m },
          value: l._parse(
            new E(s, b, s.path, m)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: m in s.data
        });
      }
    }
    return s.common.async ? Promise.resolve().then(async () => {
      const l = [];
      for (const m of d) {
        const b = await m.key, w = await m.value;
        l.push({
          key: b,
          value: w,
          alwaysSet: m.alwaysSet
        });
      }
      return l;
    }).then((l) => T.mergeObjectSync(n, l)) : T.mergeObjectSync(n, d);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return p.errToObj, new k({
      ...this._def,
      unknownKeys: "strict",
      ...e !== void 0 ? {
        errorMap: (t, n) => {
          var s, a, o, c;
          const d = (o = (a = (s = this._def).errorMap) === null || a === void 0 ? void 0 : a.call(s, t, n).message) !== null && o !== void 0 ? o : n.defaultError;
          return t.code === "unrecognized_keys" ? {
            message: (c = p.errToObj(e).message) !== null && c !== void 0 ? c : d
          } : {
            message: d
          };
        }
      } : {}
    });
  }
  strip() {
    return new k({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new k({
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
    return new k({
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
    return new k({
      unknownKeys: e._def.unknownKeys,
      catchall: e._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...e._def.shape()
      }),
      typeName: y.ZodObject
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
    return new k({
      ...this._def,
      catchall: e
    });
  }
  pick(e) {
    const t = {};
    return x.objectKeys(e).forEach((n) => {
      e[n] && this.shape[n] && (t[n] = this.shape[n]);
    }), new k({
      ...this._def,
      shape: () => t
    });
  }
  omit(e) {
    const t = {};
    return x.objectKeys(this.shape).forEach((n) => {
      e[n] || (t[n] = this.shape[n]);
    }), new k({
      ...this._def,
      shape: () => t
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return Q(this);
  }
  partial(e) {
    const t = {};
    return x.objectKeys(this.shape).forEach((n) => {
      const s = this.shape[n];
      e && !e[n] ? t[n] = s : t[n] = s.optional();
    }), new k({
      ...this._def,
      shape: () => t
    });
  }
  required(e) {
    const t = {};
    return x.objectKeys(this.shape).forEach((n) => {
      if (e && !e[n])
        t[n] = this.shape[n];
      else {
        let a = this.shape[n];
        for (; a instanceof j; )
          a = a._def.innerType;
        t[n] = a;
      }
    }), new k({
      ...this._def,
      shape: () => t
    });
  }
  keyof() {
    return Be(x.objectKeys(this.shape));
  }
}
k.create = (r, e) => new k({
  shape: () => r,
  unknownKeys: "strip",
  catchall: $.create(),
  typeName: y.ZodObject,
  ...v(e)
});
k.strictCreate = (r, e) => new k({
  shape: () => r,
  unknownKeys: "strict",
  catchall: $.create(),
  typeName: y.ZodObject,
  ...v(e)
});
k.lazycreate = (r, e) => new k({
  shape: r,
  unknownKeys: "strip",
  catchall: $.create(),
  typeName: y.ZodObject,
  ...v(e)
});
class oe extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e), n = this._def.options;
    function s(a) {
      for (const c of a)
        if (c.result.status === "valid")
          return c.result;
      for (const c of a)
        if (c.result.status === "dirty")
          return t.common.issues.push(...c.ctx.common.issues), c.result;
      const o = a.map((c) => new C(c.ctx.common.issues));
      return f(t, {
        code: u.invalid_union,
        unionErrors: o
      }), g;
    }
    if (t.common.async)
      return Promise.all(n.map(async (a) => {
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
      for (const d of n) {
        const l = {
          ...t,
          common: {
            ...t.common,
            issues: []
          },
          parent: null
        }, m = d._parseSync({
          data: t.data,
          path: t.path,
          parent: l
        });
        if (m.status === "valid")
          return m;
        m.status === "dirty" && !a && (a = { result: m, ctx: l }), l.common.issues.length && o.push(l.common.issues);
      }
      if (a)
        return t.common.issues.push(...a.ctx.common.issues), a.result;
      const c = o.map((d) => new C(d));
      return f(t, {
        code: u.invalid_union,
        unionErrors: c
      }), g;
    }
  }
  get options() {
    return this._def.options;
  }
}
oe.create = (r, e) => new oe({
  options: r,
  typeName: y.ZodUnion,
  ...v(e)
});
const P = (r) => r instanceof ue ? P(r.schema) : r instanceof O ? P(r.innerType()) : r instanceof le ? [r.value] : r instanceof z ? r.options : r instanceof fe ? x.objectValues(r.enum) : r instanceof he ? P(r._def.innerType) : r instanceof ae ? [void 0] : r instanceof ie ? [null] : r instanceof j ? [void 0, ...P(r.unwrap())] : r instanceof L ? [null, ...P(r.unwrap())] : r instanceof Ee || r instanceof pe ? P(r.unwrap()) : r instanceof me ? P(r._def.innerType) : [];
class Te extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.object)
      return f(t, {
        code: u.invalid_type,
        expected: h.object,
        received: t.parsedType
      }), g;
    const n = this.discriminator, s = t.data[n], a = this.optionsMap.get(s);
    return a ? t.common.async ? a._parseAsync({
      data: t.data,
      path: t.path,
      parent: t
    }) : a._parseSync({
      data: t.data,
      path: t.path,
      parent: t
    }) : (f(t, {
      code: u.invalid_union_discriminator,
      options: Array.from(this.optionsMap.keys()),
      path: [n]
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
  static create(e, t, n) {
    const s = /* @__PURE__ */ new Map();
    for (const a of t) {
      const o = P(a.shape[e]);
      if (!o.length)
        throw new Error(`A discriminator value for key \`${e}\` could not be extracted from all schema options`);
      for (const c of o) {
        if (s.has(c))
          throw new Error(`Discriminator property ${String(e)} has duplicate value ${String(c)}`);
        s.set(c, a);
      }
    }
    return new Te({
      typeName: y.ZodDiscriminatedUnion,
      discriminator: e,
      options: t,
      optionsMap: s,
      ...v(n)
    });
  }
}
function je(r, e) {
  const t = R(r), n = R(e);
  if (r === e)
    return { valid: !0, data: r };
  if (t === h.object && n === h.object) {
    const s = x.objectKeys(e), a = x.objectKeys(r).filter((c) => s.indexOf(c) !== -1), o = { ...r, ...e };
    for (const c of a) {
      const d = je(r[c], e[c]);
      if (!d.valid)
        return { valid: !1 };
      o[c] = d.data;
    }
    return { valid: !0, data: o };
  } else if (t === h.array && n === h.array) {
    if (r.length !== e.length)
      return { valid: !1 };
    const s = [];
    for (let a = 0; a < r.length; a++) {
      const o = r[a], c = e[a], d = je(o, c);
      if (!d.valid)
        return { valid: !1 };
      s.push(d.data);
    }
    return { valid: !0, data: s };
  } else return t === h.date && n === h.date && +r == +e ? { valid: !0, data: r } : { valid: !1 };
}
class ce extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e), s = (a, o) => {
      if (Ze(a) || Ze(o))
        return g;
      const c = je(a.value, o.value);
      return c.valid ? ((Oe(a) || Oe(o)) && t.dirty(), { status: t.value, value: c.data }) : (f(n, {
        code: u.invalid_intersection_types
      }), g);
    };
    return n.common.async ? Promise.all([
      this._def.left._parseAsync({
        data: n.data,
        path: n.path,
        parent: n
      }),
      this._def.right._parseAsync({
        data: n.data,
        path: n.path,
        parent: n
      })
    ]).then(([a, o]) => s(a, o)) : s(this._def.left._parseSync({
      data: n.data,
      path: n.path,
      parent: n
    }), this._def.right._parseSync({
      data: n.data,
      path: n.path,
      parent: n
    }));
  }
}
ce.create = (r, e, t) => new ce({
  left: r,
  right: e,
  typeName: y.ZodIntersection,
  ...v(t)
});
class D extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== h.array)
      return f(n, {
        code: u.invalid_type,
        expected: h.array,
        received: n.parsedType
      }), g;
    if (n.data.length < this._def.items.length)
      return f(n, {
        code: u.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), g;
    !this._def.rest && n.data.length > this._def.items.length && (f(n, {
      code: u.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), t.dirty());
    const a = [...n.data].map((o, c) => {
      const d = this._def.items[c] || this._def.rest;
      return d ? d._parse(new E(n, o, n.path, c)) : null;
    }).filter((o) => !!o);
    return n.common.async ? Promise.all(a).then((o) => T.mergeArray(t, o)) : T.mergeArray(t, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new D({
      ...this._def,
      rest: e
    });
  }
}
D.create = (r, e) => {
  if (!Array.isArray(r))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new D({
    items: r,
    typeName: y.ZodTuple,
    rest: null,
    ...v(e)
  });
};
class de extends _ {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== h.object)
      return f(n, {
        code: u.invalid_type,
        expected: h.object,
        received: n.parsedType
      }), g;
    const s = [], a = this._def.keyType, o = this._def.valueType;
    for (const c in n.data)
      s.push({
        key: a._parse(new E(n, c, n.path, c)),
        value: o._parse(new E(n, n.data[c], n.path, c)),
        alwaysSet: c in n.data
      });
    return n.common.async ? T.mergeObjectAsync(t, s) : T.mergeObjectSync(t, s);
  }
  get element() {
    return this._def.valueType;
  }
  static create(e, t, n) {
    return t instanceof _ ? new de({
      keyType: e,
      valueType: t,
      typeName: y.ZodRecord,
      ...v(n)
    }) : new de({
      keyType: N.create(),
      valueType: e,
      typeName: y.ZodRecord,
      ...v(t)
    });
  }
}
class ke extends _ {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== h.map)
      return f(n, {
        code: u.invalid_type,
        expected: h.map,
        received: n.parsedType
      }), g;
    const s = this._def.keyType, a = this._def.valueType, o = [...n.data.entries()].map(([c, d], l) => ({
      key: s._parse(new E(n, c, n.path, [l, "key"])),
      value: a._parse(new E(n, d, n.path, [l, "value"]))
    }));
    if (n.common.async) {
      const c = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const d of o) {
          const l = await d.key, m = await d.value;
          if (l.status === "aborted" || m.status === "aborted")
            return g;
          (l.status === "dirty" || m.status === "dirty") && t.dirty(), c.set(l.value, m.value);
        }
        return { status: t.value, value: c };
      });
    } else {
      const c = /* @__PURE__ */ new Map();
      for (const d of o) {
        const l = d.key, m = d.value;
        if (l.status === "aborted" || m.status === "aborted")
          return g;
        (l.status === "dirty" || m.status === "dirty") && t.dirty(), c.set(l.value, m.value);
      }
      return { status: t.value, value: c };
    }
  }
}
ke.create = (r, e, t) => new ke({
  valueType: e,
  keyType: r,
  typeName: y.ZodMap,
  ...v(t)
});
class W extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== h.set)
      return f(n, {
        code: u.invalid_type,
        expected: h.set,
        received: n.parsedType
      }), g;
    const s = this._def;
    s.minSize !== null && n.data.size < s.minSize.value && (f(n, {
      code: u.too_small,
      minimum: s.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.minSize.message
    }), t.dirty()), s.maxSize !== null && n.data.size > s.maxSize.value && (f(n, {
      code: u.too_big,
      maximum: s.maxSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.maxSize.message
    }), t.dirty());
    const a = this._def.valueType;
    function o(d) {
      const l = /* @__PURE__ */ new Set();
      for (const m of d) {
        if (m.status === "aborted")
          return g;
        m.status === "dirty" && t.dirty(), l.add(m.value);
      }
      return { status: t.value, value: l };
    }
    const c = [...n.data.values()].map((d, l) => a._parse(new E(n, d, n.path, l)));
    return n.common.async ? Promise.all(c).then((d) => o(d)) : o(c);
  }
  min(e, t) {
    return new W({
      ...this._def,
      minSize: { value: e, message: p.toString(t) }
    });
  }
  max(e, t) {
    return new W({
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
W.create = (r, e) => new W({
  valueType: r,
  minSize: null,
  maxSize: null,
  typeName: y.ZodSet,
  ...v(e)
});
class J extends _ {
  constructor() {
    super(...arguments), this.validate = this.implement;
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.function)
      return f(t, {
        code: u.invalid_type,
        expected: h.function,
        received: t.parsedType
      }), g;
    function n(c, d) {
      return ve({
        data: c,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          ge(),
          X
        ].filter((l) => !!l),
        issueData: {
          code: u.invalid_arguments,
          argumentsError: d
        }
      });
    }
    function s(c, d) {
      return ve({
        data: c,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          ge(),
          X
        ].filter((l) => !!l),
        issueData: {
          code: u.invalid_return_type,
          returnTypeError: d
        }
      });
    }
    const a = { errorMap: t.common.contextualErrorMap }, o = t.data;
    if (this._def.returns instanceof G) {
      const c = this;
      return I(async function(...d) {
        const l = new C([]), m = await c._def.args.parseAsync(d, a).catch((S) => {
          throw l.addIssue(n(d, S)), l;
        }), b = await Reflect.apply(o, this, m);
        return await c._def.returns._def.type.parseAsync(b, a).catch((S) => {
          throw l.addIssue(s(b, S)), l;
        });
      });
    } else {
      const c = this;
      return I(function(...d) {
        const l = c._def.args.safeParse(d, a);
        if (!l.success)
          throw new C([n(d, l.error)]);
        const m = Reflect.apply(o, this, l.data), b = c._def.returns.safeParse(m, a);
        if (!b.success)
          throw new C([s(m, b.error)]);
        return b.data;
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
      args: D.create(e).rest(U.create())
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
  static create(e, t, n) {
    return new J({
      args: e || D.create([]).rest(U.create()),
      returns: t || U.create(),
      typeName: y.ZodFunction,
      ...v(n)
    });
  }
}
class ue extends _ {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    return this._def.getter()._parse({ data: t.data, path: t.path, parent: t });
  }
}
ue.create = (r, e) => new ue({
  getter: r,
  typeName: y.ZodLazy,
  ...v(e)
});
class le extends _ {
  _parse(e) {
    if (e.data !== this._def.value) {
      const t = this._getOrReturnCtx(e);
      return f(t, {
        received: t.data,
        code: u.invalid_literal,
        expected: this._def.value
      }), g;
    }
    return { status: "valid", value: e.data };
  }
  get value() {
    return this._def.value;
  }
}
le.create = (r, e) => new le({
  value: r,
  typeName: y.ZodLiteral,
  ...v(e)
});
function Be(r, e) {
  return new z({
    values: r,
    typeName: y.ZodEnum,
    ...v(e)
  });
}
class z extends _ {
  constructor() {
    super(...arguments), ee.set(this, void 0);
  }
  _parse(e) {
    if (typeof e.data != "string") {
      const t = this._getOrReturnCtx(e), n = this._def.values;
      return f(t, {
        expected: x.joinValues(n),
        received: t.parsedType,
        code: u.invalid_type
      }), g;
    }
    if (_e(this, ee) || Fe(this, ee, new Set(this._def.values)), !_e(this, ee).has(e.data)) {
      const t = this._getOrReturnCtx(e), n = this._def.values;
      return f(t, {
        received: t.data,
        code: u.invalid_enum_value,
        options: n
      }), g;
    }
    return I(e.data);
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
    return z.create(e, {
      ...this._def,
      ...t
    });
  }
  exclude(e, t = this._def) {
    return z.create(this.options.filter((n) => !e.includes(n)), {
      ...this._def,
      ...t
    });
  }
}
ee = /* @__PURE__ */ new WeakMap();
z.create = Be;
class fe extends _ {
  constructor() {
    super(...arguments), te.set(this, void 0);
  }
  _parse(e) {
    const t = x.getValidEnumValues(this._def.values), n = this._getOrReturnCtx(e);
    if (n.parsedType !== h.string && n.parsedType !== h.number) {
      const s = x.objectValues(t);
      return f(n, {
        expected: x.joinValues(s),
        received: n.parsedType,
        code: u.invalid_type
      }), g;
    }
    if (_e(this, te) || Fe(this, te, new Set(x.getValidEnumValues(this._def.values))), !_e(this, te).has(e.data)) {
      const s = x.objectValues(t);
      return f(n, {
        received: n.data,
        code: u.invalid_enum_value,
        options: s
      }), g;
    }
    return I(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
te = /* @__PURE__ */ new WeakMap();
fe.create = (r, e) => new fe({
  values: r,
  typeName: y.ZodNativeEnum,
  ...v(e)
});
class G extends _ {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.promise && t.common.async === !1)
      return f(t, {
        code: u.invalid_type,
        expected: h.promise,
        received: t.parsedType
      }), g;
    const n = t.parsedType === h.promise ? t.data : Promise.resolve(t.data);
    return I(n.then((s) => this._def.type.parseAsync(s, {
      path: t.path,
      errorMap: t.common.contextualErrorMap
    })));
  }
}
G.create = (r, e) => new G({
  type: r,
  typeName: y.ZodPromise,
  ...v(e)
});
class O extends _ {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === y.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e), s = this._def.effect || null, a = {
      addIssue: (o) => {
        f(n, o), o.fatal ? t.abort() : t.dirty();
      },
      get path() {
        return n.path;
      }
    };
    if (a.addIssue = a.addIssue.bind(a), s.type === "preprocess") {
      const o = s.transform(n.data, a);
      if (n.common.async)
        return Promise.resolve(o).then(async (c) => {
          if (t.value === "aborted")
            return g;
          const d = await this._def.schema._parseAsync({
            data: c,
            path: n.path,
            parent: n
          });
          return d.status === "aborted" ? g : d.status === "dirty" || t.value === "dirty" ? Y(d.value) : d;
        });
      {
        if (t.value === "aborted")
          return g;
        const c = this._def.schema._parseSync({
          data: o,
          path: n.path,
          parent: n
        });
        return c.status === "aborted" ? g : c.status === "dirty" || t.value === "dirty" ? Y(c.value) : c;
      }
    }
    if (s.type === "refinement") {
      const o = (c) => {
        const d = s.refinement(c, a);
        if (n.common.async)
          return Promise.resolve(d);
        if (d instanceof Promise)
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return c;
      };
      if (n.common.async === !1) {
        const c = this._def.schema._parseSync({
          data: n.data,
          path: n.path,
          parent: n
        });
        return c.status === "aborted" ? g : (c.status === "dirty" && t.dirty(), o(c.value), { status: t.value, value: c.value });
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((c) => c.status === "aborted" ? g : (c.status === "dirty" && t.dirty(), o(c.value).then(() => ({ status: t.value, value: c.value }))));
    }
    if (s.type === "transform")
      if (n.common.async === !1) {
        const o = this._def.schema._parseSync({
          data: n.data,
          path: n.path,
          parent: n
        });
        if (!B(o))
          return o;
        const c = s.transform(o.value, a);
        if (c instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: t.value, value: c };
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((o) => B(o) ? Promise.resolve(s.transform(o.value, a)).then((c) => ({ status: t.value, value: c })) : o);
    x.assertNever(s);
  }
}
O.create = (r, e, t) => new O({
  schema: r,
  typeName: y.ZodEffects,
  effect: e,
  ...v(t)
});
O.createWithPreprocess = (r, e, t) => new O({
  schema: e,
  effect: { type: "preprocess", transform: r },
  typeName: y.ZodEffects,
  ...v(t)
});
class j extends _ {
  _parse(e) {
    return this._getType(e) === h.undefined ? I(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
j.create = (r, e) => new j({
  innerType: r,
  typeName: y.ZodOptional,
  ...v(e)
});
class L extends _ {
  _parse(e) {
    return this._getType(e) === h.null ? I(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
L.create = (r, e) => new L({
  innerType: r,
  typeName: y.ZodNullable,
  ...v(e)
});
class he extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    let n = t.data;
    return t.parsedType === h.undefined && (n = this._def.defaultValue()), this._def.innerType._parse({
      data: n,
      path: t.path,
      parent: t
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
he.create = (r, e) => new he({
  innerType: r,
  typeName: y.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...v(e)
});
class me extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e), n = {
      ...t,
      common: {
        ...t.common,
        issues: []
      }
    }, s = this._def.innerType._parse({
      data: n.data,
      path: n.path,
      parent: {
        ...n
      }
    });
    return ne(s) ? s.then((a) => ({
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new C(n.common.issues);
        },
        input: n.data
      })
    })) : {
      status: "valid",
      value: s.status === "valid" ? s.value : this._def.catchValue({
        get error() {
          return new C(n.common.issues);
        },
        input: n.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
me.create = (r, e) => new me({
  innerType: r,
  typeName: y.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...v(e)
});
class we extends _ {
  _parse(e) {
    if (this._getType(e) !== h.nan) {
      const n = this._getOrReturnCtx(e);
      return f(n, {
        code: u.invalid_type,
        expected: h.nan,
        received: n.parsedType
      }), g;
    }
    return { status: "valid", value: e.data };
  }
}
we.create = (r) => new we({
  typeName: y.ZodNaN,
  ...v(r)
});
const Nt = Symbol("zod_brand");
class Ee extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e), n = t.data;
    return this._def.type._parse({
      data: n,
      path: t.path,
      parent: t
    });
  }
  unwrap() {
    return this._def.type;
  }
}
class ye extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e);
    if (n.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: n.data,
          path: n.path,
          parent: n
        });
        return a.status === "aborted" ? g : a.status === "dirty" ? (t.dirty(), Y(a.value)) : this._def.out._parseAsync({
          data: a.value,
          path: n.path,
          parent: n
        });
      })();
    {
      const s = this._def.in._parseSync({
        data: n.data,
        path: n.path,
        parent: n
      });
      return s.status === "aborted" ? g : s.status === "dirty" ? (t.dirty(), {
        status: "dirty",
        value: s.value
      }) : this._def.out._parseSync({
        data: s.value,
        path: n.path,
        parent: n
      });
    }
  }
  static create(e, t) {
    return new ye({
      in: e,
      out: t,
      typeName: y.ZodPipeline
    });
  }
}
class pe extends _ {
  _parse(e) {
    const t = this._def.innerType._parse(e), n = (s) => (B(s) && (s.value = Object.freeze(s.value)), s);
    return ne(t) ? t.then((s) => n(s)) : n(t);
  }
  unwrap() {
    return this._def.innerType;
  }
}
pe.create = (r, e) => new pe({
  innerType: r,
  typeName: y.ZodReadonly,
  ...v(e)
});
function Me(r, e) {
  const t = typeof r == "function" ? r(e) : typeof r == "string" ? { message: r } : r;
  return typeof t == "string" ? { message: t } : t;
}
function qe(r, e = {}, t) {
  return r ? H.create().superRefine((n, s) => {
    var a, o;
    const c = r(n);
    if (c instanceof Promise)
      return c.then((d) => {
        var l, m;
        if (!d) {
          const b = Me(e, n), w = (m = (l = b.fatal) !== null && l !== void 0 ? l : t) !== null && m !== void 0 ? m : !0;
          s.addIssue({ code: "custom", ...b, fatal: w });
        }
      });
    if (!c) {
      const d = Me(e, n), l = (o = (a = d.fatal) !== null && a !== void 0 ? a : t) !== null && o !== void 0 ? o : !0;
      s.addIssue({ code: "custom", ...d, fatal: l });
    }
  }) : H.create();
}
const Zt = {
  object: k.lazycreate
};
var y;
(function(r) {
  r.ZodString = "ZodString", r.ZodNumber = "ZodNumber", r.ZodNaN = "ZodNaN", r.ZodBigInt = "ZodBigInt", r.ZodBoolean = "ZodBoolean", r.ZodDate = "ZodDate", r.ZodSymbol = "ZodSymbol", r.ZodUndefined = "ZodUndefined", r.ZodNull = "ZodNull", r.ZodAny = "ZodAny", r.ZodUnknown = "ZodUnknown", r.ZodNever = "ZodNever", r.ZodVoid = "ZodVoid", r.ZodArray = "ZodArray", r.ZodObject = "ZodObject", r.ZodUnion = "ZodUnion", r.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", r.ZodIntersection = "ZodIntersection", r.ZodTuple = "ZodTuple", r.ZodRecord = "ZodRecord", r.ZodMap = "ZodMap", r.ZodSet = "ZodSet", r.ZodFunction = "ZodFunction", r.ZodLazy = "ZodLazy", r.ZodLiteral = "ZodLiteral", r.ZodEnum = "ZodEnum", r.ZodEffects = "ZodEffects", r.ZodNativeEnum = "ZodNativeEnum", r.ZodOptional = "ZodOptional", r.ZodNullable = "ZodNullable", r.ZodDefault = "ZodDefault", r.ZodCatch = "ZodCatch", r.ZodPromise = "ZodPromise", r.ZodBranded = "ZodBranded", r.ZodPipeline = "ZodPipeline", r.ZodReadonly = "ZodReadonly";
})(y || (y = {}));
const Ot = (r, e = {
  message: `Input not instance of ${r.name}`
}) => qe((t) => t instanceof r, e), We = N.create, Qe = V.create, jt = we.create, Et = F.create, Ye = se.create, Dt = q.create, Pt = be.create, Rt = ae.create, Mt = ie.create, $t = H.create, Vt = U.create, Ft = $.create, zt = xe.create, Lt = Z.create, Ut = k.create, Bt = k.strictCreate, qt = oe.create, Wt = Te.create, Qt = ce.create, Yt = D.create, Jt = de.create, Xt = ke.create, Ht = W.create, Gt = J.create, Kt = ue.create, er = le.create, tr = z.create, rr = fe.create, nr = G.create, $e = O.create, sr = j.create, ar = L.create, ir = O.createWithPreprocess, or = ye.create, cr = () => We().optional(), dr = () => Qe().optional(), ur = () => Ye().optional(), lr = {
  string: (r) => N.create({ ...r, coerce: !0 }),
  number: (r) => V.create({ ...r, coerce: !0 }),
  boolean: (r) => se.create({
    ...r,
    coerce: !0
  }),
  bigint: (r) => F.create({ ...r, coerce: !0 }),
  date: (r) => q.create({ ...r, coerce: !0 })
}, fr = g;
var i = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  defaultErrorMap: X,
  setErrorMap: it,
  getErrorMap: ge,
  makeIssue: ve,
  EMPTY_PATH: ot,
  addIssueToContext: f,
  ParseStatus: T,
  INVALID: g,
  DIRTY: Y,
  OK: I,
  isAborted: Ze,
  isDirty: Oe,
  isValid: B,
  isAsync: ne,
  get util() {
    return x;
  },
  get objectUtil() {
    return Ne;
  },
  ZodParsedType: h,
  getParsedType: R,
  ZodType: _,
  datetimeRegex: Ue,
  ZodString: N,
  ZodNumber: V,
  ZodBigInt: F,
  ZodBoolean: se,
  ZodDate: q,
  ZodSymbol: be,
  ZodUndefined: ae,
  ZodNull: ie,
  ZodAny: H,
  ZodUnknown: U,
  ZodNever: $,
  ZodVoid: xe,
  ZodArray: Z,
  ZodObject: k,
  ZodUnion: oe,
  ZodDiscriminatedUnion: Te,
  ZodIntersection: ce,
  ZodTuple: D,
  ZodRecord: de,
  ZodMap: ke,
  ZodSet: W,
  ZodFunction: J,
  ZodLazy: ue,
  ZodLiteral: le,
  ZodEnum: z,
  ZodNativeEnum: fe,
  ZodPromise: G,
  ZodEffects: O,
  ZodTransformer: O,
  ZodOptional: j,
  ZodNullable: L,
  ZodDefault: he,
  ZodCatch: me,
  ZodNaN: we,
  BRAND: Nt,
  ZodBranded: Ee,
  ZodPipeline: ye,
  ZodReadonly: pe,
  custom: qe,
  Schema: _,
  ZodSchema: _,
  late: Zt,
  get ZodFirstPartyTypeKind() {
    return y;
  },
  coerce: lr,
  any: $t,
  array: Lt,
  bigint: Et,
  boolean: Ye,
  date: Dt,
  discriminatedUnion: Wt,
  effect: $e,
  enum: tr,
  function: Gt,
  instanceof: Ot,
  intersection: Qt,
  lazy: Kt,
  literal: er,
  map: Xt,
  nan: jt,
  nativeEnum: rr,
  never: Ft,
  null: Mt,
  nullable: ar,
  number: Qe,
  object: Ut,
  oboolean: ur,
  onumber: dr,
  optional: sr,
  ostring: cr,
  pipeline: or,
  preprocess: ir,
  promise: nr,
  record: Jt,
  set: Ht,
  strictObject: Bt,
  string: We,
  symbol: Pt,
  transformer: $e,
  tuple: Yt,
  undefined: Rt,
  union: qt,
  unknown: Vt,
  void: zt,
  NEVER: fr,
  ZodIssueCode: u,
  quotelessJson: at,
  ZodError: C
});
const hr = i.object({
  country: i.string(),
  city: i.string(),
  street: i.string(),
  streetNumber: i.string(),
  floor: i.string(),
  apartmentEnterNumber: i.string(),
  apartmentNumber: i.string()
}), M = i.string().min(1, { message: "שדה חובה" }), Ar = i.string().regex(/^\d+$/, "Must be a numeric string"), Nr = i.object({ url: i.string().url(), id: i.string() });
function Zr(r) {
  return !!(r != null && r.url);
}
const re = i.object({
  lang: i.enum(["he"]),
  value: i.string()
}), Or = i.array(re), Je = i.object({
  id: i.string().min(1),
  companyId: i.string().min(1),
  storeId: i.string().min(1),
  parentId: i.string().nullish(),
  tag: i.string().optional(),
  locales: i.array(re),
  depth: i.number()
}), De = Je.extend({
  children: i.lazy(() => De.array())
}), jr = Je.extend({
  index: i.number(),
  depth: i.number(),
  collapsed: i.boolean().optional(),
  children: i.array(De)
}), K = i.string().min(1), Xe = i.object({
  type: i.literal("Product"),
  storeId: K,
  companyId: K,
  id: K,
  objectID: K,
  sku: K,
  name: i.array(re),
  description: i.array(re),
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
  isDiscountable: i.boolean({ description: "included in store discounts" }).optional(),
  weight: i.object({
    value: i.number(),
    unit: i.enum(["kg", "gram", "none"])
  }),
  volume: i.object({
    value: i.number(),
    unit: i.enum(["liter", "ml", "none"])
  }),
  images: i.array(i.object({ url: i.string().url(), id: i.string() })),
  manufacturer: i.string(),
  brand: i.string(),
  importer: i.string(),
  supplier: i.string(),
  ingredients: i.array(re),
  created_at: i.number(),
  updated_at: i.number(),
  categoryIds: i.array(i.string().nonempty()),
  // @deprecated
  categoryList: i.array(De).optional(),
  // @deprecated
  categories: i.object({
    lvl0: i.array(i.string()),
    lvl1: i.array(i.string()),
    lvl2: i.array(i.string()),
    lvl3: i.array(i.string()),
    lvl4: i.array(i.string())
  }).optional(),
  // @deprecated
  categoryNames: i.array(i.string()).optional()
}), Er = Xe.extend({
  image: i.instanceof(File).optional()
}), He = i.object({
  product: Xe,
  originalPrice: i.number().optional(),
  finalPrice: i.number().optional(),
  finalDiscount: i.number().optional(),
  amount: i.number().positive({ message: "Quantity must be a positive number." })
}), Dr = i.object({
  type: i.literal("Cart"),
  id: i.string().uuid(),
  companyId: i.string().uuid(),
  storeId: i.string().uuid(),
  userId: i.string().uuid(),
  status: i.enum(["active", "draft", "completed"]),
  items: i.array(He)
}), Pr = i.object({
  id: i.string(),
  name: i.string(),
  websiteDomains: i.array(i.string())
}), Rr = i.object({
  type: i.literal("FavoriteProduct"),
  id: i.string().uuid(),
  companyId: i.string().uuid(),
  storeId: i.string().uuid(),
  userId: i.string().uuid(),
  productId: i.string().uuid()
}), Ge = i.enum(["default", "delayed"], {
  description: "delayed is J5 transaction"
}), mr = i.object({
  type: i.literal("Profile"),
  id: M,
  companyId: M,
  storeId: M,
  tenantId: M,
  clientType: i.enum(["user", "company"]),
  companyName: i.string().optional(),
  displayName: M,
  email: i.string().email(),
  phoneNumber: i.string().optional(),
  address: hr.optional(),
  isAnonymous: i.boolean(),
  createdDate: i.number(),
  lastActivityDate: i.number(),
  paymentType: Ge,
  organizationId: i.string().optional()
});
function Mr() {
  return {
    type: "Profile",
    id: "",
    companyId: "",
    storeId: "",
    tenantId: "",
    clientType: "user",
    displayName: "",
    email: "",
    phoneNumber: "",
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
    isAnonymous: !0,
    paymentType: Ge.Values.default
  };
}
const $r = i.object({
  type: i.literal("Order"),
  id: M,
  companyId: M,
  storeId: M,
  userId: M,
  status: i.enum([
    "draft",
    // before payment
    "pending",
    // after payment
    "processing",
    // after admin approve
    "in_delivery",
    //
    "delivered",
    "cancelled",
    "completed",
    "refunded"
  ]),
  paymentStatus: i.enum(["pending", "pending_j5", "external", "completed", "failed", "refunded"]),
  //todo check if hyp support partial refund
  cart: i.object({
    id: i.string(),
    items: i.array(He),
    cartDiscount: i.number(),
    cartTotal: i.number(),
    cartVat: i.number(),
    deliveryPrice: i.number().optional()
  }),
  originalAmount: i.number().positive().optional(),
  // what client pay
  actualAmount: i.number().positive().optional(),
  // what store charge
  date: i.number(),
  deliveryDate: i.coerce.number(),
  client: mr.required({}),
  nameOnInvoice: i.string().optional(),
  clientComment: i.string().optional()
}), pr = i.enum(["individual", "company"]), Vr = i.object({
  id: i.string(),
  companyId: i.string(),
  name: i.string(),
  urls: i.array(i.string()),
  logoUrl: i.string(),
  tenantId: i.string(),
  // firebase auth tenantId
  paymentType: i.enum(["external", "j5"]),
  allowAnonymousClients: i.boolean(),
  isVatIncludedInPrice: i.boolean(),
  clientTypes: i.array(pr),
  minimumOrder: i.number().optional(),
  freeDeliveryPrice: i.number().optional(),
  deliveryPrice: i.number().optional()
}), yr = i.object({
  minSpend: i.number().positive().optional(),
  stackable: i.boolean().default(!1)
}).optional(), gr = i.discriminatedUnion("variantType", [
  i.object({
    variantType: i.literal("bundle"),
    productsId: i.array(i.string().nonempty()).min(1),
    // Which products are included
    requiredQuantity: i.number().positive(),
    // How many items needed (e.g., 3)
    bundlePrice: i.number().positive()
    // Total price for the bundle (e.g., $25)
  })
]), Fr = i.object({
  type: i.literal("Discount"),
  storeId: i.string().min(1),
  companyId: i.string().min(1),
  id: i.string().min(1),
  name: i.array(i.object({ lang: i.enum(["he"]), value: i.string().nonempty() })),
  active: i.boolean(),
  startDate: i.number(),
  endDate: i.number(),
  variant: gr,
  conditions: yr
});
class vr {
  canApply(e, t) {
    if (e.variant.variantType !== "bundle" || !this.isDiscountActive(e)) return !1;
    const { productsId: n, requiredQuantity: s } = e.variant;
    return this.getTotalQuantity(t.cart, n) >= s;
  }
  calculate(e, t) {
    if (e.variant.variantType !== "bundle")
      return { applicable: !1, discountAmount: 0, affectedItems: [] };
    const { productsId: n, requiredQuantity: s, bundlePrice: a } = e.variant, o = t.cart.filter((A) => n.includes(A.product.id)), c = this.getTotalQuantity(t.cart, n), d = Math.floor(c / s);
    if (d === 0)
      return { applicable: !1, discountAmount: 0, affectedItems: [] };
    const l = this.calculateOriginalPrice(o), m = this.getTotalQuantity(t.cart, n), b = this.calculateDiscountedPrice(
      l,
      a,
      d,
      s,
      m
    ), w = l - b, S = this.distributeDiscount(o, w, l);
    return {
      applicable: !0,
      discountAmount: Number(w.toFixed(2)),
      affectedItems: S
    };
  }
  isDiscountActive(e) {
    const t = Date.now();
    return e.active && e.startDate <= t && e.endDate >= t;
  }
  getTotalQuantity(e, t) {
    return e.filter((n) => t.includes(n.product.id)).reduce((n, s) => n + s.amount, 0);
  }
  calculateOriginalPrice(e) {
    return e.reduce((t, n) => t + n.product.price * n.amount, 0);
  }
  calculateDiscountedPrice(e, t, n, s, a) {
    const o = t * n, c = n * s, l = Math.max(0, a - c) / a * e;
    return o + l;
  }
  distributeDiscount(e, t, n) {
    const s = t / n;
    return e.map((a) => {
      const o = a.product.price * a.amount * s;
      return {
        productId: a.product.id,
        quantity: a.amount,
        originalPrice: Number(a.product.price.toFixed(2)),
        discountedPrice: Number((a.product.price - o / a.amount).toFixed(2)),
        discountAmount: Number(o.toFixed(2))
      };
    });
  }
}
class Ke {
  static getStrategy(e) {
    return this.strategies.get(e.variant.variantType) || null;
  }
  static registerStrategy(e, t) {
    this.strategies.set(e, t);
  }
  static getRegisteredTypes() {
    return Array.from(this.strategies.keys());
  }
  static clearStrategies() {
    this.strategies.clear();
  }
}
Pe(Ke, "strategies", /* @__PURE__ */ new Map([
  ["bundle", new vr()]
]));
class _r {
  static calculateDiscounts(e, t, n) {
    var l, m;
    const s = {
      cart: e,
      user: n,
      appliedDiscounts: []
    }, a = this.filterActiveDiscounts(t), o = [];
    for (const b of a) {
      const w = Ke.getStrategy(b);
      if (!w || !w.canApply(b, s) || !((l = b.conditions) != null && l.stackable) && o.length > 0) continue;
      const S = w.calculate(b, s);
      S.applicable && (o.push({
        discountId: b.id,
        discountName: ((m = b.name[0]) == null ? void 0 : m.value) || "Discount",
        discountAmount: Number(S.discountAmount.toFixed(2)),
        affectedItems: S.affectedItems
      }), s.appliedDiscounts = o);
    }
    const c = this.calculateFinalPrices(e, o), d = o.reduce(
      (b, w) => b + w.discountAmount,
      0
    );
    return {
      items: c,
      totalDiscount: Number(d.toFixed(2)),
      appliedDiscounts: o
    };
  }
  static filterActiveDiscounts(e) {
    const t = Date.now();
    return e.filter(
      (n) => n.active && n.startDate <= t && n.endDate >= t
    );
  }
  static calculateFinalPrices(e, t) {
    return e.map((n) => {
      const s = t.filter(
        (d) => d.affectedItems.some((l) => l.productId === n.product.id)
      ), a = s.reduce((d, l) => {
        const m = l.affectedItems.find(
          (b) => b.productId === n.product.id
        );
        return d + ((m == null ? void 0 : m.discountAmount) || 0);
      }, 0), o = a / n.amount, c = n.product.price - o;
      return {
        amount: n.amount,
        product: n.product,
        originalPrice: Number(n.product.price.toFixed(2)),
        finalPrice: Number(Math.max(0, c).toFixed(2)),
        finalDiscount: Number(a.toFixed(2)),
        appliedDiscounts: s.map((d) => d.discountId)
      };
    });
  }
  static isDiscountActive(e) {
    const t = Date.now();
    return e.active && e.startDate <= t && e.endDate >= t;
  }
  static getActiveDiscounts(e) {
    return this.filterActiveDiscounts(e);
  }
}
function et(r) {
  return Number(r.toFixed(2));
}
function zr(r) {
  return r.toFixed(2);
}
function Lr(r) {
  return Math.max(0, et(r));
}
function Ur(r, e) {
  if (r <= 0) return 0;
  const t = r - e;
  return et(t / r * 100);
}
const br = i.object({
  id: i.string(),
  name: i.string(),
  discountPercentage: i.number().positive().min(0).max(100).optional(),
  nameOnInvoice: i.string().optional()
}), Br = br.omit({ id: !0 }), tt = i.object({
  _COMMENT: i.string().optional(),
  transaction_id: i.string(),
  date: i.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  currency: i.string().length(3, "Currency must be 3 characters"),
  rate: i.number().positive(),
  vat: i.string().regex(/^\d+\.\d{2}$/, "VAT must be in format XX.XX"),
  vat_price: i.number().positive(),
  price_discount: i.number(),
  price_discount_in_currency: i.number(),
  price_total: i.string().regex(/^\d+\.\d{2}$/, "Price total must be in format XX.XX"),
  price_total_in_currency: i.number().positive()
}), xr = i.object({
  doc_uuid: i.string().uuid("Document UUID must be a valid UUID"),
  pdf_link: i.string().url("PDF link must be a valid URL"),
  pdf_link_copy: i.string().url("PDF copy link must be a valid URL"),
  doc_number: i.string().min(1, "Document number is required"),
  sent_mails: i.array(i.string().email("Each email must be valid")),
  success: i.boolean(),
  ua_uuid: i.string().uuid("UA UUID must be a valid UUID"),
  calculatedData: tt,
  warning: i.string().optional()
});
function qr(r) {
  return xr.safeParse(r).success;
}
function Wr(r) {
  return tt.safeParse(r).success;
}
const Ae = {
  VAT: 18
};
function kr(r) {
  var e, t;
  return ((e = r.discount) == null ? void 0 : e.type) === "percent" ? r.price * (r.discount.value ?? 100) / 100 : ((t = r.discount) == null ? void 0 : t.type) === "number" ? r.discount.value ?? 0 : 0;
}
function wr(r) {
  var e, t;
  if (((e = r.discount) == null ? void 0 : e.type) === "percent") {
    const n = r.price * r.discount.value / 100;
    return r.price - n;
  }
  return ((t = r.discount) == null ? void 0 : t.type) === "number" ? r.price - r.discount.value : r.price;
}
function Qr({
  cart: r,
  discounts: e,
  store: t
}) {
  const { isVatIncludedInPrice: n } = t, s = r.map((d) => ({
    amount: d.amount,
    product: {
      id: d.product.id,
      price: d.product.price
    }
  })), a = _r.calculateDiscounts(s, e), o = r.map((d, l) => {
    const m = a.items[l];
    return {
      amount: d.amount,
      product: { ...d.product },
      originalPrice: d.product.price,
      finalPrice: m ? m.finalPrice : wr(d.product),
      finalDiscount: m ? m.finalDiscount : kr(d.product)
    };
  }), c = o.reduce(
    (d, l) => {
      const { product: m, amount: b, finalPrice: w, finalDiscount: S } = l;
      let A = 0;
      if (m.vat) {
        let Se = 0;
        if (n) {
          const rt = w * (Ae.VAT / (100 + Ae.VAT));
          A = Number(rt.toFixed(2)), A = A * b, Se = Number(A.toFixed(2));
        } else
          A = w * Ae.VAT / 100, A = A * b, Se = Number(A.toFixed(2));
        d.vat = Number((d.vat + Se).toFixed(2));
      }
      const Ie = Number(w.toFixed(2));
      return d.cost += b * Ie, d.discount += S && b * S, d.finalCost += b * Ie + (n ? 0 : A), d.productsCost += b * Ie + (n ? 0 : A), d.cost = Number(d.cost.toFixed(2)), d.discount = Number(d.discount.toFixed(2)), d.finalCost = Number(d.finalCost.toFixed(2)), d.productsCost = Number(d.productsCost.toFixed(2)), d;
    },
    {
      discount: 0,
      cost: 0,
      finalCost: 0,
      vat: 0,
      productsCost: 0,
      deliveryPrice: (t == null ? void 0 : t.deliveryPrice) ?? 0
    }
  );
  return c.deliveryPrice && c.productsCost >= (t.freeDeliveryPrice ?? 0) ? c.deliveryPrice = 0 : c.finalCost += c.deliveryPrice, console.log("cartDetails", c), { items: o, ...c };
}
const Tr = {
  stores: "STORES",
  companies: "COMPANIES"
}, Ir = {
  products: "products",
  profiles: "profiles",
  cart: "cart",
  clients: "clients",
  orders: "orders",
  categories: "categories",
  favorites: "favorites",
  payments: "payments",
  settings: "settings",
  discounts: "discounts",
  organizations: "organizations"
}, Sr = {
  systemCollections: Tr,
  storeCollections: Ir,
  // for client
  getPath: ({
    companyId: r,
    storeId: e,
    collectionName: t,
    id: n
  }) => `${r}/${e}/${t}${n ? `/${n}` : ""}`,
  // for backend
  getDocPath: (r) => `{companyId}/{storeId}/${r}/{id}`
}, Yr = {
  firestore: Sr
};
export {
  hr as AddressSchema,
  Je as BaseCategorySchema,
  vr as BundleDiscountStrategy,
  tt as CalculatedDataSchema,
  He as CartItemProductSchema,
  Dr as CartSchema,
  De as CategorySchema,
  Pr as CompanySchema,
  xr as DeliveryNoteSchema,
  yr as DiscountConditionsSchema,
  _r as DiscountEngine,
  Fr as DiscountSchema,
  Ke as DiscountStrategyFactory,
  gr as DiscountVariantSchema,
  Rr as FavoriteProductSchema,
  Nr as FileSchema,
  Yr as FirebaseAPI,
  re as LocaleSchema,
  Or as LocaleValueSchema,
  Br as NewOrganizationSchema,
  Er as NewProductSchema,
  $r as OrderSchema,
  br as OrganizationSchema,
  Xe as ProductSchema,
  Ge as ProfilePaymentTypeSchema,
  mr as ProfileSchema,
  Vr as StoreSchema,
  jr as TFlattenCategorySchema,
  Ur as calculatePercentageDiscount,
  pr as clientTypesSchema,
  Mr as createEmptyProfile,
  Lr as ensureNonNegative,
  et as formatCurrency,
  zr as formatCurrencyString,
  Qr as getCartCost,
  Wr as isCalculatedData,
  qr as isDeliveryNote,
  Zr as isFile,
  M as notEmptyTextSchema,
  Ar as numericTextSchema
};
//# sourceMappingURL=core.es.js.map
