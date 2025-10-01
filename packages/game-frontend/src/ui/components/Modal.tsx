import React, { forwardRef, useImperativeHandle, useState } from "react";
import styles from "../styles/modules/components/Modal.module.scss";

type ModalProps = {
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export type ModalRef = {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
};

export default forwardRef<ModalRef, ModalProps>(
  ({ children, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => setVisible(true),
      close: () => setVisible(false),
      isOpen: () => visible,
    }));

    const backgroundClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) setVisible(false);
    };

    return (
      <section
        className={`${styles.container}${visible ? ` ${styles.visible}` : ""}`}
        onClick={backgroundClick}
      >
        <div className={styles.modal} {...props}>
          {children}
        </div>
      </section>
    );
  }
);
