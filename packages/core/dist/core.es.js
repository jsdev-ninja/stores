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
    for (const c of s)
      a[c] = c;
    return a;
  }, r.getValidEnumValues = (s) => {
    const a = r.objectKeys(s).filter((i) => typeof s[s[i]] != "number"), c = {};
    for (const i of a)
      c[i] = s[i];
    return r.objectValues(c);
  }, r.objectValues = (s) => r.objectKeys(s).map(function(a) {
    return s[a];
  }), r.objectKeys = typeof Object.keys == "function" ? (s) => Object.keys(s) : (s) => {
    const a = [];
    for (const c in s)
      Object.prototype.hasOwnProperty.call(s, c) && a.push(c);
    return a;
  }, r.find = (s, a) => {
    for (const c of s)
      if (a(c))
        return c;
  }, r.isInteger = typeof Number.isInteger == "function" ? (s) => Number.isInteger(s) : (s) => typeof s == "number" && isFinite(s) && Math.floor(s) === s;
  function n(s, a = " | ") {
    return s.map((c) => typeof c == "string" ? `'${c}'` : c).join(a);
  }
  r.joinValues = n, r.jsonStringifyReplacer = (s, a) => typeof a == "bigint" ? a.toString() : a;
})(b || (b = {}));
var Ne;
(function(r) {
  r.mergeShapes = (e, t) => ({
    ...e,
    ...t
    // second overwrites first
  });
})(Ne || (Ne = {}));
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
]), V = (r) => {
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
]), it = (r) => JSON.stringify(r, null, 2).replace(/"([^"]+)":/g, "$1:");
class Z extends Error {
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
      for (const c of a.issues)
        if (c.code === "invalid_union")
          c.unionErrors.map(s);
        else if (c.code === "invalid_return_type")
          s(c.returnTypeError);
        else if (c.code === "invalid_arguments")
          s(c.argumentsError);
        else if (c.path.length === 0)
          n._errors.push(t(c));
        else {
          let i = n, l = 0;
          for (; l < c.path.length; ) {
            const u = c.path[l];
            l === c.path.length - 1 ? (i[u] = i[u] || { _errors: [] }, i[u]._errors.push(t(c))) : i[u] = i[u] || { _errors: [] }, i = i[u], l++;
          }
        }
    };
    return s(this), n;
  }
  static assert(e) {
    if (!(e instanceof Z))
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
Z.create = (r) => new Z(r);
const G = (r, e) => {
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
let Ue = G;
function ot(r) {
  Ue = r;
}
function _e() {
  return Ue;
}
const be = (r) => {
  const { data: e, path: t, errorMaps: n, issueData: s } = r, a = [...t, ...s.path || []], c = {
    ...s,
    path: a
  };
  if (s.message !== void 0)
    return {
      ...s,
      path: a,
      message: s.message
    };
  let i = "";
  const l = n.filter((u) => !!u).slice().reverse();
  for (const u of l)
    i = u(c, { data: e, defaultError: i }).message;
  return {
    ...s,
    path: a,
    message: i
  };
}, ct = [];
function f(r, e) {
  const t = _e(), n = be({
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
      t === G ? void 0 : G
      // then global default map
    ].filter((s) => !!s)
  });
  r.common.issues.push(n);
}
class C {
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
      const a = await s.key, c = await s.value;
      n.push({
        key: a,
        value: c
      });
    }
    return C.mergeObjectSync(e, n);
  }
  static mergeObjectSync(e, t) {
    const n = {};
    for (const s of t) {
      const { key: a, value: c } = s;
      if (a.status === "aborted" || c.status === "aborted")
        return g;
      a.status === "dirty" && e.dirty(), c.status === "dirty" && e.dirty(), a.value !== "__proto__" && (typeof c.value < "u" || s.alwaysSet) && (n[a.value] = c.value);
    }
    return { status: e.value, value: n };
  }
}
const g = Object.freeze({
  status: "aborted"
}), Q = (r) => ({ status: "dirty", value: r }), S = (r) => ({ status: "valid", value: r }), Oe = (r) => r.status === "aborted", je = (r) => r.status === "dirty", B = (r) => r.status === "valid", ne = (r) => typeof Promise < "u" && r instanceof Promise;
function xe(r, e, t, n) {
  if (typeof e == "function" ? r !== e || !0 : !e.has(r)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return e.get(r);
}
function Be(r, e, t, n, s) {
  if (typeof e == "function" ? r !== e || !0 : !e.has(r)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return e.set(r, t), t;
}
var m;
(function(r) {
  r.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, r.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(m || (m = {}));
var te, re;
class R {
  constructor(e, t, n, s) {
    this._cachedPath = [], this.parent = e, this.data = t, this._path = n, this._key = s;
  }
  get path() {
    return this._cachedPath.length || (this._key instanceof Array ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Le = (r, e) => {
  if (B(e))
    return { success: !0, data: e.value };
  if (!r.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const t = new Z(r.common.issues);
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
  return e ? { errorMap: e, description: s } : { errorMap: (c, i) => {
    var l, u;
    const { message: p } = r;
    return c.code === "invalid_enum_value" ? { message: p ?? i.defaultError } : typeof i.data > "u" ? { message: (l = p ?? n) !== null && l !== void 0 ? l : i.defaultError } : c.code !== "invalid_type" ? { message: i.defaultError } : { message: (u = p ?? t) !== null && u !== void 0 ? u : i.defaultError };
  }, description: s };
}
class _ {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return V(e.data);
  }
  _getOrReturnCtx(e, t) {
    return t || {
      common: e.parent.common,
      data: e.data,
      parsedType: V(e.data),
      schemaErrorMap: this._def.errorMap,
      path: e.path,
      parent: e.parent
    };
  }
  _processInputParams(e) {
    return {
      status: new C(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: V(e.data),
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
      parsedType: V(e)
    }, a = this._parseSync({ data: e, path: s.path, parent: s });
    return Le(s, a);
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
      parsedType: V(e)
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
      parsedType: V(e)
    }, s = this._parse({ data: e, path: n.path, parent: n }), a = await (ne(s) ? s : Promise.resolve(s));
    return Le(n, a);
  }
  refine(e, t) {
    const n = (s) => typeof t == "string" || typeof t > "u" ? { message: t } : typeof t == "function" ? t(s) : t;
    return this._refinement((s, a) => {
      const c = e(s), i = () => a.addIssue({
        code: d.custom,
        ...n(s)
      });
      return typeof Promise < "u" && c instanceof Promise ? c.then((l) => l ? !0 : (i(), !1)) : c ? !0 : (i(), !1);
    });
  }
  refinement(e, t) {
    return this._refinement((n, s) => e(n) ? !0 : (s.addIssue(typeof t == "function" ? t(n, s) : t), !1));
  }
  _refinement(e) {
    return new j({
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
    return E.create(this, this._def);
  }
  nullable() {
    return F.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return O.create(this);
  }
  promise() {
    return K.create(this, this._def);
  }
  or(e) {
    return oe.create([this, e], this._def);
  }
  and(e) {
    return ce.create(this, e, this._def);
  }
  transform(e) {
    return new j({
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
    return new Re({
      typeName: y.ZodBranded,
      type: this,
      ...v(this._def)
    });
  }
  catch(e) {
    const t = typeof e == "function" ? e : () => e;
    return new pe({
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
    return me.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const dt = /^c[^\s-]{8,}$/i, ut = /^[0-9a-z]+$/, lt = /^[0-9A-HJKMNP-TV-Z]{26}$/i, ft = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, ht = /^[a-z0-9_-]{21}$/i, pt = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, mt = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, yt = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, gt = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let Ie;
const vt = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, _t = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, bt = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, xt = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, kt = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, wt = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, qe = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", Tt = new RegExp(`^${qe}$`);
function We(r) {
  let e = "([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d";
  return r.precision ? e = `${e}\\.\\d{${r.precision}}` : r.precision == null && (e = `${e}(\\.\\d+)?`), e;
}
function Ct(r) {
  return new RegExp(`^${We(r)}$`);
}
function Je(r) {
  let e = `${qe}T${We(r)}`;
  const t = [];
  return t.push(r.local ? "Z?" : "Z"), r.offset && t.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${t.join("|")})`, new RegExp(`^${e}$`);
}
function St(r, e) {
  return !!((e === "v4" || !e) && vt.test(r) || (e === "v6" || !e) && bt.test(r));
}
function Zt(r, e) {
  if (!pt.test(r))
    return !1;
  try {
    const [t] = r.split("."), n = t.replace(/-/g, "+").replace(/_/g, "/").padEnd(t.length + (4 - t.length % 4) % 4, "="), s = JSON.parse(atob(n));
    return !(typeof s != "object" || s === null || !s.typ || !s.alg || e && s.alg !== e);
  } catch {
    return !1;
  }
}
function It(r, e) {
  return !!((e === "v4" || !e) && _t.test(r) || (e === "v6" || !e) && xt.test(r));
}
class N extends _ {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== h.string) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: d.invalid_type,
        expected: h.string,
        received: a.parsedType
      }), g;
    }
    const n = new C();
    let s;
    for (const a of this._def.checks)
      if (a.kind === "min")
        e.data.length < a.value && (s = this._getOrReturnCtx(e, s), f(s, {
          code: d.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), n.dirty());
      else if (a.kind === "max")
        e.data.length > a.value && (s = this._getOrReturnCtx(e, s), f(s, {
          code: d.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), n.dirty());
      else if (a.kind === "length") {
        const c = e.data.length > a.value, i = e.data.length < a.value;
        (c || i) && (s = this._getOrReturnCtx(e, s), c ? f(s, {
          code: d.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }) : i && f(s, {
          code: d.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }), n.dirty());
      } else if (a.kind === "email")
        yt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "email",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "emoji")
        Ie || (Ie = new RegExp(gt, "u")), Ie.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "emoji",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "uuid")
        ft.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "uuid",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "nanoid")
        ht.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "nanoid",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "cuid")
        dt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "cuid",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "cuid2")
        ut.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "cuid2",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "ulid")
        lt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
          validation: "ulid",
          code: d.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "url")
        try {
          new URL(e.data);
        } catch {
          s = this._getOrReturnCtx(e, s), f(s, {
            validation: "url",
            code: d.invalid_string,
            message: a.message
          }), n.dirty();
        }
      else a.kind === "regex" ? (a.regex.lastIndex = 0, a.regex.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        validation: "regex",
        code: d.invalid_string,
        message: a.message
      }), n.dirty())) : a.kind === "trim" ? e.data = e.data.trim() : a.kind === "includes" ? e.data.includes(a.value, a.position) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: d.invalid_string,
        validation: { includes: a.value, position: a.position },
        message: a.message
      }), n.dirty()) : a.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : a.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : a.kind === "startsWith" ? e.data.startsWith(a.value) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: d.invalid_string,
        validation: { startsWith: a.value },
        message: a.message
      }), n.dirty()) : a.kind === "endsWith" ? e.data.endsWith(a.value) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: d.invalid_string,
        validation: { endsWith: a.value },
        message: a.message
      }), n.dirty()) : a.kind === "datetime" ? Je(a).test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: d.invalid_string,
        validation: "datetime",
        message: a.message
      }), n.dirty()) : a.kind === "date" ? Tt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: d.invalid_string,
        validation: "date",
        message: a.message
      }), n.dirty()) : a.kind === "time" ? Ct(a).test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: d.invalid_string,
        validation: "time",
        message: a.message
      }), n.dirty()) : a.kind === "duration" ? mt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        validation: "duration",
        code: d.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "ip" ? St(e.data, a.version) || (s = this._getOrReturnCtx(e, s), f(s, {
        validation: "ip",
        code: d.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "jwt" ? Zt(e.data, a.alg) || (s = this._getOrReturnCtx(e, s), f(s, {
        validation: "jwt",
        code: d.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "cidr" ? It(e.data, a.version) || (s = this._getOrReturnCtx(e, s), f(s, {
        validation: "cidr",
        code: d.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "base64" ? kt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        validation: "base64",
        code: d.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "base64url" ? wt.test(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
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
    return new N({
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
  const t = (r.toString().split(".")[1] || "").length, n = (e.toString().split(".")[1] || "").length, s = t > n ? t : n, a = parseInt(r.toFixed(s).replace(".", "")), c = parseInt(e.toFixed(s).replace(".", ""));
  return a % c / Math.pow(10, s);
}
class M extends _ {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e) {
    if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== h.number) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: d.invalid_type,
        expected: h.number,
        received: a.parsedType
      }), g;
    }
    let n;
    const s = new C();
    for (const a of this._def.checks)
      a.kind === "int" ? b.isInteger(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: d.invalid_type,
        expected: "integer",
        received: "float",
        message: a.message
      }), s.dirty()) : a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (n = this._getOrReturnCtx(e, n), f(n, {
        code: d.too_small,
        minimum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (n = this._getOrReturnCtx(e, n), f(n, {
        code: d.too_big,
        maximum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? At(e.data, a.value) !== 0 && (n = this._getOrReturnCtx(e, n), f(n, {
        code: d.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
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
    return new M({
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
    return new M({
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
M.create = (r) => new M({
  checks: [],
  typeName: y.ZodNumber,
  coerce: (r == null ? void 0 : r.coerce) || !1,
  ...v(r)
});
class L extends _ {
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
    const s = new C();
    for (const a of this._def.checks)
      a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (n = this._getOrReturnCtx(e, n), f(n, {
        code: d.too_small,
        type: "bigint",
        minimum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (n = this._getOrReturnCtx(e, n), f(n, {
        code: d.too_big,
        type: "bigint",
        maximum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? e.data % a.value !== BigInt(0) && (n = this._getOrReturnCtx(e, n), f(n, {
        code: d.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : b.assertNever(a);
    return { status: s.value, value: e.data };
  }
  _getInvalidInput(e) {
    const t = this._getOrReturnCtx(e);
    return f(t, {
      code: d.invalid_type,
      expected: h.bigint,
      received: t.parsedType
    }), g;
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
    return new L({
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
    return new L({
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
L.create = (r) => {
  var e;
  return new L({
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
        code: d.invalid_type,
        expected: h.boolean,
        received: n.parsedType
      }), g;
    }
    return S(e.data);
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
        code: d.invalid_type,
        expected: h.date,
        received: a.parsedType
      }), g;
    }
    if (isNaN(e.data.getTime())) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: d.invalid_date
      }), g;
    }
    const n = new C();
    let s;
    for (const a of this._def.checks)
      a.kind === "min" ? e.data.getTime() < a.value && (s = this._getOrReturnCtx(e, s), f(s, {
        code: d.too_small,
        message: a.message,
        inclusive: !0,
        exact: !1,
        minimum: a.value,
        type: "date"
      }), n.dirty()) : a.kind === "max" ? e.data.getTime() > a.value && (s = this._getOrReturnCtx(e, s), f(s, {
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
    return new q({
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
q.create = (r) => new q({
  checks: [],
  coerce: (r == null ? void 0 : r.coerce) || !1,
  typeName: y.ZodDate,
  ...v(r)
});
class ke extends _ {
  _parse(e) {
    if (this._getType(e) !== h.symbol) {
      const n = this._getOrReturnCtx(e);
      return f(n, {
        code: d.invalid_type,
        expected: h.symbol,
        received: n.parsedType
      }), g;
    }
    return S(e.data);
  }
}
ke.create = (r) => new ke({
  typeName: y.ZodSymbol,
  ...v(r)
});
class ae extends _ {
  _parse(e) {
    if (this._getType(e) !== h.undefined) {
      const n = this._getOrReturnCtx(e);
      return f(n, {
        code: d.invalid_type,
        expected: h.undefined,
        received: n.parsedType
      }), g;
    }
    return S(e.data);
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
        code: d.invalid_type,
        expected: h.null,
        received: n.parsedType
      }), g;
    }
    return S(e.data);
  }
}
ie.create = (r) => new ie({
  typeName: y.ZodNull,
  ...v(r)
});
class X extends _ {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return S(e.data);
  }
}
X.create = (r) => new X({
  typeName: y.ZodAny,
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
  typeName: y.ZodUnknown,
  ...v(r)
});
class D extends _ {
  _parse(e) {
    const t = this._getOrReturnCtx(e);
    return f(t, {
      code: d.invalid_type,
      expected: h.never,
      received: t.parsedType
    }), g;
  }
}
D.create = (r) => new D({
  typeName: y.ZodNever,
  ...v(r)
});
class we extends _ {
  _parse(e) {
    if (this._getType(e) !== h.undefined) {
      const n = this._getOrReturnCtx(e);
      return f(n, {
        code: d.invalid_type,
        expected: h.void,
        received: n.parsedType
      }), g;
    }
    return S(e.data);
  }
}
we.create = (r) => new we({
  typeName: y.ZodVoid,
  ...v(r)
});
class O extends _ {
  _parse(e) {
    const { ctx: t, status: n } = this._processInputParams(e), s = this._def;
    if (t.parsedType !== h.array)
      return f(t, {
        code: d.invalid_type,
        expected: h.array,
        received: t.parsedType
      }), g;
    if (s.exactLength !== null) {
      const c = t.data.length > s.exactLength.value, i = t.data.length < s.exactLength.value;
      (c || i) && (f(t, {
        code: c ? d.too_big : d.too_small,
        minimum: i ? s.exactLength.value : void 0,
        maximum: c ? s.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: s.exactLength.message
      }), n.dirty());
    }
    if (s.minLength !== null && t.data.length < s.minLength.value && (f(t, {
      code: d.too_small,
      minimum: s.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.minLength.message
    }), n.dirty()), s.maxLength !== null && t.data.length > s.maxLength.value && (f(t, {
      code: d.too_big,
      maximum: s.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.maxLength.message
    }), n.dirty()), t.common.async)
      return Promise.all([...t.data].map((c, i) => s.type._parseAsync(new R(t, c, t.path, i)))).then((c) => C.mergeArray(n, c));
    const a = [...t.data].map((c, i) => s.type._parseSync(new R(t, c, t.path, i)));
    return C.mergeArray(n, a);
  }
  get element() {
    return this._def.type;
  }
  min(e, t) {
    return new O({
      ...this._def,
      minLength: { value: e, message: m.toString(t) }
    });
  }
  max(e, t) {
    return new O({
      ...this._def,
      maxLength: { value: e, message: m.toString(t) }
    });
  }
  length(e, t) {
    return new O({
      ...this._def,
      exactLength: { value: e, message: m.toString(t) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
O.create = (r, e) => new O({
  type: r,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: y.ZodArray,
  ...v(e)
});
function J(r) {
  if (r instanceof k) {
    const e = {};
    for (const t in r.shape) {
      const n = r.shape[t];
      e[t] = E.create(J(n));
    }
    return new k({
      ...r._def,
      shape: () => e
    });
  } else return r instanceof O ? new O({
    ...r._def,
    type: J(r.element)
  }) : r instanceof E ? E.create(J(r.unwrap())) : r instanceof F ? F.create(J(r.unwrap())) : r instanceof P ? P.create(r.items.map((e) => J(e))) : r;
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
      return f(u, {
        code: d.invalid_type,
        expected: h.object,
        received: u.parsedType
      }), g;
    }
    const { status: n, ctx: s } = this._processInputParams(e), { shape: a, keys: c } = this._getCached(), i = [];
    if (!(this._def.catchall instanceof D && this._def.unknownKeys === "strip"))
      for (const u in s.data)
        c.includes(u) || i.push(u);
    const l = [];
    for (const u of c) {
      const p = a[u], x = s.data[u];
      l.push({
        key: { status: "valid", value: u },
        value: p._parse(new R(s, x, s.path, u)),
        alwaysSet: u in s.data
      });
    }
    if (this._def.catchall instanceof D) {
      const u = this._def.unknownKeys;
      if (u === "passthrough")
        for (const p of i)
          l.push({
            key: { status: "valid", value: p },
            value: { status: "valid", value: s.data[p] }
          });
      else if (u === "strict")
        i.length > 0 && (f(s, {
          code: d.unrecognized_keys,
          keys: i
        }), n.dirty());
      else if (u !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const u = this._def.catchall;
      for (const p of i) {
        const x = s.data[p];
        l.push({
          key: { status: "valid", value: p },
          value: u._parse(
            new R(s, x, s.path, p)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: p in s.data
        });
      }
    }
    return s.common.async ? Promise.resolve().then(async () => {
      const u = [];
      for (const p of l) {
        const x = await p.key, I = await p.value;
        u.push({
          key: x,
          value: I,
          alwaysSet: p.alwaysSet
        });
      }
      return u;
    }).then((u) => C.mergeObjectSync(n, u)) : C.mergeObjectSync(n, l);
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
          var s, a, c, i;
          const l = (c = (a = (s = this._def).errorMap) === null || a === void 0 ? void 0 : a.call(s, t, n).message) !== null && c !== void 0 ? c : n.defaultError;
          return t.code === "unrecognized_keys" ? {
            message: (i = m.errToObj(e).message) !== null && i !== void 0 ? i : l
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
    return J(this);
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
        for (; a instanceof E; )
          a = a._def.innerType;
        t[n] = a;
      }
    }), new k({
      ...this._def,
      shape: () => t
    });
  }
  keyof() {
    return Qe(b.objectKeys(this.shape));
  }
}
k.create = (r, e) => new k({
  shape: () => r,
  unknownKeys: "strip",
  catchall: D.create(),
  typeName: y.ZodObject,
  ...v(e)
});
k.strictCreate = (r, e) => new k({
  shape: () => r,
  unknownKeys: "strict",
  catchall: D.create(),
  typeName: y.ZodObject,
  ...v(e)
});
k.lazycreate = (r, e) => new k({
  shape: r,
  unknownKeys: "strip",
  catchall: D.create(),
  typeName: y.ZodObject,
  ...v(e)
});
class oe extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e), n = this._def.options;
    function s(a) {
      for (const i of a)
        if (i.result.status === "valid")
          return i.result;
      for (const i of a)
        if (i.result.status === "dirty")
          return t.common.issues.push(...i.ctx.common.issues), i.result;
      const c = a.map((i) => new Z(i.ctx.common.issues));
      return f(t, {
        code: d.invalid_union,
        unionErrors: c
      }), g;
    }
    if (t.common.async)
      return Promise.all(n.map(async (a) => {
        const c = {
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
            parent: c
          }),
          ctx: c
        };
      })).then(s);
    {
      let a;
      const c = [];
      for (const l of n) {
        const u = {
          ...t,
          common: {
            ...t.common,
            issues: []
          },
          parent: null
        }, p = l._parseSync({
          data: t.data,
          path: t.path,
          parent: u
        });
        if (p.status === "valid")
          return p;
        p.status === "dirty" && !a && (a = { result: p, ctx: u }), u.common.issues.length && c.push(u.common.issues);
      }
      if (a)
        return t.common.issues.push(...a.ctx.common.issues), a.result;
      const i = c.map((l) => new Z(l));
      return f(t, {
        code: d.invalid_union,
        unionErrors: i
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
const $ = (r) => r instanceof ue ? $(r.schema) : r instanceof j ? $(r.innerType()) : r instanceof le ? [r.value] : r instanceof z ? r.options : r instanceof fe ? b.objectValues(r.enum) : r instanceof he ? $(r._def.innerType) : r instanceof ae ? [void 0] : r instanceof ie ? [null] : r instanceof E ? [void 0, ...$(r.unwrap())] : r instanceof F ? [null, ...$(r.unwrap())] : r instanceof Re || r instanceof me ? $(r.unwrap()) : r instanceof pe ? $(r._def.innerType) : [];
class Se extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.object)
      return f(t, {
        code: d.invalid_type,
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
      code: d.invalid_union_discriminator,
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
      const c = $(a.shape[e]);
      if (!c.length)
        throw new Error(`A discriminator value for key \`${e}\` could not be extracted from all schema options`);
      for (const i of c) {
        if (s.has(i))
          throw new Error(`Discriminator property ${String(e)} has duplicate value ${String(i)}`);
        s.set(i, a);
      }
    }
    return new Se({
      typeName: y.ZodDiscriminatedUnion,
      discriminator: e,
      options: t,
      optionsMap: s,
      ...v(n)
    });
  }
}
function Ee(r, e) {
  const t = V(r), n = V(e);
  if (r === e)
    return { valid: !0, data: r };
  if (t === h.object && n === h.object) {
    const s = b.objectKeys(e), a = b.objectKeys(r).filter((i) => s.indexOf(i) !== -1), c = { ...r, ...e };
    for (const i of a) {
      const l = Ee(r[i], e[i]);
      if (!l.valid)
        return { valid: !1 };
      c[i] = l.data;
    }
    return { valid: !0, data: c };
  } else if (t === h.array && n === h.array) {
    if (r.length !== e.length)
      return { valid: !1 };
    const s = [];
    for (let a = 0; a < r.length; a++) {
      const c = r[a], i = e[a], l = Ee(c, i);
      if (!l.valid)
        return { valid: !1 };
      s.push(l.data);
    }
    return { valid: !0, data: s };
  } else return t === h.date && n === h.date && +r == +e ? { valid: !0, data: r } : { valid: !1 };
}
class ce extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e), s = (a, c) => {
      if (Oe(a) || Oe(c))
        return g;
      const i = Ee(a.value, c.value);
      return i.valid ? ((je(a) || je(c)) && t.dirty(), { status: t.value, value: i.data }) : (f(n, {
        code: d.invalid_intersection_types
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
    ]).then(([a, c]) => s(a, c)) : s(this._def.left._parseSync({
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
class P extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== h.array)
      return f(n, {
        code: d.invalid_type,
        expected: h.array,
        received: n.parsedType
      }), g;
    if (n.data.length < this._def.items.length)
      return f(n, {
        code: d.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), g;
    !this._def.rest && n.data.length > this._def.items.length && (f(n, {
      code: d.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), t.dirty());
    const a = [...n.data].map((c, i) => {
      const l = this._def.items[i] || this._def.rest;
      return l ? l._parse(new R(n, c, n.path, i)) : null;
    }).filter((c) => !!c);
    return n.common.async ? Promise.all(a).then((c) => C.mergeArray(t, c)) : C.mergeArray(t, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new P({
      ...this._def,
      rest: e
    });
  }
}
P.create = (r, e) => {
  if (!Array.isArray(r))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new P({
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
        code: d.invalid_type,
        expected: h.object,
        received: n.parsedType
      }), g;
    const s = [], a = this._def.keyType, c = this._def.valueType;
    for (const i in n.data)
      s.push({
        key: a._parse(new R(n, i, n.path, i)),
        value: c._parse(new R(n, n.data[i], n.path, i)),
        alwaysSet: i in n.data
      });
    return n.common.async ? C.mergeObjectAsync(t, s) : C.mergeObjectSync(t, s);
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
class Te extends _ {
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
        code: d.invalid_type,
        expected: h.map,
        received: n.parsedType
      }), g;
    const s = this._def.keyType, a = this._def.valueType, c = [...n.data.entries()].map(([i, l], u) => ({
      key: s._parse(new R(n, i, n.path, [u, "key"])),
      value: a._parse(new R(n, l, n.path, [u, "value"]))
    }));
    if (n.common.async) {
      const i = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const l of c) {
          const u = await l.key, p = await l.value;
          if (u.status === "aborted" || p.status === "aborted")
            return g;
          (u.status === "dirty" || p.status === "dirty") && t.dirty(), i.set(u.value, p.value);
        }
        return { status: t.value, value: i };
      });
    } else {
      const i = /* @__PURE__ */ new Map();
      for (const l of c) {
        const u = l.key, p = l.value;
        if (u.status === "aborted" || p.status === "aborted")
          return g;
        (u.status === "dirty" || p.status === "dirty") && t.dirty(), i.set(u.value, p.value);
      }
      return { status: t.value, value: i };
    }
  }
}
Te.create = (r, e, t) => new Te({
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
        code: d.invalid_type,
        expected: h.set,
        received: n.parsedType
      }), g;
    const s = this._def;
    s.minSize !== null && n.data.size < s.minSize.value && (f(n, {
      code: d.too_small,
      minimum: s.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.minSize.message
    }), t.dirty()), s.maxSize !== null && n.data.size > s.maxSize.value && (f(n, {
      code: d.too_big,
      maximum: s.maxSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.maxSize.message
    }), t.dirty());
    const a = this._def.valueType;
    function c(l) {
      const u = /* @__PURE__ */ new Set();
      for (const p of l) {
        if (p.status === "aborted")
          return g;
        p.status === "dirty" && t.dirty(), u.add(p.value);
      }
      return { status: t.value, value: u };
    }
    const i = [...n.data.values()].map((l, u) => a._parse(new R(n, l, n.path, u)));
    return n.common.async ? Promise.all(i).then((l) => c(l)) : c(i);
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
  typeName: y.ZodSet,
  ...v(e)
});
class Y extends _ {
  constructor() {
    super(...arguments), this.validate = this.implement;
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.function)
      return f(t, {
        code: d.invalid_type,
        expected: h.function,
        received: t.parsedType
      }), g;
    function n(i, l) {
      return be({
        data: i,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          _e(),
          G
        ].filter((u) => !!u),
        issueData: {
          code: d.invalid_arguments,
          argumentsError: l
        }
      });
    }
    function s(i, l) {
      return be({
        data: i,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          _e(),
          G
        ].filter((u) => !!u),
        issueData: {
          code: d.invalid_return_type,
          returnTypeError: l
        }
      });
    }
    const a = { errorMap: t.common.contextualErrorMap }, c = t.data;
    if (this._def.returns instanceof K) {
      const i = this;
      return S(async function(...l) {
        const u = new Z([]), p = await i._def.args.parseAsync(l, a).catch((w) => {
          throw u.addIssue(n(l, w)), u;
        }), x = await Reflect.apply(c, this, p);
        return await i._def.returns._def.type.parseAsync(x, a).catch((w) => {
          throw u.addIssue(s(x, w)), u;
        });
      });
    } else {
      const i = this;
      return S(function(...l) {
        const u = i._def.args.safeParse(l, a);
        if (!u.success)
          throw new Z([n(l, u.error)]);
        const p = Reflect.apply(c, this, u.data), x = i._def.returns.safeParse(p, a);
        if (!x.success)
          throw new Z([s(p, x.error)]);
        return x.data;
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
    return new Y({
      ...this._def,
      args: P.create(e).rest(U.create())
    });
  }
  returns(e) {
    return new Y({
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
    return new Y({
      args: e || P.create([]).rest(U.create()),
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
        code: d.invalid_literal,
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
function Qe(r, e) {
  return new z({
    values: r,
    typeName: y.ZodEnum,
    ...v(e)
  });
}
class z extends _ {
  constructor() {
    super(...arguments), te.set(this, void 0);
  }
  _parse(e) {
    if (typeof e.data != "string") {
      const t = this._getOrReturnCtx(e), n = this._def.values;
      return f(t, {
        expected: b.joinValues(n),
        received: t.parsedType,
        code: d.invalid_type
      }), g;
    }
    if (xe(this, te) || Be(this, te, new Set(this._def.values)), !xe(this, te).has(e.data)) {
      const t = this._getOrReturnCtx(e), n = this._def.values;
      return f(t, {
        received: t.data,
        code: d.invalid_enum_value,
        options: n
      }), g;
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
te = /* @__PURE__ */ new WeakMap();
z.create = Qe;
class fe extends _ {
  constructor() {
    super(...arguments), re.set(this, void 0);
  }
  _parse(e) {
    const t = b.getValidEnumValues(this._def.values), n = this._getOrReturnCtx(e);
    if (n.parsedType !== h.string && n.parsedType !== h.number) {
      const s = b.objectValues(t);
      return f(n, {
        expected: b.joinValues(s),
        received: n.parsedType,
        code: d.invalid_type
      }), g;
    }
    if (xe(this, re) || Be(this, re, new Set(b.getValidEnumValues(this._def.values))), !xe(this, re).has(e.data)) {
      const s = b.objectValues(t);
      return f(n, {
        received: n.data,
        code: d.invalid_enum_value,
        options: s
      }), g;
    }
    return S(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
re = /* @__PURE__ */ new WeakMap();
fe.create = (r, e) => new fe({
  values: r,
  typeName: y.ZodNativeEnum,
  ...v(e)
});
class K extends _ {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.promise && t.common.async === !1)
      return f(t, {
        code: d.invalid_type,
        expected: h.promise,
        received: t.parsedType
      }), g;
    const n = t.parsedType === h.promise ? t.data : Promise.resolve(t.data);
    return S(n.then((s) => this._def.type.parseAsync(s, {
      path: t.path,
      errorMap: t.common.contextualErrorMap
    })));
  }
}
K.create = (r, e) => new K({
  type: r,
  typeName: y.ZodPromise,
  ...v(e)
});
class j extends _ {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === y.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e), s = this._def.effect || null, a = {
      addIssue: (c) => {
        f(n, c), c.fatal ? t.abort() : t.dirty();
      },
      get path() {
        return n.path;
      }
    };
    if (a.addIssue = a.addIssue.bind(a), s.type === "preprocess") {
      const c = s.transform(n.data, a);
      if (n.common.async)
        return Promise.resolve(c).then(async (i) => {
          if (t.value === "aborted")
            return g;
          const l = await this._def.schema._parseAsync({
            data: i,
            path: n.path,
            parent: n
          });
          return l.status === "aborted" ? g : l.status === "dirty" || t.value === "dirty" ? Q(l.value) : l;
        });
      {
        if (t.value === "aborted")
          return g;
        const i = this._def.schema._parseSync({
          data: c,
          path: n.path,
          parent: n
        });
        return i.status === "aborted" ? g : i.status === "dirty" || t.value === "dirty" ? Q(i.value) : i;
      }
    }
    if (s.type === "refinement") {
      const c = (i) => {
        const l = s.refinement(i, a);
        if (n.common.async)
          return Promise.resolve(l);
        if (l instanceof Promise)
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return i;
      };
      if (n.common.async === !1) {
        const i = this._def.schema._parseSync({
          data: n.data,
          path: n.path,
          parent: n
        });
        return i.status === "aborted" ? g : (i.status === "dirty" && t.dirty(), c(i.value), { status: t.value, value: i.value });
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((i) => i.status === "aborted" ? g : (i.status === "dirty" && t.dirty(), c(i.value).then(() => ({ status: t.value, value: i.value }))));
    }
    if (s.type === "transform")
      if (n.common.async === !1) {
        const c = this._def.schema._parseSync({
          data: n.data,
          path: n.path,
          parent: n
        });
        if (!B(c))
          return c;
        const i = s.transform(c.value, a);
        if (i instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: t.value, value: i };
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((c) => B(c) ? Promise.resolve(s.transform(c.value, a)).then((i) => ({ status: t.value, value: i })) : c);
    b.assertNever(s);
  }
}
j.create = (r, e, t) => new j({
  schema: r,
  typeName: y.ZodEffects,
  effect: e,
  ...v(t)
});
j.createWithPreprocess = (r, e, t) => new j({
  schema: e,
  effect: { type: "preprocess", transform: r },
  typeName: y.ZodEffects,
  ...v(t)
});
class E extends _ {
  _parse(e) {
    return this._getType(e) === h.undefined ? S(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
E.create = (r, e) => new E({
  innerType: r,
  typeName: y.ZodOptional,
  ...v(e)
});
class F extends _ {
  _parse(e) {
    return this._getType(e) === h.null ? S(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
F.create = (r, e) => new F({
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
class pe extends _ {
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
          return new Z(n.common.issues);
        },
        input: n.data
      })
    })) : {
      status: "valid",
      value: s.status === "valid" ? s.value : this._def.catchValue({
        get error() {
          return new Z(n.common.issues);
        },
        input: n.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
pe.create = (r, e) => new pe({
  innerType: r,
  typeName: y.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...v(e)
});
class Ce extends _ {
  _parse(e) {
    if (this._getType(e) !== h.nan) {
      const n = this._getOrReturnCtx(e);
      return f(n, {
        code: d.invalid_type,
        expected: h.nan,
        received: n.parsedType
      }), g;
    }
    return { status: "valid", value: e.data };
  }
}
Ce.create = (r) => new Ce({
  typeName: y.ZodNaN,
  ...v(r)
});
const Nt = Symbol("zod_brand");
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
        return a.status === "aborted" ? g : a.status === "dirty" ? (t.dirty(), Q(a.value)) : this._def.out._parseAsync({
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
class me extends _ {
  _parse(e) {
    const t = this._def.innerType._parse(e), n = (s) => (B(s) && (s.value = Object.freeze(s.value)), s);
    return ne(t) ? t.then((s) => n(s)) : n(t);
  }
  unwrap() {
    return this._def.innerType;
  }
}
me.create = (r, e) => new me({
  innerType: r,
  typeName: y.ZodReadonly,
  ...v(e)
});
function ze(r, e) {
  const t = typeof r == "function" ? r(e) : typeof r == "string" ? { message: r } : r;
  return typeof t == "string" ? { message: t } : t;
}
function Ye(r, e = {}, t) {
  return r ? X.create().superRefine((n, s) => {
    var a, c;
    const i = r(n);
    if (i instanceof Promise)
      return i.then((l) => {
        var u, p;
        if (!l) {
          const x = ze(e, n), I = (p = (u = x.fatal) !== null && u !== void 0 ? u : t) !== null && p !== void 0 ? p : !0;
          s.addIssue({ code: "custom", ...x, fatal: I });
        }
      });
    if (!i) {
      const l = ze(e, n), u = (c = (a = l.fatal) !== null && a !== void 0 ? a : t) !== null && c !== void 0 ? c : !0;
      s.addIssue({ code: "custom", ...l, fatal: u });
    }
  }) : X.create();
}
const Ot = {
  object: k.lazycreate
};
var y;
(function(r) {
  r.ZodString = "ZodString", r.ZodNumber = "ZodNumber", r.ZodNaN = "ZodNaN", r.ZodBigInt = "ZodBigInt", r.ZodBoolean = "ZodBoolean", r.ZodDate = "ZodDate", r.ZodSymbol = "ZodSymbol", r.ZodUndefined = "ZodUndefined", r.ZodNull = "ZodNull", r.ZodAny = "ZodAny", r.ZodUnknown = "ZodUnknown", r.ZodNever = "ZodNever", r.ZodVoid = "ZodVoid", r.ZodArray = "ZodArray", r.ZodObject = "ZodObject", r.ZodUnion = "ZodUnion", r.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", r.ZodIntersection = "ZodIntersection", r.ZodTuple = "ZodTuple", r.ZodRecord = "ZodRecord", r.ZodMap = "ZodMap", r.ZodSet = "ZodSet", r.ZodFunction = "ZodFunction", r.ZodLazy = "ZodLazy", r.ZodLiteral = "ZodLiteral", r.ZodEnum = "ZodEnum", r.ZodEffects = "ZodEffects", r.ZodNativeEnum = "ZodNativeEnum", r.ZodOptional = "ZodOptional", r.ZodNullable = "ZodNullable", r.ZodDefault = "ZodDefault", r.ZodCatch = "ZodCatch", r.ZodPromise = "ZodPromise", r.ZodBranded = "ZodBranded", r.ZodPipeline = "ZodPipeline", r.ZodReadonly = "ZodReadonly";
})(y || (y = {}));
const jt = (r, e = {
  message: `Input not instance of ${r.name}`
}) => Ye((t) => t instanceof r, e), He = N.create, Ge = M.create, Et = Ce.create, Rt = L.create, Xe = se.create, Pt = q.create, $t = ke.create, Vt = ae.create, Dt = ie.create, Mt = X.create, Lt = U.create, zt = D.create, Ft = we.create, Ut = O.create, Bt = k.create, qt = k.strictCreate, Wt = oe.create, Jt = Se.create, Qt = ce.create, Yt = P.create, Ht = de.create, Gt = Te.create, Xt = W.create, Kt = Y.create, er = ue.create, tr = le.create, rr = z.create, nr = fe.create, sr = K.create, Fe = j.create, ar = E.create, ir = F.create, or = j.createWithPreprocess, cr = ye.create, dr = () => He().optional(), ur = () => Ge().optional(), lr = () => Xe().optional(), fr = {
  string: (r) => N.create({ ...r, coerce: !0 }),
  number: (r) => M.create({ ...r, coerce: !0 }),
  boolean: (r) => se.create({
    ...r,
    coerce: !0
  }),
  bigint: (r) => L.create({ ...r, coerce: !0 }),
  date: (r) => q.create({ ...r, coerce: !0 })
}, hr = g;
var o = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  defaultErrorMap: G,
  setErrorMap: ot,
  getErrorMap: _e,
  makeIssue: be,
  EMPTY_PATH: ct,
  addIssueToContext: f,
  ParseStatus: C,
  INVALID: g,
  DIRTY: Q,
  OK: S,
  isAborted: Oe,
  isDirty: je,
  isValid: B,
  isAsync: ne,
  get util() {
    return b;
  },
  get objectUtil() {
    return Ne;
  },
  ZodParsedType: h,
  getParsedType: V,
  ZodType: _,
  datetimeRegex: Je,
  ZodString: N,
  ZodNumber: M,
  ZodBigInt: L,
  ZodBoolean: se,
  ZodDate: q,
  ZodSymbol: ke,
  ZodUndefined: ae,
  ZodNull: ie,
  ZodAny: X,
  ZodUnknown: U,
  ZodNever: D,
  ZodVoid: we,
  ZodArray: O,
  ZodObject: k,
  ZodUnion: oe,
  ZodDiscriminatedUnion: Se,
  ZodIntersection: ce,
  ZodTuple: P,
  ZodRecord: de,
  ZodMap: Te,
  ZodSet: W,
  ZodFunction: Y,
  ZodLazy: ue,
  ZodLiteral: le,
  ZodEnum: z,
  ZodNativeEnum: fe,
  ZodPromise: K,
  ZodEffects: j,
  ZodTransformer: j,
  ZodOptional: E,
  ZodNullable: F,
  ZodDefault: he,
  ZodCatch: pe,
  ZodNaN: Ce,
  BRAND: Nt,
  ZodBranded: Re,
  ZodPipeline: ye,
  ZodReadonly: me,
  custom: Ye,
  Schema: _,
  ZodSchema: _,
  late: Ot,
  get ZodFirstPartyTypeKind() {
    return y;
  },
  coerce: fr,
  any: Mt,
  array: Ut,
  bigint: Rt,
  boolean: Xe,
  date: Pt,
  discriminatedUnion: Jt,
  effect: Fe,
  enum: rr,
  function: Kt,
  instanceof: jt,
  intersection: Qt,
  lazy: er,
  literal: tr,
  map: Gt,
  nan: Et,
  nativeEnum: nr,
  never: zt,
  null: Dt,
  nullable: ir,
  number: Ge,
  object: Bt,
  oboolean: lr,
  onumber: ur,
  optional: ar,
  ostring: dr,
  pipeline: cr,
  preprocess: or,
  promise: sr,
  record: Ht,
  set: Xt,
  strictObject: qt,
  string: He,
  symbol: $t,
  transformer: Fe,
  tuple: Yt,
  undefined: Vt,
  union: Wt,
  unknown: Lt,
  void: Ft,
  NEVER: hr,
  ZodIssueCode: d,
  quotelessJson: it,
  ZodError: Z
});
const T = o.string().min(1, { message: "שדה חובה" }), br = o.string().regex(/^\d+$/, "Must be a numeric string"), pr = o.object({
  country: T,
  city: T,
  street: T,
  streetNumber: T,
  floor: T,
  apartmentEnterNumber: T,
  apartmentNumber: T
}), H = o.object({
  lang: o.enum(["he"]),
  value: o.string()
}), xr = o.array(H), Ke = o.object({
  id: o.string().min(1),
  companyId: o.string().min(1),
  storeId: o.string().min(1),
  parentId: o.string().nullish(),
  tag: o.string().optional(),
  locales: o.array(H),
  depth: o.number()
}), Pe = Ke.extend({
  children: o.lazy(() => Pe.array())
}), kr = Ke.extend({
  index: o.number(),
  depth: o.number(),
  collapsed: o.boolean().optional(),
  children: o.array(Pe)
}), ee = o.string().min(1), et = o.object({
  type: o.literal("Product"),
  storeId: ee,
  companyId: ee,
  id: ee,
  objectID: ee,
  sku: ee,
  name: o.array(H),
  description: o.array(H),
  isPublished: o.boolean(),
  vat: o.boolean(),
  priceType: o.object({
    type: o.enum(["unit", "kg", "gram", "liter", "ml"]),
    value: o.number()
  }),
  price: o.number().positive(),
  purchasePrice: o.number().optional(),
  profitPercentage: o.number().optional(),
  currency: o.literal("ILS"),
  discount: o.object({
    type: o.enum(["number", "percent", "none"]),
    value: o.number()
  }),
  isDiscountable: o.boolean({ description: "included in store discounts" }).optional(),
  weight: o.object({
    value: o.number(),
    unit: o.enum(["kg", "gram", "none"])
  }),
  volume: o.object({
    value: o.number(),
    unit: o.enum(["liter", "ml", "none"])
  }),
  images: o.array(o.object({ url: o.string().url(), id: o.string() })),
  manufacturer: o.string(),
  brand: o.string(),
  importer: o.string(),
  supplier: o.string(),
  ingredients: o.array(H),
  created_at: o.number(),
  updated_at: o.number(),
  categoryIds: o.array(o.string().nonempty()),
  // @deprecated
  categoryList: o.array(Pe),
  // @deprecated
  categories: o.object({
    lvl0: o.array(o.string()),
    lvl1: o.array(o.string()),
    lvl2: o.array(o.string()),
    lvl3: o.array(o.string()),
    lvl4: o.array(o.string())
  }),
  // @deprecated
  categoryNames: o.array(o.string())
}), wr = et.extend({
  image: o.instanceof(File).optional()
}), tt = o.object({
  product: et,
  originalPrice: o.number().optional(),
  finalPrice: o.number().optional(),
  finalDiscount: o.number().optional(),
  amount: o.number().int().positive({ message: "Quantity must be a positive integer." })
}), Tr = o.object({
  type: o.literal("Cart"),
  id: o.string().uuid(),
  companyId: o.string().uuid(),
  storeId: o.string().uuid(),
  userId: o.string().uuid(),
  status: o.enum(["active", "draft", "completed"]),
  items: o.array(tt)
}), Cr = o.object({
  id: o.string(),
  name: o.string(),
  websiteDomains: o.array(o.string())
}), Sr = o.object({
  type: o.literal("FavoriteProduct"),
  id: o.string().uuid(),
  companyId: o.string().uuid(),
  storeId: o.string().uuid(),
  userId: o.string().uuid(),
  productId: o.string().uuid()
}), rt = o.enum(["default", "delayed"]), mr = o.object({
  type: o.literal("Profile"),
  id: T,
  companyId: T,
  storeId: T,
  tenantId: T,
  clientType: o.enum(["user", "company"]),
  companyName: o.string().optional(),
  displayName: T,
  email: o.string().email(),
  phoneNumber: T.optional(),
  address: pr.optional(),
  isAnonymous: o.boolean(),
  createdDate: o.number(),
  lastActivityDate: o.number(),
  paymentType: rt
});
function Zr() {
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
    paymentType: rt.Values.default
  };
}
const Ir = o.object({
  type: o.literal("Order"),
  id: T,
  companyId: T,
  storeId: T,
  userId: T,
  status: o.enum([
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
  paymentStatus: o.enum(["pending", "pending_j5", "external", "completed", "failed", "refunded"]),
  //todo check if hyp support partial refund
  cart: o.object({
    id: o.string(),
    items: o.array(tt),
    cartDiscount: o.number(),
    cartTotal: o.number(),
    cartVat: o.number()
  }),
  originalAmount: o.number().positive().optional(),
  // what client pay
  actualAmount: o.number().positive().optional(),
  // what store charge
  date: o.number(),
  deliveryDate: o.coerce.number().optional(),
  createdAt: o.number().optional(),
  client: mr.required({})
}), yr = o.enum(["individual", "company"]);
o.object({
  id: o.string(),
  companyId: o.string(),
  name: o.string(),
  urls: o.array(o.string()),
  logoUrl: o.string(),
  tenantId: o.string(),
  // firebase auth tenantId
  paymentType: o.enum(["external", "j5"]),
  allowAnonymousClients: o.boolean(),
  isVatIncludedInPrice: o.boolean(),
  clientTypes: o.array(yr),
  minimumOrder: o.number().optional(),
  freeOrderPrice: o.number().optional()
});
const Ae = o.string().min(1), Ar = o.object({
  type: o.literal("Discount"),
  storeId: Ae,
  companyId: Ae,
  id: Ae,
  name: o.array(H),
  active: o.boolean(),
  variant: o.discriminatedUnion("variantType", [
    o.object({
      variantType: o.literal("bundle"),
      productsId: o.array(o.string()).min(1),
      requiredQuantity: o.number().positive(),
      discountPrice: o.number().positive()
    })
  ]),
  image: o.object({ url: o.string().url(), id: o.string() }).optional()
}), ve = {
  VAT: 18
};
function nt(r) {
  var e, t;
  return ((e = r.discount) == null ? void 0 : e.type) === "percent" ? r.price * (r.discount.value ?? 100) / 100 : ((t = r.discount) == null ? void 0 : t.type) === "number" ? r.price - (r.discount.value ?? 0) : 0;
}
function st(r) {
  var e, t;
  if (((e = r.discount) == null ? void 0 : e.type) === "percent") {
    const n = r.price * r.discount.value / 100;
    return r.price - n;
  }
  return ((t = r.discount) == null ? void 0 : t.type) === "number" ? r.price - r.discount.value : r.price;
}
function Nr({
  cart: r,
  discounts: e,
  store: t
}) {
  const { isVatIncludedInPrice: n } = t;
  let s = r.map((i) => ({
    amount: i.amount,
    product: { ...i.product },
    originalPrice: i.product.price,
    finalPrice: i.product.price,
    finalDiscount: 0
  }));
  const a = e.filter((i) => i.variant.variantType === "bundle" && ((r == null ? void 0 : r.reduce((u, p) => (i.variant.productsId.includes(p.product.id) && (u += p.amount), u), 0)) ?? 0) >= i.variant.requiredQuantity);
  console.log("activeDiscounts", a), a.forEach((i) => {
    var l, u;
    if (i.variant.variantType === "bundle") {
      const p = r.filter(
        (A) => i.variant.productsId.includes(A.product.id)
      ), x = (p == null ? void 0 : p.reduce((A, Me) => (i.variant.productsId.includes(Me.product.id) && (A += Me.amount), A), 0)) ?? 0, I = Math.floor(x / i.variant.requiredQuantity), w = st((l = p[0]) == null ? void 0 : l.product), Ze = nt((u = p[0]) == null ? void 0 : u.product);
      console.log("price", w, Ze);
      const at = Number(
        (i.variant.discountPrice / i.variant.requiredQuantity).toFixed(2)
      ) * 1;
      console.log("discountPrice", at);
      const $e = (w * i.variant.requiredQuantity - i.variant.discountPrice) * I, Ve = x * w, De = Ve - $e;
      console.log("totalDiscount", $e), console.log("discountPriceFinal", De, Ve);
      const ge = Number((De / x).toFixed(2));
      console.log("averagePrice", ge), s = s.map((A) => i.variant.productsId.includes(A.product.id) ? {
        ...A,
        finalPrice: ge,
        originalPrice: A.product.price,
        finalDiscount: A.product.price - ge
      } : A), console.log("averagePrice", ge), console.log(
        "yes",
        I,
        i.variant.requiredQuantity,
        i.variant.discountPrice
      ), console.log("dis", x, p);
    }
  }), console.log("result", s);
  const c = s.reduce(
    (i, l) => {
      const { product: u, amount: p, finalPrice: x, finalDiscount: I } = l;
      console.log("isVatIncludedInPrice", n);
      let w = 0;
      if (u.vat)
        if (n) {
          const Ze = x * (ve.VAT / (100 + ve.VAT));
          w = Number(Ze.toFixed(2)), w = w * p, i.vat += Number(w.toFixed(2));
        } else
          w = x * ve.VAT / 100, w = w * p, i.vat += Number(w.toFixed(2));
      return console.log("finalDiscount", I), i.cost += p * x, i.discount += I && p * I, i.finalCost += p * x + (n ? 0 : w), i;
    },
    {
      discount: 0,
      cost: 0,
      finalCost: 0,
      vat: 0
    }
  );
  return console.log("cartDetails", c), { items: s, ...c };
}
function Or(r) {
  return (r ?? []).reduce(
    (e, t) => {
      const { product: n, amount: s } = t, a = st(n), c = nt(n), i = n.price - c;
      let l = 0;
      return n.vat && (l = i * ve.VAT / 100, l = l * s, e.vat += l), e.cost += s * n.price, e.discount += c && s * c, e.finalCost += s * a + l, e;
    },
    {
      cost: 0,
      discount: 0,
      vat: 0,
      finalCost: 0
    }
  );
}
const gr = {
  stores: "STORES",
  companies: "COMPANIES"
}, vr = {
  products: "products",
  profiles: "profiles",
  cart: "cart",
  clients: "clients",
  orders: "orders",
  categories: "categories",
  favorites: "favorites",
  payments: "payments",
  settings: "settings",
  discounts: "discounts"
}, _r = {
  systemCollections: gr,
  storeCollections: vr,
  // for client
  getPath: ({
    companyId: r,
    storeId: e,
    collectionName: t,
    id: n
  }) => `${r}/${e}/${t}${n ? `/${n}` : ""}`,
  // for backend
  getDocPath: (r) => `{companyId}/{storeId}/${r}/{id}`
}, jr = {
  firestore: _r
};
export {
  pr as AddressSchema,
  Ke as BaseCategorySchema,
  tt as CartItemProductSchema,
  Tr as CartSchema,
  Pe as CategorySchema,
  Cr as CompanySchema,
  Ar as DiscountSchema,
  Sr as FavoriteProductSchema,
  jr as FirebaseAPI,
  H as LocaleSchema,
  xr as LocaleValueSchema,
  wr as NewProductSchema,
  Ir as OrderSchema,
  et as ProductSchema,
  rt as ProfilePaymentTypeSchema,
  mr as ProfileSchema,
  kr as TFlattenCategorySchema,
  Or as calculateCartPrice,
  Zr as createEmptyProfile,
  Nr as getCartCost,
  T as notEmptyTextSchema,
  br as numericTextSchema
};
//# sourceMappingURL=core.es.js.map
