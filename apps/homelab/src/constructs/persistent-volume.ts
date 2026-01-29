import { Size } from "cdk8s";
import { PersistentVolumeAccessMode, PersistentVolumeClaim, Volume } from "cdk8s-plus-32";
import { Construct } from "constructs";
import type { StorageClassName } from "../utils/storage-class-names";

export interface PersistentVolumeProps {
	/**
	 * Size of persistent volume claim.
	 */
	size: Size;
	/**
	 * Access modes that should be supported.
	 * @see https://kubernetes.io/docs/concepts/storage/persistent-volumes#access-modes-1
	 */
	accessModes?: PersistentVolumeAccessMode[];
	/**
	 * Storage class name to use.
	 */
	storageClassName?: StorageClassName | { custom: string };
}

export class PersistentVolume extends Construct {
	pvc: PersistentVolumeClaim;
	volume: Volume;

	/**
	 * Creates a persistent volume claim using sane defaults for this infrastructure.
	 */
	constructor(scope: Construct, id: string, props: PersistentVolumeProps) {
		super(scope, id);

		this.pvc = new PersistentVolumeClaim(this, "pvc", {
			accessModes: props.accessModes ?? [PersistentVolumeAccessMode.READ_WRITE_ONCE],
			storage: props.size,
			storageClassName:
				typeof props.storageClassName === "object" ? props.storageClassName.custom : props.storageClassName,
		});
		this.volume = Volume.fromPersistentVolumeClaim(this, "volume", this.pvc);
	}
}
