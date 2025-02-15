var b;
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
})(b || (b = {}));
var Ae;
(function(r) {
  r.mergeShapes = (e, t) => ({
    ...e,
    ...t
    // second overwrites first
  });
})(Ae || (Ae = {}));
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
]), $ = (r) => {
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
}, d = b.arrayToEnum([
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
]), Ke = (r) => JSON.stringify(r, null, 2).replace(/"([^"]+)":/g, "$1:");
class I extends Error {
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
          let c = n, f = 0;
          for (; f < o.path.length; ) {
            const u = o.path[f];
            f === o.path.length - 1 ? (c[u] = c[u] || { _errors: [] }, c[u]._errors.push(t(o))) : c[u] = c[u] || { _errors: [] }, c = c[u], f++;
          }
        }
    };
    return s(this), n;
  }
  static assert(e) {
    if (!(e instanceof I))
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
    const t = {}, n = [];
    for (const s of this.issues)
      s.path.length > 0 ? (t[s.path[0]] = t[s.path[0]] || [], t[s.path[0]].push(e(s))) : n.push(e(s));
    return { formErrors: n, fieldErrors: t };
  }
  get formErrors() {
    return this.flatten();
  }
}
I.create = (r) => new I(r);
const J = (r, e) => {
  let t;
  switch (r.code) {
    case d.invalid_type:
      r.received === h.undefined ? t = "Required" : t = `Expected ${r.expected}, received ${r.received}`;
      break;
    case d.invalid_literal:
      t = `Invalid literal value, expected ${JSON.stringify(r.expected, b.jsonStringifyReplacer)}`;
      break;
    case d.unrecognized_keys:
      t = `Unrecognized key(s) in object: ${b.joinValues(r.keys, ", ")}`;
      break;
    case d.invalid_union:
      t = "Invalid input";
      break;
    case d.invalid_union_discriminator:
      t = `Invalid discriminator value. Expected ${b.joinValues(r.options)}`;
      break;
    case d.invalid_enum_value:
      t = `Invalid enum value. Expected ${b.joinValues(r.options)}, received '${r.received}'`;
      break;
    case d.invalid_arguments:
      t = "Invalid function arguments";
      break;
    case d.invalid_return_type:
      t = "Invalid function return type";
      break;
    case d.invalid_date:
      t = "Invalid date";
      break;
    case d.invalid_string:
      typeof r.validation == "object" ? "includes" in r.validation ? (t = `Invalid input: must include "${r.validation.includes}"`, typeof r.validation.position == "number" && (t = `${t} at one or more positions greater than or equal to ${r.validation.position}`)) : "startsWith" in r.validation ? t = `Invalid input: must start with "${r.validation.startsWith}"` : "endsWith" in r.validation ? t = `Invalid input: must end with "${r.validation.endsWith}"` : b.assertNever(r.validation) : r.validation !== "regex" ? t = `Invalid ${r.validation}` : t = "Invalid";
      break;
    case d.too_small:
      r.type === "array" ? t = `Array must contain ${r.exact ? "exactly" : r.inclusive ? "at least" : "more than"} ${r.minimum} element(s)` : r.type === "string" ? t = `String must contain ${r.exact ? "exactly" : r.inclusive ? "at least" : "over"} ${r.minimum} character(s)` : r.type === "number" ? t = `Number must be ${r.exact ? "exactly equal to " : r.inclusive ? "greater than or equal to " : "greater than "}${r.minimum}` : r.type === "date" ? t = `Date must be ${r.exact ? "exactly equal to " : r.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(r.minimum))}` : t = "Invalid input";
      break;
    case d.too_big:
      r.type === "array" ? t = `Array must contain ${r.exact ? "exactly" : r.inclusive ? "at most" : "less than"} ${r.maximum} element(s)` : r.type === "string" ? t = `String must contain ${r.exact ? "exactly" : r.inclusive ? "at most" : "under"} ${r.maximum} character(s)` : r.type === "number" ? t = `Number must be ${r.exact ? "exactly" : r.inclusive ? "less than or equal to" : "less than"} ${r.maximum}` : r.type === "bigint" ? t = `BigInt must be ${r.exact ? "exactly" : r.inclusive ? "less than or equal to" : "less than"} ${r.maximum}` : r.type === "date" ? t = `Date must be ${r.exact ? "exactly" : r.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(r.maximum))}` : t = "Invalid input";
      break;
    case d.custom:
      t = "Invalid input";
      break;
    case d.invalid_intersection_types:
      t = "Intersection results could not be merged";
      break;
    case d.not_multiple_of:
      t = `Number must be a multiple of ${r.multipleOf}`;
      break;
    case d.not_finite:
      t = "Number must be finite";
      break;
    default:
      t = e.defaultError, b.assertNever(r);
  }
  return { message: t };
};
let Le = J;
function Xe(r) {
  Le = r;
}
function ye() {
  return Le;
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
  const f = n.filter((u) => !!u).slice().reverse();
  for (const u of f)
    c = u(o, { data: e, defaultError: c }).message;
  return {
    ...s,
    path: a,
    message: c
  };
}, et = [];
function l(r, e) {
  const t = ye(), n = ve({
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
      t === J ? void 0 : J
      // then global default map
    ].filter((s) => !!s)
  });
  r.common.issues.push(n);
}
class w {
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
        return y;
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
    return w.mergeObjectSync(e, n);
  }
  static mergeObjectSync(e, t) {
    const n = {};
    for (const s of t) {
      const { key: a, value: o } = s;
      if (a.status === "aborted" || o.status === "aborted")
        return y;
      a.status === "dirty" && e.dirty(), o.status === "dirty" && e.dirty(), a.value !== "__proto__" && (typeof o.value < "u" || s.alwaysSet) && (n[a.value] = o.value);
    }
    return { status: e.value, value: n };
  }
}
const y = Object.freeze({
  status: "aborted"
}), q = (r) => ({ status: "dirty", value: r }), S = (r) => ({ status: "valid", value: r }), je = (r) => r.status === "aborted", Oe = (r) => r.status === "dirty", F = (r) => r.status === "valid", te = (r) => typeof Promise < "u" && r instanceof Promise;
function _e(r, e, t, n) {
  if (typeof e == "function" ? r !== e || !0 : !e.has(r)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return e.get(r);
}
function ze(r, e, t, n, s) {
  if (typeof e == "function" ? r !== e || !0 : !e.has(r)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return e.set(r, t), t;
}
var m;
(function(r) {
  r.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, r.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(m || (m = {}));
var K, X;
class E {
  constructor(e, t, n, s) {
    this._cachedPath = [], this.parent = e, this.data = t, this._path = n, this._key = s;
  }
  get path() {
    return this._cachedPath.length || (this._key instanceof Array ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Me = (r, e) => {
  if (F(e))
    return { success: !0, data: e.value };
  if (!r.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const t = new I(r.common.issues);
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
    var f, u;
    const { message: p } = r;
    return o.code === "invalid_enum_value" ? { message: p ?? c.defaultError } : typeof c.data > "u" ? { message: (f = p ?? n) !== null && f !== void 0 ? f : c.defaultError } : o.code !== "invalid_type" ? { message: c.defaultError } : { message: (u = p ?? t) !== null && u !== void 0 ? u : c.defaultError };
  }, description: s };
}
class _ {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return $(e.data);
  }
  _getOrReturnCtx(e, t) {
    return t || {
      common: e.parent.common,
      data: e.data,
      parsedType: $(e.data),
      schemaErrorMap: this._def.errorMap,
      path: e.path,
      parent: e.parent
    };
  }
  _processInputParams(e) {
    return {
      status: new w(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: $(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent
      }
    };
  }
  _parseSync(e) {
    const t = this._parse(e);
    if (te(t))
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
      parsedType: $(e)
    }, a = this._parseSync({ data: e, path: s.path, parent: s });
    return Me(s, a);
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
      parsedType: $(e)
    };
    if (!this["~standard"].async)
      try {
        const a = this._parseSync({ data: e, path: [], parent: s });
        return F(a) ? {
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
    return this._parseAsync({ data: e, path: [], parent: s }).then((a) => F(a) ? {
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
      parsedType: $(e)
    }, s = this._parse({ data: e, path: n.path, parent: n }), a = await (te(s) ? s : Promise.resolve(s));
    return Me(n, a);
  }
  refine(e, t) {
    const n = (s) => typeof t == "string" || typeof t > "u" ? { message: t } : typeof t == "function" ? t(s) : t;
    return this._refinement((s, a) => {
      const o = e(s), c = () => a.addIssue({
        code: d.custom,
        ...n(s)
      });
      return typeof Promise < "u" && o instanceof Promise ? o.then((f) => f ? !0 : (c(), !1)) : o ? !0 : (c(), !1);
    });
  }
  refinement(e, t) {
    return this._refinement((n, s) => e(n) ? !0 : (s.addIssue(typeof t == "function" ? t(n, s) : t), !1));
  }
  _refinement(e) {
    return new A({
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
    return O.create(this, this._def);
  }
  nullable() {
    return z.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return N.create(this);
  }
  promise() {
    return Q.create(this, this._def);
  }
  or(e) {
    return ae.create([this, e], this._def);
  }
  and(e) {
    return ie.create(this, e, this._def);
  }
  transform(e) {
    return new A({
      ...v(this._def),
      schema: this,
      typeName: g.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const t = typeof e == "function" ? e : () => e;
    return new le({
      ...v(this._def),
      innerType: this,
      defaultValue: t,
      typeName: g.ZodDefault
    });
  }
  brand() {
    return new Re({
      typeName: g.ZodBranded,
      type: this,
      ...v(this._def)
    });
  }
  catch(e) {
    const t = typeof e == "function" ? e : () => e;
    return new fe({
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
    return me.create(this, e);
  }
  readonly() {
    return he.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const tt = /^c[^\s-]{8,}$/i, rt = /^[0-9a-z]+$/, nt = /^[0-9A-HJKMNP-TV-Z]{26}$/i, st = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, at = /^[a-z0-9_-]{21}$/i, it = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, ot = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, ct = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, dt = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let Ie;
const ut = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, lt = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, ft = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, ht = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, mt = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, pt = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, Ue = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", gt = new RegExp(`^${Ue}$`);
function Fe(r) {
  let e = "([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d";
  return r.precision ? e = `${e}\\.\\d{${r.precision}}` : r.precision == null && (e = `${e}(\\.\\d+)?`), e;
}
function yt(r) {
  return new RegExp(`^${Fe(r)}$`);
}
function Be(r) {
  let e = `${Ue}T${Fe(r)}`;
  const t = [];
  return t.push(r.local ? "Z?" : "Z"), r.offset && t.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${t.join("|")})`, new RegExp(`^${e}$`);
}
function vt(r, e) {
  return !!((e === "v4" || !e) && ut.test(r) || (e === "v6" || !e) && ft.test(r));
}
function _t(r, e) {
  if (!it.test(r))
    return !1;
  try {
    const [t] = r.split("."), n = t.replace(/-/g, "+").replace(/_/g, "/").padEnd(t.length + (4 - t.length % 4) % 4, "="), s = JSON.parse(atob(n));
    return !(typeof s != "object" || s === null || !s.typ || !s.alg || e && s.alg !== e);
  } catch {
    return !1;
  }
}
function bt(r, e) {
  return !!((e === "v4" || !e) && lt.test(r) || (e === "v6" || !e) && ht.test(r));
}
class Z extends _ {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== h.string) {
      const a = this._getOrReturnCtx(e);
      return l(a, {
        code: d.invalid_type,
        expected: h.string,
        received: a.parsedType
      }), y;
    }
    const n = new w();
    let s;
    for (const a of this._def.checks)
      if (a.kind === "min")
        e.data.length < a.value && (s = this._getOrReturnCtx(e, s), l(s, {
          code: d.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), n.dirty());
      else if (a.kind === "max")
        e.data.length > a.value && (s = this._getOrReturnCtx(e, s), l(s, {
          code: d.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), n.dirty());
      else if (a.kind === "length") {
        const o = e.data.length > a.value, c = e.data.length < a.value;
        (o || c) && (s = this._getOrReturnCtx(e, s), o ? l(s, {
          code: d.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }) : c && l(s, {
          code: d.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }), n.dirty());
      } else if (a.kind === "email")
        ct.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "email",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "emoji")
        Ie || (Ie = new RegExp(dt, "u")), Ie.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "emoji",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "uuid")
        st.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "uuid",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "nanoid")
        at.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "nanoid",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "cuid")
        tt.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "cuid",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "cuid2")
        rt.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "cuid2",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "ulid")
        nt.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "ulid",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "url")
        try {
          new URL(e.data);
        } catch {
          s = this._getOrReturnCtx(e, s), l(s, {
            validation: "url",
            code: d.invalid_string,
            message: a.message
          }), n.dirty();
        }
      else a.kind === "regex" ? (a.regex.lastIndex = 0, a.regex.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "regex",
        code: d.invalid_string,
        message: a.message
      }), n.dirty())) : a.kind === "trim" ? e.data = e.data.trim() : a.kind === "includes" ? e.data.includes(a.value, a.position) || (s = this._getOrReturnCtx(e, s), l(s, {
        code: d.invalid_string,
        validation: { includes: a.value, position: a.position },
        message: a.message
      }), n.dirty()) : a.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : a.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : a.kind === "startsWith" ? e.data.startsWith(a.value) || (s = this._getOrReturnCtx(e, s), l(s, {
        code: d.invalid_string,
        validation: { startsWith: a.value },
        message: a.message
      }), n.dirty()) : a.kind === "endsWith" ? e.data.endsWith(a.value) || (s = this._getOrReturnCtx(e, s), l(s, {
        code: d.invalid_string,
        validation: { endsWith: a.value },
        message: a.message
      }), n.dirty()) : a.kind === "datetime" ? Be(a).test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        code: d.invalid_string,
        validation: "datetime",
        message: a.message
      }), n.dirty()) : a.kind === "date" ? gt.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        code: d.invalid_string,
        validation: "date",
        message: a.message
      }), n.dirty()) : a.kind === "time" ? yt(a).test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        code: d.invalid_string,
        validation: "time",
        message: a.message
      }), n.dirty()) : a.kind === "duration" ? ot.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "duration",
        code: d.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "ip" ? vt(e.data, a.version) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "ip",
        code: d.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "jwt" ? _t(e.data, a.alg) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "jwt",
        code: d.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "cidr" ? bt(e.data, a.version) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "cidr",
        code: d.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "base64" ? mt.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "base64",
        code: d.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "base64url" ? pt.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "base64url",
        code: d.invalid_string,
        message: a.message
      }), n.dirty()) : b.assertNever(a);
    return { status: n.value, value: e.data };
  }
  _regex(e, t, n) {
    return this.refinement((s) => e.test(s), {
      validation: t,
      code: d.invalid_string,
      ...m.errToObj(n)
    });
  }
  _addCheck(e) {
    return new Z({
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
    return new Z({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new Z({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new Z({
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
Z.create = (r) => {
  var e;
  return new Z({
    checks: [],
    typeName: g.ZodString,
    coerce: (e = r == null ? void 0 : r.coerce) !== null && e !== void 0 ? e : !1,
    ...v(r)
  });
};
function xt(r, e) {
  const t = (r.toString().split(".")[1] || "").length, n = (e.toString().split(".")[1] || "").length, s = t > n ? t : n, a = parseInt(r.toFixed(s).replace(".", "")), o = parseInt(e.toFixed(s).replace(".", ""));
  return a % o / Math.pow(10, s);
}
class D extends _ {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e) {
    if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== h.number) {
      const a = this._getOrReturnCtx(e);
      return l(a, {
        code: d.invalid_type,
        expected: h.number,
        received: a.parsedType
      }), y;
    }
    let n;
    const s = new w();
    for (const a of this._def.checks)
      a.kind === "int" ? b.isInteger(e.data) || (n = this._getOrReturnCtx(e, n), l(n, {
        code: d.invalid_type,
        expected: "integer",
        received: "float",
        message: a.message
      }), s.dirty()) : a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (n = this._getOrReturnCtx(e, n), l(n, {
        code: d.too_small,
        minimum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (n = this._getOrReturnCtx(e, n), l(n, {
        code: d.too_big,
        maximum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? xt(e.data, a.value) !== 0 && (n = this._getOrReturnCtx(e, n), l(n, {
        code: d.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (n = this._getOrReturnCtx(e, n), l(n, {
        code: d.not_finite,
        message: a.message
      }), s.dirty()) : b.assertNever(a);
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
  setLimit(e, t, n, s) {
    return new D({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: t,
          inclusive: n,
          message: m.toString(s)
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
    return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && b.isInteger(e.value));
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
D.create = (r) => new D({
  checks: [],
  typeName: g.ZodNumber,
  coerce: (r == null ? void 0 : r.coerce) || !1,
  ...v(r)
});
class V extends _ {
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
    const s = new w();
    for (const a of this._def.checks)
      a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (n = this._getOrReturnCtx(e, n), l(n, {
        code: d.too_small,
        type: "bigint",
        minimum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (n = this._getOrReturnCtx(e, n), l(n, {
        code: d.too_big,
        type: "bigint",
        maximum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? e.data % a.value !== BigInt(0) && (n = this._getOrReturnCtx(e, n), l(n, {
        code: d.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : b.assertNever(a);
    return { status: s.value, value: e.data };
  }
  _getInvalidInput(e) {
    const t = this._getOrReturnCtx(e);
    return l(t, {
      code: d.invalid_type,
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
  setLimit(e, t, n, s) {
    return new V({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: t,
          inclusive: n,
          message: m.toString(s)
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
V.create = (r) => {
  var e;
  return new V({
    checks: [],
    typeName: g.ZodBigInt,
    coerce: (e = r == null ? void 0 : r.coerce) !== null && e !== void 0 ? e : !1,
    ...v(r)
  });
};
class re extends _ {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== h.boolean) {
      const n = this._getOrReturnCtx(e);
      return l(n, {
        code: d.invalid_type,
        expected: h.boolean,
        received: n.parsedType
      }), y;
    }
    return S(e.data);
  }
}
re.create = (r) => new re({
  typeName: g.ZodBoolean,
  coerce: (r == null ? void 0 : r.coerce) || !1,
  ...v(r)
});
class B extends _ {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== h.date) {
      const a = this._getOrReturnCtx(e);
      return l(a, {
        code: d.invalid_type,
        expected: h.date,
        received: a.parsedType
      }), y;
    }
    if (isNaN(e.data.getTime())) {
      const a = this._getOrReturnCtx(e);
      return l(a, {
        code: d.invalid_date
      }), y;
    }
    const n = new w();
    let s;
    for (const a of this._def.checks)
      a.kind === "min" ? e.data.getTime() < a.value && (s = this._getOrReturnCtx(e, s), l(s, {
        code: d.too_small,
        message: a.message,
        inclusive: !0,
        exact: !1,
        minimum: a.value,
        type: "date"
      }), n.dirty()) : a.kind === "max" ? e.data.getTime() > a.value && (s = this._getOrReturnCtx(e, s), l(s, {
        code: d.too_big,
        message: a.message,
        inclusive: !0,
        exact: !1,
        maximum: a.value,
        type: "date"
      }), n.dirty()) : b.assertNever(a);
    return {
      status: n.value,
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
B.create = (r) => new B({
  checks: [],
  coerce: (r == null ? void 0 : r.coerce) || !1,
  typeName: g.ZodDate,
  ...v(r)
});
class be extends _ {
  _parse(e) {
    if (this._getType(e) !== h.symbol) {
      const n = this._getOrReturnCtx(e);
      return l(n, {
        code: d.invalid_type,
        expected: h.symbol,
        received: n.parsedType
      }), y;
    }
    return S(e.data);
  }
}
be.create = (r) => new be({
  typeName: g.ZodSymbol,
  ...v(r)
});
class ne extends _ {
  _parse(e) {
    if (this._getType(e) !== h.undefined) {
      const n = this._getOrReturnCtx(e);
      return l(n, {
        code: d.invalid_type,
        expected: h.undefined,
        received: n.parsedType
      }), y;
    }
    return S(e.data);
  }
}
ne.create = (r) => new ne({
  typeName: g.ZodUndefined,
  ...v(r)
});
class se extends _ {
  _parse(e) {
    if (this._getType(e) !== h.null) {
      const n = this._getOrReturnCtx(e);
      return l(n, {
        code: d.invalid_type,
        expected: h.null,
        received: n.parsedType
      }), y;
    }
    return S(e.data);
  }
}
se.create = (r) => new se({
  typeName: g.ZodNull,
  ...v(r)
});
class G extends _ {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return S(e.data);
  }
}
G.create = (r) => new G({
  typeName: g.ZodAny,
  ...v(r)
});
class U extends _ {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return S(e.data);
  }
}
U.create = (r) => new U({
  typeName: g.ZodUnknown,
  ...v(r)
});
class M extends _ {
  _parse(e) {
    const t = this._getOrReturnCtx(e);
    return l(t, {
      code: d.invalid_type,
      expected: h.never,
      received: t.parsedType
    }), y;
  }
}
M.create = (r) => new M({
  typeName: g.ZodNever,
  ...v(r)
});
class xe extends _ {
  _parse(e) {
    if (this._getType(e) !== h.undefined) {
      const n = this._getOrReturnCtx(e);
      return l(n, {
        code: d.invalid_type,
        expected: h.void,
        received: n.parsedType
      }), y;
    }
    return S(e.data);
  }
}
xe.create = (r) => new xe({
  typeName: g.ZodVoid,
  ...v(r)
});
class N extends _ {
  _parse(e) {
    const { ctx: t, status: n } = this._processInputParams(e), s = this._def;
    if (t.parsedType !== h.array)
      return l(t, {
        code: d.invalid_type,
        expected: h.array,
        received: t.parsedType
      }), y;
    if (s.exactLength !== null) {
      const o = t.data.length > s.exactLength.value, c = t.data.length < s.exactLength.value;
      (o || c) && (l(t, {
        code: o ? d.too_big : d.too_small,
        minimum: c ? s.exactLength.value : void 0,
        maximum: o ? s.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: s.exactLength.message
      }), n.dirty());
    }
    if (s.minLength !== null && t.data.length < s.minLength.value && (l(t, {
      code: d.too_small,
      minimum: s.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.minLength.message
    }), n.dirty()), s.maxLength !== null && t.data.length > s.maxLength.value && (l(t, {
      code: d.too_big,
      maximum: s.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.maxLength.message
    }), n.dirty()), t.common.async)
      return Promise.all([...t.data].map((o, c) => s.type._parseAsync(new E(t, o, t.path, c)))).then((o) => w.mergeArray(n, o));
    const a = [...t.data].map((o, c) => s.type._parseSync(new E(t, o, t.path, c)));
    return w.mergeArray(n, a);
  }
  get element() {
    return this._def.type;
  }
  min(e, t) {
    return new N({
      ...this._def,
      minLength: { value: e, message: m.toString(t) }
    });
  }
  max(e, t) {
    return new N({
      ...this._def,
      maxLength: { value: e, message: m.toString(t) }
    });
  }
  length(e, t) {
    return new N({
      ...this._def,
      exactLength: { value: e, message: m.toString(t) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
N.create = (r, e) => new N({
  type: r,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: g.ZodArray,
  ...v(e)
});
function Y(r) {
  if (r instanceof k) {
    const e = {};
    for (const t in r.shape) {
      const n = r.shape[t];
      e[t] = O.create(Y(n));
    }
    return new k({
      ...r._def,
      shape: () => e
    });
  } else return r instanceof N ? new N({
    ...r._def,
    type: Y(r.element)
  }) : r instanceof O ? O.create(Y(r.unwrap())) : r instanceof z ? z.create(Y(r.unwrap())) : r instanceof R ? R.create(r.items.map((e) => Y(e))) : r;
}
class k extends _ {
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
      const u = this._getOrReturnCtx(e);
      return l(u, {
        code: d.invalid_type,
        expected: h.object,
        received: u.parsedType
      }), y;
    }
    const { status: n, ctx: s } = this._processInputParams(e), { shape: a, keys: o } = this._getCached(), c = [];
    if (!(this._def.catchall instanceof M && this._def.unknownKeys === "strip"))
      for (const u in s.data)
        o.includes(u) || c.push(u);
    const f = [];
    for (const u of o) {
      const p = a[u], T = s.data[u];
      f.push({
        key: { status: "valid", value: u },
        value: p._parse(new E(s, T, s.path, u)),
        alwaysSet: u in s.data
      });
    }
    if (this._def.catchall instanceof M) {
      const u = this._def.unknownKeys;
      if (u === "passthrough")
        for (const p of c)
          f.push({
            key: { status: "valid", value: p },
            value: { status: "valid", value: s.data[p] }
          });
      else if (u === "strict")
        c.length > 0 && (l(s, {
          code: d.unrecognized_keys,
          keys: c
        }), n.dirty());
      else if (u !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const u = this._def.catchall;
      for (const p of c) {
        const T = s.data[p];
        f.push({
          key: { status: "valid", value: p },
          value: u._parse(
            new E(s, T, s.path, p)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: p in s.data
        });
      }
    }
    return s.common.async ? Promise.resolve().then(async () => {
      const u = [];
      for (const p of f) {
        const T = await p.key, pe = await p.value;
        u.push({
          key: T,
          value: pe,
          alwaysSet: p.alwaysSet
        });
      }
      return u;
    }).then((u) => w.mergeObjectSync(n, u)) : w.mergeObjectSync(n, f);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return m.errToObj, new k({
      ...this._def,
      unknownKeys: "strict",
      ...e !== void 0 ? {
        errorMap: (t, n) => {
          var s, a, o, c;
          const f = (o = (a = (s = this._def).errorMap) === null || a === void 0 ? void 0 : a.call(s, t, n).message) !== null && o !== void 0 ? o : n.defaultError;
          return t.code === "unrecognized_keys" ? {
            message: (c = m.errToObj(e).message) !== null && c !== void 0 ? c : f
          } : {
            message: f
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
    return b.objectKeys(e).forEach((n) => {
      e[n] && this.shape[n] && (t[n] = this.shape[n]);
    }), new k({
      ...this._def,
      shape: () => t
    });
  }
  omit(e) {
    const t = {};
    return b.objectKeys(this.shape).forEach((n) => {
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
    return Y(this);
  }
  partial(e) {
    const t = {};
    return b.objectKeys(this.shape).forEach((n) => {
      const s = this.shape[n];
      e && !e[n] ? t[n] = s : t[n] = s.optional();
    }), new k({
      ...this._def,
      shape: () => t
    });
  }
  required(e) {
    const t = {};
    return b.objectKeys(this.shape).forEach((n) => {
      if (e && !e[n])
        t[n] = this.shape[n];
      else {
        let a = this.shape[n];
        for (; a instanceof O; )
          a = a._def.innerType;
        t[n] = a;
      }
    }), new k({
      ...this._def,
      shape: () => t
    });
  }
  keyof() {
    return We(b.objectKeys(this.shape));
  }
}
k.create = (r, e) => new k({
  shape: () => r,
  unknownKeys: "strip",
  catchall: M.create(),
  typeName: g.ZodObject,
  ...v(e)
});
k.strictCreate = (r, e) => new k({
  shape: () => r,
  unknownKeys: "strict",
  catchall: M.create(),
  typeName: g.ZodObject,
  ...v(e)
});
k.lazycreate = (r, e) => new k({
  shape: r,
  unknownKeys: "strip",
  catchall: M.create(),
  typeName: g.ZodObject,
  ...v(e)
});
class ae extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e), n = this._def.options;
    function s(a) {
      for (const c of a)
        if (c.result.status === "valid")
          return c.result;
      for (const c of a)
        if (c.result.status === "dirty")
          return t.common.issues.push(...c.ctx.common.issues), c.result;
      const o = a.map((c) => new I(c.ctx.common.issues));
      return l(t, {
        code: d.invalid_union,
        unionErrors: o
      }), y;
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
      for (const f of n) {
        const u = {
          ...t,
          common: {
            ...t.common,
            issues: []
          },
          parent: null
        }, p = f._parseSync({
          data: t.data,
          path: t.path,
          parent: u
        });
        if (p.status === "valid")
          return p;
        p.status === "dirty" && !a && (a = { result: p, ctx: u }), u.common.issues.length && o.push(u.common.issues);
      }
      if (a)
        return t.common.issues.push(...a.ctx.common.issues), a.result;
      const c = o.map((f) => new I(f));
      return l(t, {
        code: d.invalid_union,
        unionErrors: c
      }), y;
    }
  }
  get options() {
    return this._def.options;
  }
}
ae.create = (r, e) => new ae({
  options: r,
  typeName: g.ZodUnion,
  ...v(e)
});
const P = (r) => r instanceof ce ? P(r.schema) : r instanceof A ? P(r.innerType()) : r instanceof de ? [r.value] : r instanceof L ? r.options : r instanceof ue ? b.objectValues(r.enum) : r instanceof le ? P(r._def.innerType) : r instanceof ne ? [void 0] : r instanceof se ? [null] : r instanceof O ? [void 0, ...P(r.unwrap())] : r instanceof z ? [null, ...P(r.unwrap())] : r instanceof Re || r instanceof he ? P(r.unwrap()) : r instanceof fe ? P(r._def.innerType) : [];
class Te extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.object)
      return l(t, {
        code: d.invalid_type,
        expected: h.object,
        received: t.parsedType
      }), y;
    const n = this.discriminator, s = t.data[n], a = this.optionsMap.get(s);
    return a ? t.common.async ? a._parseAsync({
      data: t.data,
      path: t.path,
      parent: t
    }) : a._parseSync({
      data: t.data,
      path: t.path,
      parent: t
    }) : (l(t, {
      code: d.invalid_union_discriminator,
      options: Array.from(this.optionsMap.keys()),
      path: [n]
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
      typeName: g.ZodDiscriminatedUnion,
      discriminator: e,
      options: t,
      optionsMap: s,
      ...v(n)
    });
  }
}
function Ee(r, e) {
  const t = $(r), n = $(e);
  if (r === e)
    return { valid: !0, data: r };
  if (t === h.object && n === h.object) {
    const s = b.objectKeys(e), a = b.objectKeys(r).filter((c) => s.indexOf(c) !== -1), o = { ...r, ...e };
    for (const c of a) {
      const f = Ee(r[c], e[c]);
      if (!f.valid)
        return { valid: !1 };
      o[c] = f.data;
    }
    return { valid: !0, data: o };
  } else if (t === h.array && n === h.array) {
    if (r.length !== e.length)
      return { valid: !1 };
    const s = [];
    for (let a = 0; a < r.length; a++) {
      const o = r[a], c = e[a], f = Ee(o, c);
      if (!f.valid)
        return { valid: !1 };
      s.push(f.data);
    }
    return { valid: !0, data: s };
  } else return t === h.date && n === h.date && +r == +e ? { valid: !0, data: r } : { valid: !1 };
}
class ie extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e), s = (a, o) => {
      if (je(a) || je(o))
        return y;
      const c = Ee(a.value, o.value);
      return c.valid ? ((Oe(a) || Oe(o)) && t.dirty(), { status: t.value, value: c.data }) : (l(n, {
        code: d.invalid_intersection_types
      }), y);
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
ie.create = (r, e, t) => new ie({
  left: r,
  right: e,
  typeName: g.ZodIntersection,
  ...v(t)
});
class R extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== h.array)
      return l(n, {
        code: d.invalid_type,
        expected: h.array,
        received: n.parsedType
      }), y;
    if (n.data.length < this._def.items.length)
      return l(n, {
        code: d.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), y;
    !this._def.rest && n.data.length > this._def.items.length && (l(n, {
      code: d.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), t.dirty());
    const a = [...n.data].map((o, c) => {
      const f = this._def.items[c] || this._def.rest;
      return f ? f._parse(new E(n, o, n.path, c)) : null;
    }).filter((o) => !!o);
    return n.common.async ? Promise.all(a).then((o) => w.mergeArray(t, o)) : w.mergeArray(t, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new R({
      ...this._def,
      rest: e
    });
  }
}
R.create = (r, e) => {
  if (!Array.isArray(r))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new R({
    items: r,
    typeName: g.ZodTuple,
    rest: null,
    ...v(e)
  });
};
class oe extends _ {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== h.object)
      return l(n, {
        code: d.invalid_type,
        expected: h.object,
        received: n.parsedType
      }), y;
    const s = [], a = this._def.keyType, o = this._def.valueType;
    for (const c in n.data)
      s.push({
        key: a._parse(new E(n, c, n.path, c)),
        value: o._parse(new E(n, n.data[c], n.path, c)),
        alwaysSet: c in n.data
      });
    return n.common.async ? w.mergeObjectAsync(t, s) : w.mergeObjectSync(t, s);
  }
  get element() {
    return this._def.valueType;
  }
  static create(e, t, n) {
    return t instanceof _ ? new oe({
      keyType: e,
      valueType: t,
      typeName: g.ZodRecord,
      ...v(n)
    }) : new oe({
      keyType: Z.create(),
      valueType: e,
      typeName: g.ZodRecord,
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
      return l(n, {
        code: d.invalid_type,
        expected: h.map,
        received: n.parsedType
      }), y;
    const s = this._def.keyType, a = this._def.valueType, o = [...n.data.entries()].map(([c, f], u) => ({
      key: s._parse(new E(n, c, n.path, [u, "key"])),
      value: a._parse(new E(n, f, n.path, [u, "value"]))
    }));
    if (n.common.async) {
      const c = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const f of o) {
          const u = await f.key, p = await f.value;
          if (u.status === "aborted" || p.status === "aborted")
            return y;
          (u.status === "dirty" || p.status === "dirty") && t.dirty(), c.set(u.value, p.value);
        }
        return { status: t.value, value: c };
      });
    } else {
      const c = /* @__PURE__ */ new Map();
      for (const f of o) {
        const u = f.key, p = f.value;
        if (u.status === "aborted" || p.status === "aborted")
          return y;
        (u.status === "dirty" || p.status === "dirty") && t.dirty(), c.set(u.value, p.value);
      }
      return { status: t.value, value: c };
    }
  }
}
ke.create = (r, e, t) => new ke({
  valueType: e,
  keyType: r,
  typeName: g.ZodMap,
  ...v(t)
});
class W extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== h.set)
      return l(n, {
        code: d.invalid_type,
        expected: h.set,
        received: n.parsedType
      }), y;
    const s = this._def;
    s.minSize !== null && n.data.size < s.minSize.value && (l(n, {
      code: d.too_small,
      minimum: s.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.minSize.message
    }), t.dirty()), s.maxSize !== null && n.data.size > s.maxSize.value && (l(n, {
      code: d.too_big,
      maximum: s.maxSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.maxSize.message
    }), t.dirty());
    const a = this._def.valueType;
    function o(f) {
      const u = /* @__PURE__ */ new Set();
      for (const p of f) {
        if (p.status === "aborted")
          return y;
        p.status === "dirty" && t.dirty(), u.add(p.value);
      }
      return { status: t.value, value: u };
    }
    const c = [...n.data.values()].map((f, u) => a._parse(new E(n, f, n.path, u)));
    return n.common.async ? Promise.all(c).then((f) => o(f)) : o(c);
  }
  min(e, t) {
    return new W({
      ...this._def,
      minSize: { value: e, message: m.toString(t) }
    });
  }
  max(e, t) {
    return new W({
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
W.create = (r, e) => new W({
  valueType: r,
  minSize: null,
  maxSize: null,
  typeName: g.ZodSet,
  ...v(e)
});
class H extends _ {
  constructor() {
    super(...arguments), this.validate = this.implement;
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.function)
      return l(t, {
        code: d.invalid_type,
        expected: h.function,
        received: t.parsedType
      }), y;
    function n(c, f) {
      return ve({
        data: c,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          ye(),
          J
        ].filter((u) => !!u),
        issueData: {
          code: d.invalid_arguments,
          argumentsError: f
        }
      });
    }
    function s(c, f) {
      return ve({
        data: c,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          ye(),
          J
        ].filter((u) => !!u),
        issueData: {
          code: d.invalid_return_type,
          returnTypeError: f
        }
      });
    }
    const a = { errorMap: t.common.contextualErrorMap }, o = t.data;
    if (this._def.returns instanceof Q) {
      const c = this;
      return S(async function(...f) {
        const u = new I([]), p = await c._def.args.parseAsync(f, a).catch((Ce) => {
          throw u.addIssue(n(f, Ce)), u;
        }), T = await Reflect.apply(o, this, p);
        return await c._def.returns._def.type.parseAsync(T, a).catch((Ce) => {
          throw u.addIssue(s(T, Ce)), u;
        });
      });
    } else {
      const c = this;
      return S(function(...f) {
        const u = c._def.args.safeParse(f, a);
        if (!u.success)
          throw new I([n(f, u.error)]);
        const p = Reflect.apply(o, this, u.data), T = c._def.returns.safeParse(p, a);
        if (!T.success)
          throw new I([s(p, T.error)]);
        return T.data;
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
    return new H({
      ...this._def,
      args: R.create(e).rest(U.create())
    });
  }
  returns(e) {
    return new H({
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
    return new H({
      args: e || R.create([]).rest(U.create()),
      returns: t || U.create(),
      typeName: g.ZodFunction,
      ...v(n)
    });
  }
}
class ce extends _ {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    return this._def.getter()._parse({ data: t.data, path: t.path, parent: t });
  }
}
ce.create = (r, e) => new ce({
  getter: r,
  typeName: g.ZodLazy,
  ...v(e)
});
class de extends _ {
  _parse(e) {
    if (e.data !== this._def.value) {
      const t = this._getOrReturnCtx(e);
      return l(t, {
        received: t.data,
        code: d.invalid_literal,
        expected: this._def.value
      }), y;
    }
    return { status: "valid", value: e.data };
  }
  get value() {
    return this._def.value;
  }
}
de.create = (r, e) => new de({
  value: r,
  typeName: g.ZodLiteral,
  ...v(e)
});
function We(r, e) {
  return new L({
    values: r,
    typeName: g.ZodEnum,
    ...v(e)
  });
}
class L extends _ {
  constructor() {
    super(...arguments), K.set(this, void 0);
  }
  _parse(e) {
    if (typeof e.data != "string") {
      const t = this._getOrReturnCtx(e), n = this._def.values;
      return l(t, {
        expected: b.joinValues(n),
        received: t.parsedType,
        code: d.invalid_type
      }), y;
    }
    if (_e(this, K) || ze(this, K, new Set(this._def.values)), !_e(this, K).has(e.data)) {
      const t = this._getOrReturnCtx(e), n = this._def.values;
      return l(t, {
        received: t.data,
        code: d.invalid_enum_value,
        options: n
      }), y;
    }
    return S(e.data);
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
    return L.create(e, {
      ...this._def,
      ...t
    });
  }
  exclude(e, t = this._def) {
    return L.create(this.options.filter((n) => !e.includes(n)), {
      ...this._def,
      ...t
    });
  }
}
K = /* @__PURE__ */ new WeakMap();
L.create = We;
class ue extends _ {
  constructor() {
    super(...arguments), X.set(this, void 0);
  }
  _parse(e) {
    const t = b.getValidEnumValues(this._def.values), n = this._getOrReturnCtx(e);
    if (n.parsedType !== h.string && n.parsedType !== h.number) {
      const s = b.objectValues(t);
      return l(n, {
        expected: b.joinValues(s),
        received: n.parsedType,
        code: d.invalid_type
      }), y;
    }
    if (_e(this, X) || ze(this, X, new Set(b.getValidEnumValues(this._def.values))), !_e(this, X).has(e.data)) {
      const s = b.objectValues(t);
      return l(n, {
        received: n.data,
        code: d.invalid_enum_value,
        options: s
      }), y;
    }
    return S(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
X = /* @__PURE__ */ new WeakMap();
ue.create = (r, e) => new ue({
  values: r,
  typeName: g.ZodNativeEnum,
  ...v(e)
});
class Q extends _ {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.promise && t.common.async === !1)
      return l(t, {
        code: d.invalid_type,
        expected: h.promise,
        received: t.parsedType
      }), y;
    const n = t.parsedType === h.promise ? t.data : Promise.resolve(t.data);
    return S(n.then((s) => this._def.type.parseAsync(s, {
      path: t.path,
      errorMap: t.common.contextualErrorMap
    })));
  }
}
Q.create = (r, e) => new Q({
  type: r,
  typeName: g.ZodPromise,
  ...v(e)
});
class A extends _ {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === g.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e), s = this._def.effect || null, a = {
      addIssue: (o) => {
        l(n, o), o.fatal ? t.abort() : t.dirty();
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
            return y;
          const f = await this._def.schema._parseAsync({
            data: c,
            path: n.path,
            parent: n
          });
          return f.status === "aborted" ? y : f.status === "dirty" || t.value === "dirty" ? q(f.value) : f;
        });
      {
        if (t.value === "aborted")
          return y;
        const c = this._def.schema._parseSync({
          data: o,
          path: n.path,
          parent: n
        });
        return c.status === "aborted" ? y : c.status === "dirty" || t.value === "dirty" ? q(c.value) : c;
      }
    }
    if (s.type === "refinement") {
      const o = (c) => {
        const f = s.refinement(c, a);
        if (n.common.async)
          return Promise.resolve(f);
        if (f instanceof Promise)
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return c;
      };
      if (n.common.async === !1) {
        const c = this._def.schema._parseSync({
          data: n.data,
          path: n.path,
          parent: n
        });
        return c.status === "aborted" ? y : (c.status === "dirty" && t.dirty(), o(c.value), { status: t.value, value: c.value });
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((c) => c.status === "aborted" ? y : (c.status === "dirty" && t.dirty(), o(c.value).then(() => ({ status: t.value, value: c.value }))));
    }
    if (s.type === "transform")
      if (n.common.async === !1) {
        const o = this._def.schema._parseSync({
          data: n.data,
          path: n.path,
          parent: n
        });
        if (!F(o))
          return o;
        const c = s.transform(o.value, a);
        if (c instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: t.value, value: c };
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((o) => F(o) ? Promise.resolve(s.transform(o.value, a)).then((c) => ({ status: t.value, value: c })) : o);
    b.assertNever(s);
  }
}
A.create = (r, e, t) => new A({
  schema: r,
  typeName: g.ZodEffects,
  effect: e,
  ...v(t)
});
A.createWithPreprocess = (r, e, t) => new A({
  schema: e,
  effect: { type: "preprocess", transform: r },
  typeName: g.ZodEffects,
  ...v(t)
});
class O extends _ {
  _parse(e) {
    return this._getType(e) === h.undefined ? S(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
O.create = (r, e) => new O({
  innerType: r,
  typeName: g.ZodOptional,
  ...v(e)
});
class z extends _ {
  _parse(e) {
    return this._getType(e) === h.null ? S(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
z.create = (r, e) => new z({
  innerType: r,
  typeName: g.ZodNullable,
  ...v(e)
});
class le extends _ {
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
le.create = (r, e) => new le({
  innerType: r,
  typeName: g.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...v(e)
});
class fe extends _ {
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
    return te(s) ? s.then((a) => ({
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new I(n.common.issues);
        },
        input: n.data
      })
    })) : {
      status: "valid",
      value: s.status === "valid" ? s.value : this._def.catchValue({
        get error() {
          return new I(n.common.issues);
        },
        input: n.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
fe.create = (r, e) => new fe({
  innerType: r,
  typeName: g.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...v(e)
});
class we extends _ {
  _parse(e) {
    if (this._getType(e) !== h.nan) {
      const n = this._getOrReturnCtx(e);
      return l(n, {
        code: d.invalid_type,
        expected: h.nan,
        received: n.parsedType
      }), y;
    }
    return { status: "valid", value: e.data };
  }
}
we.create = (r) => new we({
  typeName: g.ZodNaN,
  ...v(r)
});
const kt = Symbol("zod_brand");
class Re extends _ {
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
class me extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e);
    if (n.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: n.data,
          path: n.path,
          parent: n
        });
        return a.status === "aborted" ? y : a.status === "dirty" ? (t.dirty(), q(a.value)) : this._def.out._parseAsync({
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
      return s.status === "aborted" ? y : s.status === "dirty" ? (t.dirty(), {
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
    return new me({
      in: e,
      out: t,
      typeName: g.ZodPipeline
    });
  }
}
class he extends _ {
  _parse(e) {
    const t = this._def.innerType._parse(e), n = (s) => (F(s) && (s.value = Object.freeze(s.value)), s);
    return te(t) ? t.then((s) => n(s)) : n(t);
  }
  unwrap() {
    return this._def.innerType;
  }
}
he.create = (r, e) => new he({
  innerType: r,
  typeName: g.ZodReadonly,
  ...v(e)
});
function De(r, e) {
  const t = typeof r == "function" ? r(e) : typeof r == "string" ? { message: r } : r;
  return typeof t == "string" ? { message: t } : t;
}
function Ye(r, e = {}, t) {
  return r ? G.create().superRefine((n, s) => {
    var a, o;
    const c = r(n);
    if (c instanceof Promise)
      return c.then((f) => {
        var u, p;
        if (!f) {
          const T = De(e, n), pe = (p = (u = T.fatal) !== null && u !== void 0 ? u : t) !== null && p !== void 0 ? p : !0;
          s.addIssue({ code: "custom", ...T, fatal: pe });
        }
      });
    if (!c) {
      const f = De(e, n), u = (o = (a = f.fatal) !== null && a !== void 0 ? a : t) !== null && o !== void 0 ? o : !0;
      s.addIssue({ code: "custom", ...f, fatal: u });
    }
  }) : G.create();
}
const wt = {
  object: k.lazycreate
};
var g;
(function(r) {
  r.ZodString = "ZodString", r.ZodNumber = "ZodNumber", r.ZodNaN = "ZodNaN", r.ZodBigInt = "ZodBigInt", r.ZodBoolean = "ZodBoolean", r.ZodDate = "ZodDate", r.ZodSymbol = "ZodSymbol", r.ZodUndefined = "ZodUndefined", r.ZodNull = "ZodNull", r.ZodAny = "ZodAny", r.ZodUnknown = "ZodUnknown", r.ZodNever = "ZodNever", r.ZodVoid = "ZodVoid", r.ZodArray = "ZodArray", r.ZodObject = "ZodObject", r.ZodUnion = "ZodUnion", r.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", r.ZodIntersection = "ZodIntersection", r.ZodTuple = "ZodTuple", r.ZodRecord = "ZodRecord", r.ZodMap = "ZodMap", r.ZodSet = "ZodSet", r.ZodFunction = "ZodFunction", r.ZodLazy = "ZodLazy", r.ZodLiteral = "ZodLiteral", r.ZodEnum = "ZodEnum", r.ZodEffects = "ZodEffects", r.ZodNativeEnum = "ZodNativeEnum", r.ZodOptional = "ZodOptional", r.ZodNullable = "ZodNullable", r.ZodDefault = "ZodDefault", r.ZodCatch = "ZodCatch", r.ZodPromise = "ZodPromise", r.ZodBranded = "ZodBranded", r.ZodPipeline = "ZodPipeline", r.ZodReadonly = "ZodReadonly";
})(g || (g = {}));
const Tt = (r, e = {
  message: `Input not instance of ${r.name}`
}) => Ye((t) => t instanceof r, e), qe = Z.create, He = D.create, St = we.create, Ct = V.create, Je = re.create, It = B.create, Zt = be.create, Nt = ne.create, At = se.create, jt = G.create, Ot = U.create, Et = M.create, Rt = xe.create, Pt = N.create, $t = k.create, Mt = k.strictCreate, Dt = ae.create, Vt = Te.create, Lt = ie.create, zt = R.create, Ut = oe.create, Ft = ke.create, Bt = W.create, Wt = H.create, Yt = ce.create, qt = de.create, Ht = L.create, Jt = ue.create, Gt = Q.create, Ve = A.create, Qt = O.create, Kt = z.create, Xt = A.createWithPreprocess, er = me.create, tr = () => qe().optional(), rr = () => He().optional(), nr = () => Je().optional(), sr = {
  string: (r) => Z.create({ ...r, coerce: !0 }),
  number: (r) => D.create({ ...r, coerce: !0 }),
  boolean: (r) => re.create({
    ...r,
    coerce: !0
  }),
  bigint: (r) => V.create({ ...r, coerce: !0 }),
  date: (r) => B.create({ ...r, coerce: !0 })
}, ar = y;
var i = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  defaultErrorMap: J,
  setErrorMap: Xe,
  getErrorMap: ye,
  makeIssue: ve,
  EMPTY_PATH: et,
  addIssueToContext: l,
  ParseStatus: w,
  INVALID: y,
  DIRTY: q,
  OK: S,
  isAborted: je,
  isDirty: Oe,
  isValid: F,
  isAsync: te,
  get util() {
    return b;
  },
  get objectUtil() {
    return Ae;
  },
  ZodParsedType: h,
  getParsedType: $,
  ZodType: _,
  datetimeRegex: Be,
  ZodString: Z,
  ZodNumber: D,
  ZodBigInt: V,
  ZodBoolean: re,
  ZodDate: B,
  ZodSymbol: be,
  ZodUndefined: ne,
  ZodNull: se,
  ZodAny: G,
  ZodUnknown: U,
  ZodNever: M,
  ZodVoid: xe,
  ZodArray: N,
  ZodObject: k,
  ZodUnion: ae,
  ZodDiscriminatedUnion: Te,
  ZodIntersection: ie,
  ZodTuple: R,
  ZodRecord: oe,
  ZodMap: ke,
  ZodSet: W,
  ZodFunction: H,
  ZodLazy: ce,
  ZodLiteral: de,
  ZodEnum: L,
  ZodNativeEnum: ue,
  ZodPromise: Q,
  ZodEffects: A,
  ZodTransformer: A,
  ZodOptional: O,
  ZodNullable: z,
  ZodDefault: le,
  ZodCatch: fe,
  ZodNaN: we,
  BRAND: kt,
  ZodBranded: Re,
  ZodPipeline: me,
  ZodReadonly: he,
  custom: Ye,
  Schema: _,
  ZodSchema: _,
  late: wt,
  get ZodFirstPartyTypeKind() {
    return g;
  },
  coerce: sr,
  any: jt,
  array: Pt,
  bigint: Ct,
  boolean: Je,
  date: It,
  discriminatedUnion: Vt,
  effect: Ve,
  enum: Ht,
  function: Wt,
  instanceof: Tt,
  intersection: Lt,
  lazy: Yt,
  literal: qt,
  map: Ft,
  nan: St,
  nativeEnum: Jt,
  never: Et,
  null: At,
  nullable: Kt,
  number: He,
  object: $t,
  oboolean: nr,
  onumber: rr,
  optional: Qt,
  ostring: tr,
  pipeline: er,
  preprocess: Xt,
  promise: Gt,
  record: Ut,
  set: Bt,
  strictObject: Mt,
  string: qe,
  symbol: Zt,
  transformer: Ve,
  tuple: zt,
  undefined: Nt,
  union: Dt,
  unknown: Ot,
  void: Rt,
  NEVER: ar,
  ZodIssueCode: d,
  quotelessJson: Ke,
  ZodError: I
});
const ir = i.object({
  country: i.string(),
  city: i.string(),
  street: i.string(),
  streetNumber: i.string(),
  floor: i.string(),
  apartmentEnterNumber: i.string(),
  apartmentNumber: i.string()
}), C = i.enum(["True", "False"]), lr = i.string().min(1), fr = i.string().regex(/^\d+$/, "Must be a numeric string"), ee = i.object({
  lang: i.enum(["he"]),
  value: i.string().min(1)
}), hr = i.array(ee), Ge = i.object({
  id: i.string().min(1),
  companyId: i.string().min(1),
  storeId: i.string().min(1),
  parentId: i.string().nullish(),
  tag: i.string().min(1),
  locales: i.array(ee),
  depth: i.number()
}), Pe = Ge.extend({
  children: i.lazy(() => Pe.array())
}), mr = Ge.extend({
  index: i.number(),
  depth: i.number(),
  collapsed: i.boolean().optional(),
  children: i.array(Pe)
}), Ze = i.string(), Se = i.object({
  type: i.literal("Product"),
  storeId: Ze,
  companyId: Ze,
  id: i.string(),
  objectID: i.string(),
  sku: i.string().min(1),
  name: i.array(ee),
  description: i.array(ee),
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
  manufacturer: Ze,
  brand: i.string(),
  importer: i.string(),
  supplier: i.string(),
  ingredients: i.array(ee),
  created_at: i.number(),
  updated_at: i.number(),
  categoryList: i.array(Pe),
  // generated
  categories: i.object({
    lvl0: i.array(i.string()),
    lvl1: i.array(i.string()),
    lvl2: i.array(i.string()),
    lvl3: i.array(i.string()),
    lvl4: i.array(i.string())
  }),
  categoryNames: i.array(i.string())
}), pr = Se.omit({
  id: !0,
  categories: !0,
  images: !0
}).extend({
  image: i.instanceof(File).optional()
}), gr = Se.extend({
  image: i.instanceof(File).optional()
}), yr = i.object({
  type: i.literal("Cart"),
  id: i.string().uuid(),
  companyId: i.string().uuid(),
  storeId: i.string().uuid(),
  userId: i.string().uuid(),
  status: i.enum(["active", "draft", "completed"]),
  items: i.array(
    i.object({
      product: Se,
      amount: i.number().int().positive({ message: "Quantity must be a positive integer." })
    })
  )
}), vr = i.object({
  id: i.string(),
  name: i.string(),
  websiteDomains: i.array(i.string()),
  owner: i.object({
    name: i.string(),
    emails: i.object({
      mainEmail: i.string()
    })
  })
}), _r = i.object({
  type: i.literal("FavoriteProduct"),
  id: i.string().uuid(),
  companyId: i.string().uuid(),
  storeId: i.string().uuid(),
  userId: i.string().uuid(),
  productId: i.string().uuid()
}), or = i.object({
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
  address: ir,
  isAnonymous: i.boolean(),
  createdDate: i.number(),
  lastActivityDate: i.number()
});
function br() {
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
const xr = i.object({
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
    items: i.array(i.object({ product: Se, amount: i.number() })),
    cartTotal: i.number(),
    cartDiscount: i.number(),
    cartVat: i.number()
  }),
  date: i.number(),
  deliveryDate: i.number().optional(),
  client: or
}), x = i.string().min(1), j = i.string().regex(/^\d+$/, "Must be a numeric string"), $e = i.object({
  Masof: x,
  // store masof number
  PassP: x,
  // store masof password,
  KEY: x.optional(),
  // hyp api key
  Amount: x,
  Order: x.optional(),
  // order id generated by store
  Tash: j,
  // Max number of payments that can be selected by the customer
  FixTash: C.optional(),
  // tashType: - Payment type optional NOT_IN_USE
  UTF8: C,
  // request is utf8
  UTF8out: C,
  // response is utf8
  MoreData: C.optional(),
  // extra data in response
  J5: C.optional()
}), kr = $e.extend({
  action: i.literal("soft"),
  Info: x,
  // text that will be displayed in transaction, report and the management system.
  CC: j,
  // token number
  Tmonth: x,
  // MM
  Tyear: x,
  // YYYY
  AuthNum: x,
  //  confirmation number
  cvv: i.string().optional(),
  // only if required
  UserId: x,
  "inputObj.originalUid": x,
  "inputObj.originalAmount": x,
  "inputObj.authorizationCodeManpik": i.literal("7"),
  ClientName: x,
  ClientLName: x,
  Token: i.literal("True")
  // CC2
  // Coin
}), wr = i.object({
  action: i.literal("getToken"),
  allowFalse: i.literal("True"),
  Masof: x,
  // store masof number
  PassP: x,
  // store masof password,
  TransId: j
  //todo api key is not required???
}), Tr = i.object({
  Id: j,
  Token: j,
  Tokef: j,
  // credit card validity date in the format YYMM
  CCode: j
  //0 code is valid
}), Sr = $e.extend({
  Id: x,
  // transaction Id in Hypay
  ACode: j,
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
}), Cr = $e.extend({
  Masof: x,
  // store masof number
  PassP: x,
  // store masof password,
  KEY: x,
  // hyp api key
  action: i.literal("APISign"),
  What: i.literal("SIGN"),
  Info: x,
  // text that will be displayed in transaction, report and the management system.
  Sign: C,
  // Sign on sent parameters in answer
  UTF8: C,
  // request is utf8
  UTF8out: C,
  // response is utf8
  Tash: j,
  // Max number of payments that can be selected by the customer
  FixTash: C.optional(),
  sendemail: C.optional(),
  // EzCount Invoice parameters - Pay Protocol
  SendHesh: C.optional(),
  // send invoice in email
  heshDesc: x,
  // [0~Item 1~1~8][0~Item 2~2~1]
  Pritim: C.optional(),
  // The invoice description contains items
  // client data
  UserId: j,
  ClientName: x,
  // first name
  ClientLName: x.optional(),
  // last name
  street: x.optional(),
  city: x.optional(),
  zip: x.optional(),
  phone: x.optional(),
  cell: x.optional(),
  email: x.optional()
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
    isJ5: C,
    KEY: i.string().min(1)
    // api key
  })
});
const Ir = i.object({
  storeEmail: i.string().email()
}), cr = {
  products: "products"
}, Qe = {
  getPath: ({
    companyId: r,
    storeId: e,
    collectionName: t
  }) => `${r}/${e}/${t}`,
  getProductsPath: ({ companyId: r, storeId: e }) => Qe.getPath({ companyId: r, storeId: e, collectionName: cr.products })
}, Zr = {
  firestore: Qe
}, ge = "https://pay.hyp.co.il/p/";
function Ne(r) {
  return Object.keys(r).map((e) => `${encodeURIComponent(e)}=${encodeURIComponent(r[e])}`).join("&");
}
function dr(r) {
  if (!/^\d{4}$/.test(r))
    throw new Error("Invalid YYMM format. Expected 4-digit string (YYMM).");
  const e = r.slice(0, 2), t = r.slice(2, 4), n = (/* @__PURE__ */ new Date()).getFullYear(), a = Math.floor(n / 100) * 100 + parseInt(e, 10), o = n % 100, c = parseInt(e, 10) > o ? a - 100 : a;
  return { month: t, year: c.toString() };
}
function ur(r) {
  return r.split("&").reduce((e, t) => {
    const [n, s] = t.split("=");
    return n && s && (e[n] = decodeURIComponent(s)), e;
  }, {});
}
const Nr = {
  async chargeJ5Transaction(r) {
    try {
      const e = Ne({
        action: "getToken",
        allowFalse: "True",
        Masof: r.masof,
        PassP: r.masofPassword,
        TransId: r.transactionId
      }), n = await (await fetch(`${ge}?${e}`)).text(), s = ur(n), a = dr(s.Tokef);
      let o = Number(r.originalAmount) * 100;
      const c = Ne({
        action: "soft",
        MoreData: "True",
        UTF8: "True",
        UTF8out: "True",
        "inputObj.originalUid": r.transactionUID,
        "inputObj.originalAmount": o.toString(),
        "inputObj.authorizationCodeManpik": "7",
        Amount: r.actualAmount.toString(),
        AuthNum: r.creditCardConfirmNumber,
        Info: "soft Info",
        Masof: r.masof,
        PassP: r.masofPassword,
        Tash: "1",
        Tmonth: a.month,
        Tyear: a.year,
        Order: r.orderId,
        CC: s.Token,
        UserId: "203269535",
        ClientName: r.clientName,
        ClientLName: r.clientLastName,
        Token: "True",
        FixTash: "True"
      }), u = await (await fetch(`${ge}?${c}`)).text();
      return console.log("Amount", r.actualAmount.toString()), console.log("token", s.Token), console.log("AuthNum", r.creditCardConfirmNumber), console.log("originalUid", r.transactionUID), console.log("transactionData", u), { success: !0 };
    } catch (e) {
      return console.log(e), { success: !1, errMessage: e.message };
    }
  },
  async createPaymentLink(r) {
    try {
      const e = Ne(r), t = `${ge}?${e}`;
      console.log("createPaymentLink url", t);
      const s = await (await fetch(t)).text();
      return { success: !0, paymentLink: `${ge}?${s}` };
    } catch (e) {
      return console.log(e), { success: !1, errMessage: e.message };
    }
  }
};
export {
  ir as AddressSchema,
  Ge as BaseCategorySchema,
  yr as CartSchema,
  Pe as CategorySchema,
  vr as CompanySchema,
  gr as EditProductSchema,
  _r as FavoriteProductSchema,
  Zr as FirebaseAPI,
  Cr as HypPaymentLinkRequestSchema,
  kr as HypSoftTransactionRequestSchema,
  wr as HypTokenRequestSchema,
  Tr as HypTokenResponseSchema,
  ee as LocaleSchema,
  hr as LocaleValueSchema,
  pr as NewProductSchema,
  xr as OrderSchema,
  $e as PayProtocolGeneralSchema,
  Sr as PayProtocolResponseSchema,
  Se as ProductSchema,
  or as ProfileSchema,
  Ir as StorePrivateSchema,
  mr as TFlattenCategorySchema,
  br as createEmptyProfile,
  C as hypBooleanSchema,
  Nr as hypPaymentService,
  lr as notEmptyTextSchema,
  fr as numericTextSchema
};
//# sourceMappingURL=core.es.js.map
