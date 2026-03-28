import React, { useEffect, useMemo, useRef, useState } from "react";
import useLobby from "@/hooks/useLobby";
import Container from "../components/Container";
import type { ModalRef } from "../components/Modal";
import Join from "../modals/Join";
import { Page } from "../Router";
import styles from "../styles/modules/pages/Landing.module.scss";

type LandingProps = {
	setPage: (page: Page) => void;
};

export default function Landing({ setPage }: LandingProps) {
	const [selected, setSelected] = useState(0);
	const joinRef = useRef<ModalRef>(null);
	const { metadata } = useLobby();

	const options = useMemo(
		() => [
			{ label: "Host Game", action: () => setPage(Page.Lobby) },
			{ label: "Enter Code", action: () => joinRef.current?.open() },
			{ label: "Options", action: () => setPage(Page.Options) },
		],
		[],
	);

	useEffect(() => {
		if (metadata?.code) setPage(Page.Lobby);
	}, [metadata]);

	return (
		<React.Fragment>
			<Container yCenter>
				<h1 className={styles.title}>{document.title}</h1>
				<ul className={styles.menu}>
					{options.map((option, index) => (
						<li
							key={option.label}
							className={`${styles.option}${
								index === selected ? ` ${styles.selected}` : ""
							}`}
							onClick={() => option.action()}
							onMouseEnter={() => setSelected(index)}
						>
							{option.label}
						</li>
					))}
				</ul>
			</Container>
			<Join ref={joinRef} />
		</React.Fragment>
	);
}
