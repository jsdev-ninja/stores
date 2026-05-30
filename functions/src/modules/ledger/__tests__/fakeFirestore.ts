/**
 * Minimal in-memory Firestore double for ledger unit tests.
 *
 * Implements only the surface the ledger module uses:
 *   - db.doc(path).get() / .create() / .set() / .update()
 *   - db.collection(path).doc() (auto-id) and .where().where()...get()
 *   - db.collectionGroup(name).where().limit().get()
 *   - db.runTransaction(fn) with txn.get/create/update/set
 *
 * .create() throws an ALREADY_EXISTS-shaped error (code 6) when the doc exists,
 * matching the real gRPC behaviour the production code catches.
 */

export type StoredDocs = Map<string, Record<string, unknown>>;

class AlreadyExistsError extends Error {
	code = 6;
	constructor(path: string) {
		super(`ALREADY_EXISTS: ${path}`);
	}
}

function matchesWhere(
	data: Record<string, unknown>,
	clauses: Array<[string, string, unknown]>,
): boolean {
	return clauses.every(([field, op, value]) => {
		const actual = field
			.split(".")
			.reduce<unknown>(
				(acc, key) =>
					acc && typeof acc === "object"
						? (acc as Record<string, unknown>)[key]
						: undefined,
				data,
			);
		if (op === "==") return actual === value;
		throw new Error(`unsupported op ${op}`);
	});
}

export class FakeFirestore {
	// path -> doc data
	docs: StoredDocs = new Map();
	// call counters for assertions
	createCalls: string[] = [];
	updateCalls: Array<{ path: string; data: Record<string, unknown> }> = [];
	setCalls: Array<{ path: string; data: Record<string, unknown> }> = [];

	private docSnap(path: string) {
		const data = this.docs.get(path);
		return {
			exists: data !== undefined,
			id: path.split("/").pop()!,
			data: () => data,
		};
	}

	doc(path: string) {
		const self = this;
		return {
			path,
			async get() {
				return self.docSnap(path);
			},
			async create(data: Record<string, unknown>) {
				self.createCalls.push(path);
				if (self.docs.has(path)) throw new AlreadyExistsError(path);
				self.docs.set(path, data);
			},
			async set(data: Record<string, unknown>) {
				self.setCalls.push({ path, data });
				self.docs.set(path, data);
			},
			async update(data: Record<string, unknown>) {
				self.updateCalls.push({ path, data });
				const existing = self.docs.get(path) ?? {};
				self.docs.set(path, { ...existing, ...data });
			},
		};
	}

	collection(collPath: string) {
		const self = this;
		let autoCounter = 0;
		const clauses: Array<[string, string, unknown]> = [];
		const query = {
			where(field: string, op: string, value: unknown) {
				clauses.push([field, op, value]);
				return query;
			},
			limit() {
				return query;
			},
			async get() {
				const prefix = collPath.endsWith("/")
					? collPath
					: `${collPath}/`;
				const docs = [...self.docs.entries()]
					.filter(([p]) => p.startsWith(prefix))
					.filter(([, d]) => matchesWhere(d, clauses))
					.map(([p, d]) => ({
						id: p.split("/").pop()!,
						data: () => d,
					}));
				return { empty: docs.length === 0, docs };
			},
			doc(id?: string) {
				const docId = id ?? `auto_${++autoCounter}_${Date.now()}`;
				return self.doc(`${collPath}/${docId}`);
			},
		};
		return query;
	}

	collectionGroup(name: string) {
		const self = this;
		const clauses: Array<[string, string, unknown]> = [];
		const query = {
			where(field: string, op: string, value: unknown) {
				clauses.push([field, op, value]);
				return query;
			},
			limit() {
				return query;
			},
			async get() {
				// match any path containing /{name}/ segment
				const docs = [...self.docs.entries()]
					.filter(([p]) => p.includes(`/${name}/`))
					.filter(([, d]) => matchesWhere(d, clauses))
					.map(([p, d]) => ({
						id: p.split("/").pop()!,
						data: () => d,
					}));
				return { empty: docs.length === 0, docs };
			},
		};
		return query;
	}

	async runTransaction<T>(fn: (txn: FakeTxn) => Promise<T>): Promise<T> {
		const txn = new FakeTxn(this);
		return fn(txn);
	}
}

export class FakeTxn {
	constructor(private store: FakeFirestore) {}

	async get(ref: { path: string }) {
		const data = this.store.docs.get(ref.path);
		return {
			exists: data !== undefined,
			data: () => data,
		};
	}

	create(ref: { path: string }, data: Record<string, unknown>) {
		this.store.createCalls.push(ref.path);
		if (this.store.docs.has(ref.path)) {
			const err = new Error(`ALREADY_EXISTS: ${ref.path}`) as Error & {
				code: number;
			};
			err.code = 6;
			throw err;
		}
		this.store.docs.set(ref.path, data);
	}

	update(ref: { path: string }, data: Record<string, unknown>) {
		this.store.updateCalls.push({ path: ref.path, data });
		const existing = this.store.docs.get(ref.path) ?? {};
		this.store.docs.set(ref.path, { ...existing, ...data });
	}

	set(ref: { path: string }, data: Record<string, unknown>) {
		this.store.setCalls.push({ path: ref.path, data });
		this.store.docs.set(ref.path, data);
	}
}
