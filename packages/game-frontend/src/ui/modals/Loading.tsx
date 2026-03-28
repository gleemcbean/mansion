import { PlayerMushroomCapColor } from "@mansion/shared/types/player";
import { useMemo } from "react";
import PlayerIcon from "../components/PlayerIcon";
import styles from "../styles/modules/modals/Loading.module.scss";

const MESSAGES = Object.freeze([
	"Spore scanners warming up",
	"Generating suspicious hallways",
	"Polishing the mushroom caps",
	"Hunting anomalies in the attic",
	"Seeding the mansion with mysteries",
	"Checking walls for breathing patterns",
	"Calibrating fungal detection units",
	"Counting footsteps that aren't yours",
	"Growing a fresh batch of clues",
	"Loading rooms that shouldn't exist",
	"Mapping corridors that keep moving",
	"Tracking spores through the vents",
	"Listening for doors that whisper",
	"Preparing the anomaly containment jars",
	"Rearranging furniture... again",
	"Sprinkling spores in dark corners",
	"Summoning the mansion blueprint",
	"Tuning the mushroom radar",
	"Detecting chairs that stare back",
	"Scanning paintings for blinking eyes",
	"Watering the investigation",
	"Replacing normal air with suspicious fog",
	"Rolling out the haunted carpet",
	"Verifying if the staircase is real",
	"Cultivating paranoia",
	"Stirring the soup of randomness",
	"Loading the fungus among us",
	"Collecting echoes from empty rooms",
	"Activating the mycelium network",
	"Planting anomalies behind curtains",
	"Generating a totally normal mansion",
	"Checking if the basement exists today",
	"Measuring the silence levels",
	"Feeding the mushrooms forbidden knowledge",
	"Locking doors that were never opened",
	"Analyzing creaks and groans",
	"Deploying mushroom scouts",
	"Installing extra shadows",
	"Filling jars with questionable spores",
	"Rewriting reality, please wait",
	"Stitching together impossible rooms",
	"Inspecting mirrors for impostors",
	"Downloading haunted architecture",
	"Making sure the walls are listening",
	"Charging the anomaly vacuum",
	"Refreshing the mansion's nightmares",
	"Rendering suspicious chandeliers",
	"Asking the mushrooms for directions",
	"Packing your flashlight with courage",
	"Rolling dice for cursed furniture",
	"Locating the room that shouldn't be there",
	"Dusting off the forbidden library",
	"Training mushrooms to scream quietly",
	"Brewing spores of uncertainty",
	"Generating fresh anomalies",
	"Stabilizing the unstable floorboards",
	"Teaching doors how to vanish",
	"Compiling paranormal mushrooms",
	"Loading creepy ambiance",
	"Syncing footsteps with nobody",
	"Reticulating splines... but fungal",
	"Unfolding the mansion's true shape",
	"Shuffling the rooms like cards",
	"Preparing your inevitable confusion",
	"Tightening bolts on reality",
	"Spawning mushrooms with bad intentions",
	"Connecting to the mycelial mainframe",
	"Checking if gravity is optional",
	"Loading the smell of damp wood",
	"Injecting spores into the simulation",
	"Calibrating fear levels",
	"Ensuring the hallway loops properly",
	"Growing mushrooms in forbidden places",
	"Finalizing the anomaly disguise kit",
	"Opening doors that lead nowhere",
	"Tuning the mansion's heartbeat",
	"Packing spores into your inventory",
	"Storing screams in the walls",
	"Buffering eldritch fungus",
	"Adjusting lighting for maximum dread",
	"Rendering the room behind you",
	"Loading the mansion's personality disorders",
	"Fungal engines online",
	"Waking up the attic",
	"Confirming that the piano is haunted",
	"Adding extra staircases for no reason",
	"Planting mushrooms in your blind spot",
	"Preparing the next impossible corner",
	"Launching anomaly capture protocols",
	"Almost ready to get lost",
]);

export default function Loading() {
	const { message, color } = useMemo(() => {
		const colors = Object.values(PlayerMushroomCapColor);

		return {
			message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
			color: colors[Math.floor(Math.random() * colors.length)],
		};
	}, []);

	return (
		<div className={styles.container}>
			<PlayerIcon color={color} />
			<h2>Loading</h2>
			<p className={styles.text}>{message}...</p>
		</div>
	);
}
