import { ComponentProps } from "react";
import { Modal as UiModal } from "@heroui/react";

export type ModalProps = ComponentProps<typeof UiModal>;

// Re-export the v3 Modal compound directly so callers can use
// <Modal>, <Modal.Backdrop>, <Modal.Container>, <Modal.Dialog>, etc.
export { UiModal as Modal };
