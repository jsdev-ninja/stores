import admin from "firebase-admin";
import { TenantCtx, TenantCtxSchema, CollectionName } from "./types";

export function tenantDb(ctx: TenantCtx) {
	TenantCtxSchema.parse(ctx);
	const db = admin.firestore();
	const base = `${ctx.companyId}/${ctx.storeId}`;

	return {
		ctx,

		collection(name: CollectionName): FirebaseFirestore.CollectionReference {
			return db.collection(`${base}/${name}`);
		},

		doc(name: CollectionName, id: string): FirebaseFirestore.DocumentReference {
			return db.collection(`${base}/${name}`).doc(id);
		},

		subcollection(
			parent: CollectionName,
			parentId: string,
			child: CollectionName,
		): FirebaseFirestore.CollectionReference {
			return db
				.collection(`${base}/${parent}`)
				.doc(parentId)
				.collection(child);
		},

		subdoc(
			parent: CollectionName,
			parentId: string,
			child: CollectionName,
			childId: string,
		): FirebaseFirestore.DocumentReference {
			return db
				.collection(`${base}/${parent}`)
				.doc(parentId)
				.collection(child)
				.doc(childId);
		},
	};
}
