import { Html, useProgress } from "@react-three/drei";

export default function Loading() {
	const { progress, item } = useProgress();

	return (
		<Html fullscreen>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: window.innerHeight,
					width: window.innerWidth,
					background: "rgb(10,10,10)",
					color: "white",
					flexDirection: "column",
					gap: 12,
					fontFamily: "sans-serif",
				}}
			>
				<h1 style={{ fontSize: 18, fontWeight: 600 }}>Loading scene…</h1>
				<div style={{ width: 300 }}>
					<div
						style={{
							height: 8,
							width: "100%",
							background: "rgba(255,255,255,0.12)",
							borderRadius: 4,
							overflow: "hidden",
						}}
					>
						<div
							style={{
								height: "100%",
								width: `${progress}%`,
								transition: "width 150ms linear",
								background:
									"linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.35))",
							}}
						/>
					</div>
				</div>
				<div style={{ fontSize: 13 }}>
					{Math.round(progress)}% — {item ?? "starting..."}
				</div>
			</div>
		</Html>
	);
}
