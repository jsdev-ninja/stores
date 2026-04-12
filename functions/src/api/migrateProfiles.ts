import * as functionsV2 from "firebase-functions/v2";
import admin from "firebase-admin";

const BATCH_SIZE = 500;

export const migrateProfilesToMultiOrg = functionsV2.https.onCall(async (opts) => {
	if (!opts.auth?.token?.admin) {
		throw new functionsV2.https.HttpsError("permission-denied", "Admin only");
	}

	const { companyId, storeId } = opts.data as { companyId: string; storeId: string };

	if (!companyId || typeof companyId !== "string") {
		throw new functionsV2.https.HttpsError("invalid-argument", "companyId is required");
	}
	if (!storeId || typeof storeId !== "string") {
		throw new functionsV2.https.HttpsError("invalid-argument", "storeId is required");
	}

	const db = admin.firestore();
	const profilesCollection = db.collection(`${companyId}/${storeId}/profiles`);

	let migrated = 0;
	let skipped = 0;
	let errors = 0;

	functionsV2.logger.info("migrateProfilesToMultiOrg: starting", { companyId, storeId });

	const snap = await profilesCollection.get();

	functionsV2.logger.info("migrateProfilesToMultiOrg: fetched profiles", {
		companyId,
		storeId,
		total: snap.size,
	});

	const docsToMigrate: admin.firestore.QueryDocumentSnapshot[] = [];

	for (const doc of snap.docs) {
		const data = doc.data();
		const organizationId: string | null | undefined = data.organizationId;
		const organizationIds: string[] | undefined = data.organizationIds;

		const hasLegacyId = typeof organizationId === "string" && organizationId.length > 0;
		const alreadyMigrated =
			Array.isArray(organizationIds) && organizationIds.length > 0;

		if (hasLegacyId && !alreadyMigrated) {
			docsToMigrate.push(doc);
		} else {
			skipped++;
		}
	}

	// Process in batches of BATCH_SIZE
	for (let i = 0; i < docsToMigrate.length; i += BATCH_SIZE) {
		const chunk = docsToMigrate.slice(i, i + BATCH_SIZE);
		const batch = db.batch();
		let chunkErrors = 0;

		for (const doc of chunk) {
			const organizationId = doc.data().organizationId as string;
			try {
				batch.update(doc.ref, { organizationIds: [organizationId] });
			} catch (err) {
				functionsV2.logger.info("migrateProfilesToMultiOrg: batch.update error", {
					docId: doc.id,
					err,
				});
				chunkErrors++;
			}
		}

		try {
			await batch.commit();
			migrated += chunk.length - chunkErrors;
			errors += chunkErrors;
		} catch (err) {
			functionsV2.logger.info("migrateProfilesToMultiOrg: batch.commit error", {
				batchStart: i,
				err,
			});
			errors += chunk.length;
		}
	}

	functionsV2.logger.info("migrateProfilesToMultiOrg: complete", {
		companyId,
		storeId,
		migrated,
		skipped,
		errors,
	});

	return { success: true, data: { migrated, skipped, errors } };
});
