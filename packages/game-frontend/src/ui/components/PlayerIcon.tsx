type PlayerIconProps = {
	color: string;
	owner?: boolean;
	className?: string;
};

export default function PlayerIcon({
	color,
	className,
	owner = false,
}: PlayerIconProps) {
	return (
		<svg
			width="80"
			height="80"
			viewBox="0 0 80 80"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<title>Player Icon</title>
			<g transform={`${owner ? "translate(0,5)" : ""}`}>
				<path
					d="M53.3386 54.4349C55.3905 72.9939 47.2141 70.9318 39.6592 70.9318C32.1043 70.9318 23.928 72.9939 25.9799 54.4349C26.8559 46.5115 25.9799 40 39.6592 40C53.3386 40 52.4626 46.5115 53.3386 54.4349Z"
					fill="#E5E0D6"
				/>
				<path
					d="M70 40.5C70 50.165 56.5685 56 40 56C23.4315 56 10 50.165 10 40.5C10 30.835 23.4315 17 40 17C56.5685 17 70 30.835 70 40.5Z"
					fill={color}
				/>
				<ellipse cx="32.1592" cy="62" rx="1.5" ry="2" fill="#1F1F1F" />
				<ellipse cx="47.1592" cy="62" rx="1.5" ry="2" fill="#1F1F1F" />
				<path
					d="M37.6592 65C38.8592 65 40.8259 65 41.6592 65"
					stroke="#1F1F1F"
					strokeWidth="2"
					strokeLinecap="round"
				/>
				<ellipse
					cx="4.26231"
					cy="2.47377"
					rx="4.26231"
					ry="2.47377"
					transform="matrix(0.950968 -0.309289 0.333423 0.942777 20.3749 30.4123)"
					fill="white"
				/>
				<ellipse
					cx="4.7436"
					cy="2.63926"
					rx="4.7436"
					ry="2.63926"
					transform="matrix(0.923518 0.383554 -0.411588 0.91137 47.372 24.4922)"
					fill="white"
				/>
				<ellipse cx="47.9312" cy="44.5" rx="2" ry="2.5" fill="white" />
				<ellipse
					cx="1.71059"
					cy="2.05412"
					rx="1.71059"
					ry="2.05412"
					transform="matrix(0.99031 -0.138874 0.150745 0.988573 16.6592 39.5275)"
					fill="white"
				/>
				<ellipse
					cx="1.71059"
					cy="2.05412"
					rx="1.71059"
					ry="2.05412"
					transform="matrix(0.997948 0.064026 -0.0520479 0.998645 36.0627 22.1073)"
					fill="white"
				/>
				<ellipse
					cx="1.64663"
					cy="2.13423"
					rx="1.64663"
					ry="2.13423"
					transform="matrix(0.27011 0.96283 -0.968295 0.249811 39.7924 33)"
					fill="white"
				/>
				<ellipse
					cx="3.41485"
					cy="2.46989"
					rx="3.41485"
					ry="2.46989"
					transform="matrix(0.968561 0.248778 -0.269005 0.963139 29.9881 43.3235)"
					fill="white"
				/>
				<ellipse
					cx="3.39575"
					cy="2.48465"
					rx="3.39575"
					ry="2.48465"
					transform="matrix(0.899096 -0.437752 0.467901 0.883781 55.2279 42.6082)"
					fill="white"
				/>
				{owner && (
					<path
						d="M29 16V4L32.5 13.5L36 4L39.5 13.5L43 4L46.5 13.5L50 4V16.5V23.5L46.5 26L39.5 27L33.5 26L29 23.5V16Z"
						fill="#FFD000"
					/>
				)}
			</g>
		</svg>
	);
}
