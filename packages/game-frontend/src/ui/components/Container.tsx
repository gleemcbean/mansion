import styles from "../styles/modules/components/Container.module.scss";

type ContainerProps = {
  children?: React.ReactNode;
  yCenter?: boolean;
  xCenter?: boolean;
  horizontal?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export default function Container({
  children,
  yCenter,
  xCenter,
  horizontal,
  ...props
}: ContainerProps) {
  return (
    <section className={styles.container}>
      <div
        className={styles.content}
        style={{
          justifyContent: yCenter ? "center" : "flex-start",
          alignItems: xCenter ? "center" : "flex-start",
          flexDirection: horizontal ? "row" : "column",
        }}
        {...props}
      >
        {children}
      </div>
    </section>
  );
}
