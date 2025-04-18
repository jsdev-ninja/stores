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
    for (const i of s)
      a[i] = i;
    return a;
  }, r.getValidEnumValues = (s) => {
    const a = r.objectKeys(s).filter((o) => typeof s[s[o]] != "number"), i = {};
    for (const o of a)
      i[o] = s[o];
    return r.objectValues(i);
  }, r.objectValues = (s) => r.objectKeys(s).map(function(a) {
    return s[a];
  }), r.objectKeys = typeof Object.keys == "function" ? (s) => Object.keys(s) : (s) => {
    const a = [];
    for (const i in s)
      Object.prototype.hasOwnProperty.call(s, i) && a.push(i);
    return a;
  }, r.find = (s, a) => {
    for (const i of s)
      if (a(i))
        return i;
  }, r.isInteger = typeof Number.isInteger == "function" ? (s) => Number.isInteger(s) : (s) => typeof s == "number" && isFinite(s) && Math.floor(s) === s;
  function n(s, a = " | ") {
    return s.map((i) => typeof i == "string" ? `'${i}'` : i).join(a);
  }
  r.joinValues = n, r.jsonStringifyReplacer = (s, a) => typeof a == "bigint" ? a.toString() : a;
})(b || (b = {}));
var Ze;
(function(r) {
  r.mergeShapes = (e, t) => ({
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
]), qe = (r) => JSON.stringify(r, null, 2).replace(/"([^"]+)":/g, "$1:");
class S extends Error {
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
      for (const i of a.issues)
        if (i.code === "invalid_union")
          i.unionErrors.map(s);
        else if (i.code === "invalid_return_type")
          s(i.returnTypeError);
        else if (i.code === "invalid_arguments")
          s(i.argumentsError);
        else if (i.path.length === 0)
          n._errors.push(t(i));
        else {
          let o = n, f = 0;
          for (; f < i.path.length; ) {
            const u = i.path[f];
            f === i.path.length - 1 ? (o[u] = o[u] || { _errors: [] }, o[u]._errors.push(t(i))) : o[u] = o[u] || { _errors: [] }, o = o[u], f++;
          }
        }
    };
    return s(this), n;
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
    const t = {}, n = [];
    for (const s of this.issues)
      s.path.length > 0 ? (t[s.path[0]] = t[s.path[0]] || [], t[s.path[0]].push(e(s))) : n.push(e(s));
    return { formErrors: n, fieldErrors: t };
  }
  get formErrors() {
    return this.flatten();
  }
}
S.create = (r) => new S(r);
const J = (r, e) => {
  let t;
  switch (r.code) {
    case c.invalid_type:
      r.received === h.undefined ? t = "Required" : t = `Expected ${r.expected}, received ${r.received}`;
      break;
    case c.invalid_literal:
      t = `Invalid literal value, expected ${JSON.stringify(r.expected, b.jsonStringifyReplacer)}`;
      break;
    case c.unrecognized_keys:
      t = `Unrecognized key(s) in object: ${b.joinValues(r.keys, ", ")}`;
      break;
    case c.invalid_union:
      t = "Invalid input";
      break;
    case c.invalid_union_discriminator:
      t = `Invalid discriminator value. Expected ${b.joinValues(r.options)}`;
      break;
    case c.invalid_enum_value:
      t = `Invalid enum value. Expected ${b.joinValues(r.options)}, received '${r.received}'`;
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
      typeof r.validation == "object" ? "includes" in r.validation ? (t = `Invalid input: must include "${r.validation.includes}"`, typeof r.validation.position == "number" && (t = `${t} at one or more positions greater than or equal to ${r.validation.position}`)) : "startsWith" in r.validation ? t = `Invalid input: must start with "${r.validation.startsWith}"` : "endsWith" in r.validation ? t = `Invalid input: must end with "${r.validation.endsWith}"` : b.assertNever(r.validation) : r.validation !== "regex" ? t = `Invalid ${r.validation}` : t = "Invalid";
      break;
    case c.too_small:
      r.type === "array" ? t = `Array must contain ${r.exact ? "exactly" : r.inclusive ? "at least" : "more than"} ${r.minimum} element(s)` : r.type === "string" ? t = `String must contain ${r.exact ? "exactly" : r.inclusive ? "at least" : "over"} ${r.minimum} character(s)` : r.type === "number" ? t = `Number must be ${r.exact ? "exactly equal to " : r.inclusive ? "greater than or equal to " : "greater than "}${r.minimum}` : r.type === "date" ? t = `Date must be ${r.exact ? "exactly equal to " : r.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(r.minimum))}` : t = "Invalid input";
      break;
    case c.too_big:
      r.type === "array" ? t = `Array must contain ${r.exact ? "exactly" : r.inclusive ? "at most" : "less than"} ${r.maximum} element(s)` : r.type === "string" ? t = `String must contain ${r.exact ? "exactly" : r.inclusive ? "at most" : "under"} ${r.maximum} character(s)` : r.type === "number" ? t = `Number must be ${r.exact ? "exactly" : r.inclusive ? "less than or equal to" : "less than"} ${r.maximum}` : r.type === "bigint" ? t = `BigInt must be ${r.exact ? "exactly" : r.inclusive ? "less than or equal to" : "less than"} ${r.maximum}` : r.type === "date" ? t = `Date must be ${r.exact ? "exactly" : r.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(r.maximum))}` : t = "Invalid input";
      break;
    case c.custom:
      t = "Invalid input";
      break;
    case c.invalid_intersection_types:
      t = "Intersection results could not be merged";
      break;
    case c.not_multiple_of:
      t = `Number must be a multiple of ${r.multipleOf}`;
      break;
    case c.not_finite:
      t = "Number must be finite";
      break;
    default:
      t = e.defaultError, b.assertNever(r);
  }
  return { message: t };
};
let Pe = J;
function Je(r) {
  Pe = r;
}
function pe() {
  return Pe;
}
const ye = (r) => {
  const { data: e, path: t, errorMaps: n, issueData: s } = r, a = [...t, ...s.path || []], i = {
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
  const f = n.filter((u) => !!u).slice().reverse();
  for (const u of f)
    o = u(i, { data: e, defaultError: o }).message;
  return {
    ...s,
    path: a,
    message: o
  };
}, Ye = [];
function l(r, e) {
  const t = pe(), n = ye({
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
        return g;
      s.status === "dirty" && e.dirty(), n.push(s.value);
    }
    return { status: e.value, value: n };
  }
  static async mergeObjectAsync(e, t) {
    const n = [];
    for (const s of t) {
      const a = await s.key, i = await s.value;
      n.push({
        key: a,
        value: i
      });
    }
    return w.mergeObjectSync(e, n);
  }
  static mergeObjectSync(e, t) {
    const n = {};
    for (const s of t) {
      const { key: a, value: i } = s;
      if (a.status === "aborted" || i.status === "aborted")
        return g;
      a.status === "dirty" && e.dirty(), i.status === "dirty" && e.dirty(), a.value !== "__proto__" && (typeof i.value < "u" || s.alwaysSet) && (n[a.value] = i.value);
    }
    return { status: e.value, value: n };
  }
}
const g = Object.freeze({
  status: "aborted"
}), W = (r) => ({ status: "dirty", value: r }), Z = (r) => ({ status: "valid", value: r }), Se = (r) => r.status === "aborted", Ce = (r) => r.status === "dirty", z = (r) => r.status === "valid", ee = (r) => typeof Promise < "u" && r instanceof Promise;
function ge(r, e, t, n) {
  if (typeof e == "function" ? r !== e || !0 : !e.has(r)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return e.get(r);
}
function $e(r, e, t, n, s) {
  if (typeof e == "function" ? r !== e || !0 : !e.has(r)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return e.set(r, t), t;
}
var m;
(function(r) {
  r.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, r.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(m || (m = {}));
var Q, X;
class O {
  constructor(e, t, n, s) {
    this._cachedPath = [], this.parent = e, this.data = t, this._path = n, this._key = s;
  }
  get path() {
    return this._cachedPath.length || (this._key instanceof Array ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const je = (r, e) => {
  if (z(e))
    return { success: !0, data: e.value };
  if (!r.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const t = new S(r.common.issues);
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
  return e ? { errorMap: e, description: s } : { errorMap: (i, o) => {
    var f, u;
    const { message: p } = r;
    return i.code === "invalid_enum_value" ? { message: p ?? o.defaultError } : typeof o.data > "u" ? { message: (f = p ?? n) !== null && f !== void 0 ? f : o.defaultError } : i.code !== "invalid_type" ? { message: o.defaultError } : { message: (u = p ?? t) !== null && u !== void 0 ? u : o.defaultError };
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
      status: new w(),
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
    if (ee(t))
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
    return je(s, a);
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
        return z(a) ? {
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
    return this._parseAsync({ data: e, path: [], parent: s }).then((a) => z(a) ? {
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
    }, s = this._parse({ data: e, path: n.path, parent: n }), a = await (ee(s) ? s : Promise.resolve(s));
    return je(n, a);
  }
  refine(e, t) {
    const n = (s) => typeof t == "string" || typeof t > "u" ? { message: t } : typeof t == "function" ? t(s) : t;
    return this._refinement((s, a) => {
      const i = e(s), o = () => a.addIssue({
        code: c.custom,
        ...n(s)
      });
      return typeof Promise < "u" && i instanceof Promise ? i.then((f) => f ? !0 : (o(), !1)) : i ? !0 : (o(), !1);
    });
  }
  refinement(e, t) {
    return this._refinement((n, s) => e(n) ? !0 : (s.addIssue(typeof t == "function" ? t(n, s) : t), !1));
  }
  _refinement(e) {
    return new I({
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
    return N.create(this, this._def);
  }
  nullable() {
    return D.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return A.create(this);
  }
  promise() {
    return H.create(this, this._def);
  }
  or(e) {
    return se.create([this, e], this._def);
  }
  and(e) {
    return ae.create(this, e, this._def);
  }
  transform(e) {
    return new I({
      ...v(this._def),
      schema: this,
      typeName: y.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const t = typeof e == "function" ? e : () => e;
    return new ue({
      ...v(this._def),
      innerType: this,
      defaultValue: t,
      typeName: y.ZodDefault
    });
  }
  brand() {
    return new Ie({
      typeName: y.ZodBranded,
      type: this,
      ...v(this._def)
    });
  }
  catch(e) {
    const t = typeof e == "function" ? e : () => e;
    return new le({
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
const He = /^c[^\s-]{8,}$/i, Ge = /^[0-9a-z]+$/, Qe = /^[0-9A-HJKMNP-TV-Z]{26}$/i, Xe = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, Ke = /^[a-z0-9_-]{21}$/i, et = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, tt = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, rt = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, nt = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let Te;
const st = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, at = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, it = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, ot = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, dt = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, ct = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, Me = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", ut = new RegExp(`^${Me}$`);
function Ve(r) {
  let e = "([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d";
  return r.precision ? e = `${e}\\.\\d{${r.precision}}` : r.precision == null && (e = `${e}(\\.\\d+)?`), e;
}
function lt(r) {
  return new RegExp(`^${Ve(r)}$`);
}
function De(r) {
  let e = `${Me}T${Ve(r)}`;
  const t = [];
  return t.push(r.local ? "Z?" : "Z"), r.offset && t.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${t.join("|")})`, new RegExp(`^${e}$`);
}
function ft(r, e) {
  return !!((e === "v4" || !e) && st.test(r) || (e === "v6" || !e) && it.test(r));
}
function ht(r, e) {
  if (!et.test(r))
    return !1;
  try {
    const [t] = r.split("."), n = t.replace(/-/g, "+").replace(/_/g, "/").padEnd(t.length + (4 - t.length % 4) % 4, "="), s = JSON.parse(atob(n));
    return !(typeof s != "object" || s === null || !s.typ || !s.alg || e && s.alg !== e);
  } catch {
    return !1;
  }
}
function mt(r, e) {
  return !!((e === "v4" || !e) && at.test(r) || (e === "v6" || !e) && ot.test(r));
}
class C extends _ {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== h.string) {
      const a = this._getOrReturnCtx(e);
      return l(a, {
        code: c.invalid_type,
        expected: h.string,
        received: a.parsedType
      }), g;
    }
    const n = new w();
    let s;
    for (const a of this._def.checks)
      if (a.kind === "min")
        e.data.length < a.value && (s = this._getOrReturnCtx(e, s), l(s, {
          code: c.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), n.dirty());
      else if (a.kind === "max")
        e.data.length > a.value && (s = this._getOrReturnCtx(e, s), l(s, {
          code: c.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), n.dirty());
      else if (a.kind === "length") {
        const i = e.data.length > a.value, o = e.data.length < a.value;
        (i || o) && (s = this._getOrReturnCtx(e, s), i ? l(s, {
          code: c.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }) : o && l(s, {
          code: c.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }), n.dirty());
      } else if (a.kind === "email")
        rt.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "email",
          code: c.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "emoji")
        Te || (Te = new RegExp(nt, "u")), Te.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "emoji",
          code: c.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "uuid")
        Xe.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "uuid",
          code: c.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "nanoid")
        Ke.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "nanoid",
          code: c.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "cuid")
        He.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "cuid",
          code: c.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "cuid2")
        Ge.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "cuid2",
          code: c.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "ulid")
        Qe.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
          validation: "ulid",
          code: c.invalid_string,
          message: a.message
        }), n.dirty());
      else if (a.kind === "url")
        try {
          new URL(e.data);
        } catch {
          s = this._getOrReturnCtx(e, s), l(s, {
            validation: "url",
            code: c.invalid_string,
            message: a.message
          }), n.dirty();
        }
      else a.kind === "regex" ? (a.regex.lastIndex = 0, a.regex.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "regex",
        code: c.invalid_string,
        message: a.message
      }), n.dirty())) : a.kind === "trim" ? e.data = e.data.trim() : a.kind === "includes" ? e.data.includes(a.value, a.position) || (s = this._getOrReturnCtx(e, s), l(s, {
        code: c.invalid_string,
        validation: { includes: a.value, position: a.position },
        message: a.message
      }), n.dirty()) : a.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : a.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : a.kind === "startsWith" ? e.data.startsWith(a.value) || (s = this._getOrReturnCtx(e, s), l(s, {
        code: c.invalid_string,
        validation: { startsWith: a.value },
        message: a.message
      }), n.dirty()) : a.kind === "endsWith" ? e.data.endsWith(a.value) || (s = this._getOrReturnCtx(e, s), l(s, {
        code: c.invalid_string,
        validation: { endsWith: a.value },
        message: a.message
      }), n.dirty()) : a.kind === "datetime" ? De(a).test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        code: c.invalid_string,
        validation: "datetime",
        message: a.message
      }), n.dirty()) : a.kind === "date" ? ut.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        code: c.invalid_string,
        validation: "date",
        message: a.message
      }), n.dirty()) : a.kind === "time" ? lt(a).test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        code: c.invalid_string,
        validation: "time",
        message: a.message
      }), n.dirty()) : a.kind === "duration" ? tt.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "duration",
        code: c.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "ip" ? ft(e.data, a.version) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "ip",
        code: c.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "jwt" ? ht(e.data, a.alg) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "jwt",
        code: c.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "cidr" ? mt(e.data, a.version) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "cidr",
        code: c.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "base64" ? dt.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "base64",
        code: c.invalid_string,
        message: a.message
      }), n.dirty()) : a.kind === "base64url" ? ct.test(e.data) || (s = this._getOrReturnCtx(e, s), l(s, {
        validation: "base64url",
        code: c.invalid_string,
        message: a.message
      }), n.dirty()) : b.assertNever(a);
    return { status: n.value, value: e.data };
  }
  _regex(e, t, n) {
    return this.refinement((s) => e.test(s), {
      validation: t,
      code: c.invalid_string,
      ...m.errToObj(n)
    });
  }
  _addCheck(e) {
    return new C({
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
C.create = (r) => {
  var e;
  return new C({
    checks: [],
    typeName: y.ZodString,
    coerce: (e = r == null ? void 0 : r.coerce) !== null && e !== void 0 ? e : !1,
    ...v(r)
  });
};
function pt(r, e) {
  const t = (r.toString().split(".")[1] || "").length, n = (e.toString().split(".")[1] || "").length, s = t > n ? t : n, a = parseInt(r.toFixed(s).replace(".", "")), i = parseInt(e.toFixed(s).replace(".", ""));
  return a % i / Math.pow(10, s);
}
class $ extends _ {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e) {
    if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== h.number) {
      const a = this._getOrReturnCtx(e);
      return l(a, {
        code: c.invalid_type,
        expected: h.number,
        received: a.parsedType
      }), g;
    }
    let n;
    const s = new w();
    for (const a of this._def.checks)
      a.kind === "int" ? b.isInteger(e.data) || (n = this._getOrReturnCtx(e, n), l(n, {
        code: c.invalid_type,
        expected: "integer",
        received: "float",
        message: a.message
      }), s.dirty()) : a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (n = this._getOrReturnCtx(e, n), l(n, {
        code: c.too_small,
        minimum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (n = this._getOrReturnCtx(e, n), l(n, {
        code: c.too_big,
        maximum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? pt(e.data, a.value) !== 0 && (n = this._getOrReturnCtx(e, n), l(n, {
        code: c.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (n = this._getOrReturnCtx(e, n), l(n, {
        code: c.not_finite,
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
    return new $({
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
    return new $({
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
$.create = (r) => new $({
  checks: [],
  typeName: y.ZodNumber,
  coerce: (r == null ? void 0 : r.coerce) || !1,
  ...v(r)
});
class M extends _ {
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
        code: c.too_small,
        type: "bigint",
        minimum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (n = this._getOrReturnCtx(e, n), l(n, {
        code: c.too_big,
        type: "bigint",
        maximum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), s.dirty()) : a.kind === "multipleOf" ? e.data % a.value !== BigInt(0) && (n = this._getOrReturnCtx(e, n), l(n, {
        code: c.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), s.dirty()) : b.assertNever(a);
    return { status: s.value, value: e.data };
  }
  _getInvalidInput(e) {
    const t = this._getOrReturnCtx(e);
    return l(t, {
      code: c.invalid_type,
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
M.create = (r) => {
  var e;
  return new M({
    checks: [],
    typeName: y.ZodBigInt,
    coerce: (e = r == null ? void 0 : r.coerce) !== null && e !== void 0 ? e : !1,
    ...v(r)
  });
};
class te extends _ {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== h.boolean) {
      const n = this._getOrReturnCtx(e);
      return l(n, {
        code: c.invalid_type,
        expected: h.boolean,
        received: n.parsedType
      }), g;
    }
    return Z(e.data);
  }
}
te.create = (r) => new te({
  typeName: y.ZodBoolean,
  coerce: (r == null ? void 0 : r.coerce) || !1,
  ...v(r)
});
class U extends _ {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== h.date) {
      const a = this._getOrReturnCtx(e);
      return l(a, {
        code: c.invalid_type,
        expected: h.date,
        received: a.parsedType
      }), g;
    }
    if (isNaN(e.data.getTime())) {
      const a = this._getOrReturnCtx(e);
      return l(a, {
        code: c.invalid_date
      }), g;
    }
    const n = new w();
    let s;
    for (const a of this._def.checks)
      a.kind === "min" ? e.data.getTime() < a.value && (s = this._getOrReturnCtx(e, s), l(s, {
        code: c.too_small,
        message: a.message,
        inclusive: !0,
        exact: !1,
        minimum: a.value,
        type: "date"
      }), n.dirty()) : a.kind === "max" ? e.data.getTime() > a.value && (s = this._getOrReturnCtx(e, s), l(s, {
        code: c.too_big,
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
    return new U({
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
U.create = (r) => new U({
  checks: [],
  coerce: (r == null ? void 0 : r.coerce) || !1,
  typeName: y.ZodDate,
  ...v(r)
});
class ve extends _ {
  _parse(e) {
    if (this._getType(e) !== h.symbol) {
      const n = this._getOrReturnCtx(e);
      return l(n, {
        code: c.invalid_type,
        expected: h.symbol,
        received: n.parsedType
      }), g;
    }
    return Z(e.data);
  }
}
ve.create = (r) => new ve({
  typeName: y.ZodSymbol,
  ...v(r)
});
class re extends _ {
  _parse(e) {
    if (this._getType(e) !== h.undefined) {
      const n = this._getOrReturnCtx(e);
      return l(n, {
        code: c.invalid_type,
        expected: h.undefined,
        received: n.parsedType
      }), g;
    }
    return Z(e.data);
  }
}
re.create = (r) => new re({
  typeName: y.ZodUndefined,
  ...v(r)
});
class ne extends _ {
  _parse(e) {
    if (this._getType(e) !== h.null) {
      const n = this._getOrReturnCtx(e);
      return l(n, {
        code: c.invalid_type,
        expected: h.null,
        received: n.parsedType
      }), g;
    }
    return Z(e.data);
  }
}
ne.create = (r) => new ne({
  typeName: y.ZodNull,
  ...v(r)
});
class Y extends _ {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return Z(e.data);
  }
}
Y.create = (r) => new Y({
  typeName: y.ZodAny,
  ...v(r)
});
class L extends _ {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return Z(e.data);
  }
}
L.create = (r) => new L({
  typeName: y.ZodUnknown,
  ...v(r)
});
class P extends _ {
  _parse(e) {
    const t = this._getOrReturnCtx(e);
    return l(t, {
      code: c.invalid_type,
      expected: h.never,
      received: t.parsedType
    }), g;
  }
}
P.create = (r) => new P({
  typeName: y.ZodNever,
  ...v(r)
});
class _e extends _ {
  _parse(e) {
    if (this._getType(e) !== h.undefined) {
      const n = this._getOrReturnCtx(e);
      return l(n, {
        code: c.invalid_type,
        expected: h.void,
        received: n.parsedType
      }), g;
    }
    return Z(e.data);
  }
}
_e.create = (r) => new _e({
  typeName: y.ZodVoid,
  ...v(r)
});
class A extends _ {
  _parse(e) {
    const { ctx: t, status: n } = this._processInputParams(e), s = this._def;
    if (t.parsedType !== h.array)
      return l(t, {
        code: c.invalid_type,
        expected: h.array,
        received: t.parsedType
      }), g;
    if (s.exactLength !== null) {
      const i = t.data.length > s.exactLength.value, o = t.data.length < s.exactLength.value;
      (i || o) && (l(t, {
        code: i ? c.too_big : c.too_small,
        minimum: o ? s.exactLength.value : void 0,
        maximum: i ? s.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: s.exactLength.message
      }), n.dirty());
    }
    if (s.minLength !== null && t.data.length < s.minLength.value && (l(t, {
      code: c.too_small,
      minimum: s.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.minLength.message
    }), n.dirty()), s.maxLength !== null && t.data.length > s.maxLength.value && (l(t, {
      code: c.too_big,
      maximum: s.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: s.maxLength.message
    }), n.dirty()), t.common.async)
      return Promise.all([...t.data].map((i, o) => s.type._parseAsync(new O(t, i, t.path, o)))).then((i) => w.mergeArray(n, i));
    const a = [...t.data].map((i, o) => s.type._parseSync(new O(t, i, t.path, o)));
    return w.mergeArray(n, a);
  }
  get element() {
    return this._def.type;
  }
  min(e, t) {
    return new A({
      ...this._def,
      minLength: { value: e, message: m.toString(t) }
    });
  }
  max(e, t) {
    return new A({
      ...this._def,
      maxLength: { value: e, message: m.toString(t) }
    });
  }
  length(e, t) {
    return new A({
      ...this._def,
      exactLength: { value: e, message: m.toString(t) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
A.create = (r, e) => new A({
  type: r,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: y.ZodArray,
  ...v(e)
});
function B(r) {
  if (r instanceof x) {
    const e = {};
    for (const t in r.shape) {
      const n = r.shape[t];
      e[t] = N.create(B(n));
    }
    return new x({
      ...r._def,
      shape: () => e
    });
  } else return r instanceof A ? new A({
    ...r._def,
    type: B(r.element)
  }) : r instanceof N ? N.create(B(r.unwrap())) : r instanceof D ? D.create(B(r.unwrap())) : r instanceof j ? j.create(r.items.map((e) => B(e))) : r;
}
class x extends _ {
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
        code: c.invalid_type,
        expected: h.object,
        received: u.parsedType
      }), g;
    }
    const { status: n, ctx: s } = this._processInputParams(e), { shape: a, keys: i } = this._getCached(), o = [];
    if (!(this._def.catchall instanceof P && this._def.unknownKeys === "strip"))
      for (const u in s.data)
        i.includes(u) || o.push(u);
    const f = [];
    for (const u of i) {
      const p = a[u], T = s.data[u];
      f.push({
        key: { status: "valid", value: u },
        value: p._parse(new O(s, T, s.path, u)),
        alwaysSet: u in s.data
      });
    }
    if (this._def.catchall instanceof P) {
      const u = this._def.unknownKeys;
      if (u === "passthrough")
        for (const p of o)
          f.push({
            key: { status: "valid", value: p },
            value: { status: "valid", value: s.data[p] }
          });
      else if (u === "strict")
        o.length > 0 && (l(s, {
          code: c.unrecognized_keys,
          keys: o
        }), n.dirty());
      else if (u !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const u = this._def.catchall;
      for (const p of o) {
        const T = s.data[p];
        f.push({
          key: { status: "valid", value: p },
          value: u._parse(
            new O(s, T, s.path, p)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: p in s.data
        });
      }
    }
    return s.common.async ? Promise.resolve().then(async () => {
      const u = [];
      for (const p of f) {
        const T = await p.key, me = await p.value;
        u.push({
          key: T,
          value: me,
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
    return m.errToObj, new x({
      ...this._def,
      unknownKeys: "strict",
      ...e !== void 0 ? {
        errorMap: (t, n) => {
          var s, a, i, o;
          const f = (i = (a = (s = this._def).errorMap) === null || a === void 0 ? void 0 : a.call(s, t, n).message) !== null && i !== void 0 ? i : n.defaultError;
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
    return new x({
      ...this._def,
      catchall: e
    });
  }
  pick(e) {
    const t = {};
    return b.objectKeys(e).forEach((n) => {
      e[n] && this.shape[n] && (t[n] = this.shape[n]);
    }), new x({
      ...this._def,
      shape: () => t
    });
  }
  omit(e) {
    const t = {};
    return b.objectKeys(this.shape).forEach((n) => {
      e[n] || (t[n] = this.shape[n]);
    }), new x({
      ...this._def,
      shape: () => t
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return B(this);
  }
  partial(e) {
    const t = {};
    return b.objectKeys(this.shape).forEach((n) => {
      const s = this.shape[n];
      e && !e[n] ? t[n] = s : t[n] = s.optional();
    }), new x({
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
        for (; a instanceof N; )
          a = a._def.innerType;
        t[n] = a;
      }
    }), new x({
      ...this._def,
      shape: () => t
    });
  }
  keyof() {
    return Le(b.objectKeys(this.shape));
  }
}
x.create = (r, e) => new x({
  shape: () => r,
  unknownKeys: "strip",
  catchall: P.create(),
  typeName: y.ZodObject,
  ...v(e)
});
x.strictCreate = (r, e) => new x({
  shape: () => r,
  unknownKeys: "strict",
  catchall: P.create(),
  typeName: y.ZodObject,
  ...v(e)
});
x.lazycreate = (r, e) => new x({
  shape: r,
  unknownKeys: "strip",
  catchall: P.create(),
  typeName: y.ZodObject,
  ...v(e)
});
class se extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e), n = this._def.options;
    function s(a) {
      for (const o of a)
        if (o.result.status === "valid")
          return o.result;
      for (const o of a)
        if (o.result.status === "dirty")
          return t.common.issues.push(...o.ctx.common.issues), o.result;
      const i = a.map((o) => new S(o.ctx.common.issues));
      return l(t, {
        code: c.invalid_union,
        unionErrors: i
      }), g;
    }
    if (t.common.async)
      return Promise.all(n.map(async (a) => {
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
        p.status === "dirty" && !a && (a = { result: p, ctx: u }), u.common.issues.length && i.push(u.common.issues);
      }
      if (a)
        return t.common.issues.push(...a.ctx.common.issues), a.result;
      const o = i.map((f) => new S(f));
      return l(t, {
        code: c.invalid_union,
        unionErrors: o
      }), g;
    }
  }
  get options() {
    return this._def.options;
  }
}
se.create = (r, e) => new se({
  options: r,
  typeName: y.ZodUnion,
  ...v(e)
});
const E = (r) => r instanceof oe ? E(r.schema) : r instanceof I ? E(r.innerType()) : r instanceof de ? [r.value] : r instanceof V ? r.options : r instanceof ce ? b.objectValues(r.enum) : r instanceof ue ? E(r._def.innerType) : r instanceof re ? [void 0] : r instanceof ne ? [null] : r instanceof N ? [void 0, ...E(r.unwrap())] : r instanceof D ? [null, ...E(r.unwrap())] : r instanceof Ie || r instanceof fe ? E(r.unwrap()) : r instanceof le ? E(r._def.innerType) : [];
class ke extends _ {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.object)
      return l(t, {
        code: c.invalid_type,
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
    }) : (l(t, {
      code: c.invalid_union_discriminator,
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
      const i = E(a.shape[e]);
      if (!i.length)
        throw new Error(`A discriminator value for key \`${e}\` could not be extracted from all schema options`);
      for (const o of i) {
        if (s.has(o))
          throw new Error(`Discriminator property ${String(e)} has duplicate value ${String(o)}`);
        s.set(o, a);
      }
    }
    return new ke({
      typeName: y.ZodDiscriminatedUnion,
      discriminator: e,
      options: t,
      optionsMap: s,
      ...v(n)
    });
  }
}
function Ae(r, e) {
  const t = R(r), n = R(e);
  if (r === e)
    return { valid: !0, data: r };
  if (t === h.object && n === h.object) {
    const s = b.objectKeys(e), a = b.objectKeys(r).filter((o) => s.indexOf(o) !== -1), i = { ...r, ...e };
    for (const o of a) {
      const f = Ae(r[o], e[o]);
      if (!f.valid)
        return { valid: !1 };
      i[o] = f.data;
    }
    return { valid: !0, data: i };
  } else if (t === h.array && n === h.array) {
    if (r.length !== e.length)
      return { valid: !1 };
    const s = [];
    for (let a = 0; a < r.length; a++) {
      const i = r[a], o = e[a], f = Ae(i, o);
      if (!f.valid)
        return { valid: !1 };
      s.push(f.data);
    }
    return { valid: !0, data: s };
  } else return t === h.date && n === h.date && +r == +e ? { valid: !0, data: r } : { valid: !1 };
}
class ae extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e), s = (a, i) => {
      if (Se(a) || Se(i))
        return g;
      const o = Ae(a.value, i.value);
      return o.valid ? ((Ce(a) || Ce(i)) && t.dirty(), { status: t.value, value: o.data }) : (l(n, {
        code: c.invalid_intersection_types
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
    ]).then(([a, i]) => s(a, i)) : s(this._def.left._parseSync({
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
ae.create = (r, e, t) => new ae({
  left: r,
  right: e,
  typeName: y.ZodIntersection,
  ...v(t)
});
class j extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== h.array)
      return l(n, {
        code: c.invalid_type,
        expected: h.array,
        received: n.parsedType
      }), g;
    if (n.data.length < this._def.items.length)
      return l(n, {
        code: c.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), g;
    !this._def.rest && n.data.length > this._def.items.length && (l(n, {
      code: c.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), t.dirty());
    const a = [...n.data].map((i, o) => {
      const f = this._def.items[o] || this._def.rest;
      return f ? f._parse(new O(n, i, n.path, o)) : null;
    }).filter((i) => !!i);
    return n.common.async ? Promise.all(a).then((i) => w.mergeArray(t, i)) : w.mergeArray(t, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new j({
      ...this._def,
      rest: e
    });
  }
}
j.create = (r, e) => {
  if (!Array.isArray(r))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new j({
    items: r,
    typeName: y.ZodTuple,
    rest: null,
    ...v(e)
  });
};
class ie extends _ {
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
        code: c.invalid_type,
        expected: h.object,
        received: n.parsedType
      }), g;
    const s = [], a = this._def.keyType, i = this._def.valueType;
    for (const o in n.data)
      s.push({
        key: a._parse(new O(n, o, n.path, o)),
        value: i._parse(new O(n, n.data[o], n.path, o)),
        alwaysSet: o in n.data
      });
    return n.common.async ? w.mergeObjectAsync(t, s) : w.mergeObjectSync(t, s);
  }
  get element() {
    return this._def.valueType;
  }
  static create(e, t, n) {
    return t instanceof _ ? new ie({
      keyType: e,
      valueType: t,
      typeName: y.ZodRecord,
      ...v(n)
    }) : new ie({
      keyType: C.create(),
      valueType: e,
      typeName: y.ZodRecord,
      ...v(t)
    });
  }
}
class be extends _ {
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
        code: c.invalid_type,
        expected: h.map,
        received: n.parsedType
      }), g;
    const s = this._def.keyType, a = this._def.valueType, i = [...n.data.entries()].map(([o, f], u) => ({
      key: s._parse(new O(n, o, n.path, [u, "key"])),
      value: a._parse(new O(n, f, n.path, [u, "value"]))
    }));
    if (n.common.async) {
      const o = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const f of i) {
          const u = await f.key, p = await f.value;
          if (u.status === "aborted" || p.status === "aborted")
            return g;
          (u.status === "dirty" || p.status === "dirty") && t.dirty(), o.set(u.value, p.value);
        }
        return { status: t.value, value: o };
      });
    } else {
      const o = /* @__PURE__ */ new Map();
      for (const f of i) {
        const u = f.key, p = f.value;
        if (u.status === "aborted" || p.status === "aborted")
          return g;
        (u.status === "dirty" || p.status === "dirty") && t.dirty(), o.set(u.value, p.value);
      }
      return { status: t.value, value: o };
    }
  }
}
be.create = (r, e, t) => new be({
  valueType: e,
  keyType: r,
  typeName: y.ZodMap,
  ...v(t)
});
class F extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e);
    if (n.parsedType !== h.set)
      return l(n, {
        code: c.invalid_type,
        expected: h.set,
        received: n.parsedType
      }), g;
    const s = this._def;
    s.minSize !== null && n.data.size < s.minSize.value && (l(n, {
      code: c.too_small,
      minimum: s.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.minSize.message
    }), t.dirty()), s.maxSize !== null && n.data.size > s.maxSize.value && (l(n, {
      code: c.too_big,
      maximum: s.maxSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: s.maxSize.message
    }), t.dirty());
    const a = this._def.valueType;
    function i(f) {
      const u = /* @__PURE__ */ new Set();
      for (const p of f) {
        if (p.status === "aborted")
          return g;
        p.status === "dirty" && t.dirty(), u.add(p.value);
      }
      return { status: t.value, value: u };
    }
    const o = [...n.data.values()].map((f, u) => a._parse(new O(n, f, n.path, u)));
    return n.common.async ? Promise.all(o).then((f) => i(f)) : i(o);
  }
  min(e, t) {
    return new F({
      ...this._def,
      minSize: { value: e, message: m.toString(t) }
    });
  }
  max(e, t) {
    return new F({
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
F.create = (r, e) => new F({
  valueType: r,
  minSize: null,
  maxSize: null,
  typeName: y.ZodSet,
  ...v(e)
});
class q extends _ {
  constructor() {
    super(...arguments), this.validate = this.implement;
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.function)
      return l(t, {
        code: c.invalid_type,
        expected: h.function,
        received: t.parsedType
      }), g;
    function n(o, f) {
      return ye({
        data: o,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          pe(),
          J
        ].filter((u) => !!u),
        issueData: {
          code: c.invalid_arguments,
          argumentsError: f
        }
      });
    }
    function s(o, f) {
      return ye({
        data: o,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          pe(),
          J
        ].filter((u) => !!u),
        issueData: {
          code: c.invalid_return_type,
          returnTypeError: f
        }
      });
    }
    const a = { errorMap: t.common.contextualErrorMap }, i = t.data;
    if (this._def.returns instanceof H) {
      const o = this;
      return Z(async function(...f) {
        const u = new S([]), p = await o._def.args.parseAsync(f, a).catch((we) => {
          throw u.addIssue(n(f, we)), u;
        }), T = await Reflect.apply(i, this, p);
        return await o._def.returns._def.type.parseAsync(T, a).catch((we) => {
          throw u.addIssue(s(T, we)), u;
        });
      });
    } else {
      const o = this;
      return Z(function(...f) {
        const u = o._def.args.safeParse(f, a);
        if (!u.success)
          throw new S([n(f, u.error)]);
        const p = Reflect.apply(i, this, u.data), T = o._def.returns.safeParse(p, a);
        if (!T.success)
          throw new S([s(p, T.error)]);
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
    return new q({
      ...this._def,
      args: j.create(e).rest(L.create())
    });
  }
  returns(e) {
    return new q({
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
    return new q({
      args: e || j.create([]).rest(L.create()),
      returns: t || L.create(),
      typeName: y.ZodFunction,
      ...v(n)
    });
  }
}
class oe extends _ {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    return this._def.getter()._parse({ data: t.data, path: t.path, parent: t });
  }
}
oe.create = (r, e) => new oe({
  getter: r,
  typeName: y.ZodLazy,
  ...v(e)
});
class de extends _ {
  _parse(e) {
    if (e.data !== this._def.value) {
      const t = this._getOrReturnCtx(e);
      return l(t, {
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
de.create = (r, e) => new de({
  value: r,
  typeName: y.ZodLiteral,
  ...v(e)
});
function Le(r, e) {
  return new V({
    values: r,
    typeName: y.ZodEnum,
    ...v(e)
  });
}
class V extends _ {
  constructor() {
    super(...arguments), Q.set(this, void 0);
  }
  _parse(e) {
    if (typeof e.data != "string") {
      const t = this._getOrReturnCtx(e), n = this._def.values;
      return l(t, {
        expected: b.joinValues(n),
        received: t.parsedType,
        code: c.invalid_type
      }), g;
    }
    if (ge(this, Q) || $e(this, Q, new Set(this._def.values)), !ge(this, Q).has(e.data)) {
      const t = this._getOrReturnCtx(e), n = this._def.values;
      return l(t, {
        received: t.data,
        code: c.invalid_enum_value,
        options: n
      }), g;
    }
    return Z(e.data);
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
    return V.create(this.options.filter((n) => !e.includes(n)), {
      ...this._def,
      ...t
    });
  }
}
Q = /* @__PURE__ */ new WeakMap();
V.create = Le;
class ce extends _ {
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
        code: c.invalid_type
      }), g;
    }
    if (ge(this, X) || $e(this, X, new Set(b.getValidEnumValues(this._def.values))), !ge(this, X).has(e.data)) {
      const s = b.objectValues(t);
      return l(n, {
        received: n.data,
        code: c.invalid_enum_value,
        options: s
      }), g;
    }
    return Z(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
X = /* @__PURE__ */ new WeakMap();
ce.create = (r, e) => new ce({
  values: r,
  typeName: y.ZodNativeEnum,
  ...v(e)
});
class H extends _ {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== h.promise && t.common.async === !1)
      return l(t, {
        code: c.invalid_type,
        expected: h.promise,
        received: t.parsedType
      }), g;
    const n = t.parsedType === h.promise ? t.data : Promise.resolve(t.data);
    return Z(n.then((s) => this._def.type.parseAsync(s, {
      path: t.path,
      errorMap: t.common.contextualErrorMap
    })));
  }
}
H.create = (r, e) => new H({
  type: r,
  typeName: y.ZodPromise,
  ...v(e)
});
class I extends _ {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === y.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e), s = this._def.effect || null, a = {
      addIssue: (i) => {
        l(n, i), i.fatal ? t.abort() : t.dirty();
      },
      get path() {
        return n.path;
      }
    };
    if (a.addIssue = a.addIssue.bind(a), s.type === "preprocess") {
      const i = s.transform(n.data, a);
      if (n.common.async)
        return Promise.resolve(i).then(async (o) => {
          if (t.value === "aborted")
            return g;
          const f = await this._def.schema._parseAsync({
            data: o,
            path: n.path,
            parent: n
          });
          return f.status === "aborted" ? g : f.status === "dirty" || t.value === "dirty" ? W(f.value) : f;
        });
      {
        if (t.value === "aborted")
          return g;
        const o = this._def.schema._parseSync({
          data: i,
          path: n.path,
          parent: n
        });
        return o.status === "aborted" ? g : o.status === "dirty" || t.value === "dirty" ? W(o.value) : o;
      }
    }
    if (s.type === "refinement") {
      const i = (o) => {
        const f = s.refinement(o, a);
        if (n.common.async)
          return Promise.resolve(f);
        if (f instanceof Promise)
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return o;
      };
      if (n.common.async === !1) {
        const o = this._def.schema._parseSync({
          data: n.data,
          path: n.path,
          parent: n
        });
        return o.status === "aborted" ? g : (o.status === "dirty" && t.dirty(), i(o.value), { status: t.value, value: o.value });
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((o) => o.status === "aborted" ? g : (o.status === "dirty" && t.dirty(), i(o.value).then(() => ({ status: t.value, value: o.value }))));
    }
    if (s.type === "transform")
      if (n.common.async === !1) {
        const i = this._def.schema._parseSync({
          data: n.data,
          path: n.path,
          parent: n
        });
        if (!z(i))
          return i;
        const o = s.transform(i.value, a);
        if (o instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: t.value, value: o };
      } else
        return this._def.schema._parseAsync({ data: n.data, path: n.path, parent: n }).then((i) => z(i) ? Promise.resolve(s.transform(i.value, a)).then((o) => ({ status: t.value, value: o })) : i);
    b.assertNever(s);
  }
}
I.create = (r, e, t) => new I({
  schema: r,
  typeName: y.ZodEffects,
  effect: e,
  ...v(t)
});
I.createWithPreprocess = (r, e, t) => new I({
  schema: e,
  effect: { type: "preprocess", transform: r },
  typeName: y.ZodEffects,
  ...v(t)
});
class N extends _ {
  _parse(e) {
    return this._getType(e) === h.undefined ? Z(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
N.create = (r, e) => new N({
  innerType: r,
  typeName: y.ZodOptional,
  ...v(e)
});
class D extends _ {
  _parse(e) {
    return this._getType(e) === h.null ? Z(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
D.create = (r, e) => new D({
  innerType: r,
  typeName: y.ZodNullable,
  ...v(e)
});
class ue extends _ {
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
ue.create = (r, e) => new ue({
  innerType: r,
  typeName: y.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...v(e)
});
class le extends _ {
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
    return ee(s) ? s.then((a) => ({
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new S(n.common.issues);
        },
        input: n.data
      })
    })) : {
      status: "valid",
      value: s.status === "valid" ? s.value : this._def.catchValue({
        get error() {
          return new S(n.common.issues);
        },
        input: n.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
le.create = (r, e) => new le({
  innerType: r,
  typeName: y.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...v(e)
});
class xe extends _ {
  _parse(e) {
    if (this._getType(e) !== h.nan) {
      const n = this._getOrReturnCtx(e);
      return l(n, {
        code: c.invalid_type,
        expected: h.nan,
        received: n.parsedType
      }), g;
    }
    return { status: "valid", value: e.data };
  }
}
xe.create = (r) => new xe({
  typeName: y.ZodNaN,
  ...v(r)
});
const yt = Symbol("zod_brand");
class Ie extends _ {
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
class he extends _ {
  _parse(e) {
    const { status: t, ctx: n } = this._processInputParams(e);
    if (n.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: n.data,
          path: n.path,
          parent: n
        });
        return a.status === "aborted" ? g : a.status === "dirty" ? (t.dirty(), W(a.value)) : this._def.out._parseAsync({
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
    return new he({
      in: e,
      out: t,
      typeName: y.ZodPipeline
    });
  }
}
class fe extends _ {
  _parse(e) {
    const t = this._def.innerType._parse(e), n = (s) => (z(s) && (s.value = Object.freeze(s.value)), s);
    return ee(t) ? t.then((s) => n(s)) : n(t);
  }
  unwrap() {
    return this._def.innerType;
  }
}
fe.create = (r, e) => new fe({
  innerType: r,
  typeName: y.ZodReadonly,
  ...v(e)
});
function Ee(r, e) {
  const t = typeof r == "function" ? r(e) : typeof r == "string" ? { message: r } : r;
  return typeof t == "string" ? { message: t } : t;
}
function ze(r, e = {}, t) {
  return r ? Y.create().superRefine((n, s) => {
    var a, i;
    const o = r(n);
    if (o instanceof Promise)
      return o.then((f) => {
        var u, p;
        if (!f) {
          const T = Ee(e, n), me = (p = (u = T.fatal) !== null && u !== void 0 ? u : t) !== null && p !== void 0 ? p : !0;
          s.addIssue({ code: "custom", ...T, fatal: me });
        }
      });
    if (!o) {
      const f = Ee(e, n), u = (i = (a = f.fatal) !== null && a !== void 0 ? a : t) !== null && i !== void 0 ? i : !0;
      s.addIssue({ code: "custom", ...f, fatal: u });
    }
  }) : Y.create();
}
const gt = {
  object: x.lazycreate
};
var y;
(function(r) {
  r.ZodString = "ZodString", r.ZodNumber = "ZodNumber", r.ZodNaN = "ZodNaN", r.ZodBigInt = "ZodBigInt", r.ZodBoolean = "ZodBoolean", r.ZodDate = "ZodDate", r.ZodSymbol = "ZodSymbol", r.ZodUndefined = "ZodUndefined", r.ZodNull = "ZodNull", r.ZodAny = "ZodAny", r.ZodUnknown = "ZodUnknown", r.ZodNever = "ZodNever", r.ZodVoid = "ZodVoid", r.ZodArray = "ZodArray", r.ZodObject = "ZodObject", r.ZodUnion = "ZodUnion", r.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", r.ZodIntersection = "ZodIntersection", r.ZodTuple = "ZodTuple", r.ZodRecord = "ZodRecord", r.ZodMap = "ZodMap", r.ZodSet = "ZodSet", r.ZodFunction = "ZodFunction", r.ZodLazy = "ZodLazy", r.ZodLiteral = "ZodLiteral", r.ZodEnum = "ZodEnum", r.ZodEffects = "ZodEffects", r.ZodNativeEnum = "ZodNativeEnum", r.ZodOptional = "ZodOptional", r.ZodNullable = "ZodNullable", r.ZodDefault = "ZodDefault", r.ZodCatch = "ZodCatch", r.ZodPromise = "ZodPromise", r.ZodBranded = "ZodBranded", r.ZodPipeline = "ZodPipeline", r.ZodReadonly = "ZodReadonly";
})(y || (y = {}));
const vt = (r, e = {
  message: `Input not instance of ${r.name}`
}) => ze((t) => t instanceof r, e), Ue = C.create, Fe = $.create, _t = xe.create, bt = M.create, Be = te.create, xt = U.create, kt = ve.create, wt = re.create, Tt = ne.create, Zt = Y.create, St = L.create, Ct = P.create, At = _e.create, It = A.create, Nt = x.create, Ot = x.strictCreate, jt = se.create, Et = ke.create, Rt = ae.create, Pt = j.create, $t = ie.create, Mt = be.create, Vt = F.create, Dt = q.create, Lt = oe.create, zt = de.create, Ut = V.create, Ft = ce.create, Bt = H.create, Re = I.create, Wt = N.create, qt = D.create, Jt = I.createWithPreprocess, Yt = he.create, Ht = () => Ue().optional(), Gt = () => Fe().optional(), Qt = () => Be().optional(), Xt = {
  string: (r) => C.create({ ...r, coerce: !0 }),
  number: (r) => $.create({ ...r, coerce: !0 }),
  boolean: (r) => te.create({
    ...r,
    coerce: !0
  }),
  bigint: (r) => M.create({ ...r, coerce: !0 }),
  date: (r) => U.create({ ...r, coerce: !0 })
}, Kt = g;
var d = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  defaultErrorMap: J,
  setErrorMap: Je,
  getErrorMap: pe,
  makeIssue: ye,
  EMPTY_PATH: Ye,
  addIssueToContext: l,
  ParseStatus: w,
  INVALID: g,
  DIRTY: W,
  OK: Z,
  isAborted: Se,
  isDirty: Ce,
  isValid: z,
  isAsync: ee,
  get util() {
    return b;
  },
  get objectUtil() {
    return Ze;
  },
  ZodParsedType: h,
  getParsedType: R,
  ZodType: _,
  datetimeRegex: De,
  ZodString: C,
  ZodNumber: $,
  ZodBigInt: M,
  ZodBoolean: te,
  ZodDate: U,
  ZodSymbol: ve,
  ZodUndefined: re,
  ZodNull: ne,
  ZodAny: Y,
  ZodUnknown: L,
  ZodNever: P,
  ZodVoid: _e,
  ZodArray: A,
  ZodObject: x,
  ZodUnion: se,
  ZodDiscriminatedUnion: ke,
  ZodIntersection: ae,
  ZodTuple: j,
  ZodRecord: ie,
  ZodMap: be,
  ZodSet: F,
  ZodFunction: q,
  ZodLazy: oe,
  ZodLiteral: de,
  ZodEnum: V,
  ZodNativeEnum: ce,
  ZodPromise: H,
  ZodEffects: I,
  ZodTransformer: I,
  ZodOptional: N,
  ZodNullable: D,
  ZodDefault: ue,
  ZodCatch: le,
  ZodNaN: xe,
  BRAND: yt,
  ZodBranded: Ie,
  ZodPipeline: he,
  ZodReadonly: fe,
  custom: ze,
  Schema: _,
  ZodSchema: _,
  late: gt,
  get ZodFirstPartyTypeKind() {
    return y;
  },
  coerce: Xt,
  any: Zt,
  array: It,
  bigint: bt,
  boolean: Be,
  date: xt,
  discriminatedUnion: Et,
  effect: Re,
  enum: Ut,
  function: Dt,
  instanceof: vt,
  intersection: Rt,
  lazy: Lt,
  literal: zt,
  map: Mt,
  nan: _t,
  nativeEnum: Ft,
  never: Ct,
  null: Tt,
  nullable: qt,
  number: Fe,
  object: Nt,
  oboolean: Qt,
  onumber: Gt,
  optional: Wt,
  ostring: Ht,
  pipeline: Yt,
  preprocess: Jt,
  promise: Bt,
  record: $t,
  set: Vt,
  strictObject: Ot,
  string: Ue,
  symbol: kt,
  transformer: Re,
  tuple: Pt,
  undefined: wt,
  union: jt,
  unknown: St,
  void: At,
  NEVER: Kt,
  ZodIssueCode: c,
  quotelessJson: qe,
  ZodError: S
});
const k = d.string().min(1, { message: "שדה חובה" }), ar = d.string().regex(/^\d+$/, "Must be a numeric string"), er = d.object({
  country: k,
  city: k,
  street: k,
  streetNumber: k,
  floor: k,
  apartmentEnterNumber: k,
  apartmentNumber: k
}), K = d.object({
  lang: d.enum(["he"]),
  value: d.string()
}), ir = d.array(K), We = d.object({
  id: d.string().min(1),
  companyId: d.string().min(1),
  storeId: d.string().min(1),
  parentId: d.string().nullish(),
  tag: d.string().min(1),
  locales: d.array(K),
  depth: d.number()
}), Ne = We.extend({
  children: d.lazy(() => Ne.array())
}), or = We.extend({
  index: d.number(),
  depth: d.number(),
  collapsed: d.boolean().optional(),
  children: d.array(Ne)
}), G = d.string().min(1), Oe = d.object({
  type: d.literal("Product"),
  storeId: G,
  companyId: G,
  id: G,
  objectID: G,
  sku: G,
  name: d.array(K),
  description: d.array(K),
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
  manufacturer: d.string(),
  brand: d.string(),
  importer: d.string(),
  supplier: d.string(),
  ingredients: d.array(K),
  created_at: d.number(),
  updated_at: d.number(),
  categoryIds: d.array(d.string().nonempty()),
  // @deprecated
  categoryList: d.array(Ne),
  // @deprecated
  categories: d.object({
    lvl0: d.array(d.string()),
    lvl1: d.array(d.string()),
    lvl2: d.array(d.string()),
    lvl3: d.array(d.string()),
    lvl4: d.array(d.string())
  }),
  // @deprecated
  categoryNames: d.array(d.string())
}), dr = Oe.extend({
  image: d.instanceof(File).optional()
}), cr = d.object({
  type: d.literal("Cart"),
  id: d.string().uuid(),
  companyId: d.string().uuid(),
  storeId: d.string().uuid(),
  userId: d.string().uuid(),
  status: d.enum(["active", "draft", "completed"]),
  items: d.array(
    d.object({
      product: Oe,
      amount: d.number().int().positive({ message: "Quantity must be a positive integer." })
    })
  )
}), ur = d.object({
  id: d.string(),
  name: d.string(),
  websiteDomains: d.array(d.string())
}), lr = d.object({
  type: d.literal("FavoriteProduct"),
  id: d.string().uuid(),
  companyId: d.string().uuid(),
  storeId: d.string().uuid(),
  userId: d.string().uuid(),
  productId: d.string().uuid()
}), tr = d.object({
  type: d.literal("Profile"),
  id: k,
  companyId: k,
  storeId: k,
  tenantId: k,
  clientType: d.enum(["user", "company"]),
  displayName: k,
  email: d.string().email(),
  phoneNumber: k.optional(),
  address: er.optional(),
  isAnonymous: d.boolean(),
  createdDate: d.number(),
  lastActivityDate: d.number()
});
function fr() {
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
    isAnonymous: !0
  };
}
const hr = d.object({
  type: d.literal("Order"),
  id: k,
  companyId: k,
  storeId: k,
  userId: k,
  status: d.enum([
    "draft",
    // before payment
    "pending",
    // after payment
    "processing",
    // after admin approve
    "in_delivery",
    //
    "delivered",
    "canceled",
    "completed",
    "refunded"
  ]),
  paymentStatus: d.enum(["pending", "pending_j5", "completed", "failed", "refunded"]),
  //todo check if hyp support partial refund
  cart: d.object({
    id: d.string(),
    items: d.array(d.object({ product: Oe, amount: d.number() })),
    cartDiscount: d.number(),
    cartTotal: d.number(),
    cartVat: d.number()
  }),
  originalAmount: d.number().positive().optional(),
  // what client pay
  actualAmount: d.number().positive().optional(),
  // what store charge
  date: d.number(),
  deliveryDate: d.number().optional(),
  createdAt: d.number().optional(),
  client: tr.required({})
});
d.object({
  id: d.string(),
  companyId: d.string(),
  name: d.string(),
  urls: d.array(d.string()),
  logoUrl: d.string(),
  tenantId: d.string(),
  // firebase auth tenantId
  paymentType: d.enum(["external", "j5"])
});
const rr = {
  stores: "STORES",
  companies: "COMPANIES"
}, nr = {
  products: "products",
  profiles: "profiles",
  cart: "cart",
  clients: "clients",
  orders: "orders",
  categories: "categories",
  favorites: "favorites",
  payments: "payments",
  settings: "settings"
}, sr = {
  systemCollections: rr,
  storeCollections: nr,
  // for client
  getPath: ({
    companyId: r,
    storeId: e,
    collectionName: t,
    id: n
  }) => `${r}/${e}/${t}${n ? `/${n}` : ""}`,
  // for backend
  getDocPath: (r) => `{companyId}/{storeId}/${r}/{id}`
}, mr = {
  firestore: sr
};
export {
  er as AddressSchema,
  We as BaseCategorySchema,
  cr as CartSchema,
  Ne as CategorySchema,
  ur as CompanySchema,
  lr as FavoriteProductSchema,
  mr as FirebaseAPI,
  K as LocaleSchema,
  ir as LocaleValueSchema,
  dr as NewProductSchema,
  hr as OrderSchema,
  Oe as ProductSchema,
  tr as ProfileSchema,
  or as TFlattenCategorySchema,
  fr as createEmptyProfile,
  k as notEmptyTextSchema,
  ar as numericTextSchema
};
//# sourceMappingURL=core.es.js.map
