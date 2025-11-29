var it = Object.defineProperty;
var ot = (n, e, t) => e in n ? it(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var Re = (n, e, t) => ot(n, typeof e != "symbol" ? e + "" : e, t);
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
    for (const o of s)
      a[o] = o;
    return a;
  }, n.getValidEnumValues = (s) => {
    const a = n.objectKeys(s).filter((c) => typeof s[s[c]] != "number"), o = {};
    for (const c of a)
      o[c] = s[c];
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
})(x || (x = {}));
var Ze;
(function(n) {
  n.mergeShapes = (e, t) => ({
    ...e,
    ...t
    // second overwrites first
  });
})(Ze || (Ze = {}));
const f = x.arrayToEnum([
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
]), R = (n) => {
  switch (typeof n) {
    case "undefined":
      return f.undefined;
    case "string":
      return f.string;
    case "number":
      return isNaN(n) ? f.nan : f.number;
    case "boolean":
      return f.boolean;
    case "function":
      return f.function;
    case "bigint":
      return f.bigint;
    case "symbol":
      return f.symbol;
    case "object":
      return Array.isArray(n) ? f.array : n === null ? f.null : n.then && typeof n.then == "function" && n.catch && typeof n.catch == "function" ? f.promise : typeof Map < "u" && n instanceof Map ? f.map : typeof Set < "u" && n instanceof Set ? f.set : typeof Date < "u" && n instanceof Date ? f.date : f.object;
    default:
      return f.unknown;
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
]), ct = (n) => JSON.stringify(n, null, 2).replace(/"([^"]+)":/g, "$1:");
class N extends Error {
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
          let c = r, l = 0;
          for (; l < o.path.length; ) {
            const d = o.path[l];
            l === o.path.length - 1 ? (c[d] = c[d] || { _errors: [] }, c[d]._errors.push(t(o))) : c[d] = c[d] || { _errors: [] }, c = c[d], l++;
          }
        }
    };
    return s(this), r;
  }
  static assert(e) {
    if (!(e instanceof N))
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
N.create = (n) => new N(n);
const X = (n, e) => {
  let t;
  switch (n.code) {
    case u.invalid_type:
      n.received === f.undefined ? t = "Required" : t = `Expected ${n.expected}, received ${n.received}`;
      break;
    case u.invalid_literal:
      t = `Invalid literal value, expected ${JSON.stringify(n.expected, x.jsonStringifyReplacer)}`;
      break;
    case u.unrecognized_keys:
      t = `Unrecognized key(s) in object: ${x.joinValues(n.keys, ", ")}`;
      break;
    case u.invalid_union:
      t = "Invalid input";
      break;
    case u.invalid_union_discriminator:
      t = `Invalid discriminator value. Expected ${x.joinValues(n.options)}`;
      break;
    case u.invalid_enum_value:
      t = `Invalid enum value. Expected ${x.joinValues(n.options)}, received '${n.received}'`;
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
      typeof n.validation == "object" ? "includes" in n.validation ? (t = `Invalid input: must include "${n.validation.includes}"`, typeof n.validation.position == "number" && (t = `${t} at one or more positions greater than or equal to ${n.validation.position}`)) : "startsWith" in n.validation ? t = `Invalid input: must start with "${n.validation.startsWith}"` : "endsWith" in n.validation ? t = `Invalid input: must end with "${n.validation.endsWith}"` : x.assertNever(n.validation) : n.validation !== "regex" ? t = `Invalid ${n.validation}` : t = "Invalid";
      break;
    case u.too_small:
      n.type === "array" ? t = `Array must contain ${n.exact ? "exactly" : n.inclusive ? "at least" : "more than"} ${n.minimum} element(s)` : n.type === "string" ? t = `String must contain ${n.exact ? "exactly" : n.inclusive ? "at least" : "over"} ${n.minimum} character(s)` : n.type === "number" ? t = `Number must be ${n.exact ? "exactly equal to " : n.inclusive ? "greater than or equal to " : "greater than "}${n.minimum}` : n.type === "date" ? t = `Date must be ${n.exact ? "exactly equal to " : n.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(n.minimum))}` : t = "Invalid input";
      break;
    case u.too_big:
      n.type === "array" ? t = `Array must contain ${n.exact ? "exactly" : n.inclusive ? "at most" : "less than"} ${n.maximum} element(s)` : n.type === "string" ? t = `String must contain ${n.exact ? "exactly" : n.inclusive ? "at most" : "under"} ${n.maximum} character(s)` : n.type === "number" ? t = `Number must be ${n.exact ? "exactly" : n.inclusive ? "less than or equal to" : "less than"} ${n.maximum}` : n.type === "bigint" ? t = `BigInt must be ${n.exact ? "exactly" : n.inclusive ? "less than or equal to" : "less than"} ${n.maximum}` : n.type === "date" ? t = `Date must be ${n.exact ? "exactly" : n.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(n.maximum))}` : t = "Invalid input";
      break;
    case u.custom:
      t = "Invalid input";
      break;
    case u.invalid_intersection_types:
      t = "Intersection results could not be merged";
      break;
    case u.not_multiple_of:
      t = `Number must be a multiple of ${n.multipleOf}`;
      break;
    case u.not_finite:
      t = "Number must be finite";
      break;
    default:
      t = e.defaultError, x.assertNever(n);
  }
  return { message: t };
};
let Fe = X;
function dt(n) {
  Fe = n;
}
function ve() {
  return Fe;
}
const _e = (n) => {
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
  let c = "";
  const l = r.filter((d) => !!d).slice().reverse();
  for (const d of l)
    c = d(o, { data: e, defaultError: c }).message;
  return {
    ...s,
    path: a,
    message: c
  };
}, ut = [];
function m(n, e) {
  const t = ve(), r = _e({
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
      t === X ? void 0 : X
      // then global default map
    ].filter((s) => !!s)
  });
  n.common.issues.push(r);
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
      const a = await s.key, o = await s.value;
      r.push({
        key: a,
        value: o
      });
    }
    return T.mergeObjectSync(e, r);
  }
  static mergeObjectSync(e, t) {
    const r = {};
    for (const s of t) {
      const { key: a, value: o } = s;
      if (a.status === "aborted" || o.status === "aborted")
        return y;
      a.status === "dirty" && e.dirty(), o.status === "dirty" && e.dirty(), a.value !== "__proto__" && (typeof o.value < "u" || s.alwaysSet) && (r[a.value] = o.value);
    }
    return { status: e.value, value: r };
  }
}
const y = Object.freeze({
  status: "aborted"
}), Y = (n) => ({ status: "dirty", value: n }), I = (n) => ({ status: "valid", value: n }), De = (n) => n.status === "aborted", je = (n) => n.status === "dirty", q = (n) => n.status === "valid", se = (n) => typeof Promise < "u" && n instanceof Promise;
function be(n, e, t, r) {
  if (typeof e == "function" ? n !== e || !0 : !e.has(n)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return e.get(n);
}
function ze(n, e, t, r, s) {
  if (typeof e == "function" ? n !== e || !0 : !e.has(n)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return e.set(n, t), t;
}
var h;
(function(n) {
  n.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, n.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(h || (h = {}));
var te, ne;
class O {
  constructor(e, t, r, s) {
    this._cachedPath = [], this.parent = e, this.data = t, this._path = r, this._key = s;
  }
  get path() {
    return this._cachedPath.length || (this._key instanceof Array ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Me = (n, e) => {
  if (q(e))
    return { success: !0, data: e.value };
  if (!n.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const t = new N(n.common.issues);
      return this._error = t, this._error;
    }
  };
};
function v(n) {
  if (!n)
    return {};
  const { errorMap: e, invalid_type_error: t, required_error: r, description: s } = n;
  if (e && (t || r))
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  return e ? { errorMap: e, description: s } : { errorMap: (o, c) => {
    var l, d;
    const { message: p } = n;
    return o.code === "invalid_enum_value" ? { message: p ?? c.defaultError } : typeof c.data > "u" ? { message: (l = p ?? r) !== null && l !== void 0 ? l : c.defaultError } : o.code !== "invalid_type" ? { message: c.defaultError } : { message: (d = p ?? t) !== null && d !== void 0 ? d : c.defaultError };
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
    if (se(t))
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
      parsedType: R(e)
    }, a = this._parseSync({ data: e, path: s.path, parent: s });
    return Me(s, a);
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
      parsedType: R(e)
    };
    if (!this["~standard"].async)
      try {
        const a = this._parseSync({ data: e, path: [], parent: s });
        return q(a) ? {
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
    return this._parseAsync({ data: e, path: [], parent: s }).then((a) => q(a) ? {
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
      parsedType: R(e)
    }, s = this._parse({ data: e, path: r.path, parent: r }), a = await (se(s) ? s : Promise.resolve(s));
    return Me(r, a);
  }
  refine(e, t) {
    const r = (s) => typeof t == "string" || typeof t > "u" ? { message: t } : typeof t == "function" ? t(s) : t;
    return this._refinement((s, a) => {
      const o = e(s), c = () => a.addIssue({
        code: u.custom,
        ...r(s)
      });
      return typeof Promise < "u" && o instanceof Promise ? o.then((l) => l ? !0 : (c(), !1)) : o ? !0 : (c(), !1);
    });
  }
  refinement(e, t) {
    return this._refinement((r, s) => e(r) ? !0 : (s.addIssue(typeof t == "function" ? t(r, s) : t), !1));
  }
  _refinement(e) {
    return new Z({
      schema: this,
      typeName: g.ZodEffects,
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
    return U.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return C.create(this);
  }
  promise() {
    return G.create(this, this._def);
  }
  or(e) {
    return ce.create([this, e], this._def);
  }
  and(e) {
    return de.create(this, e, this._def);
  }
  transform(e) {
    return new Z({
      ...v(this._def),
      schema: this,
      typeName: g.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const t = typeof e == "function" ? e : () => e;
    return new pe({
      ...v(this._def),
      innerType: this,
      defaultValue: t,
      typeName: g.ZodDefault
    });
  }
  brand() {
    return new Ee({
      typeName: g.ZodBranded,
      type: this,
      ...v(this._def)
    });
  }
  catch(e) {
    const t = typeof e == "function" ? e : () => e;
    return new he({
      ...v(this._def),
      innerType: this,
      catchValue: t,
      typeName: g.ZodCatch
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
    return ge.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const lt = /^c[^\s-]{8,}$/i, mt = /^[0-9a-z]+$/, ft = /^[0-9A-HJKMNP-TV-Z]{26}$/i, pt = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, ht = /^[a-z0-9_-]{21}$/i, gt = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, yt = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, vt = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, _t = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let Se;
const bt = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, xt = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, kt = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, wt = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, Tt = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, It = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, Ue = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", At = new RegExp(`^${Ue}$`);
function Le(n) {
  let e = "([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d";
  return n.precision ? e = `${e}\\.\\d{${n.precision}}` : n.precision == null && (e = `${e}(\\.\\d+)?`), e;
}
function Nt(n) {
  return new RegExp(`^${Le(n)}$`);
}
function qe(n) {
  let e = `${Ue}T${Le(n)}`;
  const t = [];
  return t.push(n.local ? "Z?" : "Z"), n.offset && t.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${t.join("|")})`, new RegExp(`^${e}$`);
}
function St(n, e) {
  return !!((e === "v4" || !e) && bt.test(n) || (e === "v6" || !e) && kt.test(n));
}
function Ct(n, e) {
  if (!gt.test(n))
    return !1;
  try {
    const [t] = n.split("."), r = t.replace(/-/g, "+").replace(/_/g, "/").padEnd(t.length + (4 - t.length % 4) % 4, "="), s = JSON.parse(atob(r));
    return !(typeof s != "object" || s === null || !s.typ || !s.alg || e && s.alg !== e);
  } catch {
    return !1;
  }
}
function Zt(n, e) {
  return !!((e === "v4" || !e) && xt.test(n) || (e === "v6" || !e) && wt.test(n));
}
class S extends _ {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== f.string) {
      const a = this._getOrReturnCtx(e);
      return m(a, {
        code: u.invalid_type,
        expected: f.string,
        received: a.parsedType
      }), y;
    }
    const r = new T();
    let s;
    for (const a of this._def.checks)
      if (a.kind === "min")
        e.data.length < a.value && (s = this._getOrReturnCtx(e, s), m(s, {
          code: u.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), r.dirty());
      else if (a.kind === "max")
        e.data.length > a.value && (s = this._getOrReturnCtx(e, s), m(s, {
          code: u.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), r.dirty());
      else if (a.kind === "length") {
        const o = e.data.length > a.value, c = e.data.length < a.value;
        (o || c) && (s = this._getOrReturnCtx(e, s), o ? m(s, {
          code: u.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }) : c && m(s, {
          code: u.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }), r.dirty());
      } else if (a.kind === "email")
        vt.test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
          validation: "email",
          code: u.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "emoji")
        Se || (Se = new RegExp(_t, "u")), Se.test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
          validation: "emoji",
          code: u.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "uuid")
        pt.test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
          validation: "uuid",
          code: u.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "nanoid")
        ht.test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
          validation: "nanoid",
          code: u.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "cuid")
        lt.test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
          validation: "cuid",
          code: u.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "cuid2")
        mt.test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
          validation: "cuid2",
          code: u.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "ulid")
        ft.test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
          validation: "ulid",
          code: u.invalid_string,
          message: a.message
        }), r.dirty());
      else if (a.kind === "url")
        try {
          new URL(e.data);
        } catch {
          s = this._getOrReturnCtx(e, s), m(s, {
            validation: "url",
            code: u.invalid_string,
            message: a.message
          }), r.dirty();
        }
      else a.kind === "regex" ? (a.regex.lastIndex = 0, a.regex.test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
        validation: "regex",
        code: u.invalid_string,
        message: a.message
      }), r.dirty())) : a.kind === "trim" ? e.data = e.data.trim() : a.kind === "includes" ? e.data.includes(a.value, a.position) || (s = this._getOrReturnCtx(e, s), m(s, {
        code: u.invalid_string,
        validation: { includes: a.value, position: a.position },
        message: a.message
      }), r.dirty()) : a.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : a.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : a.kind === "startsWith" ? e.data.startsWith(a.value) || (s = this._getOrReturnCtx(e, s), m(s, {
        code: u.invalid_string,
        validation: { startsWith: a.value },
        message: a.message
      }), r.dirty()) : a.kind === "endsWith" ? e.data.endsWith(a.value) || (s = this._getOrReturnCtx(e, s), m(s, {
        code: u.invalid_string,
        validation: { endsWith: a.value },
        message: a.message
      }), r.dirty()) : a.kind === "datetime" ? qe(a).test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
        code: u.invalid_string,
        validation: "datetime",
        message: a.message
      }), r.dirty()) : a.kind === "date" ? At.test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
        code: u.invalid_string,
        validation: "date",
        message: a.message
      }), r.dirty()) : a.kind === "time" ? Nt(a).test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
        code: u.invalid_string,
        validation: "time",
        message: a.message
      }), r.dirty()) : a.kind === "duration" ? yt.test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
        validation: "duration",
        code: u.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "ip" ? St(e.data, a.version) || (s = this._getOrReturnCtx(e, s), m(s, {
        validation: "ip",
        code: u.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "jwt" ? Ct(e.data, a.alg) || (s = this._getOrReturnCtx(e, s), m(s, {
        validation: "jwt",
        code: u.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "cidr" ? Zt(e.data, a.version) || (s = this._getOrReturnCtx(e, s), m(s, {
        validation: "cidr",
        code: u.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "base64" ? Tt.test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
        validation: "base64",
        code: u.invalid_string,
        message: a.message
      }), r.dirty()) : a.kind === "base64url" ? It.test(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
        validation: "base64url",
        code: u.invalid_string,
        message: a.message
      }), r.dirty()) : x.assertNever(a);
    return { status: r.value, value: e.data };
  }
  _regex(e, t, r) {
    return this.refinement((s) => e.test(s), {
      validation: t,
      code: u.invalid_string,
      ...h.errToObj(r)
    });
  }
  _addCheck(e) {
    return new S({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  email(e) {
    return this._addCheck({ kind: "email", ...h.errToObj(e) });
  }
  url(e) {
    return this._addCheck({ kind: "url", ...h.errToObj(e) });
  }
  emoji(e) {
    return this._addCheck({ kind: "emoji", ...h.errToObj(e) });
  }
  uuid(e) {
    return this._addCheck({ kind: "uuid", ...h.errToObj(e) });
  }
  nanoid(e) {
    return this._addCheck({ kind: "nanoid", ...h.errToObj(e) });
  }
  cuid(e) {
    return this._addCheck({ kind: "cuid", ...h.errToObj(e) });
  }
  cuid2(e) {
    return this._addCheck({ kind: "cuid2", ...h.errToObj(e) });
  }
  ulid(e) {
    return this._addCheck({ kind: "ulid", ...h.errToObj(e) });
  }
  base64(e) {
    return this._addCheck({ kind: "base64", ...h.errToObj(e) });
  }
  base64url(e) {
    return this._addCheck({
      kind: "base64url",
      ...h.errToObj(e)
    });
  }
  jwt(e) {
    return this._addCheck({ kind: "jwt", ...h.errToObj(e) });
  }
  ip(e) {
    return this._addCheck({ kind: "ip", ...h.errToObj(e) });
  }
  cidr(e) {
    return this._addCheck({ kind: "cidr", ...h.errToObj(e) });
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
      ...h.errToObj(e == null ? void 0 : e.message)
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
      ...h.errToObj(e == null ? void 0 : e.message)
    });
  }
  duration(e) {
    return this._addCheck({ kind: "duration", ...h.errToObj(e) });
  }
  regex(e, t) {
    return this._addCheck({
      kind: "regex",
      regex: e,
      ...h.errToObj(t)
    });
  }
  includes(e, t) {
    return this._addCheck({
      kind: "includes",
      value: e,
      position: t == null ? void 0 : t.position,
      ...h.errToObj(t == null ? void 0 : t.message)
    });
  }
  startsWith(e, t) {
    return this._addCheck({
      kind: "startsWith",
      value: e,
      ...h.errToObj(t)
    });
  }
  endsWith(e, t) {
    return this._addCheck({
      kind: "endsWith",
      value: e,
      ...h.errToObj(t)
    });
  }
  min(e, t) {
    return this._addCheck({
      kind: "min",
      value: e,
      ...h.errToObj(t)
    });
  }
  max(e, t) {
    return this._addCheck({
      kind: "max",
      value: e,
      ...h.errToObj(t)
    });
  }
  length(e, t) {
    return this._addCheck({
      kind: "length",
      value: e,
      ...h.errToObj(t)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(e) {
    return this.min(1, h.errToObj(e));
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
    typeName: g.ZodString,
    coerce: (e = n == null ? void 0 : n.coerce) !== null && e !== void 0 ? e : !1,
    ...v(n)
  });
};
function Dt(n, e) {
  const t = (n.toString().split(".")[1] || "").length, r = (e.toString().split(".")[1] || "").length, s = t > r ? t : r, a = parseInt(n.toFixed(s).replace(".", "")), o = parseInt(e.toFixed(s).replace(".", ""));
  return a % o / Math.pow(10, s);
}
class V extends _ {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e) {
    if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== f.number) {
      const a = this._getOrReturnCtx(e);
      return m(a, {
        code: u.invalid_type,
        expected: f.number,
        received: a.parsedType
      }), y;
    }
    let r;
    const s = new T();
    for (const a of this._def.checks)
      a.kind === "int" ? x.isInteger(e.data) || (r = this._getOrReturnCtx(e, r), m(r, {
        code: u.invalid_type,
        expected: "integer",
        received: "float",
        message: a.message
      }), s.dirty()) : a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (r = this._getOrReturnCtx(e, r), m(r, {
        code: u.too_small,
        minimum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (r = this._getOrReturnCtx(e, r), m(r, {
        code: u.too_big,
        maximum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? Dt(e.data, a.value) !== 0 && (r = this._getOrReturnCtx(e, r), m(r, {
        code: u.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (r = this._getOrReturnCtx(e, r), m(r, {
        code: u.not_finite,
        message: a.message
      }), s.dirty()) : x.assertNever(a);
    return { status: s.value, value: e.data };
  }
  gte(e, t) {
    return this.setLimit("min", e, !0, h.toString(t));
  }
  gt(e, t) {
    return this.setLimit("min", e, !1, h.toString(t));
  }
  lte(e, t) {
    return this.setLimit("max", e, !0, h.toString(t));
  }
  lt(e, t) {
    return this.setLimit("max", e, !1, h.toString(t));
  }
  setLimit(e, t, r, s) {
    return new V({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: t,
          inclusive: r,
          message: h.toString(s)
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
      message: h.toString(e)
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !1,
      message: h.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !1,
      message: h.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !0,
      message: h.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !0,
      message: h.toString(e)
    });
  }
  multipleOf(e, t) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: h.toString(t)
    });
  }
  finite(e) {
    return this._addCheck({
      kind: "finite",
      message: h.toString(e)
    });
  }
  safe(e) {
    return this._addCheck({
      kind: "min",
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: h.toString(e)
    })._addCheck({
      kind: "max",
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: h.toString(e)
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
V.create = (n) => new V({
  checks: [],
  typeName: g.ZodNumber,
  coerce: (n == null ? void 0 : n.coerce) || !1,
  ...v(n)
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
    if (this._getType(e) !== f.bigint)
      return this._getInvalidInput(e);
    let r;
    const s = new T();
    for (const a of this._def.checks)
      a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (r = this._getOrReturnCtx(e, r), m(r, {
        code: u.too_small,
        type: "bigint",
        minimum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (r = this._getOrReturnCtx(e, r), m(r, {
        code: u.too_big,
        type: "bigint",
        maximum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? e.data % a.value !== BigInt(0) && (r = this._getOrReturnCtx(e, r), m(r, {
        code: u.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : x.assertNever(a);
    return { status: s.value, value: e.data };
  }
  _getInvalidInput(e) {
    const t = this._getOrReturnCtx(e);
    return m(t, {
      code: u.invalid_type,
      expected: f.bigint,
      received: t.parsedType
    }), y;
  }
  gte(e, t) {
    return this.setLimit("min", e, !0, h.toString(t));
  }
  gt(e, t) {
    return this.setLimit("min", e, !1, h.toString(t));
  }
  lte(e, t) {
    return this.setLimit("max", e, !0, h.toString(t));
  }
  lt(e, t) {
    return this.setLimit("max", e, !1, h.toString(t));
  }
  setLimit(e, t, r, s) {
    return new F({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: t,
          inclusive: r,
          message: h.toString(s)
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
      message: h.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !1,
      message: h.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !0,
      message: h.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !0,
      message: h.toString(e)
    });
  }
  multipleOf(e, t) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: h.toString(t)
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
F.create = (n) => {
  var e;
  return new F({
    checks: [],
    typeName: g.ZodBigInt,
    coerce: (e = n == null ? void 0 : n.coerce) !== null && e !== void 0 ? e : !1,
    ...v(n)
  });
};
class ae extends _ {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== f.boolean) {
      const r = this._getOrReturnCtx(e);
      return m(r, {
        code: u.invalid_type,
        expected: f.boolean,
        received: r.parsedType
      }), y;
    }
    return I(e.data);
  }
}
ae.create = (n) => new ae({
  typeName: g.ZodBoolean,
  coerce: (n == null ? void 0 : n.coerce) || !1,
  ...v(n)
});
class B extends _ {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== f.date) {
      const a = this._getOrReturnCtx(e);
      return m(a, {
        code: u.invalid_type,
        expected: f.date,
        received: a.parsedType
      }), y;
    }
    if (isNaN(e.data.getTime())) {
      const a = this._getOrReturnCtx(e);
      return m(a, {
        code: u.invalid_date
      }), y;
    }
    const r = new T();
    let s;
    for (const a of this._def.checks)
      a.kind === "min" ? e.data.getTime() < a.value && (s = this._getOrReturnCtx(e, s), m(s, {
        code: u.too_small,
        message: a.message,
        inclusive: !0,
        exact: !1,
        minimum: a.value,
        type: "date"
      }), r.dirty()) : a.kind === "max" ? e.data.getTime() > a.value && (s = this._getOrReturnCtx(e, s), m(s, {
        code: u.too_big,
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
    return new B({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  min(e, t) {
    return this._addCheck({
      kind: "min",
      value: e.getTime(),
      message: h.toString(t)
    });
  }
  max(e, t) {
    return this._addCheck({
      kind: "max",
      value: e.getTime(),
      message: h.toString(t)
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
B.create = (n) => new B({
  checks: [],
  coerce: (n == null ? void 0 : n.coerce) || !1,
  typeName: g.ZodDate,
  ...v(n)
});
class xe extends _ {
  _parse(e) {
    if (this._getType(e) !== f.symbol) {
      const r = this._getOrReturnCtx(e);
      return m(r, {
        code: u.invalid_type,
        expected: f.symbol,
        received: r.parsedType
      }), y;
    }
    return I(e.data);
  }
}
xe.create = (n) => new xe({
  typeName: g.ZodSymbol,
  ...v(n)
});
class ie extends _ {
  _parse(e) {
    if (this._getType(e) !== f.undefined) {
      const r = this._getOrReturnCtx(e);
      return m(r, {
        code: u.invalid_type,
        expected: f.undefined,
        received: r.parsedType
      }), y;
    }
    return I(e.data);
  }
}
ie.create = (n) => new ie({
  typeName: g.ZodUndefined,
  ...v(n)
});
class oe extends _ {
  _parse(e) {
    if (this._getType(e) !== f.null) {
      const r = this._getOrReturnCtx(e);
      return m(r, {
        code: u.invalid_type,
        expected: f.null,
        received: r.parsedType
      }), y;
    }
    return I(e.data);
  }
}
oe.create = (n) => new oe({
  typeName: g.ZodNull,
  ...v(n)
});
class H extends _ {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return I(e.data);
  }
}
H.create = (n) => new H({
  typeName: g.ZodAny,
  ...v(n)
});
class L extends _ {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return I(e.data);
  }
}
L.create = (n) => new L({
  typeName: g.ZodUnknown,
  ...v(n)
});
class $ extends _ {
  _parse(e) {
    const t = this._getOrReturnCtx(e);
    return m(t, {
      code: u.invalid_type,
      expected: f.never,
      received: t.parsedType
    }), y;
  }
}
$.create = (n) => new $({
  typeName: g.ZodNever,
  ...v(n)
});
class ke extends _ {
  _parse(e) {
    if (this._getType(e) !== f.undefined) {
      const r = this._getOrReturnCtx(e);
      return m(r, {
        code: u.invalid_type,
        expected: f.void,
        received: r.parsedType
      }), y;
    }
    return I(e.data);
  }
}
ke.create = (n) => new ke({
  typeName: g.ZodVoid,
  ...v(n)
});
class C extends _ {
  _parse(e) {
    const { ctx: t, status: r } = this._processInputParams(e), s = this._def;
    if (t.parsedType !== f.array)
      return m(t, {
        code: u.invalid_type,
        expected: f.array,
        received: t.parsedType
      }), y;
    if (s.exactLength !== null) {
      const o = t.data.length > s.exactLength.value, c = t.data.length < s.exactLength.value;
      (o || c) && (m(t, {
        code: o ? u.too_big : u.too_small,
        minimum: c ? s.exactLength.value : void 0,
        maximum: o ? s.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: s.exactLength.message
      }), r.dirty());
    }
    if (s.minLength !== null && t.data.length < s.minLength.value && (m(t, {
      code: u.too_small,
      minimum: s.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.minLength.message
    }), r.dirty()), s.maxLength !== null && t.data.length > s.maxLength.value && (m(t, {
      code: u.too_big,
      maximum: s.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.maxLength.message
    }), r.dirty()), t.common.async)
      return Promise.all([...t.data].map((o, c) => s.type._parseAsync(new O(t, o, t.path, c)))).then((o) => T.mergeArray(r, o));
    const a = [...t.data].map((o, c) => s.type._parseSync(new O(t, o, t.path, c)));
    return T.mergeArray(r, a);
  }
  get element() {
    return this._def.type;
  }
  min(e, t) {
    return new C({
      ...this._def,
      minLength: { value: e, message: h.toString(t) }
    });
  }
  max(e, t) {
    return new C({
      ...this._def,
      maxLength: { value: e, message: h.toString(t) }
    });
  }
  length(e, t) {
    return new C({
      ...this._def,
      exactLength: { value: e, message: h.toString(t) }
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
  typeName: g.ZodArray,
  ...v(e)
});
function Q(n) {
  if (n instanceof k) {
    const e = {};
    for (const t in n.shape) {
      const r = n.shape[t];
      e[t] = j.create(Q(r));
    }
    return new k({
      ...n._def,
      shape: () => e
    });
  } else return n instanceof C ? new C({
    ...n._def,
    type: Q(n.element)
  }) : n instanceof j ? j.create(Q(n.unwrap())) : n instanceof U ? U.create(Q(n.unwrap())) : n instanceof E ? E.create(n.items.map((e) => Q(e))) : n;
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
    if (this._getType(e) !== f.object) {
      const d = this._getOrReturnCtx(e);
      return m(d, {
        code: u.invalid_type,
        expected: f.object,
        received: d.parsedType
      }), y;
    }
    const { status: r, ctx: s } = this._processInputParams(e), { shape: a, keys: o } = this._getCached(), c = [];
    if (!(this._def.catchall instanceof $ && this._def.unknownKeys === "strip"))
      for (const d in s.data)
        o.includes(d) || c.push(d);
    const l = [];
    for (const d of o) {
      const p = a[d], b = s.data[d];
      l.push({
        key: { status: "valid", value: d },
        value: p._parse(new O(s, b, s.path, d)),
        alwaysSet: d in s.data
      });
    }
    if (this._def.catchall instanceof $) {
      const d = this._def.unknownKeys;
      if (d === "passthrough")
        for (const p of c)
          l.push({
            key: { status: "valid", value: p },
            value: { status: "valid", value: s.data[p] }
          });
      else if (d === "strict")
        c.length > 0 && (m(s, {
          code: u.unrecognized_keys,
          keys: c
        }), r.dirty());
      else if (d !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const d = this._def.catchall;
      for (const p of c) {
        const b = s.data[p];
        l.push({
          key: { status: "valid", value: p },
          value: d._parse(
            new O(s, b, s.path, p)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: p in s.data
        });
      }
    }
    return s.common.async ? Promise.resolve().then(async () => {
      const d = [];
      for (const p of l) {
        const b = await p.key, w = await p.value;
        d.push({
          key: b,
          value: w,
          alwaysSet: p.alwaysSet
        });
      }
      return d;
    }).then((d) => T.mergeObjectSync(r, d)) : T.mergeObjectSync(r, l);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return h.errToObj, new k({
      ...this._def,
      unknownKeys: "strict",
      ...e !== void 0 ? {
        errorMap: (t, r) => {
          var s, a, o, c;
          const l = (o = (a = (s = this._def).errorMap) === null || a === void 0 ? void 0 : a.call(s, t, r).message) !== null && o !== void 0 ? o : r.defaultError;
          return t.code === "unrecognized_keys" ? {
            message: (c = h.errToObj(e).message) !== null && c !== void 0 ? c : l
          } : {
            message: l
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
      typeName: g.ZodObject
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
    return x.objectKeys(e).forEach((r) => {
      e[r] && this.shape[r] && (t[r] = this.shape[r]);
    }), new k({
      ...this._def,
      shape: () => t
    });
  }
  omit(e) {
    const t = {};
    return x.objectKeys(this.shape).forEach((r) => {
      e[r] || (t[r] = this.shape[r]);
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
    return x.objectKeys(this.shape).forEach((r) => {
      const s = this.shape[r];
      e && !e[r] ? t[r] = s : t[r] = s.optional();
    }), new k({
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
        for (; a instanceof j; )
          a = a._def.innerType;
        t[r] = a;
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
k.create = (n, e) => new k({
  shape: () => n,
  unknownKeys: "strip",
  catchall: $.create(),
  typeName: g.ZodObject,
  ...v(e)
});
k.strictCreate = (n, e) => new k({
  shape: () => n,
  unknownKeys: "strict",
  catchall: $.create(),
  typeName: g.ZodObject,
  ...v(e)
});
k.lazycreate = (n, e) => new k({
  shape: n,
  unknownKeys: "strip",
  catchall: $.create(),
  typeName: g.ZodObject,
  ...v(e)
});
class ce extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e), r = this._def.options;
    function s(a) {
      for (const c of a)
        if (c.result.status === "valid")
          return c.result;
      for (const c of a)
        if (c.result.status === "dirty")
          return t.common.issues.push(...c.ctx.common.issues), c.result;
      const o = a.map((c) => new N(c.ctx.common.issues));
      return m(t, {
        code: u.invalid_union,
        unionErrors: o
      }), y;
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
      for (const l of r) {
        const d = {
          ...t,
          common: {
            ...t.common,
            issues: []
          },
          parent: null
        }, p = l._parseSync({
          data: t.data,
          path: t.path,
          parent: d
        });
        if (p.status === "valid")
          return p;
        p.status === "dirty" && !a && (a = { result: p, ctx: d }), d.common.issues.length && o.push(d.common.issues);
      }
      if (a)
        return t.common.issues.push(...a.ctx.common.issues), a.result;
      const c = o.map((l) => new N(l));
      return m(t, {
        code: u.invalid_union,
        unionErrors: c
      }), y;
    }
  }
  get options() {
    return this._def.options;
  }
}
ce.create = (n, e) => new ce({
  options: n,
  typeName: g.ZodUnion,
  ...v(e)
});
const P = (n) => n instanceof le ? P(n.schema) : n instanceof Z ? P(n.innerType()) : n instanceof me ? [n.value] : n instanceof z ? n.options : n instanceof fe ? x.objectValues(n.enum) : n instanceof pe ? P(n._def.innerType) : n instanceof ie ? [void 0] : n instanceof oe ? [null] : n instanceof j ? [void 0, ...P(n.unwrap())] : n instanceof U ? [null, ...P(n.unwrap())] : n instanceof Ee || n instanceof ge ? P(n.unwrap()) : n instanceof he ? P(n._def.innerType) : [];
class Ie extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== f.object)
      return m(t, {
        code: u.invalid_type,
        expected: f.object,
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
    }) : (m(t, {
      code: u.invalid_union_discriminator,
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
      const o = P(a.shape[e]);
      if (!o.length)
        throw new Error(`A discriminator value for key \`${e}\` could not be extracted from all schema options`);
      for (const c of o) {
        if (s.has(c))
          throw new Error(`Discriminator property ${String(e)} has duplicate value ${String(c)}`);
        s.set(c, a);
      }
    }
    return new Ie({
      typeName: g.ZodDiscriminatedUnion,
      discriminator: e,
      options: t,
      optionsMap: s,
      ...v(r)
    });
  }
}
function Oe(n, e) {
  const t = R(n), r = R(e);
  if (n === e)
    return { valid: !0, data: n };
  if (t === f.object && r === f.object) {
    const s = x.objectKeys(e), a = x.objectKeys(n).filter((c) => s.indexOf(c) !== -1), o = { ...n, ...e };
    for (const c of a) {
      const l = Oe(n[c], e[c]);
      if (!l.valid)
        return { valid: !1 };
      o[c] = l.data;
    }
    return { valid: !0, data: o };
  } else if (t === f.array && r === f.array) {
    if (n.length !== e.length)
      return { valid: !1 };
    const s = [];
    for (let a = 0; a < n.length; a++) {
      const o = n[a], c = e[a], l = Oe(o, c);
      if (!l.valid)
        return { valid: !1 };
      s.push(l.data);
    }
    return { valid: !0, data: s };
  } else return t === f.date && r === f.date && +n == +e ? { valid: !0, data: n } : { valid: !1 };
}
class de extends _ {
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e), s = (a, o) => {
      if (De(a) || De(o))
        return y;
      const c = Oe(a.value, o.value);
      return c.valid ? ((je(a) || je(o)) && t.dirty(), { status: t.value, value: c.data }) : (m(r, {
        code: u.invalid_intersection_types
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
de.create = (n, e, t) => new de({
  left: n,
  right: e,
  typeName: g.ZodIntersection,
  ...v(t)
});
class E extends _ {
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e);
    if (r.parsedType !== f.array)
      return m(r, {
        code: u.invalid_type,
        expected: f.array,
        received: r.parsedType
      }), y;
    if (r.data.length < this._def.items.length)
      return m(r, {
        code: u.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), y;
    !this._def.rest && r.data.length > this._def.items.length && (m(r, {
      code: u.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), t.dirty());
    const a = [...r.data].map((o, c) => {
      const l = this._def.items[c] || this._def.rest;
      return l ? l._parse(new O(r, o, r.path, c)) : null;
    }).filter((o) => !!o);
    return r.common.async ? Promise.all(a).then((o) => T.mergeArray(t, o)) : T.mergeArray(t, a);
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
    typeName: g.ZodTuple,
    rest: null,
    ...v(e)
  });
};
class ue extends _ {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e);
    if (r.parsedType !== f.object)
      return m(r, {
        code: u.invalid_type,
        expected: f.object,
        received: r.parsedType
      }), y;
    const s = [], a = this._def.keyType, o = this._def.valueType;
    for (const c in r.data)
      s.push({
        key: a._parse(new O(r, c, r.path, c)),
        value: o._parse(new O(r, r.data[c], r.path, c)),
        alwaysSet: c in r.data
      });
    return r.common.async ? T.mergeObjectAsync(t, s) : T.mergeObjectSync(t, s);
  }
  get element() {
    return this._def.valueType;
  }
  static create(e, t, r) {
    return t instanceof _ ? new ue({
      keyType: e,
      valueType: t,
      typeName: g.ZodRecord,
      ...v(r)
    }) : new ue({
      keyType: S.create(),
      valueType: e,
      typeName: g.ZodRecord,
      ...v(t)
    });
  }
}
class we extends _ {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e);
    if (r.parsedType !== f.map)
      return m(r, {
        code: u.invalid_type,
        expected: f.map,
        received: r.parsedType
      }), y;
    const s = this._def.keyType, a = this._def.valueType, o = [...r.data.entries()].map(([c, l], d) => ({
      key: s._parse(new O(r, c, r.path, [d, "key"])),
      value: a._parse(new O(r, l, r.path, [d, "value"]))
    }));
    if (r.common.async) {
      const c = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const l of o) {
          const d = await l.key, p = await l.value;
          if (d.status === "aborted" || p.status === "aborted")
            return y;
          (d.status === "dirty" || p.status === "dirty") && t.dirty(), c.set(d.value, p.value);
        }
        return { status: t.value, value: c };
      });
    } else {
      const c = /* @__PURE__ */ new Map();
      for (const l of o) {
        const d = l.key, p = l.value;
        if (d.status === "aborted" || p.status === "aborted")
          return y;
        (d.status === "dirty" || p.status === "dirty") && t.dirty(), c.set(d.value, p.value);
      }
      return { status: t.value, value: c };
    }
  }
}
we.create = (n, e, t) => new we({
  valueType: e,
  keyType: n,
  typeName: g.ZodMap,
  ...v(t)
});
class W extends _ {
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e);
    if (r.parsedType !== f.set)
      return m(r, {
        code: u.invalid_type,
        expected: f.set,
        received: r.parsedType
      }), y;
    const s = this._def;
    s.minSize !== null && r.data.size < s.minSize.value && (m(r, {
      code: u.too_small,
      minimum: s.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.minSize.message
    }), t.dirty()), s.maxSize !== null && r.data.size > s.maxSize.value && (m(r, {
      code: u.too_big,
      maximum: s.maxSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.maxSize.message
    }), t.dirty());
    const a = this._def.valueType;
    function o(l) {
      const d = /* @__PURE__ */ new Set();
      for (const p of l) {
        if (p.status === "aborted")
          return y;
        p.status === "dirty" && t.dirty(), d.add(p.value);
      }
      return { status: t.value, value: d };
    }
    const c = [...r.data.values()].map((l, d) => a._parse(new O(r, l, r.path, d)));
    return r.common.async ? Promise.all(c).then((l) => o(l)) : o(c);
  }
  min(e, t) {
    return new W({
      ...this._def,
      minSize: { value: e, message: h.toString(t) }
    });
  }
  max(e, t) {
    return new W({
      ...this._def,
      maxSize: { value: e, message: h.toString(t) }
    });
  }
  size(e, t) {
    return this.min(e, t).max(e, t);
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
W.create = (n, e) => new W({
  valueType: n,
  minSize: null,
  maxSize: null,
  typeName: g.ZodSet,
  ...v(e)
});
class J extends _ {
  constructor() {
    super(...arguments), this.validate = this.implement;
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== f.function)
      return m(t, {
        code: u.invalid_type,
        expected: f.function,
        received: t.parsedType
      }), y;
    function r(c, l) {
      return _e({
        data: c,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          ve(),
          X
        ].filter((d) => !!d),
        issueData: {
          code: u.invalid_arguments,
          argumentsError: l
        }
      });
    }
    function s(c, l) {
      return _e({
        data: c,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          ve(),
          X
        ].filter((d) => !!d),
        issueData: {
          code: u.invalid_return_type,
          returnTypeError: l
        }
      });
    }
    const a = { errorMap: t.common.contextualErrorMap }, o = t.data;
    if (this._def.returns instanceof G) {
      const c = this;
      return I(async function(...l) {
        const d = new N([]), p = await c._def.args.parseAsync(l, a).catch((A) => {
          throw d.addIssue(r(l, A)), d;
        }), b = await Reflect.apply(o, this, p);
        return await c._def.returns._def.type.parseAsync(b, a).catch((A) => {
          throw d.addIssue(s(b, A)), d;
        });
      });
    } else {
      const c = this;
      return I(function(...l) {
        const d = c._def.args.safeParse(l, a);
        if (!d.success)
          throw new N([r(l, d.error)]);
        const p = Reflect.apply(o, this, d.data), b = c._def.returns.safeParse(p, a);
        if (!b.success)
          throw new N([s(p, b.error)]);
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
      args: E.create(e).rest(L.create())
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
      args: e || E.create([]).rest(L.create()),
      returns: t || L.create(),
      typeName: g.ZodFunction,
      ...v(r)
    });
  }
}
class le extends _ {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    return this._def.getter()._parse({ data: t.data, path: t.path, parent: t });
  }
}
le.create = (n, e) => new le({
  getter: n,
  typeName: g.ZodLazy,
  ...v(e)
});
class me extends _ {
  _parse(e) {
    if (e.data !== this._def.value) {
      const t = this._getOrReturnCtx(e);
      return m(t, {
        received: t.data,
        code: u.invalid_literal,
        expected: this._def.value
      }), y;
    }
    return { status: "valid", value: e.data };
  }
  get value() {
    return this._def.value;
  }
}
me.create = (n, e) => new me({
  value: n,
  typeName: g.ZodLiteral,
  ...v(e)
});
function Be(n, e) {
  return new z({
    values: n,
    typeName: g.ZodEnum,
    ...v(e)
  });
}
class z extends _ {
  constructor() {
    super(...arguments), te.set(this, void 0);
  }
  _parse(e) {
    if (typeof e.data != "string") {
      const t = this._getOrReturnCtx(e), r = this._def.values;
      return m(t, {
        expected: x.joinValues(r),
        received: t.parsedType,
        code: u.invalid_type
      }), y;
    }
    if (be(this, te) || ze(this, te, new Set(this._def.values)), !be(this, te).has(e.data)) {
      const t = this._getOrReturnCtx(e), r = this._def.values;
      return m(t, {
        received: t.data,
        code: u.invalid_enum_value,
        options: r
      }), y;
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
    return z.create(this.options.filter((r) => !e.includes(r)), {
      ...this._def,
      ...t
    });
  }
}
te = /* @__PURE__ */ new WeakMap();
z.create = Be;
class fe extends _ {
  constructor() {
    super(...arguments), ne.set(this, void 0);
  }
  _parse(e) {
    const t = x.getValidEnumValues(this._def.values), r = this._getOrReturnCtx(e);
    if (r.parsedType !== f.string && r.parsedType !== f.number) {
      const s = x.objectValues(t);
      return m(r, {
        expected: x.joinValues(s),
        received: r.parsedType,
        code: u.invalid_type
      }), y;
    }
    if (be(this, ne) || ze(this, ne, new Set(x.getValidEnumValues(this._def.values))), !be(this, ne).has(e.data)) {
      const s = x.objectValues(t);
      return m(r, {
        received: r.data,
        code: u.invalid_enum_value,
        options: s
      }), y;
    }
    return I(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
ne = /* @__PURE__ */ new WeakMap();
fe.create = (n, e) => new fe({
  values: n,
  typeName: g.ZodNativeEnum,
  ...v(e)
});
class G extends _ {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== f.promise && t.common.async === !1)
      return m(t, {
        code: u.invalid_type,
        expected: f.promise,
        received: t.parsedType
      }), y;
    const r = t.parsedType === f.promise ? t.data : Promise.resolve(t.data);
    return I(r.then((s) => this._def.type.parseAsync(s, {
      path: t.path,
      errorMap: t.common.contextualErrorMap
    })));
  }
}
G.create = (n, e) => new G({
  type: n,
  typeName: g.ZodPromise,
  ...v(e)
});
class Z extends _ {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === g.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e), s = this._def.effect || null, a = {
      addIssue: (o) => {
        m(r, o), o.fatal ? t.abort() : t.dirty();
      },
      get path() {
        return r.path;
      }
    };
    if (a.addIssue = a.addIssue.bind(a), s.type === "preprocess") {
      const o = s.transform(r.data, a);
      if (r.common.async)
        return Promise.resolve(o).then(async (c) => {
          if (t.value === "aborted")
            return y;
          const l = await this._def.schema._parseAsync({
            data: c,
            path: r.path,
            parent: r
          });
          return l.status === "aborted" ? y : l.status === "dirty" || t.value === "dirty" ? Y(l.value) : l;
        });
      {
        if (t.value === "aborted")
          return y;
        const c = this._def.schema._parseSync({
          data: o,
          path: r.path,
          parent: r
        });
        return c.status === "aborted" ? y : c.status === "dirty" || t.value === "dirty" ? Y(c.value) : c;
      }
    }
    if (s.type === "refinement") {
      const o = (c) => {
        const l = s.refinement(c, a);
        if (r.common.async)
          return Promise.resolve(l);
        if (l instanceof Promise)
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return c;
      };
      if (r.common.async === !1) {
        const c = this._def.schema._parseSync({
          data: r.data,
          path: r.path,
          parent: r
        });
        return c.status === "aborted" ? y : (c.status === "dirty" && t.dirty(), o(c.value), { status: t.value, value: c.value });
      } else
        return this._def.schema._parseAsync({ data: r.data, path: r.path, parent: r }).then((c) => c.status === "aborted" ? y : (c.status === "dirty" && t.dirty(), o(c.value).then(() => ({ status: t.value, value: c.value }))));
    }
    if (s.type === "transform")
      if (r.common.async === !1) {
        const o = this._def.schema._parseSync({
          data: r.data,
          path: r.path,
          parent: r
        });
        if (!q(o))
          return o;
        const c = s.transform(o.value, a);
        if (c instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: t.value, value: c };
      } else
        return this._def.schema._parseAsync({ data: r.data, path: r.path, parent: r }).then((o) => q(o) ? Promise.resolve(s.transform(o.value, a)).then((c) => ({ status: t.value, value: c })) : o);
    x.assertNever(s);
  }
}
Z.create = (n, e, t) => new Z({
  schema: n,
  typeName: g.ZodEffects,
  effect: e,
  ...v(t)
});
Z.createWithPreprocess = (n, e, t) => new Z({
  schema: e,
  effect: { type: "preprocess", transform: n },
  typeName: g.ZodEffects,
  ...v(t)
});
class j extends _ {
  _parse(e) {
    return this._getType(e) === f.undefined ? I(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
j.create = (n, e) => new j({
  innerType: n,
  typeName: g.ZodOptional,
  ...v(e)
});
class U extends _ {
  _parse(e) {
    return this._getType(e) === f.null ? I(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
U.create = (n, e) => new U({
  innerType: n,
  typeName: g.ZodNullable,
  ...v(e)
});
class pe extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    let r = t.data;
    return t.parsedType === f.undefined && (r = this._def.defaultValue()), this._def.innerType._parse({
      data: r,
      path: t.path,
      parent: t
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
pe.create = (n, e) => new pe({
  innerType: n,
  typeName: g.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...v(e)
});
class he extends _ {
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
    return se(s) ? s.then((a) => ({
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new N(r.common.issues);
        },
        input: r.data
      })
    })) : {
      status: "valid",
      value: s.status === "valid" ? s.value : this._def.catchValue({
        get error() {
          return new N(r.common.issues);
        },
        input: r.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
he.create = (n, e) => new he({
  innerType: n,
  typeName: g.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...v(e)
});
class Te extends _ {
  _parse(e) {
    if (this._getType(e) !== f.nan) {
      const r = this._getOrReturnCtx(e);
      return m(r, {
        code: u.invalid_type,
        expected: f.nan,
        received: r.parsedType
      }), y;
    }
    return { status: "valid", value: e.data };
  }
}
Te.create = (n) => new Te({
  typeName: g.ZodNaN,
  ...v(n)
});
const jt = Symbol("zod_brand");
class Ee extends _ {
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
class ye extends _ {
  _parse(e) {
    const { status: t, ctx: r } = this._processInputParams(e);
    if (r.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: r.data,
          path: r.path,
          parent: r
        });
        return a.status === "aborted" ? y : a.status === "dirty" ? (t.dirty(), Y(a.value)) : this._def.out._parseAsync({
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
    return new ye({
      in: e,
      out: t,
      typeName: g.ZodPipeline
    });
  }
}
class ge extends _ {
  _parse(e) {
    const t = this._def.innerType._parse(e), r = (s) => (q(s) && (s.value = Object.freeze(s.value)), s);
    return se(t) ? t.then((s) => r(s)) : r(t);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ge.create = (n, e) => new ge({
  innerType: n,
  typeName: g.ZodReadonly,
  ...v(e)
});
function $e(n, e) {
  const t = typeof n == "function" ? n(e) : typeof n == "string" ? { message: n } : n;
  return typeof t == "string" ? { message: t } : t;
}
function We(n, e = {}, t) {
  return n ? H.create().superRefine((r, s) => {
    var a, o;
    const c = n(r);
    if (c instanceof Promise)
      return c.then((l) => {
        var d, p;
        if (!l) {
          const b = $e(e, r), w = (p = (d = b.fatal) !== null && d !== void 0 ? d : t) !== null && p !== void 0 ? p : !0;
          s.addIssue({ code: "custom", ...b, fatal: w });
        }
      });
    if (!c) {
      const l = $e(e, r), d = (o = (a = l.fatal) !== null && a !== void 0 ? a : t) !== null && o !== void 0 ? o : !0;
      s.addIssue({ code: "custom", ...l, fatal: d });
    }
  }) : H.create();
}
const Ot = {
  object: k.lazycreate
};
var g;
(function(n) {
  n.ZodString = "ZodString", n.ZodNumber = "ZodNumber", n.ZodNaN = "ZodNaN", n.ZodBigInt = "ZodBigInt", n.ZodBoolean = "ZodBoolean", n.ZodDate = "ZodDate", n.ZodSymbol = "ZodSymbol", n.ZodUndefined = "ZodUndefined", n.ZodNull = "ZodNull", n.ZodAny = "ZodAny", n.ZodUnknown = "ZodUnknown", n.ZodNever = "ZodNever", n.ZodVoid = "ZodVoid", n.ZodArray = "ZodArray", n.ZodObject = "ZodObject", n.ZodUnion = "ZodUnion", n.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", n.ZodIntersection = "ZodIntersection", n.ZodTuple = "ZodTuple", n.ZodRecord = "ZodRecord", n.ZodMap = "ZodMap", n.ZodSet = "ZodSet", n.ZodFunction = "ZodFunction", n.ZodLazy = "ZodLazy", n.ZodLiteral = "ZodLiteral", n.ZodEnum = "ZodEnum", n.ZodEffects = "ZodEffects", n.ZodNativeEnum = "ZodNativeEnum", n.ZodOptional = "ZodOptional", n.ZodNullable = "ZodNullable", n.ZodDefault = "ZodDefault", n.ZodCatch = "ZodCatch", n.ZodPromise = "ZodPromise", n.ZodBranded = "ZodBranded", n.ZodPipeline = "ZodPipeline", n.ZodReadonly = "ZodReadonly";
})(g || (g = {}));
const Et = (n, e = {
  message: `Input not instance of ${n.name}`
}) => We((t) => t instanceof n, e), Qe = S.create, Ye = V.create, Pt = Te.create, Rt = F.create, Je = ae.create, Mt = B.create, $t = xe.create, Vt = ie.create, Ft = oe.create, zt = H.create, Ut = L.create, Lt = $.create, qt = ke.create, Bt = C.create, Wt = k.create, Qt = k.strictCreate, Yt = ce.create, Jt = Ie.create, Xt = de.create, Ht = E.create, Gt = ue.create, Kt = we.create, en = W.create, tn = J.create, nn = le.create, rn = me.create, sn = z.create, an = fe.create, on = G.create, Ve = Z.create, cn = j.create, dn = U.create, un = Z.createWithPreprocess, ln = ye.create, mn = () => Qe().optional(), fn = () => Ye().optional(), pn = () => Je().optional(), hn = {
  string: (n) => S.create({ ...n, coerce: !0 }),
  number: (n) => V.create({ ...n, coerce: !0 }),
  boolean: (n) => ae.create({
    ...n,
    coerce: !0
  }),
  bigint: (n) => F.create({ ...n, coerce: !0 }),
  date: (n) => B.create({ ...n, coerce: !0 })
}, gn = y;
var i = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  defaultErrorMap: X,
  setErrorMap: dt,
  getErrorMap: ve,
  makeIssue: _e,
  EMPTY_PATH: ut,
  addIssueToContext: m,
  ParseStatus: T,
  INVALID: y,
  DIRTY: Y,
  OK: I,
  isAborted: De,
  isDirty: je,
  isValid: q,
  isAsync: se,
  get util() {
    return x;
  },
  get objectUtil() {
    return Ze;
  },
  ZodParsedType: f,
  getParsedType: R,
  ZodType: _,
  datetimeRegex: qe,
  ZodString: S,
  ZodNumber: V,
  ZodBigInt: F,
  ZodBoolean: ae,
  ZodDate: B,
  ZodSymbol: xe,
  ZodUndefined: ie,
  ZodNull: oe,
  ZodAny: H,
  ZodUnknown: L,
  ZodNever: $,
  ZodVoid: ke,
  ZodArray: C,
  ZodObject: k,
  ZodUnion: ce,
  ZodDiscriminatedUnion: Ie,
  ZodIntersection: de,
  ZodTuple: E,
  ZodRecord: ue,
  ZodMap: we,
  ZodSet: W,
  ZodFunction: J,
  ZodLazy: le,
  ZodLiteral: me,
  ZodEnum: z,
  ZodNativeEnum: fe,
  ZodPromise: G,
  ZodEffects: Z,
  ZodTransformer: Z,
  ZodOptional: j,
  ZodNullable: U,
  ZodDefault: pe,
  ZodCatch: he,
  ZodNaN: Te,
  BRAND: jt,
  ZodBranded: Ee,
  ZodPipeline: ye,
  ZodReadonly: ge,
  custom: We,
  Schema: _,
  ZodSchema: _,
  late: Ot,
  get ZodFirstPartyTypeKind() {
    return g;
  },
  coerce: hn,
  any: zt,
  array: Bt,
  bigint: Rt,
  boolean: Je,
  date: Mt,
  discriminatedUnion: Jt,
  effect: Ve,
  enum: sn,
  function: tn,
  instanceof: Et,
  intersection: Xt,
  lazy: nn,
  literal: rn,
  map: Kt,
  nan: Pt,
  nativeEnum: an,
  never: Lt,
  null: Ft,
  nullable: dn,
  number: Ye,
  object: Wt,
  oboolean: pn,
  onumber: fn,
  optional: cn,
  ostring: mn,
  pipeline: ln,
  preprocess: un,
  promise: on,
  record: Gt,
  set: en,
  strictObject: Qt,
  string: Qe,
  symbol: $t,
  transformer: Ve,
  tuple: Ht,
  undefined: Vt,
  union: Yt,
  unknown: Ut,
  void: qt,
  NEVER: gn,
  ZodIssueCode: u,
  quotelessJson: ct,
  ZodError: N
});
const Xe = i.object({
  country: i.string().optional(),
  city: i.string().optional(),
  street: i.string().optional(),
  streetNumber: i.string().optional(),
  floor: i.string().optional(),
  apartmentEnterNumber: i.string().optional(),
  apartmentNumber: i.string().optional()
}), M = i.string().min(1, { message: "שדה חובה" }), En = i.string().regex(/^\d+$/, "Must be a numeric string"), Pn = i.object({ url: i.string().url(), id: i.string() });
function Rn(n) {
  return !!(n != null && n.url);
}
const re = i.object({
  lang: i.enum(["he"]),
  value: i.string()
}), Mn = i.array(re), He = i.object({
  id: i.string().min(1),
  companyId: i.string().min(1),
  storeId: i.string().min(1),
  parentId: i.string().nullish(),
  tag: i.string().optional(),
  locales: i.array(re),
  depth: i.number()
}), Pe = He.extend({
  children: i.lazy(() => Pe.array())
}), $n = He.extend({
  index: i.number(),
  depth: i.number(),
  collapsed: i.boolean().optional(),
  children: i.array(Pe)
}), ee = i.string().min(1), Ge = i.object({
  type: i.literal("Product"),
  storeId: ee,
  companyId: ee,
  id: ee,
  objectID: ee,
  sku: ee,
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
  categoryList: i.array(Pe).optional(),
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
}), Vn = Ge.extend({
  image: i.instanceof(File).optional()
}), Ke = i.object({
  product: Ge,
  originalPrice: i.number().optional(),
  finalPrice: i.number().optional(),
  finalDiscount: i.number().optional(),
  amount: i.number().positive({ message: "Quantity must be a positive number." })
}), Fn = i.object({
  type: i.literal("Cart"),
  id: i.string().uuid(),
  companyId: i.string().uuid(),
  storeId: i.string().uuid(),
  userId: i.string().uuid(),
  status: i.enum(["active", "draft", "completed"]),
  items: i.array(Ke)
}), zn = i.object({
  id: i.string(),
  name: i.string(),
  websiteDomains: i.array(i.string())
}), Un = i.object({
  type: i.literal("FavoriteProduct"),
  id: i.string().uuid(),
  companyId: i.string().uuid(),
  storeId: i.string().uuid(),
  userId: i.string().uuid(),
  productId: i.string().uuid()
}), et = i.enum(["default", "delayed"], {
  description: "delayed is J5 transaction"
}), yn = i.object({
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
  address: Xe.optional(),
  isAnonymous: i.boolean(),
  createdDate: i.number(),
  lastActivityDate: i.number(),
  paymentType: et,
  organizationId: i.string().optional().nullable()
});
function Ln() {
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
    paymentType: et.Values.default
  };
}
const tt = i.object({
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
}), vn = i.object({
  doc_uuid: i.string().uuid("Document UUID must be a valid UUID"),
  pdf_link: i.string().url("PDF link must be a valid URL"),
  pdf_link_copy: i.string().url("PDF copy link must be a valid URL"),
  doc_number: i.string().min(1, "Document number is required"),
  sent_mails: i.array(i.string().email("Each email must be valid")),
  success: i.boolean(),
  ua_uuid: i.string().uuid("UA UUID must be a valid UUID"),
  calculatedData: tt,
  warning: i.string().optional(),
  date: i.number().optional()
}), _n = i.object({
  id: i.string().min(1, "ID is required"),
  number: i.string().min(1, "Number is required"),
  date: i.number().min(1, "Date is required"),
  createdAt: i.number().min(1, "Created at is required"),
  status: i.enum(["pending", "paid", "cancelled"]),
  companyDetails: i.object({
    name: i.string().min(1, "Name is required").optional(),
    address: i.string().min(1, "Address is required").optional(),
    phone: i.string().min(1, "Phone is required").optional(),
    email: i.string().email("Email must be valid").optional()
  }).optional(),
  clientDetails: i.object({
    name: i.string().min(1, "Name is required").optional(),
    address: i.string().min(1, "Address is required").optional(),
    phone: i.string().min(1, "Phone is required").optional(),
    email: i.string().email("Email must be valid").optional()
  }).optional(),
  items: i.array(
    i.object({
      name: i.string().min(1, "Name is required").optional(),
      price: i.number().min(1, "Price is required").optional(),
      quantity: i.number().min(1, "Quantity is required").optional(),
      total: i.number().min(1, "Total is required").optional()
    })
  ).optional(),
  total: i.number().min(1, "Total is required").optional(),
  vat: i.number().min(1, "VAT is required").optional(),
  link: i.string().url("Link must be a valid URL").optional()
}), nt = i.object({
  number: i.string(),
  name: i.string(),
  id: i.string()
}), bn = i.object({
  id: i.string(),
  name: i.string(),
  discountPercentage: i.number().positive().min(0).max(100).optional(),
  nameOnInvoice: i.string().optional(),
  billingAccounts: i.array(nt),
  paymentType: i.enum(["default", "delayed"])
}), qn = bn.omit({ id: !0 }), xn = i.object({
  doc_uuid: i.string().uuid("Document UUID must be a valid UUID"),
  pdf_link: i.string().url("PDF link must be a valid URL"),
  pdf_link_copy: i.string().url("PDF copy link must be a valid URL"),
  doc_number: i.string().min(1, "Document number is required"),
  sent_mails: i.array(i.string().email("Each email must be valid")),
  success: i.boolean(),
  ua_uuid: i.string().uuid("UA UUID must be a valid UUID"),
  calculatedData: tt,
  warning: i.string().optional(),
  date: i.number().optional()
}), kn = i.object({
  id: i.string().min(1, "ID is required"),
  number: i.string().min(1, "Number is required"),
  date: i.string().min(1, "Date is required"),
  createdAt: i.number().min(1, "Created at is required"),
  status: i.enum(["pending", "paid", "cancelled"]),
  companyDetails: i.object({
    name: i.string().min(1, "Name is required").optional(),
    address: i.string().min(1, "Address is required").optional(),
    phone: i.string().min(1, "Phone is required").optional(),
    email: i.string().email("Email must be valid").optional()
  }).optional(),
  clientDetails: i.object({
    name: i.string().min(1, "Name is required").optional(),
    address: i.string().min(1, "Address is required").optional(),
    phone: i.string().min(1, "Phone is required").optional(),
    email: i.string().email("Email must be valid").optional()
  }).optional(),
  items: i.array(
    i.object({
      name: i.string().min(1, "Name is required").optional(),
      price: i.number().min(1, "Price is required").optional(),
      quantity: i.number().min(1, "Quantity is required").optional(),
      total: i.number().min(1, "Total is required").optional()
    })
  ).optional(),
  total: i.number().min(1, "Total is required").optional(),
  vat: i.number().min(1, "VAT is required").optional(),
  link: i.string().url("Link must be a valid URL").optional()
}), Bn = i.object({
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
  paymentType: i.enum(["internal", "external"]).optional(),
  paymentStatus: i.enum(["pending", "pending_j5", "external", "completed", "failed", "refunded"]),
  //todo check if hyp support partial refund
  cart: i.object({
    id: i.string(),
    items: i.array(Ke),
    cartDiscount: i.number(),
    cartTotal: i.number(),
    cartVat: i.number(),
    deliveryPrice: i.number().optional()
    // final delivery price for cart
  }),
  storeOptions: i.object({
    deliveryPrice: i.number().optional(),
    freeDeliveryPrice: i.number().optional(),
    isVatIncludedInPrice: i.boolean().optional()
  }).optional(),
  orderDeliveryPrice: i.number().optional(),
  // delivery price for order
  originalAmount: i.number().positive().optional(),
  // what client pay
  actualAmount: i.number().positive().optional(),
  // what store charge
  date: i.number(),
  deliveryDate: i.coerce.number(),
  client: yn.required({}),
  nameOnInvoice: i.string().optional(),
  clientComment: i.string().optional(),
  organizationId: i.string().optional(),
  billingAccount: nt.optional(),
  deliveryNote: _n.optional(),
  invoice: kn.optional(),
  ezInvoice: xn.optional(),
  ezDeliveryNote: vn.optional()
}), wn = i.enum(["individual", "company"]), Wn = i.object({
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
  clientTypes: i.array(wn),
  minimumOrder: i.number().optional(),
  freeDeliveryPrice: i.number().optional(),
  deliveryPrice: i.number().optional(),
  address: Xe.optional(),
  companyNumber: i.string().optional()
  // חפ של החברה
}), Tn = i.object({
  minSpend: i.number().positive().optional(),
  stackable: i.boolean().default(!1)
}).optional(), In = i.discriminatedUnion("variantType", [
  i.object({
    variantType: i.literal("bundle"),
    productsId: i.array(i.string().nonempty()).min(1),
    // Which products are included
    requiredQuantity: i.number().positive(),
    // How many items needed (e.g., 3)
    bundlePrice: i.number().positive()
    // Total price for the bundle (e.g., $25)
  })
]), Qn = i.object({
  type: i.literal("Discount"),
  storeId: i.string().min(1),
  companyId: i.string().min(1),
  id: i.string().min(1),
  name: i.array(i.object({ lang: i.enum(["he"]), value: i.string().nonempty() })),
  active: i.boolean(),
  startDate: i.number(),
  endDate: i.number(),
  variant: In,
  conditions: Tn
});
class An {
  canApply(e, t) {
    if (e.variant.variantType !== "bundle" || !this.isDiscountActive(e)) return !1;
    const { productsId: r, requiredQuantity: s } = e.variant;
    return this.getTotalQuantity(t.cart, r) >= s;
  }
  calculate(e, t) {
    if (e.variant.variantType !== "bundle")
      return { applicable: !1, discountAmount: 0, affectedItems: [] };
    const { productsId: r, requiredQuantity: s, bundlePrice: a } = e.variant, o = t.cart.filter((K) => r.includes(K.product.id)), c = this.getTotalQuantity(t.cart, r), l = Math.floor(c / s);
    if (l === 0)
      return { applicable: !1, discountAmount: 0, affectedItems: [] };
    const d = this.calculateOriginalPrice(o), p = this.getTotalQuantity(t.cart, r), b = this.calculateDiscountedPrice(
      d,
      a,
      l,
      s,
      p
    ), w = d - b, A = this.distributeDiscount(o, w, d);
    return {
      applicable: !0,
      discountAmount: Number(w.toFixed(2)),
      affectedItems: A
    };
  }
  isDiscountActive(e) {
    const t = Date.now();
    return e.active && e.startDate <= t && e.endDate >= t;
  }
  getTotalQuantity(e, t) {
    return e.filter((r) => t.includes(r.product.id)).reduce((r, s) => r + s.amount, 0);
  }
  calculateOriginalPrice(e) {
    return e.reduce((t, r) => t + r.product.price * r.amount, 0);
  }
  calculateDiscountedPrice(e, t, r, s, a) {
    const o = t * r, c = r * s, d = Math.max(0, a - c) / a * e;
    return o + d;
  }
  distributeDiscount(e, t, r) {
    const s = t / r;
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
class rt {
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
Re(rt, "strategies", /* @__PURE__ */ new Map([
  ["bundle", new An()]
]));
class Nn {
  static calculateDiscounts(e, t, r) {
    var d, p;
    const s = {
      cart: e,
      user: r,
      appliedDiscounts: []
    }, a = this.filterActiveDiscounts(t), o = [];
    for (const b of a) {
      const w = rt.getStrategy(b);
      if (!w || !w.canApply(b, s) || !((d = b.conditions) != null && d.stackable) && o.length > 0) continue;
      const A = w.calculate(b, s);
      A.applicable && (o.push({
        discountId: b.id,
        discountName: ((p = b.name[0]) == null ? void 0 : p.value) || "Discount",
        discountAmount: Number(A.discountAmount.toFixed(2)),
        affectedItems: A.affectedItems
      }), s.appliedDiscounts = o);
    }
    const c = this.calculateFinalPrices(e, o), l = o.reduce(
      (b, w) => b + w.discountAmount,
      0
    );
    return {
      items: c,
      totalDiscount: Number(l.toFixed(2)),
      appliedDiscounts: o
    };
  }
  static filterActiveDiscounts(e) {
    const t = Date.now();
    return e.filter(
      (r) => r.active && r.startDate <= t && r.endDate >= t
    );
  }
  static calculateFinalPrices(e, t) {
    return e.map((r) => {
      const s = t.filter(
        (l) => l.affectedItems.some((d) => d.productId === r.product.id)
      ), a = s.reduce((l, d) => {
        const p = d.affectedItems.find(
          (b) => b.productId === r.product.id
        );
        return l + ((p == null ? void 0 : p.discountAmount) || 0);
      }, 0), o = a / r.amount, c = r.product.price - o;
      return {
        amount: r.amount,
        product: r.product,
        originalPrice: Number(r.product.price.toFixed(2)),
        finalPrice: Number(Math.max(0, c).toFixed(2)),
        finalDiscount: Number(a.toFixed(2)),
        appliedDiscounts: s.map((l) => l.discountId)
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
function st(n) {
  return Number(n.toFixed(2));
}
function Yn(n) {
  return n.toFixed(2);
}
function Jn(n) {
  return Math.max(0, st(n));
}
function Xn(n, e) {
  if (n <= 0) return 0;
  const t = n - e;
  return st(t / n * 100);
}
const Ce = {
  VAT: 18
};
function Sn(n) {
  var e, t;
  return ((e = n.discount) == null ? void 0 : e.type) === "percent" ? n.price * (n.discount.value ?? 100) / 100 : ((t = n.discount) == null ? void 0 : t.type) === "number" ? n.discount.value ?? 0 : 0;
}
function Cn(n) {
  var e, t;
  if (((e = n.discount) == null ? void 0 : e.type) === "percent") {
    const r = n.price * n.discount.value / 100;
    return n.price - r;
  }
  return ((t = n.discount) == null ? void 0 : t.type) === "number" ? n.price - n.discount.value : n.price;
}
function Hn({
  cart: n,
  discounts: e,
  deliveryPrice: t = 0,
  freeDeliveryPrice: r = 0,
  isVatIncludedInPrice: s = !1
}) {
  const a = n.map((d) => ({
    amount: d.amount,
    product: {
      id: d.product.id,
      price: d.product.price
    }
  })), o = Nn.calculateDiscounts(a, e), c = n.map((d, p) => {
    const b = o.items[p];
    return {
      amount: d.amount,
      product: { ...d.product },
      originalPrice: d.product.price,
      finalPrice: b ? b.finalPrice : Cn(d.product),
      finalDiscount: b ? b.finalDiscount : Sn(d.product)
    };
  }), l = c.reduce(
    (d, p) => {
      const { product: b, amount: w, finalPrice: A, finalDiscount: K } = p;
      let D = 0;
      if (b.vat) {
        let Ne = 0;
        if (s) {
          const at = A * (Ce.VAT / (100 + Ce.VAT));
          D = Number(at.toFixed(2)), D = D * w, Ne = Number(D.toFixed(2));
        } else
          D = A * Ce.VAT / 100, D = D * w, Ne = Number(D.toFixed(2));
        d.vat = Number((d.vat + Ne).toFixed(2));
      }
      const Ae = Number(A.toFixed(2));
      return d.cost += w * Ae, d.discount += K && w * K, d.finalCost += w * Ae + (s ? 0 : D), d.productsCost += w * Ae + (s ? 0 : D), d.cost = Number(d.cost.toFixed(2)), d.discount = Number(d.discount.toFixed(2)), d.finalCost = Number(d.finalCost.toFixed(2)), d.productsCost = Number(d.productsCost.toFixed(2)), d;
    },
    {
      discount: 0,
      cost: 0,
      finalCost: 0,
      vat: 0,
      productsCost: 0,
      deliveryPrice: t
    }
  );
  return l.deliveryPrice && l.productsCost >= r ? l.deliveryPrice = 0 : l.finalCost += l.deliveryPrice, console.log("cartDetails", l), { items: c, ...l };
}
const Zn = {
  stores: "STORES",
  companies: "COMPANIES"
}, Dn = {
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
  organizations: "organizations",
  invoices: "invoices"
}, jn = {
  systemCollections: Zn,
  storeCollections: Dn,
  // for client and server
  getPath: ({
    companyId: n,
    storeId: e,
    collectionName: t,
    id: r
  }) => `${n}/${e}/${t}${r ? `/${r}` : ""}`,
  // for firestore events
  getDocPath: (n) => `{companyId}/{storeId}/${n}/{id}`
}, Gn = {
  firestore: jn
};
export {
  Xe as AddressSchema,
  He as BaseCategorySchema,
  nt as BillingAccountSchema,
  An as BundleDiscountStrategy,
  tt as CalculatedDataSchema,
  Ke as CartItemProductSchema,
  Fn as CartSchema,
  Pe as CategorySchema,
  zn as CompanySchema,
  _n as DeliveryNoteSchema,
  Tn as DiscountConditionsSchema,
  Nn as DiscountEngine,
  Qn as DiscountSchema,
  rt as DiscountStrategyFactory,
  In as DiscountVariantSchema,
  vn as EzDeliveryNoteSchema,
  Un as FavoriteProductSchema,
  Pn as FileSchema,
  Gn as FirebaseAPI,
  re as LocaleSchema,
  Mn as LocaleValueSchema,
  qn as NewOrganizationSchema,
  Vn as NewProductSchema,
  Bn as OrderSchema,
  bn as OrganizationSchema,
  Ge as ProductSchema,
  et as ProfilePaymentTypeSchema,
  yn as ProfileSchema,
  Wn as StoreSchema,
  $n as TFlattenCategorySchema,
  Xn as calculatePercentageDiscount,
  wn as clientTypesSchema,
  Ln as createEmptyProfile,
  Jn as ensureNonNegative,
  st as formatCurrency,
  Yn as formatCurrencyString,
  Hn as getCartCost,
  Rn as isFile,
  M as notEmptyTextSchema,
  En as numericTextSchema
};
//# sourceMappingURL=core.es.js.map
